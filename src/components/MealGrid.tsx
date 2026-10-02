import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, Flame } from 'lucide-react-native';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Meal } from '../data/meals';
import { font, motion, radius, shadow, themedStyles, useColors } from '../theme';
import { LockedBlock, LockedText } from './Locked';
import { PressableScale } from './ui';

const { width: W } = Dimensions.get('window');
const GRID_CARD_W = (W - 20 * 2 - 12) / 2;

/** Two-up meal card used by explore, collections and cuisines. */
export function MealGridCard({ meal, index = 0 }: { meal: Meal; index?: number }) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 10) * 45)
        .duration(motion.base)
        .easing(motion.enter)}
    >
      <PressableScale onPress={() => router.push(`/meal/${meal.id}`)} style={styles.card} scaleTo={0.98}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: meal.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LockedBlock radius={radius.sm} bleed={5} style={styles.kcalBadge}>
            <Flame size={11} color={colors.secondary} strokeWidth={2.6} />
            <LockedText style={styles.kcalBadgeText}>{String(meal.calories)}</LockedText>
          </LockedBlock>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {meal.name}
        </Text>
        <View style={styles.metaRow}>
          <Clock size={12} color={colors.inkFaint} strokeWidth={2.4} />
          <Text style={styles.meta}>{meal.time} min</Text>
          <View style={styles.dot} />
          <Text style={styles.meta} numberOfLines={1}>
            {meal.category}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function MealGrid({ meals }: { meals: Meal[] }) {
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {meals.map((m, i) => (
        <MealGridCard key={m.id} meal={m} index={i} />
      ))}
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: GRID_CARD_W,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 10,
    paddingBottom: 14,
    ...shadow.card,
  },
  imageWrap: {
    height: GRID_CARD_W * 0.78,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgSoft,
  },
  kcalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  kcalBadgeText: { fontFamily: font.bold, fontSize: 11, color: colors.ink },
  name: {
    fontFamily: font.semibold,
    fontSize: 14.5,
    lineHeight: 19,
    color: colors.ink,
    marginTop: 10,
    marginLeft: 4,
    minHeight: 38,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginLeft: 4 },
  meta: { fontFamily: font.medium, fontSize: 11.5, color: colors.inkFaint, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.inkFaint },
}));
