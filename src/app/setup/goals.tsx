import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SetupPage } from '../../components/setup-page';
import { calculateBmi } from '../../lib/health';
import { Goals, Personalization, useStore } from '../../lib/store';
import { useEntitlement } from '../../lib/subscription';
import { font, themedStyles, useColors } from '../../theme';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/** Adult starting estimates. Activity is deliberately kept at a conservative baseline. */
export function calculateSuggestedGoals(profile: Personalization): Goals | null {
  const { age, heightCm, weightKg, gender, wellnessGoals } = profile;
  if (age == null || age < 20 || heightCm == null || weightKg == null) return null;
  if (heightCm <= 0 || weightKg <= 0) return null;

  // Mifflin–St Jeor resting-energy equation. For gender-neutral or undisclosed
  // selections, use the midpoint of the two constants and label it as an estimate.
  const sexConstant = gender === 'man' ? 5 : gender === 'woman' ? -161 : -78;
  const restingEnergy = 10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant;
  const bmi = calculateBmi(heightCm, weightKg);
  if (bmi == null) return null;
  const losing = wellnessGoals.includes('lose_weight');
  const gaining = wellnessGoals.includes('gain_weight');
  const building = wellnessGoals.includes('build_muscle');
  const boostingEnergy = wellnessGoals.includes('boost_energy');

  let adjustment = 0;
  if (losing) {
    if (bmi >= 30) adjustment = -400;
    else if (bmi >= 25) adjustment = -350;
    else if (bmi >= 18.5) adjustment = -250;
  } else if (gaining) {
    if (bmi < 18.5) adjustment = 350;
    else if (bmi < 25) adjustment = 250;
    else if (bmi < 30) adjustment = 100;
  } else if (building) {
    if (bmi < 18.5) adjustment = 300;
    else if (bmi < 25) adjustment = 200;
    else if (bmi < 30) adjustment = 100;
  }

  const calories = clamp(roundTo(restingEnergy * 1.2 + adjustment, 50), 1200, 4500);
  const proteinShare = losing || building ? 0.25 : 0.2;
  const carbShare = gaining || boostingEnergy ? 0.5 : 0.45;
  const fatShare = 1 - proteinShare - carbShare;

  return {
    calories,
    protein: clamp(roundTo((calories * proteinShare) / 4, 5), 40, 300),
    carbs: clamp(roundTo((calories * carbShare) / 4, 5), 50, 500),
    fat: clamp(roundTo((calories * fatShare) / 9, 5), 20, 200),
    fiber: clamp(Math.round((calories / 1000) * 14), 10, 80),
    target: losing ? 'lose' : gaining || building ? 'gain' : 'maintain',
  };
}


type TargetKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';
const FIELDS = [
  { key: 'protein', label: 'Protein', detail: 'Build & repair', min: 40, max: 300 },
  { key: 'carbs', label: 'Carbs', detail: 'Everyday fuel', min: 50, max: 500 },
  { key: 'fat', label: 'Fats', detail: 'Essential nourishment', min: 20, max: 200 },
  { key: 'fiber', label: 'Fibre', detail: 'Digestive support', min: 10, max: 80 },
] as const;
const toDraft = (values: Goals): Record<TargetKey, string> => ({
  calories: String(values.calories), protein: String(values.protein), carbs: String(values.carbs), fat: String(values.fat), fiber: String(values.fiber),
});

function EnergySegment({ share, color }: { share: number; color: string }) {
  const reduced = useReducedMotion();
  const amount = useSharedValue(share);
  useEffect(() => { amount.value = withTiming(share, { duration: reduced ? 0 : 300 }); }, [amount, reduced, share]);
  const style = useAnimatedStyle(() => ({ flex: Math.max(0.001, amount.value) }));
  return <Animated.View style={[{ backgroundColor: color, height: 12 }, style]} />;
}

