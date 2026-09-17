# Ahmed Water 💧

A personal, offline-first hydration reminder app built for Ahmed with Expo (React Native).

## Why Expo / React Native, and not a web app

The one non-negotiable requirement — reminders that fire on schedule with
**no internet, no server, even with the app fully closed** — can only be
done reliably with the operating system's own local notification
scheduler (`expo-notifications`, wrapping `UNUserNotificationCenter` on
iOS and `AlarmManager` on Android). A browser tab cannot survive being
closed, so this had to be a real installable app.

## Getting it running

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `a` / `i` for an
emulator. To ship a real standalone build later:

```bash
npx expo prebuild
eas build --platform android
eas build --platform ios
```

## How it's structured

```
App.tsx                        Root: onboarding, notification response handling
src/
  context/AppContext.tsx       All state (settings, days, streak) + persistence + daily rollover
  services/
    notifications.ts           Everything about scheduling local notifications
    storage.ts                 AsyncStorage read/write, CSV export
  screens/
    DashboardScreen.tsx        Home: ring, log button, streak, personal message
    HistoryScreen.tsx          Today's timeline + 7-day chart
    SettingsScreen.tsx         Goal, interval, active hours, toggles, data controls
  components/                  ProgressRing, WaterButton, AmountPicker
  theme/colors.ts               Light/dark palettes, spacing, radius
  utils/dates.ts                Local-time date helpers
  navigation/index.tsx          Bottom tabs
```

## How each requirement is handled

**Offline-first reminders** — `notifications.ts` schedules concrete
future `Date` triggers through `expo-notifications`. The OS itself owns
delivery from that point on; nothing polls a server or depends on
connectivity.

**No background polling / battery efficiency** — there's no
`setInterval` loop. A rolling window (today's remaining slots +
tomorrow's full day) is scheduled up front and topped up whenever the
app comes to the foreground (`ensureQueueFresh`, wired to `AppState`
changes in `AppContext`).

**Survives app close, device reboot, midnight** — iOS keeps scheduled
local notifications across app termination and device restarts
automatically. Android requires the `RECEIVE_BOOT_COMPLETED` permission
(declared in `app.json`) so the OS can restore the pending queue after
reboot. Because the window always covers "the rest of today +
tomorrow," a midnight rollover never leaves a gap even if Ahmed hasn't
opened the app.

**No duplicates on settings change** — `updateSettings` always calls
`rescheduleReminders`, which does `cancelAllReminders()` (scoped only to
notifications tagged `source: 'ahmed-water-reminder'`) before scheduling
the new set.

**Snooze actions** — `registerNotificationCategory` defines "Drink Now /
Snooze 15 / Snooze 30" as native notification action buttons. The
response listener in `App.tsx` schedules a one-off follow-up
notification for snoozes.

**Daily reset** — `AppContext` creates a fresh `DayRecord` for the new
date key whenever the app loads or returns to the foreground and the
date has changed, while past days remain in `state.days`.

**Local-only storage** — everything lives in a single AsyncStorage key
(`storage.ts`); there is no network call anywhere in the data path. The
architecture leaves room for an optional sync layer later without
touching the reminder or storage core.

## Test cases from the spec — where to verify

| # | Case | Where |
|---|------|-------|
| 1–3 | Notification with Wi-Fi / data / both off | OS-level once scheduled — turn off networking, wait for a slot |
| 4 | App fully closed | Force-quit after enabling reminders, wait for a slot |
| 5 | Interval changed → old cleared | `updateSettings` → `rescheduleReminders` → `cancelAllReminders` first |
| 6–7 | Pause / resume | Settings → "Pause reminders" toggle |
| 8 | Reboot restores reminders | Android: boot permission + OS restore; iOS: automatic |
| 9 | Active hours changed | Settings → Start/End → reschedule triggers |
| 10 | Timezone change | Triggers are wall-clock `Date` objects tied to local calendar day, recalculated on next foreground |
| 11 | Reopened after hours offline | Data is local (`AsyncStorage`), always available |
| 12 | No duplicate notifications | `cancelAllReminders` scoped by tag, always run before rescheduling |
| 13 | Midnight rollover | `AppContext` foreground check + `todayKey()` |
| 14 | Permission denied | Onboarding screen explains, then re-prompts; Settings can be revisited |

## What was updated since the first draft

- **Active hours** now use a real native time picker
  (`@react-native-community/datetimepicker`) — a spinner sheet on iOS, the
  system dialog on Android — instead of a tap-to-cycle stepper.
- **Custom water amount** now opens a proper cross-platform modal
  (`CustomAmountModal.tsx`) with validation (1–5000 ml), on both iOS and
  Android, instead of falling back to a plain alert on Android.
- **App icons** are real generated assets under `/assets` (icon, adaptive
  icon, splash, notification icon, favicon) — a simple water-drop mark on
  the app's navy/blue palette — wired up in `app.json`. Swap them for a
  designer's artwork whenever you're ready; the plumbing is already done.

## Remaining known limitation

- The generated icons are a placeholder illustration, not final brand
  artwork — good enough to install and test with, but worth a real
  design pass before a public release.
