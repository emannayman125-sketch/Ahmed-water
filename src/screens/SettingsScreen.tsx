import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert, useColorScheme, Share, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { light, dark, spacing, radius } from '../theme/colors';
import { formatHourMinute } from '../utils/dates';
import { exportHistoryAsCsv } from '../services/storage';

const GOALS = [1500, 2000, 2500, 3000];
const INTERVALS = [15, 30, 45, 60];

export default function SettingsScreen() {
  const { state, updateSettings, resetTodayProgress, clearAll } = useApp();
  const scheme = useColorScheme();
  const isDark = state.settings.darkMode === 'on' || (state.settings.darkMode === 'system' && scheme === 'dark');
  const palette = isDark ? dark : light;
  const s = state.settings;

  const confirmReset = () => {
    Alert.alert("Reset today's progress?", "Today's log will be cleared. History stays intact.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetTodayProgress },
    ]);
  };

  const confirmClear = () => {
    Alert.alert('Clear all data?', 'This removes everything — history, streak, and settings. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear everything', style: 'destructive', onPress: clearAll },
    ]);
  };

  const handleExport = async () => {
    const csv = await exportHistoryAsCsv(state.days);
    await Share.share({ message: csv, title: 'Ahmed Water — history export' });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Settings</Text>

        <Section label="Daily goal" palette={palette}>
          <ChipRow
            values={GOALS}
            selected={s.dailyGoalMl}
            format={(v) => `${(v / 1000).toFixed(1)} L`}
            onSelect={(v) => updateSettings({ dailyGoalMl: v })}
            palette={palette}
          />
        </Section>

        <Section label="Reminder interval" palette={palette}>
          <ChipRow
            values={INTERVALS}
            selected={s.reminderIntervalMin}
            format={(v) => `${v} min`}
            onSelect={(v) => updateSettings({ reminderIntervalMin: v })}
            palette={palette}
          />
        </Section>

        <Section label="Active hours" palette={palette}>
          <TimeRow
            label="Start"
            hour={s.activeStartHour}
            minute={s.activeStartMinute}
            palette={palette}
            onChange={(h, m) => updateSettings({ activeStartHour: h, activeStartMinute: m })}
          />
          <TimeRow
            label="End"
            hour={s.activeEndHour}
            minute={s.activeEndMinute}
            palette={palette}
            onChange={(h, m) => updateSettings({ activeEndHour: h, activeEndMinute: m })}
          />
        </Section>

        <Section label="Reminders" palette={palette}>
          <ToggleRow
            label="Pause reminders"
            value={s.remindersPaused}
            onChange={(v) => updateSettings({ remindersPaused: v })}
            palette={palette}
          />
          <ToggleRow
            label="Sound"
            value={s.soundEnabled}
            onChange={(v) => updateSettings({ soundEnabled: v })}
            palette={palette}
          />
          <ToggleRow
            label="Vibration"
            value={s.vibrationEnabled}
            onChange={(v) => updateSettings({ vibrationEnabled: v })}
            palette={palette}
          />
        </Section>

        <Section label="Appearance" palette={palette}>
          <ChipRow
            values={['system', 'on', 'off'] as const}
            selected={s.darkMode}
            format={(v) => (v === 'system' ? 'Auto' : v === 'on' ? 'Dark' : 'Light')}
            onSelect={(v) => updateSettings({ darkMode: v })}
            palette={palette}
          />
        </Section>

        <Section label="Data" palette={palette}>
          <Row label="Reset today's progress" value="" palette={palette} onPress={confirmReset} />
          <Row label="Export history" value="" palette={palette} onPress={handleExport} />
          <Row label="Clear all data" value="" palette={palette} onPress={confirmClear} destructive />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimeRow({
  label,
  hour,
  minute,
  onChange,
  palette,
}: {
  label: string;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  palette: typeof light;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const currentValue = new Date();
  currentValue.setHours(hour, minute, 0, 0);

  const applyAndClose = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      // Android's dialog closes itself after a selection or on dismiss.
      setPickerOpen(false);
      if (event.type === 'set' && date) onChange(date.getHours(), date.getMinutes());
      return;
    }
    if (date) onChange(date.getHours(), date.getMinutes());
  };

  return (
    <>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[styles.row, { borderBottomColor: palette.border }]}
        accessibilityRole="button"
        accessibilityLabel={`${label} time, ${formatHourMinute(hour, minute)}`}
      >
        <Text style={{ color: palette.textPrimary, fontSize: 15 }}>{label}</Text>
        <Text style={{ color: palette.textSecondary }}>{formatHourMinute(hour, minute)}</Text>
      </Pressable>

      {pickerOpen && Platform.OS === 'android' && (
        <DateTimePicker mode="time" value={currentValue} onChange={applyAndClose} is24Hour={false} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: palette.surface }]}>
              <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>{label} time</Text>
              <DateTimePicker
                mode="time"
                value={currentValue}
                display="spinner"
                onChange={applyAndClose}
                textColor={palette.textPrimary as any}
              />
              <Pressable
                onPress={() => setPickerOpen(false)}
                style={[styles.modalDoneButton, { backgroundColor: palette.accent }]}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function Section({ label, children, palette }: { label: string; children: React.ReactNode; palette: typeof light }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>{label.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  palette,
  destructive,
}: {
  label: string;
  value: string;
  onPress: () => void;
  palette: typeof light;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: palette.border }]}>
      <Text style={{ color: destructive ? palette.danger : palette.textPrimary, fontSize: 15 }}>{label}</Text>
      {!!value && <Text style={{ color: palette.textSecondary }}>{value}</Text>}
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  palette,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  palette: typeof light;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <Text style={{ color: palette.textPrimary, fontSize: 15 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.accent }} />
    </View>
  );
}

function ChipRow<T extends string | number>({
  values,
  selected,
  format,
  onSelect,
  palette,
}: {
  values: readonly T[];
  selected: T;
  format: (v: T) => string;
  onSelect: (v: T) => void;
  palette: typeof light;
}) {
  return (
    <View style={styles.chipRow}>
      {values.map((v) => {
        const active = v === selected;
        return (
          <Pressable
            key={String(v)}
            onPress={() => onSelect(v)}
            style={[
              styles.chip,
              { backgroundColor: active ? palette.accent : palette.surfaceMuted, borderColor: palette.border },
            ]}
          >
            <Text style={{ color: active ? '#fff' : palette.textPrimary, fontWeight: '600', fontSize: 13 }}>
              {format(v)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', marginTop: spacing.sm },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  card: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden', padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  modalDoneButton: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  modalDoneText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
