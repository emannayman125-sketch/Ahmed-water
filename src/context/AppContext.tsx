import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import { AppState, DayRecord, Settings, WaterEntry } from '../types';
import { loadState, saveState } from '../services/storage';
import { ensureQueueFresh, rescheduleReminders } from '../services/notifications';
import { todayKey } from '../utils/dates';

interface Ctx {
  state: AppState;
  loading: boolean;
  today: DayRecord;
  addWater: (amountMl: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetTodayProgress: () => void;
  clearAll: () => void;
}

const AppContext = createContext<Ctx | undefined>(undefined);

function emptyDay(dateKey: string, goalMl: number): DayRecord {
  return { date: dateKey, entries: [], goalMl };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    settings: {} as Settings, // replaced on load
    days: {},
    streak: { current: 0, longest: 0, lastGoalMetDate: null },
  });
  const [loading, setLoading] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  // --- initial load + daily rollover check + notification queue check ---
  useEffect(() => {
    (async () => {
      const loaded = await loadState();
      const key = todayKey();
      if (!loaded.days[key]) {
        loaded.days[key] = emptyDay(key, loaded.settings.dailyGoalMl);
      }
      setState(loaded);
      setLoading(false);
      await ensureQueueFresh(loaded.settings);
    })();
  }, []);

  // Re-check rollover + notification freshness whenever the app comes to
  // the foreground — this is what lets midnight resets and post-reboot
  // notification restoration happen even if the app was closed for days.
  useEffect(() => {
    const onChange = async (status: AppStateStatus) => {
      if (status !== 'active') return;
      const key = todayKey();
      setState((prev) => {
        if (prev.days[key]) return prev;
        const next = { ...prev, days: { ...prev.days, [key]: emptyDay(key, prev.settings.dailyGoalMl) } };
        saveState(next);
        return next;
      });
      if (stateRef.current.settings.reminderIntervalMin) {
        await ensureQueueFresh(stateRef.current.settings);
      }
    };
    const sub = RNAppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    saveState(next);
  }, []);

  const addWater = useCallback((amountMl: number) => {
    const key = todayKey();
    const prev = stateRef.current;
    const day = prev.days[key] ?? emptyDay(key, prev.settings.dailyGoalMl);
    const entry: WaterEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amountMl,
      timestamp: new Date().toISOString(),
    };
    const updatedDay: DayRecord = { ...day, entries: [...day.entries, entry] };
    const totalToday = updatedDay.entries.reduce((sum, e) => sum + e.amountMl, 0);

    let streak = prev.streak;
    if (totalToday >= updatedDay.goalMl && streak.lastGoalMetDate !== key) {
      const current = streak.current + 1;
      streak = { current, longest: Math.max(streak.longest, current), lastGoalMetDate: key };
    }

    persist({
      ...prev,
      days: { ...prev.days, [key]: updatedDay },
      streak,
    });
  }, [persist]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const prev = stateRef.current;
    const nextSettings = { ...prev.settings, ...patch };
    const next = { ...prev, settings: nextSettings };
    persist(next);
    // Any settings change affecting schedule (interval, active hours,
    // pause, sound) requires cancel-and-reschedule so old triggers never
    // linger alongside new ones (no duplicates).
    rescheduleReminders(nextSettings);
  }, [persist]);

  const resetTodayProgress = useCallback(() => {
    const key = todayKey();
    const prev = stateRef.current;
    persist({ ...prev, days: { ...prev.days, [key]: emptyDay(key, prev.settings.dailyGoalMl) } });
  }, [persist]);

  const clearAll = useCallback(() => {
    const key = todayKey();
    const fresh: AppState = {
      settings: stateRef.current.settings,
      days: { [key]: emptyDay(key, stateRef.current.settings.dailyGoalMl) },
      streak: { current: 0, longest: 0, lastGoalMetDate: null },
    };
    persist(fresh);
  }, [persist]);

  const today = state.days[todayKey()] ?? emptyDay(todayKey(), state.settings?.dailyGoalMl ?? 2500);

  return (
    <AppContext.Provider value={{ state, loading, today, addWater, updateSettings, resetTodayProgress, clearAll }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
