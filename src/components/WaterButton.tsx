import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Palette, radius } from '../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  palette: Palette;
}

export default function WaterButton({ label, onPress, palette }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.button, { backgroundColor: palette.accent }]}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  label: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
