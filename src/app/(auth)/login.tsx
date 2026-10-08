import { Link, useRouter } from 'expo-router';
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
import { displayName, login, usingPlatformApi } from '../../api/platform';
import { Button, Field, OrDivider, PressableScale, SocialButton } from '../../components/ui';
import { saveToken } from '../../lib/session';
import { useStore } from '../../lib/store';
import { themedStyles, useColors, font } from '../../theme';

export default function Login() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, setupDone } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [social, setSocial] = useState<'google' | 'apple' | null>(null);

  /**
   * Mocked OAuth. Real Google/Apple sign-in needs a dev build plus provider
   * credentials; until then this stands in the same place in the flow.
   */
  const socialSignIn = (provider: 'google' | 'apple') => {
    setSocial(provider);
    setTimeout(() => {
      const [name, mail] =
        provider === 'google'
          ? ['Adaeze Okafor', 'adaeze.okafor@gmail.com']
          : ['Adaeze Okafor', 'adaeze@icloud.com'];
      signIn(name, mail);
      setSocial(null);
      router.replace(setupDone ? '/(tabs)' : '/setup/preferences');
    }, 900);
  };

  const submit = async () => {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';
    // platform-api rejects passwords under 8 characters before checking them.
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setLoading(true);

    if (usingPlatformApi) {
      try {
        const res = await login(email, password);
        await saveToken(res.token);
        signIn(displayName(res.user), res.user.email);
        router.replace(setupDone ? '/(tabs)' : '/setup/preferences');
      } catch (err) {
        setFormError((err as Error).message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // No platform-api configured: local-only sign-in, as before.
    setTimeout(() => {
      const name = email.split('@')[0].replace(/[._-]/g, ' ');
      signIn(name.charAt(0).toUpperCase() + name.slice(1), email.trim());
      router.replace(setupDone ? '/(tabs)' : '/setup/preferences');
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.duration(500)}>
          <Text style={styles.brand}>
            Akaani<Text style={{ color: colors.secondary }}>.</Text>
          </Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.sub}>Your meals missed you. Sign in to continue.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.social}>
          <SocialButton
            provider="google"
            onPress={() => socialSignIn('google')}
            loading={social === 'google'}
          />
          <SocialButton
            provider="apple"
            onPress={() => socialSignIn('apple')}
            loading={social === 'apple'}
          />
          <OrDivider label="or sign in with email" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.form}>
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
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <Link href="/(auth)/forgot-password" asChild>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Link>
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
          <Button title="Sign in" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>New to Akaani? </Text>
          <PressableScale onPress={() => router.push('/(auth)/signup')} haptic={false}>
            <Text style={styles.footerLink}>Create an account</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((colors) => ({
  container: { flexGrow: 1, paddingHorizontal: 28 },
  brand: { fontFamily: font.extrabold, fontSize: 22, color: colors.primary, letterSpacing: -0.5 },
  title: {
    fontFamily: font.extrabold,
    fontSize: 38,
    color: colors.ink,
    letterSpacing: -1,
    marginTop: 40,
  },
  sub: { fontFamily: font.regular, fontSize: 15.5, color: colors.inkSoft, marginTop: 8 },
  social: { marginTop: 32, gap: 12 },
  form: { marginTop: 20, gap: 18 },
  forgot: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.secondary,
    alignSelf: 'flex-end',
  },
  formError: { fontFamily: font.medium, fontSize: 13.5, color: colors.danger, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 40 },
  footerText: { fontFamily: font.regular, fontSize: 15, color: colors.inkSoft },
  footerLink: { fontFamily: font.semibold, fontSize: 15, color: colors.primary },
}));
