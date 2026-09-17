// All date logic here works in the device's LOCAL time zone deliberately,
// since "midnight" and "active hours" mean local midnight/hours to Ahmed.

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayKeyOffset(offsetDays: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + offsetDays);
  return todayKey(d);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function formatHourMinute(hour: number, minute: number): string {
  let h = hour % 12;
  if (h === 0) h = 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:${String(minute).padStart(2, '0')} ${ampm}`;
}

export function lastNDayKeys(n: number, from: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(dayKeyOffset(-i, from));
  return keys;
}

export function weekdayLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}
