import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Palette, radius, spacing } from '../theme/colors';

const PRESETS = [150, 200, 250, 330, 500];

interface Props {
  selected: number;
  onSelect: (ml: number) => void;
  onCustom: () => void;
  palette: Palette;
}

export default function AmountPicker({ selected, onSelect, onCustom, palette }: Props) {
  const isCustomSelected = !PRESETS.includes(selected);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {PRESETS.map((ml) => {
        const active = ml === selected;
        return (
          <Pressable
            key={ml}
            onPress={() => onSelect(ml)}
            accessibilityRole="button"
            accessibilityLabel={`${ml} milliliters`}
            style={[
              styles.chip,
              { backgroundColor: active ? palette.accent : palette.surfaceMuted, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : palette.textPrimary }]}>{ml} ml</Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={onCustom}
        accessibilityRole="button"
        accessibilityLabel="Custom amount"
        style={[
          styles.chip,
          { backgroundColor: isCustomSelected ? palette.accent : palette.surfaceMuted, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.chipText, { color: isCustomSelected ? '#fff' : palette.textPrimary }]}>
          {isCustomSelected ? `${selected} ml` : 'Custom'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
});
