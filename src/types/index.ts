export interface WaterEntry {
  id: string;
  amountMl: number;
  timestamp: string; // ISO string, local time captured at logging moment
}

export interface DayRecord {
  date: string; // YYYY-MM-DD (local)
  entries: WaterEntry[];
  goalMl: number; // goal snapshot for that day, in case goal changes later
}

export interface Settings {
  dailyGoalMl: number;
  reminderIntervalMin: number;
  activeStartHour: number; // 0-23
  activeStartMinute: number;
  activeEndHour: number;
  activeEndMinute: number;
  defaultAmountMl: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  darkMode: 'system' | 'on' | 'off';
  personalMessage: string;
  remindersPaused: boolean;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastGoalMetDate: string | null; // YYYY-MM-DD
}

export interface AppState {
  settings: Settings;
  days: Record<string, DayRecord>; // keyed by YYYY-MM-DD
  streak: StreakInfo;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyGoalMl: 2500,
  reminderIntervalMin: 30,
  activeStartHour: 9,
  activeStartMinute: 0,
  activeEndHour: 23,
  activeEndMinute: 0,
  defaultAmountMl: 250,
  soundEnabled: true,
  vibrationEnabled: true,
  darkMode: 'system',
  personalMessage: 'Take care of yourself, Ahmed. One sip at a time. 💙',
  remindersPaused: false,
};
