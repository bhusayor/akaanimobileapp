import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LuMascot } from '../components/LuMascot';
import { useStore } from '../lib/store';
import { themedStyles, useColors, font, motion } from '../theme';

const { width: W, height: H } = Dimensions.get('window');
const LETTERS = 'Akaani'.split('');
const FLOATERS = [
  { emoji: '🍲', x: 0.12, delay: 0 },
  { emoji: '🌶️', x: 0.82, delay: 500 },
  { emoji: '🍛', x: 0.3, delay: 1000 },
  { emoji: '🍢', x: 0.68, delay: 300 },
  { emoji: '🫘', x: 0.5, delay: 800 },
  { emoji: '🍌', x: 0.9, delay: 1300 },
];

function Letter({ char, index }: { char: string; index: number }) {
  const styles = useStyles();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(150 + index * 70, withTiming(1, { duration: motion.slow, easing: motion.enter }));
  }, [index, v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 50 }, { rotate: `${(1 - v.value) * 12}deg` }],
  }));
  return <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>;
}

function Floater({ emoji, x, delay }: { emoji: string; x: number; delay: number }) {
  const styles = useStyles();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 4200, easing: Easing.out(Easing.quad) }), -1)
    );
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.value < 0.15 ? v.value * 4 : 1 - v.value,
    transform: [
      { translateY: -v.value * H * 0.55 },
      { translateX: Math.sin(v.value * 6) * 14 },
      { rotate: `${Math.sin(v.value * 5) * 18}deg` },
      { scale: 0.7 + v.value * 0.5 },
    ],
  }));
  return (
    <Animated.Text style={[styles.floater, { left: x * W, top: H * 0.82 }, style]}>
      {emoji}
    </Animated.Text>
  );
}

function PulseRing({ delay, size }: { delay: number; size: number }) {
  const styles = useStyles();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1));
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - v.value) * 0.35,
    transform: [{ scale: 0.5 + v.value * 1.1 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, marginLeft: -size / 2, marginTop: -size / 2 },
        style,
      ]}
    />
  );
}

export default function Splash() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const { hydrated, seenOnboarding, user, setupDone } = useStore();

  const mascot = useSharedValue(0);
  const tag = useSharedValue(0);

  useEffect(() => {
    mascot.value = withDelay(500, withTiming(1, { duration: motion.slow, easing: motion.enter }));
    tag.value = withDelay(850, withTiming(1, { duration: 500 }));
  }, [mascot, tag]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      if (!seenOnboarding) router.replace('/onboarding');
      else if (!user) router.replace('/(auth)/login');
      else if (!setupDone) router.replace('/setup/preferences');
      else router.replace('/(tabs)');
    }, 2300);
    return () => clearTimeout(t);
  }, [hydrated, seenOnboarding, user, setupDone, router]);

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascot.value,
    transform: [{ scale: mascot.value }, { translateY: (1 - mascot.value) * 30 }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tag.value,
    transform: [{ translateY: (1 - tag.value) * 12 }],
  }));

  return (
    <View style={styles.root}>
      {FLOATERS.map((f) => (
        <Floater key={f.emoji} {...f} />
      ))}

      <View style={styles.center}>
        <View style={styles.ringAnchor}>
          <PulseRing delay={600} size={220} />
          <PulseRing delay={1400} size={220} />
        </View>
        <Animated.View style={mascotStyle}>
          <LuMascot size={86} />
        </Animated.View>
        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          {LETTERS.map((c, i) => (
            <Letter key={`${c}-${i}`} char={c} index={i} />
          ))}
          <Animated.View style={[styles.dot, tagStyle]} />
        </View>
        <Animated.Text style={[styles.tagline, tagStyle]}>
          Nigerian food, made personal
        </Animated.Text>
      </View>

      <Animated.View style={[styles.footer, tagStyle]}>
        <Text style={styles.footerText}>Eat well · Track smart · Ask Lu</Text>
      </Animated.View>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringAnchor: { position: 'absolute', top: '42%', left: '50%' },
  ring: { position: 'absolute', borderWidth: 2, borderColor: colors.secondary },
  letter: {
    fontFamily: font.extrabold,
    fontSize: 54,
    color: colors.primary,
    letterSpacing: -1.5,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.secondary,
    alignSelf: 'flex-end',
    marginBottom: 13,
    marginLeft: 4,
  },
  tagline: { fontFamily: font.medium, fontSize: 15, color: colors.inkSoft, marginTop: 8 },
  floater: { position: 'absolute', fontSize: 30 },
  footer: { alignItems: 'center', paddingBottom: 56 },
  footerText: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: colors.inkFaint,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
}));
