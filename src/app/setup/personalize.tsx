import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SetupPage } from '../../components/setup-page';
import { WellnessGoal, useStore } from '../../lib/store';
import { font, themedStyles, useColors } from '../../theme';

const GOALS: { id: WellnessGoal; title: string; description: string; color: string }[] = [
  { id: 'lose_weight', title: 'Lose weight', description: 'Find a lighter, satisfying balance.', color: '#A078BB' },
  { id: 'gain_weight', title: 'Gain weight', description: 'Add nourishment, little by little.', color: '#C48147' },
  { id: 'build_muscle', title: 'Build muscle', description: 'Fuel strength and recovery.', color: '#568E9B' },
  { id: 'eat_healthier', title: 'Eat healthier', description: 'More variety. More whole foods.', color: '#659A73' },
  { id: 'boost_energy', title: 'Boost energy', description: 'Keep your day well fuelled.', color: '#BC9442' },
  { id: 'stay_consistent', title: 'Stay consistent', description: 'Make good habits feel natural.', color: '#BA7768' },
];

function GoalDrawing({ goal, color }: { goal: WellnessGoal; color: string }) {
  return <Svg width={44} height={44} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {goal === 'lose_weight' || goal === 'gain_weight' ? <>
      <Circle cx={24} cy={25} r={15} /><Circle cx={24} cy={25} r={10} strokeOpacity={0.35} />
      <Path d={goal === 'lose_weight' ? 'M24 15a10 10 0 0 1 10 10H24Z' : 'M24 15a10 10 0 1 1-10 10h10Z'} fill={color} fillOpacity={0.22} />
      <Path d="M4 12v10m-2-10v5q2 4 4 0v-5M4 22v16m40-26v26m0-26q-5 5 0 12" />
    </> : goal === 'build_muscle' ? <>
      <Path d="m16 29 13-13M7 26l15 15M26 7l15 15" strokeWidth={4} />
      <Rect x={9} y={22} width={8} height={19} rx={2} transform="rotate(-45 13 31)" fill={color} fillOpacity={0.15} />
      <Rect x={29} y={2} width={8} height={19} rx={2} transform="rotate(-45 33 11)" fill={color} fillOpacity={0.15} />
    </> : goal === 'eat_healthier' ? <>
      <Path d="M7 26h34c-1 12-8 15-17 15S8 38 7 26Z" fill={color} fillOpacity={0.13} />
      <Path d="M23 26C9 23 9 14 11 9c10 0 14 7 12 17Zm2 0C24 13 30 7 39 6c1 11-5 18-14 20ZM15 14l8 12m11-14-9 14" />
    </> : goal === 'boost_energy' ? <>
      <Path d="M6 33h36M10 39h28M15 27a10 10 0 0 1 20 0" fill={color} fillOpacity={0.15} />
      <Path d="M25 5v6M9 12l4 4m24-4-4 4M4 24h6m30 0h4" />
    </> : <>
      <Rect x={7} y={10} width={34} height={31} rx={5} /><Path d="M7 19h34M16 6v8m16-8v8M14 28l3 3 5-6m5 3 3 3 5-6M14 36h7" />
    </>}
  </Svg>;
}

export default function GoalIntentScreen() {
  const styles = useStyles();
  const colors = useColors();
  const reduced = useReducedMotion();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { personalization, savePersonalization, hydrated } = useStore();
  const [selected, setSelected] = useState(personalization.wellnessGoals);
  const touched = useRef(false);
  useEffect(() => { if (hydrated && !touched.current) setSelected(personalization.wellnessGoals); }, [hydrated, personalization.wellnessGoals]);
  const next = (goals = selected) => {
    savePersonalization({ ...personalization, wellnessGoals: goals });
    router.push({ pathname: '/setup/gender', params: { source } } as never);
  };
  const toggle = (goal: WellnessGoal) => {
    touched.current = true;
    Haptics.selectionAsync().catch(() => {});
    setSelected(current => {
      if (current.includes(goal)) return current.filter(item => item !== goal);
      const opposite = goal === 'lose_weight' ? 'gain_weight' : goal === 'gain_weight' ? 'lose_weight' : null;
      return [...current.filter(item => item !== opposite), goal];
    });
  };
  return <SetupPage step={2} title="What brings you here?" description="Choose what matters to you. Pick more than one." action="Continue" onContinue={() => next()} onSkip={() => next([])}>
    <View style={styles.listHeader}><Text style={styles.label}>YOUR DIRECTION</Text><Text accessibilityLiveRegion="polite" style={styles.count}>{selected.length ? `${selected.length} selected` : 'Optional'}</Text></View>
    <View style={styles.list}>
      {GOALS.map(({ id, title, description, color }, index) => {
        const active = selected.includes(id);
        return <Animated.View key={id} entering={reduced ? undefined : FadeInDown.delay(index * 35).duration(320)}>
          <Pressable onPress={() => toggle(id)} accessibilityRole="checkbox" accessibilityState={{ checked: active }} accessibilityLabel={`${title}. ${description}`}
            style={({ pressed }) => [styles.row, active && { backgroundColor: colors.card, borderColor: color }, pressed && { opacity: 0.75 }]}>
            <View style={[styles.drawing, { backgroundColor: `${color}12` }]}><GoalDrawing goal={id} color={color} /></View>
            <View style={styles.copy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDescription}>{description}</Text></View>
            <View style={[styles.check, active && { backgroundColor: color, borderColor: color }]}>
              {active && <Svg width={15} height={15} viewBox="0 0 20 20"><Path d="m4 10 4 4 8-8" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>}
            </View>
          </Pressable>
        </Animated.View>;
      })}
    </View>
    <Text style={styles.note}>Your goals can change. So can your plan.</Text>
  </SetupPage>;
}

const useStyles = themedStyles(colors => ({
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 12 },
  label: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.5, color: colors.inkSoft },
  count: { fontFamily: font.medium, fontSize: 11, color: colors.inkSoft },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, borderRadius: 18, minHeight: 78, borderWidth: 1, borderColor: colors.line },
  drawing: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  copy: { flex: 1 },
  rowTitle: { fontFamily: font.semibold, fontSize: 16, lineHeight: 20, color: colors.ink },
  rowDescription: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 16, color: colors.inkSoft, marginTop: 3 },
  check: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' },
  note: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: colors.inkFaint, textAlign: 'center', marginTop: 18 },
}));
