import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { light, dark, spacing, radius } from '../theme/colors';
import { formatTime, lastNDayKeys, weekdayLabel, todayKey } from '../utils/dates';

export default function HistoryScreen() {
  const { state, today } = useApp();
  const scheme = useColorScheme();
  const isDark = state.settings.darkMode === 'on' || (state.settings.darkMode === 'system' && scheme === 'dark');
  const palette = isDark ? dark : light;

  const last7 = lastNDayKeys(7);
  const weekDays = last7.map((key) => {
    const record = state.days[key];
    const consumed = record ? record.entries.reduce((s, e) => s + e.amountMl, 0) : 0;
    const goal = record?.goalMl ?? state.settings.dailyGoalMl;
    return { key, consumed, goal, met: consumed >= goal && consumed > 0 };
  });

  const daysWithData = weekDays.filter((d) => d.consumed > 0);
  const avgIntake = daysWithData.length
    ? Math.round(daysWithData.reduce((s, d) => s + d.consumed, 0) / daysWithData.length)
    : 0;
  const goalsMetCount = weekDays.filter((d) => d.met).length;
  const maxForChart = Math.max(...weekDays.map((d) => d.goal), 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>History</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>TODAY</Text>
          {today.entries.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: palette.surfaceMuted }]}>
              <Text style={{ color: palette.textSecondary }}>No entries yet. Your first glass will show up here.</Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              {[...today.entries].reverse().map((e, i) => (
                <View
                  key={e.id}
                  style={[
                    styles.timelineRow,
                    i !== today.entries.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
                  ]}
                >
                  <Text style={{ color: palette.textSecondary }}>{formatTime(e.timestamp)}</Text>
                  <Text style={{ color: palette.textPrimary, fontWeight: '600' }}>{e.amountMl} ml</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>WEEKLY STATISTICS</Text>
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.chartRow}>
              {weekDays.map((d) => {
                const heightPct = Math.min(d.consumed / maxForChart, 1);
                return (
                  <View key={d.key} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${Math.max(heightPct * 100, d.consumed > 0 ? 6 : 0)}%`,
                            backgroundColor: d.met ? palette.success : palette.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: palette.textTertiary }]}>{weekdayLabel(d.key)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatBox label="Avg / day" value={`${(avgIntake / 1000).toFixed(1)} L`} palette={palette} />
            <StatBox label="Goal days" value={`${goalsMetCount} / 7`} palette={palette} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, palette }: { label: string; value: string; palette: typeof light }) {
  return (
    <View style={[statStyles.box, { backgroundColor: palette.surfaceMuted }]}>
      <Text style={[statStyles.value, { color: palette.textPrimary }]}>{value}</Text>
      <Text style={[statStyles.label, { color: palette.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', gap: 2 },
  value: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 12 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', marginTop: spacing.sm },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  card: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  emptyCard: { padding: spacing.lg, borderRadius: radius.md, alignItems: 'center' },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  chartRow: { flexDirection: 'row', height: 140, padding: spacing.md, alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 },
  barTrack: { width: 18, height: '85%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 0 },
  barLabel: { fontSize: 11 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
});
