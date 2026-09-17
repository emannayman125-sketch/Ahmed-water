import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import ProgressRing from '../components/ProgressRing';
import WaterButton from '../components/WaterButton';
import AmountPicker from '../components/AmountPicker';
import CustomAmountModal from '../components/CustomAmountModal';
import { light, dark, spacing, radius } from '../theme/colors';

function litersLabel(ml: number): string {
  return `${(ml / 1000).toFixed(1)} L`;
}

export default function DashboardScreen() {
  const { today, state, addWater, updateSettings } = useApp();
  const scheme = useColorScheme();
  const isDark = state.settings.darkMode === 'on' || (state.settings.darkMode === 'system' && scheme === 'dark');
  const palette = isDark ? dark : light;

  const [selectedAmount, setSelectedAmount] = useState(state.settings.defaultAmountMl);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const consumed = today.entries.reduce((sum, e) => sum + e.amountMl, 0);
  const goal = today.goalMl;
  const remaining = Math.max(goal - consumed, 0);
  const progress = goal > 0 ? consumed / goal : 0;

  const handleDrink = () => {
    addWater(selectedAmount);
    if (selectedAmount !== state.settings.defaultAmountMl) {
      updateSettings({ defaultAmountMl: selectedAmount });
    }
  };

  const handleCustom = () => setCustomModalOpen(true);

  const handleCustomConfirm = (ml: number) => {
    setSelectedAmount(ml);
    setCustomModalOpen(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: palette.textPrimary }]}>Hey Ahmed 👋</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Let's keep you hydrated today.
          </Text>
        </View>

        <View style={styles.ringWrap}>
          <ProgressRing
            progress={progress}
            consumedLabel={litersLabel(consumed)}
            goalLabel={litersLabel(goal)}
            palette={palette}
          />
        </View>

        <Text style={[styles.remaining, { color: palette.textSecondary }]}>
          {remaining > 0 ? `${litersLabel(remaining)} remaining` : "Goal reached — nice work 💧"}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>AMOUNT</Text>
          <AmountPicker
            selected={selectedAmount}
            onSelect={setSelectedAmount}
            onCustom={handleCustom}
            palette={palette}
          />
        </View>

        <View style={styles.buttonWrap}>
          <WaterButton label="+ I Drank Water 💧" onPress={handleDrink} palette={palette} />
        </View>

        {state.streak.current > 0 && (
          <View style={[styles.streakCard, { backgroundColor: palette.surfaceMuted }]}>
            <Text style={[styles.streakText, { color: palette.textPrimary }]}>
              🔥 {state.streak.current} day streak
            </Text>
          </View>
        )}

        <View style={[styles.personalCard, { backgroundColor: palette.accentSoft }]}>
          <Text style={[styles.personalLabel, { color: palette.textSecondary }]}>A little reminder for you</Text>
          <Text style={[styles.personalMessage, { color: palette.textPrimary }]}>
            {state.settings.personalMessage}
          </Text>
        </View>
      </ScrollView>

      <CustomAmountModal
        visible={customModalOpen}
        initialValue={selectedAmount}
        onCancel={() => setCustomModalOpen(false)}
        onConfirm={handleCustomConfirm}
        palette={palette}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { marginTop: spacing.sm },
  greeting: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4 },
  ringWrap: { alignItems: 'center', marginVertical: spacing.md },
  remaining: { textAlign: 'center', fontSize: 15, marginTop: -spacing.md },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  buttonWrap: { marginTop: spacing.sm },
  streakCard: { padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  streakText: { fontSize: 16, fontWeight: '600' },
  personalCard: { padding: spacing.md, borderRadius: radius.md, gap: 4 },
  personalLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  personalMessage: { fontSize: 15, lineHeight: 21 },
});
