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
import { Button, Field, OrDivider, PressableScale, SocialButton } from '../../components/ui';
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

  const submit = () => {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 40 },
  footerText: { fontFamily: font.regular, fontSize: 15, color: colors.inkSoft },
  footerLink: { fontFamily: font.semibold, fontSize: 15, color: colors.primary },
}));
