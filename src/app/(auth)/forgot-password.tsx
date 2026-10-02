import { useRouter } from 'expo-router';
import { ArrowLeft, MailCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field, PressableScale } from '../../components/ui';
import { themedStyles, useColors, font, shadow } from '../../theme';

export default function ForgotPassword() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError(undefined);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={colors.ink} strokeWidth={2.2} />
        </PressableScale>

        {sent ? (
          <Animated.View entering={ZoomIn.duration(400)} style={styles.sentWrap}>
            <View style={styles.sentBadge}>
              <MailCheck size={34} color={colors.success} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Check your inbox</Text>
            <Text style={[styles.sub, { textAlign: 'center' }]}>
              We sent a reset link to{'\n'}
              <Text style={{ fontFamily: font.semibold, color: colors.ink }}>{email}</Text>
            </Text>
            <Button title="Back to sign in" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 32 }} />
            <PressableScale onPress={() => setSent(false)} haptic={false} style={{ marginTop: 20 }}>
              <Text style={styles.resend}>Didn't get it? Send again</Text>
            </PressableScale>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInUp.duration(500)}>
              <Text style={styles.title}>Forgot{'\n'}password?</Text>
              <Text style={styles.sub}>
                No wahala. Enter your email and we'll send you a link to reset it.
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.form}>
              <Field
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={error}
              />
              <Button title="Send reset link" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
            </Animated.View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((colors) => ({
  container: { flexGrow: 1, paddingHorizontal: 28 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 24,
  },
  title: { fontFamily: font.extrabold, fontSize: 36, lineHeight: 40, color: colors.ink, letterSpacing: -1 },
  sub: { fontFamily: font.regular, fontSize: 15.5, lineHeight: 23, color: colors.inkSoft, marginTop: 10 },
  form: { marginTop: 32, gap: 18 },
  sentWrap: { alignItems: 'center', paddingTop: 48 },
  sentBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...shadow.card,
  },
  resend: { fontFamily: font.semibold, fontSize: 14.5, color: colors.secondary },
}));
