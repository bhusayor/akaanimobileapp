import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Bot, CalendarDays, LineChart, Sparkles } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/ui';
import { useStore } from '../lib/store';
import { themedStyles, useColors, font, radius, shadow } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'ai',
    emoji: '✨',
    Icon: Sparkles,
    title: 'AI meal\nrecommendations',
    body: 'Akaani learns what you love — from party jollof to pepper soup — and recommends meals that fit your taste and your goals.',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'plan',
    emoji: '🗓️',
    Icon: CalendarDays,
    title: 'Smart daily\nmeal plan',
    body: 'Wake up to a full day already planned: breakfast, lunch and dinner curated around your preferences and calorie targets.',
    image:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'track',
    emoji: '📊',
    Icon: LineChart,
    title: 'Track your\nmeals',
    body: 'Log meals in two taps, watch your macros in real time, and review your week with clean, honest analytics.',
    image:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'lu',
    emoji: '🧑🏾‍🍳',
    Icon: Bot,
    title: 'Meet Lu,\nyour food guide',
    body: '“How do I make ayamase less bitter?” Ask Lu anything about Nigerian food — recipes, swaps, portions, all of it.',
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
  },
];

function Slide({ item, index, x }: { item: (typeof SLIDES)[0]; index: number; x: SharedValue<number> }) {
  const styles = useStyles();
  const colors = useColors();
  const range = [(index - 1) * W, index * W, (index + 1) * W];
  const imgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(x.value, range, [W * 0.35, 0, -W * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(x.value, range, [1.18, 1, 1.18], Extrapolation.CLAMP) },
    ],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(x.value, range, [40, 0, 40], Extrapolation.CLAMP) },
    ],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(x.value, range, [6, 0, -6], Extrapolation.CLAMP)}deg` },
      { scale: interpolate(x.value, range, [0.9, 1, 0.9], Extrapolation.CLAMP) },
    ],
  }));
  const stickerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(x.value, range, [70, 12, -40], Extrapolation.CLAMP)}deg` },
      { scale: interpolate(x.value, range, [0.3, 1, 0.3], Extrapolation.CLAMP) },
    ],
  }));
  const { Icon } = item;
  return (
    <View style={{ width: W }}>
      <Animated.View style={[styles.imageWrap, cardStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, imgStyle]}>
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        </Animated.View>
        <View style={styles.imageScrim} />
        <View style={styles.iconBadge}>
          <Icon size={22} color={colors.secondary} strokeWidth={2.2} />
        </View>
        <Animated.View style={[styles.sticker, stickerStyle]}>
          <Text style={{ fontSize: 30 }}>{item.emoji}</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, x }: { index: number; x: SharedValue<number> }) {
  const styles = useStyles();
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * W, index * W, (index + 1) * W];
    return {
      width: interpolate(x.value, range, [8, 28, 8], Extrapolation.CLAMP),
      opacity: interpolate(x.value, range, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

export default function Onboarding() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useStore();
  const x = useSharedValue(0);
  const [page, setPage] = useState(0);
  const listRef = useRef<Animated.ScrollView>(null);

  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  const finish = () => {
    completeOnboarding();
    router.replace('/(auth)/login');
  };

  const next = () => {
    if (page >= SLIDES.length - 1) return finish();
    listRef.current?.scrollTo({ x: (page + 1) * W, animated: true });
  };

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
        bounces={false}
      >
        {SLIDES.map((s, i) => (
          <Slide key={s.key} item={s} index={i} x={x} />
        ))}
      </Animated.ScrollView>

      <PressableScale onPress={finish} style={[styles.skip, { top: insets.top + 10 }]}>
        <Text style={styles.skipText}>Skip</Text>
      </PressableScale>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} x={x} />
          ))}
        </View>
        <PressableScale onPress={next} style={styles.nextBtn}>
          {page === SLIDES.length - 1 ? (
            <Text style={styles.nextText}>Get started</Text>
          ) : (
            <ArrowRight size={24} color={colors.onPrimary} strokeWidth={2.4} />
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg },
  imageWrap: {
    height: H * 0.48,
    marginHorizontal: 16,
    marginTop: 70,
    overflow: 'hidden',
    borderRadius: radius.xl + 8,
    backgroundColor: colors.bgSoft,
    ...shadow.float,
  },
  sticker: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(20, 12, 4, 0.12)',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  textBlock: { paddingHorizontal: 28, paddingTop: 36, gap: 14 },
  title: {
    fontFamily: font.extrabold,
    fontSize: 36,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -1,
  },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 25, color: colors.inkSoft },
  skip: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  skipText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  nextBtn: {
    minWidth: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    ...shadow.float,
  },
  nextText: { fontFamily: font.semibold, fontSize: 16, color: colors.onPrimary },
}));
