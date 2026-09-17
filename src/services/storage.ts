import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DEFAULT_SETTINGS, Settings, DayRecord, StreakInfo } from '../types';

// A single namespaced key holds the whole app state. This is deliberate:
// it keeps writes atomic-ish (one setItem) and avoids partial-write races
// between settings/days/streak that separate keys would risk.
const STORAGE_KEY = 'ahmed_water_state_v1';

const DEFAULT_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  days: {},
  streak: { current: 0, longest: 0, lastGoalMetDate: null },
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    // Merge with defaults so new settings fields introduced in later
    // versions don't come back undefined for existing installs.
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      days: parsed.days ?? {},
      streak: parsed.streak ?? DEFAULT_STATE.streak,
    };
  } catch (e) {
    console.warn('Failed to load state, starting fresh:', e);
    return DEFAULT_STATE;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function exportHistoryAsCsv(days: Record<string, DayRecord>): Promise<string> {
  const rows = ['date,time,amount_ml'];
  Object.values(days)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((day) => {
      day.entries.forEach((entry) => {
        const t = new Date(entry.timestamp);
        const time = t.toTimeString().slice(0, 8);
        rows.push(`${day.date},${time},${entry.amountMl}`);
      });
    });
  return rows.join('\n');
}
