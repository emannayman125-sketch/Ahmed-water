import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useApp } from '../context/AppContext';
import { light, dark } from '../theme/colors';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = { Home: '💧', History: '📊', Settings: '⚙️' };

export default function RootNavigation() {
  const { state } = useApp();
  const scheme = useColorScheme();
  const isDark = state.settings.darkMode === 'on' || (state.settings.darkMode === 'system' && scheme === 'dark');
  const palette = isDark ? dark : light;

  return (
    <NavigationContainer theme={{
      dark: isDark,
      colors: {
        primary: palette.accent,
        background: palette.background,
        card: palette.surface,
        text: palette.textPrimary,
        border: palette.border,
        notification: palette.accent,
      },
    }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.textTertiary,
          tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Home" component={DashboardScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
