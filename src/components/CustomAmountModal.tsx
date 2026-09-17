import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Palette, radius, spacing } from '../theme/colors';

interface Props {
  visible: boolean;
  initialValue: number;
  onCancel: () => void;
  onConfirm: (ml: number) => void;
  palette: Palette;
}

export default function CustomAmountModal({ visible, initialValue, onCancel, onConfirm, palette }: Props) {
  const [text, setText] = useState(String(initialValue));

  useEffect(() => {
    if (visible) setText(String(initialValue));
  }, [visible, initialValue]);

  const parsed = parseInt(text, 10);
  const valid = !isNaN(parsed) && parsed > 0 && parsed <= 5000;

  const confirm = () => {
    if (valid) onConfirm(parsed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>Custom amount</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Enter an amount in milliliters</Text>

          <View style={[styles.inputRow, { borderColor: valid ? palette.border : palette.danger, backgroundColor: palette.surfaceMuted }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              keyboardType="number-pad"
              autoFocus
              maxLength={4}
              style={[styles.input, { color: palette.textPrimary }]}
              placeholder="250"
              placeholderTextColor={palette.textTertiary}
              accessibilityLabel="Amount in milliliters"
              onSubmitEditing={confirm}
              returnKeyType="done"
            />
            <Text style={[styles.unit, { color: palette.textSecondary }]}>ml</Text>
          </View>
          {!valid && <Text style={[styles.error, { color: palette.danger }]}>Enter a value between 1 and 5000 ml</Text>}

          <View style={styles.buttonRow}>
            <Pressable onPress={onCancel} style={[styles.button, { backgroundColor: palette.surfaceMuted }]}>
              <Text style={[styles.buttonText, { color: palette.textPrimary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={!valid}
              style={[styles.button, { backgroundColor: valid ? palette.accent : palette.textTertiary }]}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Use amount</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  input: { flex: 1, fontSize: 20, fontWeight: '600', paddingVertical: 12 },
  unit: { fontSize: 16, fontWeight: '600' },
  error: { fontSize: 12 },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  button: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
