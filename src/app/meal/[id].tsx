import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Clock, Images, Minus, Plus, UtensilsCrossed } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedBlock, LockedText, PremiumPill, UnlockRow } from '../../components/Locked';
import { SuccessModal } from '../../components/modals';
import { Button, PressableScale } from '../../components/ui';
import { currentMealType, mealById } from '../../data/meals';
import { todayKey, useStore } from '../../lib/store';
import { useEntitlement, usePaywall } from '../../lib/subscription';
import { themedStyles, useColors, font, macroColor, radius, shadow } from '../../theme';

const HERO_H = 340;

/** Label → the theme key that colours it. */
const MACRO_KEY = {
  Calories: 'calories',
  Protein: 'protein',
  Carbs: 'carbs',
  Fat: 'fat',
  Fibre: 'fibre',
} as const;

/** Scale a human quantity string ("1/2 cup", "3 tbsp", "600 g") by a factor. */
function scaleQty(qty: string, factor: number): string {
  if (factor === 1) return qty;
  return qty.replace(/(\d+\s*\/\s*\d+|\d+(?:\.\d+)?)/, (raw) => {
    let n: number;
    if (raw.includes('/')) {
      const [a, b] = raw.split('/').map((s) => parseFloat(s));
      n = a / b;
    } else {
      n = parseFloat(raw);
    }
    const scaled = n * factor;
    const rounded = Math.round(scaled * 4) / 4;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  });
}