export default function GoalsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const reduced = useReducedMotion();
  const router = useRouter();
  const { flow, source } = useLocalSearchParams<{ flow?: string; source?: string }>();
  const { goals, personalization, saveGoals, setupDone, hydrated } = useStore();
  const { premium, trialUsed } = useEntitlement();
  const inPersonalizationFlow = flow === 'personalization';
  const editing = setupDone && !inPersonalizationFlow;
  const suggestion = useMemo(() => calculateSuggestedGoals(personalization), [personalization]);
  const [draft, setDraft] = useState(() => toDraft(!editing && suggestion ? suggestion : goals));
  const touched = useRef(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    if (!hydrated || touched.current) return;
    setDraft(toDraft(!editing && suggestion ? suggestion : goals));
  }, [editing, goals, hydrated, suggestion]);
  const values = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, Number(value)])) as Record<TargetKey, number>;
  const valid = (key: TargetKey, min: number, max: number) => !!draft[key].trim() && Number.isFinite(values[key]) && values[key] >= min && values[key] <= max;
  const allValid = valid('calories', 1200, 4500) && FIELDS.every(field => valid(field.key, field.min, field.max));
  const update = (key: TargetKey, value: string) => {
    touched.current = true;
    setDraft(current => ({ ...current, [key]: value.replace(/[^0-9]/g, '').slice(0, 4) }));
  };
  const nutrientColors = { protein: colors.macroProtein, carbs: colors.macroCarbs, fat: colors.macroFat, fiber: colors.macroFibre };
  const macroEnergy = values.protein * 4 + values.carbs * 4 + values.fat * 9;
  const shares = [values.protein * 4, values.carbs * 4, values.fat * 9].map(value => macroEnergy > 0 ? value / macroEnergy : 0);
  const differs = allValid && Math.abs(macroEnergy - values.calories) > values.calories * 0.1;
  const target: Goals['target'] = personalization.wellnessGoals.includes('lose_weight') ? 'lose'
    : personalization.wellnessGoals.some(goal => goal === 'gain_weight' || goal === 'build_muscle') ? 'gain'
    : personalization.wellnessGoals.length ? 'maintain' : goals.target;
  const finish = () => {
    if (!allValid) return;
    saveGoals({ ...values, target }, true);
    if (inPersonalizationFlow) {
      router.replace(source === 'profile' ? '/(tabs)/profile' : '/(tabs)');
      if (!setupDone && !trialUsed && !premium) router.push('/paywall');
    } else if (editing) router.back();
    else {
      router.replace('/(tabs)');
      if (!trialUsed && !premium) router.push('/paywall');
    }
  };
  const restore = () => { if (suggestion) { touched.current = true; setDraft(toDraft(suggestion)); } };
  return <SetupPage step={8} title={editing ? 'Make it your own.' : 'Your daily targets.'}
    description="A starting point, not a strict rule. Tap any number."
    action={editing ? 'Save targets' : 'Start my plan'} onContinue={finish} disabled={!allValid}>
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(350)} style={styles.energy}>
      <View style={styles.energyTop}><Text style={styles.calorieLabel}>Calories</Text><Text style={styles.perDay}>PER DAY</Text></View>
      <View style={styles.energyNumber}>
        <TextInput value={draft.calories} onChangeText={text => update('calories', text)} keyboardType="number-pad" returnKeyType="done" selectTextOnFocus
          accessibilityLabel="Daily calorie target" style={styles.calorieInput} maxLength={4} />
        <Text style={styles.kcal}>kcal</Text>
      </View>
      {!valid('calories', 1200, 4500) && <Text style={styles.error}>Enter 1,200–4,500 kcal.</Text>}
      <View style={styles.energyBar} accessibilityLabel="Energy split from protein, carbs and fats">
        {shares.map((share, index) => <EnergySegment key={index} share={share} color={[colors.macroProtein, colors.macroCarbs, colors.macroFat][index]} />)}
      </View>
      <View style={styles.legend}>
        {['Protein', 'Carbs', 'Fats'].map((name, index) => <View key={name} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: [colors.macroProtein, colors.macroCarbs, colors.macroFat][index] }]} /><Text style={styles.legendText}>{name} {Math.round(shares[index] * 100)}%</Text></View>)}
      </View>
    </Animated.View>

    <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>YOUR DAILY BALANCE</Text><Text style={styles.hint}>Tap to adjust</Text></View>
    <View style={styles.nutrients}>
      {FIELDS.map(({ key, label, detail, min, max }, index) => <Animated.View key={key} entering={reduced ? undefined : FadeInDown.delay(60 + index * 35).duration(320)}
        style={[styles.nutrient, index === FIELDS.length - 1 && { borderBottomWidth: 0 }]}>
        <View style={[styles.nutrientMark, { backgroundColor: nutrientColors[key] }]} />
        <View style={styles.nutrientCopy}><Text style={styles.nutrientName}>{label}</Text><Text style={styles.nutrientDetail}>{detail}</Text>
          {!valid(key, min, max) && <Text style={styles.error}>Enter {min}–{max} g.</Text>}</View>
        <TextInput accessibilityLabel={label + ' target'} value={draft[key]} onChangeText={text => update(key, text)} keyboardType="number-pad" returnKeyType="done"
          selectTextOnFocus maxLength={3} style={styles.nutrientInput} /><Text style={styles.grams}>g</Text>
      </Animated.View>)}
    </View>
    {differs && <Text style={styles.balanceNote}>Your macros add up to about {macroEnergy.toLocaleString()} kcal. Adjust them if you want a closer match.</Text>}

    <View style={styles.estimateRow}>
      <Pressable onPress={() => setDetailsOpen(open => !open)} accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} style={styles.estimateButton}>
        <Text style={styles.estimateTitle}>{suggestion ? 'How we estimated this' : 'About these targets'}</Text><Text style={styles.expand}>{detailsOpen ? '−' : '+'}</Text>
      </Pressable>
      {suggestion && <Pressable onPress={restore} accessibilityRole="button" accessibilityLabel="Restore suggested targets" style={styles.restore}><Text style={styles.restoreText}>Reset</Text></Pressable>}
    </View>
    {detailsOpen && <Animated.View entering={reduced ? undefined : FadeInDown.duration(180)}>
      <Text style={styles.explanation}>{suggestion
        ? 'An adult estimate using your age, measurements, selected goal and a low-activity baseline. BMI informs the goal adjustment; it does not measure your energy needs by itself.'
        : 'These are starting values, not a personalized recommendation. Adult age, height and weight are needed for an estimate.'}</Text>
      <Text style={styles.explanation}>Adjust for your activity and professional advice. Fibre is part of carbs, not an extra energy share.</Text>
    </Animated.View>}
  </SetupPage>;
}

