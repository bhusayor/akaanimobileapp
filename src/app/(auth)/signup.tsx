import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { displayName, signup, usingPlatformApi } from '../../api/platform';
import { Button, Field, OrDivider, PressableScale, SocialButton } from '../../components/ui';
import { saveToken } from '../../lib/session';
import { useStore } from '../../lib/store';
import { themedStyles, useColors, font } from '../../theme';

export default function Signup() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [social, setSocial] = useState<'google' | 'apple' | null>(null);

  /** Mocked OAuth — see the note in login.tsx. */
  const socialSignUp = (provider: 'google' | 'apple') => {
    setSocial(provider);
    setTimeout(() => {
      signIn(
        'Adaeze Okafor',
        provider === 'google' ? 'adaeze.okafor@gmail.com' : 'adaeze@icloud.com'
      );
      setSocial(null);
      router.replace('/setup/preferences');
    }, 900);
  };

  const submit = async () => {
    const e: typeof errors = {};
    // platform-api needs a first and a last name, each at least 2 characters.
    const [first = '', ...rest] = name.trim().split(/\s+/);
    const last = rest.join(' ');
    if (name.trim().length < 2) e.name = 'Tell us what to call you';
    else if (usingPlatformApi && (first.length < 2 || last.length < 2)) e.name = 'Enter your first and last name';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';
    if (password.length < 8) e.password = 'Use at least 8 characters';
    const digits = phone.replace(/[^\d+]/g, '');
    if (usingPlatformApi && (digits.length < 7 || digits.length > 14)) e.phone = 'Enter a valid phone number';
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setLoading(true);

    if (usingPlatformApi) {
      try {
        const res = await signup({ first_name: first, last_name: last, email: email.trim(), password, phone: digits });
        await saveToken(res.token);
        signIn(displayName(res.user), res.user.email);
        router.replace('/setup/preferences');
      } catch (err) {
        setFormError((err as Error).message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // No platform-api configured: local-only account, as before.
    setTimeout(() => {
      signIn(name.trim(), email.trim());
      router.replace('/setup/preferences');
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

        <Animated.View entering={FadeInUp.duration(500)}>
          <Text style={styles.title}>Create your{'\n'}account</Text>
          <Text style={styles.sub}>
            One account, every Nigerian meal you'll ever need.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.social}>
          <SocialButton
            provider="google"
            label="Sign up with Google"
            onPress={() => socialSignUp('google')}
            loading={social === 'google'}
          />
          <SocialButton
            provider="apple"
            label="Sign up with Apple"
            onPress={() => socialSignUp('apple')}
            loading={social === 'apple'}
          />
          <OrDivider label="or use your email" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.form}>
          <Field
            label="Full name"
            placeholder="Adaeze Okafor"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <Field
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <Field
            label="Password"
            placeholder="Minimum 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          {usingPlatformApi && (
            <Field
              label="Phone"
              placeholder="+2348012345678"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
            />
          )}
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
          <Button title="Create account" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
          <Text style={styles.terms}>
            By continuing you agree to Akaani's Terms of Service and Privacy Policy.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <PressableScale onPress={() => router.back()} haptic={false}>
            <Text style={styles.footerLink}>Sign in</Text>
          </PressableScale>
        </Animated.View>
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
  sub: { fontFamily: font.regular, fontSize: 15.5, color: colors.inkSoft, marginTop: 10 },
  social: { marginTop: 28, gap: 12 },
  form: { marginTop: 20, gap: 18 },
  formError: { fontFamily: font.medium, fontSize: 13.5, color: colors.danger, textAlign: 'center' },
  terms: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkFaint, textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 32 },
  footerText: { fontFamily: font.regular, fontSize: 15, color: colors.inkSoft },
  footerLink: { fontFamily: font.semibold, fontSize: 15, color: colors.primary },
}));
