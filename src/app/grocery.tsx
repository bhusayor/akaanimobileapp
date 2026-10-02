import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, RotateCcw } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/ui';
import { useStore, weeklyGroceries } from '../lib/store';
import { useEntitlement } from '../lib/subscription';
import { themedStyles, useColors, font, motion, radius, shadow } from '../theme';

function GroceryItem({
  name,
  qty,
  checked,
  onToggle,
}: {
  name: string;
  qty: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const v = useSharedValue(checked ? 1 : 0);
  React.useEffect(() => {
    v.value = withTiming(checked ? 1 : 0, { duration: 220 });
  }, [checked, v]);
  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: v.value > 0.5 ? colors.primary : colors.card,
    borderColor: v.value > 0.5 ? colors.primary : colors.line,
    transform: [{ scale: withTiming(1, { duration: motion.fast, easing: motion.ease }) }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: 1 - v.value * 0.55 }));
  return (
    <PressableScale onPress={onToggle} style={styles.itemRow} scaleTo={0.98} haptic>
      <Animated.View style={[styles.checkbox, boxStyle]}>
        {checked && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
      </Animated.View>
      <Animated.Text
        style={[styles.itemName, textStyle, checked && { textDecorationLine: 'line-through' }]}
        numberOfLines={1}
      >
        {name}
      </Animated.Text>
      <Text style={styles.itemQty}>{qty}</Text>
    </PressableScale>
  );
}

export default function GroceryScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groceryTicks, toggleGrocery, resetGroceries } = useStore();
  const { premium } = useEntitlement();
  const { week } = useLocalSearchParams<{ week?: string }>();
  const offset = week === '1' ? 1 : 0;
  const sections = useMemo(() => weeklyGroceries(offset), [offset]);

  // The list is Premium outright — there is no half-useful version of a
  // shopping list. Anyone arriving here without it (a deep link, or a plan that
  // lapsed while the screen was open) gets the paywall itself rather than a
  // holding screen about the paywall. `replace`, so Back does not bounce them
  // straight back into this redirect.
  useEffect(() => {
    if (!premium) router.replace('/paywall');
  }, [premium, router]);

  if (!premium) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const total = sections.reduce((a, s) => a + s.items.length, 0);
  const done = sections.reduce((a, s) => a + s.items.filter((i) => groceryTicks[i.key]).length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Groceries</Text>
          <Text style={styles.sub}>
            Everything you need for {offset === 0 ? "this week's" : "next week's"} plan
          </Text>
        </View>
        <PressableScale
          onPress={() => resetGroceries(`w${offset}:`)}
          style={styles.resetBtn}
          scaleTo={0.88}
        >
          <RotateCcw size={17} color={colors.inkSoft} strokeWidth={2.2} />
        </PressableScale>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${total ? (done / total) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {done} of {total} in the basket
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}
      >
        {sections.map((section, si) => (
          <Animated.View key={section.section} entering={FadeInDown.delay(si * 80).duration(400)}>
            <Text style={styles.sectionName}>{section.section}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <View key={item.key} style={i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }}>
                  <GroceryItem
                    name={item.name}
                    qty={item.qty}
                    checked={!!groceryTicks[item.key]}
                    onToggle={() => toggleGrocery(item.key)}
                  />
                </View>
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.extrabold, fontSize: 26, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { paddingHorizontal: 24, paddingBottom: 18, gap: 8 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.bgSoft, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.secondary },
  progressText: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkSoft },
  sectionName: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 10,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, ...shadow.card },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.ink },
  itemQty: { fontFamily: font.medium, fontSize: 13, color: colors.inkFaint },
}));