function MacroCell({
  label,
  value,
  unit,
  max,
  delay,
}: {
  label: keyof typeof MACRO_KEY;
  value: number;
  unit: string;
  max: number;
  delay: number;
}) {
  const styles = useStyles();
  const colors = useColors();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(Math.min(1, value / max), { duration: 700 }));
  }, [value, max, delay, w]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(w.value * 100, 6)}%` }));
  return (
    <View style={styles.macroCell}>
      <View style={styles.macroValueRow}>
        <LockedText style={styles.macroValue}>{String(value)}</LockedText>
        <Text style={styles.macroUnit}> {unit}</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <Animated.View
          style={[styles.macroFill, { backgroundColor: macroColor(colors, MACRO_KEY[label]) }, fill]}
        />
      </View>
    </View>
  );
}

export default function MealDetail() {
  const styles = useStyles();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addLog } = useStore();
  const { premium } = useEntitlement();
  const openPaywall = usePaywall();
  const meal = useMemo(() => mealById(String(id)), [id]);

  const [servings, setServings] = useState(meal?.servings ?? 2);
  const [logged, setLogged] = useState(false);
  const [gathered, setGathered] = useState<Record<string, boolean>>({});
  const [doneSteps, setDoneSteps] = useState<Record<number, boolean>>({});

  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-HERO_H, 0, HERO_H], [-HERO_H / 2, 0, HERO_H * 0.5]) },
      { scale: interpolate(y.value, [-HERO_H, 0], [1.8, 1], Extrapolation.CLAMP) },
    ],
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [HERO_H - 140, HERO_H - 70], [0, 1], Extrapolation.CLAMP),
  }));

  if (!meal) {
    return (
      <View style={styles.missing}>
        <UtensilsCrossed size={40} color={colors.inkFaint} />
        <Text style={styles.missingText}>Meal not found</Text>
        <Button title="Go back" variant="soft" onPress={() => router.back()} />
      </View>
    );
  }

  const factor = servings / meal.servings;
  const gatheredCount = meal.ingredients.filter((i) => gathered[i.name]).length;
  const doneCount = meal.steps.filter((_, i) => doneSteps[i]).length;

  const toggleIngredient = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setGathered((prev) => ({ ...prev, [name]: !prev[name] }));
  };
  const toggleStep = (i: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDoneSteps((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const logMeal = () => {
    addLog({
      mealId: meal.id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      mealType: currentMealType(),
      date: todayKey(),
    });
    setLogged(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
            <Image source={{ uri: meal.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
          </Animated.View>
          <View style={styles.heroScrim} />
        </View>

        <View style={styles.sheet}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.kickerRow}>
              <Text style={styles.kicker}>{meal.category.toUpperCase()}</Text>
              <View style={styles.kickerDot} />
              <Text style={styles.kicker}>{meal.region.toUpperCase()}</Text>
              <View style={{ flex: 1 }} />
              <View style={styles.timePill}>
                <Clock size={13} color={colors.inkSoft} strokeWidth={2.4} />
                <Text style={styles.timeText}>{meal.time} min</Text>
              </View>
            </View>
            <Text style={styles.title}>{meal.name}</Text>
            <Text style={styles.desc}>{meal.description}</Text>
          </Animated.View>

          {/* Tags */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tags}>
            {meal.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Macros per serving */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>MACROS PER SERVING</Text>
              <View style={styles.sectionRule} />
            </View>
            <View style={styles.macroCard}>
              {/* Frosted inside the card, not around it — an overflow-clipped
                  wrapper would eat the card's shadow while locked. */}
              <LockedBlock radius={radius.sm} style={styles.macroCells}>
                <MacroCell label="Calories" value={meal.calories} unit="kcal" max={800} delay={100} />
                <MacroCell label="Protein" value={meal.protein} unit="g" max={60} delay={180} />
                <MacroCell label="Carbs" value={meal.carbs} unit="g" max={100} delay={260} />
                <MacroCell label="Fat" value={meal.fat} unit="g" max={60} delay={340} />
                <MacroCell label="Fibre" value={meal.fiber} unit="g" max={15} delay={420} />
              </LockedBlock>
            </View>
            <UnlockRow label="Subscribe to see this meal's macros" style={{ marginTop: 10 }} />
          </Animated.View>

          {/* Ingredients — tap to gather */}
          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>INGREDIENTS</Text>
              <View style={styles.sectionRule} />
              <Text style={styles.sectionCount}>
                {gatheredCount}/{meal.ingredients.length} ready
              </Text>
            </View>
            <View style={styles.servingsRow}>
              <Text style={styles.servingsHint}>Tap items as you gather them</Text>
              <View style={styles.servings}>
                <PressableScale onPress={() => setServings(Math.max(1, servings - 1))} style={styles.servBtn} scaleTo={0.85}>
                  <Minus size={15} color={colors.ink} strokeWidth={2.6} />
                </PressableScale>
                <Text style={styles.servText}>{servings} servings</Text>
                <PressableScale onPress={() => setServings(Math.min(16, servings + 1))} style={styles.servBtn} scaleTo={0.85}>
                  <Plus size={15} color={colors.ink} strokeWidth={2.6} />
                </PressableScale>
              </View>
            </View>
            <View style={styles.ingList}>
              {meal.ingredients.map((ing, i) => {
                const done = !!gathered[ing.name];
                return (
                  <PressableScale
                    key={ing.name}
                    onPress={() => toggleIngredient(ing.name)}
                    haptic={false}
                    scaleTo={0.99}
                    style={[styles.ingRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
                  >
                    <View style={[styles.ingCheck, done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      {done && <Check size={13} color={colors.onPrimary} strokeWidth={3} />}
                    </View>
                    <Text
                      style={[
                        styles.ingName,
                        done && { color: colors.inkFaint, textDecorationLine: 'line-through' },
                      ]}
                    >
                      {ing.name}
                    </Text>
                    <Text style={[styles.ingQty, done && { color: colors.inkFaint }]}>{scaleQty(ing.qty, factor)}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Steps — tap the number to mark done */}
          <Animated.View entering={FadeInDown.delay(340).duration(400)}>
            <View style={[styles.sectionRow, { marginTop: 36 }]}>
              <Text style={styles.sectionLabel}>HOW TO COOK IT</Text>
              <View style={styles.sectionRule} />
              <Text style={styles.sectionCount}>
                {doneCount}/{meal.steps.length} done
              </Text>
            </View>
            <View style={{ marginBottom: 16 }}>
              <UnlockRow feature="walkthrough" label="Subscribe to cook along with photos" />
            </View>
            <View style={{ gap: 20 }}>
              {meal.steps.map((step, i) => {
                const done = !!doneSteps[i];
                return (
                  <View key={step.title} style={[styles.stepCard, done && { opacity: 0.55 }]}>
                    {!!step.image &&
                      (premium ? (
                        <Image
                          source={{ uri: step.image }}
                          style={styles.stepImage}
                          contentFit="cover"
                          transition={300}
                        />
                      ) : (
                        <PressableScale
                          onPress={() => openPaywall('walkthrough')}
                          scaleTo={0.99}
                          style={styles.stepLocked}
                        >
                          <Images size={20} color={colors.inkFaint} strokeWidth={2.2} />
                          <Text style={styles.stepLockedText}>See this step in photos</Text>
                          <PremiumPill />
                        </PressableScale>
                      ))}
                    <View style={styles.stepBody}>
                      <PressableScale
                        onPress={() => toggleStep(i)}
                        haptic={false}
                        scaleTo={0.8}
                        style={[styles.stepNum, done && { backgroundColor: colors.success }]}
                      >
                        {done ? (
                          <Check size={15} color={colors.onPrimary} strokeWidth={3} />
                        ) : (
                          <Text style={styles.stepNumText}>{i + 1}</Text>
                        )}
                      </PressableScale>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepText}>{step.text}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Back button */}
      <PressableScale onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]}>
        <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
      </PressableScale>

      {/* Compact title bar on scroll */}
      <Animated.View pointerEvents="none" style={[styles.titleBar, { paddingTop: insets.top + 10 }, barStyle]}>
        <Text style={styles.titleBarText} numberOfLines={1}>
          {meal.name}
        </Text>
      </Animated.View>

      {/* Log CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button title="Log this meal" onPress={logMeal} />
      </View>

      <SuccessModal
        visible={logged}
        title="Meal logged!"
        message={
          premium
            ? `${meal.name} — ${meal.calories} kcal added to today's plate.`
            : `${meal.name} added to today's plate.`
        }
        buttonLabel="Nice"
        onClose={() => setLogged(false)}
      />
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  hero: { height: HERO_H, overflow: 'hidden', backgroundColor: colors.bgSoft },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,10,3,0.12)',
  },
  sheet: {
    marginTop: -28,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontFamily: font.bold, fontSize: 10.5, letterSpacing: 1.6, color: colors.secondary },
  kickerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.inkFaint },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  timeText: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkSoft },
  title: {
    fontFamily: font.extrabold,
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: 12,
  },
  desc: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.inkSoft, marginTop: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  tag: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  tagText: { fontFamily: font.medium, fontSize: 12.5, color: '#8A4A08' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 34,
    marginBottom: 14,
  },
  sectionLabel: { fontFamily: font.bold, fontSize: 12.5, letterSpacing: 2, color: colors.ink },
  sectionRule: { flex: 1, height: 1, backgroundColor: colors.line },
  sectionCount: { fontFamily: font.semibold, fontSize: 12, color: colors.inkFaint },
  macroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow.card,
  },
  macroCells: { flexDirection: 'row', gap: 10 },
  macroCell: { flex: 1, gap: 3 },
  macroValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  macroValue: { fontFamily: font.bold, fontSize: 15.5, color: colors.ink },
  macroUnit: { fontFamily: font.regular, fontSize: 10, color: colors.inkFaint },
  macroLabel: { fontFamily: font.regular, fontSize: 10.5, color: colors.inkSoft },
  macroTrack: { height: 4, borderRadius: 2, backgroundColor: colors.bg, overflow: 'hidden', marginTop: 3 },
  macroFill: { height: '100%', borderRadius: 2 },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  servingsHint: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkFaint, flex: 1 },
  servings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  servBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  ingList: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 18, ...shadow.card },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  ingCheck: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingName: { fontFamily: font.regular, fontSize: 15, color: colors.ink, flex: 1 },
  ingQty: { fontFamily: font.semibold, fontSize: 14, color: colors.secondary },
  stepCard: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  stepImage: { width: '100%', height: 170, backgroundColor: colors.bgSoft },
  stepLocked: {
    height: 78,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  stepLockedText: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkSoft },
  stepBody: { flexDirection: 'row', gap: 14, padding: 16 },
  stepNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: font.bold, fontSize: 14, color: colors.onPrimary },
  stepTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  stepText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.inkSoft },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  titleBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 76,
  },
  titleBarText: { fontFamily: font.bold, fontSize: 16.5, color: colors.ink },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.bg,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
    backgroundColor: colors.bg,
  },
  missingText: { fontFamily: font.semibold, fontSize: 17, color: colors.inkSoft },
}));
