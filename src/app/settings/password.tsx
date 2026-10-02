import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SuccessModal } from '../../components/modals';
import { Button, Field, ScreenHeader } from '../../components/ui';
import { font, motion, themedStyles, useColors } from '../../theme';

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One capital letter', test: (p: string) => /[A-Z]/.test(p) },
];

export default function ChangePasswordScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = () => {
    const e: typeof errors = {};
    if (current.length < 6) e.current = 'Enter your current password';
    if (!RULES.every((r) => r.test(next))) e.next = 'Password does not meet the rules below';
    if (next !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    // No auth backend yet — this stands in for the real request.
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Change password" sub="Keep your account yours" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.duration(motion.base).easing(motion.enter)}
          style={{ gap: 18 }}
        >
          <Field
            label="Current password"
            placeholder="••••••••"
            secureTextEntry
            value={current}
            onChangeText={setCurrent}
            error={errors.current}
          />
          <Field
            label="New password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={next}
            onChangeText={setNext}
            error={errors.next}
          />
          <Field
            label="Confirm new password"
            placeholder="Type it again"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(70).duration(motion.base).easing(motion.enter)}
          style={styles.rules}
        >
          {RULES.map((r) => {
            const ok = r.test(next);
            return (
              <View key={r.label} style={styles.ruleRow}>
                {ok ? (
                  <Check size={15} color={colors.success} strokeWidth={3} />
                ) : (
                  <X size={15} color={colors.inkFaint} strokeWidth={2.6} />
                )}
                <Text style={[styles.ruleText, ok && { color: colors.success }]}>{r.label}</Text>
              </View>
            );
          })}
        </Animated.View>

        <Button title="Update password" onPress={submit} loading={loading} />
      </ScrollView>

      <SuccessModal
        visible={done}
        title="Password updated"
        message="Use your new password the next time you sign in."
        buttonLabel="Done"
        onClose={() => {
          setDone(false);
          router.back();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((colors) => ({
  rules: { gap: 8, paddingHorizontal: 2 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontFamily: font.medium, fontSize: 13, color: colors.inkSoft },
}));
