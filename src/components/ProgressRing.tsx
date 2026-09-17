import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Palette } from '../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0 to 1 (can exceed 1, will be clamped for the ring but shown in label)
  size?: number;
  strokeWidth?: number;
  consumedLabel: string;
  goalLabel: string;
  palette: Palette;
}

export default function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 16,
  consumedLabel,
  goalLabel,
  palette,
}: Props) {
  const clamped = Math.min(progress, 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduceMotion.current = v));
  }, []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clamped,
      duration: reduceMotion.current ? 0 : 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [clamped]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="progressbar"
      accessibilityLabel={`${consumedLabel} of ${goalLabel} consumed`}>
      <Svg width={size} height={size}>
        <Circle
          stroke={palette.ringTrack}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          stroke={palette.ring}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.consumed, { color: palette.textPrimary }]}>{consumedLabel}</Text>
        <Text style={[styles.goal, { color: palette.textSecondary }]}>of {goalLabel}</Text>
        <Text style={[styles.percent, { color: palette.accent }]}>{Math.round(clamped * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  consumed: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  goal: { fontSize: 14, marginTop: 2 },
  percent: { fontSize: 16, fontWeight: '600', marginTop: 10 },
});
