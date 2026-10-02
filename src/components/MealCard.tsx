import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, Flame } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Meal } from '../data/meals';
import { themedStyles, useColors, font, radius, shadow } from '../theme';
import { LockedBlock, LockedText } from './Locked';
import { PressableScale } from './ui';

export function MealCard({ meal, width = 250 }: { meal: Meal; width?: number }) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  return (
    <PressableScale
      onPress={() => router.push(`/meal/${meal.id}`)}
      style={[styles.card, { width }]}
      scaleTo={0.97}
    >
      <Image source={{ uri: meal.image }} style={styles.image} contentFit="cover" transition={300} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.name}
        </Text>
        <View style={styles.metaRow}>
          <LockedBlock radius={radius.full} bleed={6} style={styles.meta}>
            <Flame size={14} color={colors.secondary} strokeWidth={2.4} />
            <LockedText style={styles.metaText}>{String(meal.calories)}</LockedText>
            <Text style={styles.metaText}>kcal</Text>
          </LockedBlock>
          <View style={styles.meta}>
            <Clock size={14} color={colors.inkFaint} strokeWidth={2.4} />
            <Text style={styles.metaText}>{meal.time} min</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export function MealRow({ meal, tag }: { meal: Meal; tag?: string }) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  return (
    <PressableScale
      onPress={() => router.push(`/meal/${meal.id}`)}
      style={styles.row}
      scaleTo={0.98}
    >
      <Image source={{ uri: meal.image }} style={styles.rowImage} contentFit="cover" transition={300} />
      <View style={{ flex: 1, gap: 3 }}>
        {!!tag && <Text style={styles.rowTag}>{tag}</Text>}
        <Text style={styles.rowName} numberOfLines={1}>
          {meal.name}
        </Text>
        <View style={styles.metaRow}>
          <LockedBlock radius={radius.full} bleed={6} style={styles.meta}>
            <Flame size={13} color={colors.secondary} strokeWidth={2.4} />
            <LockedText style={styles.metaText}>{String(meal.calories)}</LockedText>
            <Text style={styles.metaText}>kcal</Text>
          </LockedBlock>
          <View style={styles.meta}>
            <Clock size={13} color={colors.inkFaint} strokeWidth={2.4} />
            <Text style={styles.metaText}>{meal.time} min</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const useStyles = themedStyles((colors) => ({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  image: { width: '100%', height: 150, backgroundColor: colors.bgSoft },
  body: { padding: 14, gap: 8 },
  name: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  metaRow: { flexDirection: 'row', gap: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkSoft },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    ...shadow.card,
  },
  rowImage: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.bgSoft },
  rowTag: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rowName: { fontFamily: font.semibold, fontSize: 16.5, color: colors.ink },
}));
