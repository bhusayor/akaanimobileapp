import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { font, motion, radius, spacing, themedStyles, useColors } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that eases down on press — the app's core touch feel. */
export function PressableScale({
  children,
  onPress,
  style,
  haptic = true,
  scaleTo = 0.97,
  disabled,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  scaleTo?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() =>
        (scale.value = withTiming(scaleTo, { duration: motion.press, easing: motion.ease }))
      }
      onPressOut={() =>
        (scale.value = withTiming(1, { duration: motion.fast, easing: motion.ease }))
      }
      onPress={() => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={[aStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}) {
  const colors = useColors();
  const styles = useStyles();
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.secondary
        : variant === 'soft'
          ? colors.bgSoft
          : 'transparent';
  const fg =
    variant === 'primary' ? colors.onPrimary : variant === 'secondary' ? '#FFFFFF' : colors.primary;
  return (
    <PressableScale
      onPress={loading || disabled ? undefined : onPress}
      disabled={loading || disabled}
      style={[
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: colors.line },
        style ?? {},
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}

export function Chip({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  small?: boolean;
}) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.93}
      style={[
        styles.chip,
        small && { paddingVertical: 6, paddingHorizontal: 12 },
        active && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      <Text
        style={[styles.chipText, small && { fontSize: 13 }, active && { color: colors.onPrimary }]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

export function Field({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label: string; error?: string; style?: ViewStyle }) {
  const colors = useColors();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const focusStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(error ? colors.danger : focused ? colors.primary : colors.line, {
      duration: motion.fast,
      easing: motion.ease,
    }),
  }));
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.fieldBox, focusStyle]}>
        <TextInput
          placeholderTextColor={colors.inkFaint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.fieldInput}
          {...props}
        />
      </Animated.View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

/** Google's four-colour "G", drawn rather than shipped as an asset. */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}

/** The Apple mark, in a single fill so it can flip with the button colour. */
export function AppleMark({ size = 19, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 512">
      <Path
        fill={color}
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </Svg>
  );
}

/** Google / Apple continue button. Full width, sits under the email form. */
export function SocialButton({
  provider,
  onPress,
  loading,
  label,
}: {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
  label?: string;
}) {
  const colors = useColors();
  const styles = useStyles();
  const apple = provider === 'apple';
  const text = label ?? `Continue with ${apple ? 'Apple' : 'Google'}`;
  return (
    <PressableScale
      onPress={loading ? undefined : onPress}
      disabled={loading}
      scaleTo={0.98}
      style={[
        styles.social,
        apple
          ? { backgroundColor: colors.ink }
          : { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={apple ? colors.bg : colors.ink} />
      ) : (
        <>
          {apple ? <AppleMark color={colors.bg} /> : <GoogleMark />}
          <Text style={[styles.socialText, apple && { color: colors.bg }]}>{text}</Text>
        </>
      )}
    </PressableScale>
  );
}

/** Back arrow + title bar shared by every pushed screen. */
export function ScreenHeader({ title, sub }: { title: string; sub?: string }) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <PressableScale onPress={() => router.back()} style={styles.headerBack}>
        <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
      </PressableScale>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {!!sub && <Text style={styles.headerSub}>{sub}</Text>}
      </View>
    </View>
  );
}

/** "or" rule between the social buttons and the email form. */
export function OrDivider({ label = 'or' }: { label?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.orRow}>
      <View style={styles.orRule} />
      <Text style={styles.orText}>{label}</Text>
      <View style={styles.orRule} />
    </View>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
  style,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.sectionRow, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!sub && <Text style={styles.sectionSub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  button: {
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonText: { fontFamily: font.semibold, fontSize: 16 },
  social: {
    height: 54,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialText: { fontFamily: font.semibold, fontSize: 15.5, color: colors.ink },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: font.extrabold, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
  headerSub: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  orRule: { flex: 1, height: 1, backgroundColor: colors.line },
  orText: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkFaint },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  chipText: { fontFamily: font.medium, fontSize: 14.5, color: colors.ink },
  fieldLabel: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft },
  fieldBox: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
  },
  fieldInput: {
    height: 54,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.ink,
  },
  fieldError: { fontFamily: font.medium, fontSize: 12.5, color: colors.danger },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontFamily: font.bold, fontSize: 21, color: colors.ink, letterSpacing: -0.3 },
  sectionSub: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkFaint, marginTop: 2 },
}));
