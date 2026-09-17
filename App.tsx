import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigation from './src/navigation';
import WaterButton from './src/components/WaterButton';
import { requestPermissions, rescheduleReminders, scheduleSnooze } from './src/services/notifications';
import { light, dark, spacing } from './src/theme/colors';

function Onboarding({ onDone }: { onDone: () => void }) {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? dark : light;

  const handleAllow = async () => {
    await requestPermissions();
    onDone();
  };

  return (
    <SafeAreaView style={[styles.onboardSafe, { backgroundColor: palette.background }]}>
      <View style={styles.onboardContent}>
        <Text style={styles.onboardEmoji}>💧</Text>
        <Text style={[styles.onboardTitle, { color: palette.textPrimary }]}>
          Ahmed, I'll remind you to drink water throughout the day.
        </Text>
        <Text style={[styles.onboardBody, { color: palette.textSecondary }]}>
          These reminders work directly from your phone, even when you're offline.
        </Text>
      </View>
      <WaterButton label="Enable Reminders" onPress={handleAllow} palette={palette} />
    </SafeAreaView>
  );
}

function AppInner() {
  const { loading, state } = useApp();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const responseListener = useRef<any>();

  useEffect(() => {
    if (loading) return;
    // Once settings are loaded we know whether this is a returning user.
    // A real build would persist an "onboarded" flag; here we infer it
    // from whether any entries/settings already exist beyond defaults.
    Notifications.getPermissionsAsync().then(({ status }) => {
      setOnboarded(status === 'granted');
    });
  }, [loading]);

  useEffect(() => {
    // Handles the "Drink Now" / "Snooze 15/30" notification action
    // buttons — this is what makes those work even though the app was
    // in the background or fully closed when the user tapped them.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      if (actionId === 'SNOOZE_15') {
        scheduleSnooze(15, state.settings);
      } else if (actionId === 'SNOOZE_30') {
        scheduleSnooze(30, state.settings);
      }
      // 'DRINK_NOW' and the default tap both open the app to the
      // foreground already (see notifications.ts category config),
      // landing Ahmed on the dashboard where he can log the amount.
    });
    return () => {
      responseListener.current?.remove();
    };
  }, [state.settings]);

  if (loading || onboarded === null) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!onboarded) {
    return (
      <Onboarding
        onDone={async () => {
          await rescheduleReminders(state.settings);
          setOnboarded(true);
        }}
      />
    );
  }

  return <RootNavigation />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  onboardSafe: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  onboardContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  onboardEmoji: { fontSize: 56, marginBottom: spacing.md },
  onboardTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30 },
  onboardBody: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