const useStyles = themedStyles(colors => ({
  energy: { marginTop: 25, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.line },
  energyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calorieLabel: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  perDay: { fontFamily: font.medium, fontSize: 9, letterSpacing: 1.4, color: colors.inkFaint },
  energyNumber: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  calorieInput: { flex: 1, minWidth: 0, padding: 0, fontFamily: font.light, fontSize: 76, lineHeight: 90, letterSpacing: -3, color: colors.ink },
  kcal: { fontFamily: font.medium, fontSize: 15, color: colors.inkSoft, marginLeft: 8 },
  energyBar: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', gap: 3, marginTop: 10 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginTop: 13 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legendText: { fontFamily: font.medium, fontSize: 10, color: colors.inkSoft },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 8 },
  sectionLabel: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.2, color: colors.inkSoft },
  hint: { fontFamily: font.regular, fontSize: 10, color: colors.inkFaint },
  nutrients: { marginTop: 2 },
  nutrient: { minHeight: 74, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12, paddingVertical: 10 },
  nutrientMark: { height: 30, width: 4, borderRadius: 2 },
  nutrientCopy: { flex: 1 },
  nutrientName: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  nutrientDetail: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: colors.inkSoft, marginTop: 2 },
  nutrientInput: { width: 69, padding: 0, fontFamily: font.semibold, fontSize: 30, color: colors.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
  grams: { width: 10, fontFamily: font.regular, fontSize: 13, color: colors.inkFaint },
  estimateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 18 },
  estimateButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  estimateTitle: { fontFamily: font.medium, fontSize: 12, color: colors.inkSoft },
  expand: { fontFamily: font.regular, fontSize: 21, color: colors.inkSoft },
  restore: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 },
  restoreText: { fontFamily: font.semibold, fontSize: 12, color: colors.secondary },
  explanation: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft, marginTop: 8 },
  balanceNote: { fontFamily: font.regular, fontSize: 11, lineHeight: 17, color: colors.inkSoft, marginTop: 12 },
  error: { fontFamily: font.medium, fontSize: 11, color: colors.danger, marginTop: 5 },
}));
