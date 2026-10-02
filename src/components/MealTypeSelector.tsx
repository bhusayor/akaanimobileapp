import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { MealType } from '../lib/meal-draft';
import { font, motion, radius, themedStyles, useColors } from '../theme';
import { PressableScale } from './ui';

/**
 * Breakfast / lunch / dinner only — matches the rest of the app, whose meal
 * plan has no snack slot. `LoggedMeal` still accepts 'snack' so meals logged
 * before this change keep rendering.
 */
const OPTIONS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

const PAD = 4;

/** Segmented Breakfast / Lunch / Dinner / Snack with a pill that eases across. */
export function MealTypeSelector({
  value,
  onChange,
  label = 'Meal type',
}: {
  value: MealType;
  onChange: (v: MealType) => void;
  label?: string;
}) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  const index = Math.max(0, OPTIONS.findIndex((o) => o.key === value));
  const cell = width > 0 ? (width - PAD * 2) / OPTIONS.length : 0;

  const x = useSharedValue(0);
  const settled = useRef(false);
  useEffect(() => {
    if (cell <= 0) return;
    const to = index * cell;
    if (settled.current) {
      x.value = withTiming(to, { duration: motion.base, easing: motion.ease });
    } else {
      x.value = to;
      settled.current = true;
    }
  }, [index, cell, x]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={{ gap: 6 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {cell > 0 && <Animated.View style={[styles.pill, { width: cell }, pillStyle]} />}
        {OPTIONS.map((o) => {
          const active = o.key === value;
          return (
            <PressableScale
              key={o.key}
              onPress={() => onChange(o.key)}
              scaleTo={0.95}
              haptic={!active}
              style={styles.btn}
            >
              <Text style={[styles.btnText, active && styles.btnTextActive]} numberOfLines={1}>
                {o.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  label: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.full,
    padding: PAD,
  },
  pill: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  btnText: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  btnTextActive: { color: colors.onPrimary },
}));
