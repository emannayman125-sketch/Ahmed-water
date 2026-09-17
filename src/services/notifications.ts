import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Settings } from '../types';

// ----------------------------------------------------------------------
// WHY THIS FILE IS THE HEART OF THE APP
// ----------------------------------------------------------------------
// Every reminder is scheduled through the OS's own local notification
// scheduler (expo-notifications, which wraps UNUserNotificationCenter on
// iOS and AlarmManager/WorkManager-backed triggers on Android). Nothing
// here ever calls a server. Once scheduled, the OS itself wakes up and
// fires the notification — with Wi-Fi off, mobile data off, or the app
// fully closed. That's what makes reminders offline-first, not just
// "usually works when there's signal."
//
// We never run a setInterval() timer waiting in the background — that
// would require the app process to stay alive, which iOS/Android will
// kill to save battery, and is exactly what the spec forbids. Instead we
// hand the OS a full day's worth of future-dated triggers and let it
// take over.
// ----------------------------------------------------------------------

const CHANNEL_ID = 'water-reminders';
const NOTIFICATION_CATEGORY = 'water-reminder';
const REMINDER_SOUND = 'water_splash.wav';

const MESSAGES = [
  'Ahmed, time for some water 💧',
  'Quick water break.',
  "Don't forget your water, Ahmed.",
  'Hydration check 💧',
  'Take a sip and keep going.',
  'Your water is waiting for you.',
  '30 minutes already. Water time 💧',
  'Small sip. Big difference.',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Water Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    sound: REMINDER_SOUND,
  });
}

export async function registerNotificationCategory() {
  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY, [
    { identifier: 'DRINK_NOW', buttonTitle: 'Drink Now', options: { opensAppToForeground: true } },
    { identifier: 'SNOOZE_15', buttonTitle: 'Snooze 15 min', options: { opensAppToForeground: false } },
    { identifier: 'SNOOZE_30', buttonTitle: 'Snooze 30 min', options: { opensAppToForeground: false } },
  ]);
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getPermissionStatus() {
  return Notifications.getPermissionsAsync();
}

/**
 * Cancels every reminder this app previously scheduled. We tag our own
 * notifications with data.source === 'ahmed-water-reminder' and only
 * touch those, so we never clobber notifications from anything else.
 */
export async function cancelAllReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.content.data?.source === 'ahmed-water-reminder');
  await Promise.all(ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

function randomMessage(seedIndex: number): string {
  return MESSAGES[seedIndex % MESSAGES.length];
}

/**
 * Builds every reminder time slot for a single calendar day, in minutes
 * since local midnight, honoring active hours and the interval.
 */
function buildDailySlotsMinutes(settings: Settings): number[] {
  const startMin = settings.activeStartHour * 60 + settings.activeStartMinute;
  const endMin = settings.activeEndHour * 60 + settings.activeEndMinute;
  const slots: number[] = [];
  if (endMin <= startMin) return slots; // invalid/empty window, no reminders
  for (let t = startMin; t <= endMin; t += settings.reminderIntervalMin) {
    slots.push(t);
  }
  return slots;
}

/**
 * Re-schedules the reminder queue from scratch. Strategy: rather than
 * relying on a single repeating trigger (which can't express "every 30
 * min but only 9am-11pm" on both platforms cleanly), we schedule a
 * rolling window of concrete future date-time triggers — today's
 * remaining slots plus tomorrow's full day. This is refreshed:
 *   - whenever settings change (interval/active hours/pause)
 *   - once daily (app checks on foreground/midnight rollover) to keep
 *     the rolling window topped up
 * This keeps us within the "few dozen" notifications platforms allow
 * without pending caps, while still surviving the app being closed for
 * the rest of today and all of tomorrow.
 */
export async function rescheduleReminders(settings: Settings): Promise<void> {
  await cancelAllReminders();
  if (settings.remindersPaused) return;

  const granted = await requestPermissions();
  if (!granted) return;

  await ensureAndroidChannel();
  await registerNotificationCategory();

  const slots = buildDailySlotsMinutes(settings);
  if (slots.length === 0) return;

  const now = new Date();
  let seed = 0;

  const scheduleForDate = async (baseDate: Date) => {
    for (const minutesFromMidnight of slots) {
      const fireDate = new Date(baseDate);
      fireDate.setHours(0, 0, 0, 0);
      fireDate.setMinutes(minutesFromMidnight);

      if (fireDate.getTime() <= now.getTime()) continue; // don't schedule the past

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hey Ahmed 👋',
          body: randomMessage(seed++),
          sound: settings.soundEnabled ? REMINDER_SOUND : undefined,
          categoryIdentifier: NOTIFICATION_CATEGORY,
          data: { source: 'ahmed-water-reminder' },
        },
        trigger: {
          date: fireDate,
          channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
        } as Notifications.DateTriggerInput,
      });
    }
  };

  // Today's remaining slots
  await scheduleForDate(now);

  // Tomorrow's full day, so the queue survives past midnight even if the
  // app is never opened tomorrow. The app tops this up again on next
  // foreground open (see AppContext's daily-rollover check).
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  await scheduleForDate(tomorrow);
}

export async function scheduleSnooze(minutes: number, settings: Settings) {
  const granted = await requestPermissions();
  if (!granted) return;
  const fireDate = new Date(Date.now() + minutes * 60 * 1000);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hey Ahmed 👋',
      body: 'Snoozed reminder — time for that water 💧',
      sound: settings.soundEnabled ? REMINDER_SOUND : undefined,
      categoryIdentifier: NOTIFICATION_CATEGORY,
      data: { source: 'ahmed-water-reminder' },
    },
    trigger: {
      date: fireDate,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    } as Notifications.DateTriggerInput,
  });
}

/** Call on app foreground/launch. Cheap no-op if the queue is already fresh
 * (still has entries for both today and tomorrow); otherwise tops it up.
 * This is what makes reminders survive across a midnight rollover and
 * device reboots (Android re-delivers our persisted triggers on boot via
 * the RECEIVE_BOOT_COMPLETED permission declared in app.json; iOS keeps
 * scheduled local notifications across restarts automatically).
 */
export async function ensureQueueFresh(settings: Settings): Promise<void> {
  if (settings.remindersPaused) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.content.data?.source === 'ahmed-water-reminder');
  const now = Date.now();
  const hasFutureBeyond18h = ours.some((n) => {
    const trigger: any = n.trigger;
    const t = trigger?.value ?? trigger?.date;
    return t && new Date(t).getTime() - now > 18 * 60 * 60 * 1000;
  });
  if (ours.length === 0 || !hasFutureBeyond18h) {
    await rescheduleReminders(settings);
  }
}
