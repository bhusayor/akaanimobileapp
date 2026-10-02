import { useRouter } from 'expo-router';
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  ListPlus,
  Lock,
  Pencil,
  Plus,
  ScanLine,
  Search as SearchIcon,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedBlock, LockedText, PremiumPill, TrialNote, UnlockRow } from '../../components/Locked';
import { CalorieBadge, MacroChips } from '../../components/MacroChips';
import { ConfirmModal, SuccessModal } from '../../components/modals';
import { Button, Chip, Field, OrDivider, PressableScale, SectionTitle } from '../../components/ui';
import { MEALS } from '../../data/meals';
import { useMealDraft } from '../../lib/meal-draft';
import { LoggedMeal, logsForDate, todayKey, totalsFor, useStore } from '../../lib/store';
import { useEntitlement, usePaywall } from '../../lib/subscription';
import { font, macroColor, motion, radius, shadow, themedStyles, useColors, type MacroKey } from '../../theme';

/** No snack slot — the app's meal plan is breakfast / lunch / dinner throughout. */
const MEAL_TYPES: LoggedMeal['mealType'][] = ['breakfast', 'lunch', 'dinner'];

/** Animated count-up number — makes totals feel alive when they change. */
function CountUp({ value, textStyle }: { value: number; textStyle: object }) {
  const [display, setDisplay] = useState(0);
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withTiming(value, { duration: 800, easing: motion.ease });
  }, [value, v]);
  useAnimatedReaction(
    () => Math.round(v.value),
    (cur, prev) => {
      if (cur !== prev) runOnJS(setDisplay)(cur);
    }
  );
  return <LockedText style={textStyle}>{String(display)}</LockedText>;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Animated calorie ring — fills toward the daily goal, turns green when hit. */
function CalorieRing({ value, goal, size = 150 }: { value: number; goal: number; size?: number }) {
  const styles = useStyles();
  const colors = useColors();
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  useEffect(() => {
    p.value = withTiming(pct, { duration: 900, easing: motion.ease });
  }, [pct, p]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  const hit = value >= goal && goal > 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.bgSoft} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={hit ? colors.success : colors.secondary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {/* A frosted lozenge in the middle of the arc, so the lock reads as
          deliberate rather than as a number that failed to render. */}
      <LockedBlock radius={radius.full} bleed={9}>
        <CountUp value={value} textStyle={styles.ringValue} />
      </LockedBlock>
      <Text style={styles.ringLabel}>of {goal} kcal</Text>
    </View>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const styles = useStyles();
  const w = useSharedValue(0);
  const pct = Math.min(1, max > 0 ? value / max : 0);
  useEffect(() => {
    w.value = withTiming(pct, { duration: 700, easing: motion.ease });
  }, [pct, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

/**
 * Narrow numeric input — five of these sit on one row in the manual form.
 *
 * Named in full and dotted in its nutrient's colour, so the row reads the same
 * way as the goal card above it rather than as "P / C / F / Fb".
 */
function MacroInput({
  label,
  macro,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  macro: MacroKey;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <View style={styles.macroInputLabelRow}>
        <View style={[styles.macroInputDot, { backgroundColor: macroColor(colors, macro) }]} />
        <Text style={styles.macroInputLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType="numeric"
        style={styles.macroInput}
      />
    </View>
  );
}

export default function TrackScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logs, goals, addLog, removeLog } = useStore();
  const { premium } = useEntitlement();
  const openPaywall = usePaywall();
  const { setMealType: setDraftMealType } = useMealDraft();
  const [modal, setModal] = useState(false);
  const [mode, setMode] = useState<'database' | 'manual'>('database');
  const [query, setQuery] = useState('');
  const [mealType, setMealType] = useState<LoggedMeal['mealType']>('lunch');
  const [manual, setManual] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<LoggedMeal | null>(null);
  const [successMeal, setSuccessMeal] = useState<string | null>(null);

  const tKey = todayKey();
  const todayLogs = useMemo(() => logsForDate(logs, tKey), [logs, tKey]);
  const totals = useMemo(() => totalsFor(todayLogs), [todayLogs]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEALS.slice(0, 6);
    return MEALS.filter((m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }, [query]);

  const logFromDb = (mealId: string) => {
    const m = MEALS.find((x) => x.id === mealId)!;
    addLog({
      mealId: m.id,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      fiber: m.fiber,
      mealType,
      date: tKey,
    });
    setModal(false);
    setSuccessMeal(m.name);
  };

  const logManual = () => {
    if (!manual.name.trim() || !manual.calories) return;
    const name = manual.name.trim();
    addLog({
      name,
      calories: Number(manual.calories) || 0,
      protein: Number(manual.protein) || 0,
      carbs: Number(manual.carbs) || 0,
      fat: Number(manual.fat) || 0,
      fiber: Number(manual.fiber) || 0,
      mealType,
      date: tKey,
    });
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
    setModal(false);
    setSuccessMeal(name);
  };

  /** Macros where at least one of today's meals had no figure. */
  const incompleteMacros = (
    [
      ['Protein', totals.incomplete.protein],
      ['Carbs', totals.incomplete.carbs],
      ['Fat', totals.incomplete.fat],
      ['Fibre', totals.incomplete.fiber],
      ['Calories', totals.incomplete.calories],
    ] as const
  )
    .filter(([, missing]) => missing)
    .map(([label]) => label);

  const macroRows = [
    { label: 'Protein', value: totals.protein, max: goals.protein, color: colors.macroProtein },
    { label: 'Carbs', value: totals.carbs, max: goals.carbs, color: colors.macroCarbs },
    { label: 'Fat', value: totals.fat, max: goals.fat, color: colors.macroFat },
    { label: 'Fibre', value: totals.fiber, max: goals.fiber, color: colors.macroFibre },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerRow}>
          <View>
            <Text style={styles.h1}>Track</Text>
            <Text style={styles.sub}>Your plate, in numbers</Text>
          </View>
          <PressableScale onPress={() => router.push('/scan')} style={styles.scanBtn} scaleTo={0.92}>
            <ScanLine size={17} color={colors.onPrimary} strokeWidth={2.3} />
            <Text style={styles.scanBtnText}>Scan meal</Text>
          </PressableScale>
        </Animated.View>

        {/* Visible to everyone, readable by Premium. The ring, the bars and
            the numbers all stay on screen — frosted, so a free user can see
            the shape of their day and exactly what they are missing. */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.todayCard}>
          <View style={styles.goalHeaderRow}>
            <Text style={styles.goalHeaderLabel}>DAILY GOAL</Text>
            <PressableScale onPress={() => router.push('/setup/goals')} style={styles.editBtn} scaleTo={0.9}>
              <Pencil size={13} color={colors.primary} strokeWidth={2.4} />
              <Text style={styles.editBtnText}>Edit</Text>
            </PressableScale>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <CalorieRing value={totals.calories} goal={goals.calories} />
            <LockedBlock radius={radius.sm} style={{ flex: 1, gap: 14 }}>
              {macroRows.map((m) => (
                <View key={m.label} style={{ gap: 6 }}>
                  <View style={styles.macroLabelRow}>
                    <View style={styles.macroLabelLeft}>
                      {/* The bar is the reading; the dot is the colour key. On a
                          day with no fibre logged the bar has no width, and
                          without this the row would look like it has no colour. */}
                      <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                      <Text style={styles.macroLabel}>{m.label}</Text>
                    </View>
                    <View style={styles.macroNumsRow}>
                      <LockedText style={styles.macroNums}>{String(Math.round(m.value))}</LockedText>
                      <Text style={styles.macroNums}>/{m.max}g</Text>
                    </View>
                  </View>
                  <ProgressBar value={m.value} max={m.max} color={m.color} />
                </View>
              ))}
            </LockedBlock>
          </View>
          <View style={styles.remainRow}>
            {totals.calories >= goals.calories ? (
              <Text style={styles.remainText}>🎉 Daily goal reached — well done!</Text>
            ) : (
              <LockedBlock radius={radius.sm} bleed={6} style={styles.remainInner}>
                <LockedText style={styles.remainText}>
                  {String(goals.calories - totals.calories)}
                </LockedText>
                <Text style={styles.remainText}>kcal left today</Text>
              </LockedBlock>
            )}
          </View>
          {incompleteMacros.length > 0 && (
            <Text style={styles.incompleteNote}>
              {incompleteMacros.join(', ')} not known for every meal — totals are a minimum.
            </Text>
          )}

          <UnlockRow label="Subscribe to see your numbers" style={{ marginTop: 14 }} />
          <TrialNote style={{ marginTop: 14 }} />

          <PressableScale
            onPress={() => router.push('/analytics')}
            style={styles.analyticsLink}
            scaleTo={0.98}
          >
            <Text style={styles.analyticsLinkText}>View weekly analytics</Text>
            <ArrowUpRight size={16} color={colors.secondary} strokeWidth={2.6} />
          </PressableScale>
        </Animated.View>

        {/* Today's log */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <SectionTitle
            title="Today's meals"
            sub={todayLogs.length ? `${todayLogs.length} logged` : 'Nothing logged yet'}
            style={{ marginTop: 36 }}
            right={
              <PressableScale onPress={() => setModal(true)} style={styles.addBtn} scaleTo={0.9}>
                <Plus size={20} color={colors.onPrimary} strokeWidth={2.6} />
              </PressableScale>
            }
          />
          <View style={{ gap: 10 }}>
            {todayLogs.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Log your first meal of the day — search our kitchen, type it in, or scan your plate with the camera.
                </Text>
              </View>
            )}
            {todayLogs.map((l) => (
              <View key={l.id} style={styles.logRow}>
                <View style={styles.logTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logType}>{l.mealType}</Text>
                    <Text style={styles.logName} numberOfLines={2}>
                      {l.name}
                    </Text>
                  </View>
                  <CalorieBadge calories={l.calories} />
                  <PressableScale onPress={() => setDeleteTarget(l)} style={styles.trashBtn} scaleTo={0.85}>
                    <Trash2 size={17} color={colors.danger} strokeWidth={2.2} />
                  </PressableScale>
                </View>
                <LockedBlock radius={radius.sm}>
                  <MacroChips
                    macros={{ protein: l.protein, carbs: l.carbs, fat: l.fat, fibre: l.fiber }}
                  />
                </LockedBlock>
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>

      {/* Delete confirmation */}
      <ConfirmModal
        visible={deleteTarget !== null}
        title="Remove this meal?"
        message={
          deleteTarget
            ? premium
              ? `"${deleteTarget.name}" (${deleteTarget.calories} kcal) will be removed from today's log.`
              : `"${deleteTarget.name}" will be removed from today's log.`
            : ''
        }
        confirmLabel="Remove"
        danger
        onConfirm={() => deleteTarget && removeLog(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Log success */}
      <SuccessModal
        visible={successMeal !== null}
        title="Meal logged!"
        message={successMeal ? `${successMeal} is on today's plate. Keep the streak alive. 🔥` : undefined}
        buttonLabel="Nice"
        onClose={() => setSuccessMeal(null)}
      />

      {/* Log modal */}
      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log a meal</Text>
              <PressableScale onPress={() => setModal(false)} style={styles.closeBtn} scaleTo={0.85}>
                <X size={20} color={colors.ink} strokeWidth={2.4} />
              </PressableScale>
            </View>

            {/* Above the tabs, but Manual entry only. */}
            {mode === 'manual' && (
              <PressableScale
                onPress={() => {
                  setModal(false);
                  router.push('/scan');
                }}
                style={styles.scanRow}
                scaleTo={0.98}
              >
                <View style={styles.scanRowIcon}>
                  <Camera size={18} color={colors.onPrimary} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scanRowTitle}>Scan your meal</Text>
                  <Text style={styles.scanRowSub}>
                    Point the camera — we'll name it and count the macros
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.inkFaint} strokeWidth={2.2} />
              </PressableScale>
            )}

            <View style={styles.segment}>
              {(['database', 'manual'] as const).map((m) => (
                <PressableScale
                  key={m}
                  onPress={() => setMode(m)}
                  style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
                  haptic={false}
                >
                  <Text style={[styles.segmentText, mode === m && { color: colors.onPrimary }]}>
                    {m === 'database' ? 'From Akaani' : 'Manual entry'}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 14 }}
            >
              {MEAL_TYPES.map((t) => (
                <Chip key={t} small label={t[0].toUpperCase() + t.slice(1)} active={mealType === t} onPress={() => setMealType(t)} />
              ))}
            </ScrollView>

            {mode === 'database' ? (
              <>
                <View style={styles.searchBox}>
                  <SearchIcon size={18} color={colors.inkFaint} strokeWidth={2.2} />
                  <TextInput
                    placeholder="Search our meals…"
                    placeholderTextColor={colors.inkFaint}
                    value={query}
                    onChangeText={setQuery}
                    style={styles.searchInput}
                  />
                </View>
                <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
                  {results.map((m) => (
                    <PressableScale key={m.id} onPress={() => logFromDb(m.id)} style={styles.resultRow} haptic={false}>
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={styles.resultName}>{m.name}</Text>
                        <LockedBlock radius={radius.sm} bleed={5} style={styles.resultMetaRow}>
                          <CalorieBadge calories={m.calories} compact />
                          <MacroChips
                            compact
                            style={{ flex: 1 }}
                            macros={{ protein: m.protein, carbs: m.carbs, fat: m.fat, fibre: m.fiber }}
                          />
                        </LockedBlock>
                      </View>
                      <Plus size={18} color={colors.secondary} strokeWidth={2.6} />
                    </PressableScale>
                  ))}
                  {results.length === 0 && (
                    <Text style={styles.noResult}>
                      Not in our database yet — switch to manual entry to log it anyway.
                    </Text>
                  )}
                </ScrollView>
              </>
            ) : (
              <View style={{ gap: 16 }}>
                {/* Primary path — build the meal ingredient by ingredient. */}
                <PressableScale
                  onPress={() => {
                    setModal(false);
                    if (!premium) return openPaywall('ingredients');
                    setDraftMealType(mealType); // carry the chip selection into the draft
                    router.push('/meal-review');
                  }}
                  style={styles.builderCard}
                  scaleTo={0.98}
                >
                  <View style={styles.builderIcon}>
                    <ListPlus size={20} color="#FFFFFF" strokeWidth={2.3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.builderTitleRow}>
                      <Text style={styles.builderTitle}>Build from ingredients</Text>
                      {!premium && <PremiumPill />}
                    </View>
                    <Text style={styles.builderSub}>
                      Add each item, set its portion, and we'll total the macros for you
                    </Text>
                  </View>
                  {premium ? (
                    <ChevronRight size={20} color="rgba(255,255,255,0.7)" strokeWidth={2.4} />
                  ) : (
                    <Lock size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.6} />
                  )}
                </PressableScale>

                <OrDivider label="or enter the totals yourself" />

                {/* Compact enough that the whole section fits without scrolling. */}
                <View style={{ gap: 12 }}>
                  <Field
                    label="Meal name"
                    placeholder="e.g. Mama's okpa"
                    value={manual.name}
                    onChangeText={(v) => setManual({ ...manual, name: v })}
                  />
                  <Text style={styles.macroInputHint}>Grams, per meal</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <MacroInput
                      label="Kcal"
                      macro="calories"
                      placeholder="450"
                      value={manual.calories}
                      onChangeText={(v) => setManual({ ...manual, calories: v })}
                    />
                    <MacroInput
                      label="Protein"
                      macro="protein"
                      placeholder="20"
                      value={manual.protein}
                      onChangeText={(v) => setManual({ ...manual, protein: v })}
                    />
                    <MacroInput
                      label="Carbs"
                      macro="carbs"
                      placeholder="50"
                      value={manual.carbs}
                      onChangeText={(v) => setManual({ ...manual, carbs: v })}
                    />
                    <MacroInput
                      label="Fat"
                      macro="fat"
                      placeholder="15"
                      value={manual.fat}
                      onChangeText={(v) => setManual({ ...manual, fat: v })}
                    />
                    <MacroInput
                      label="Fibre"
                      macro="fibre"
                      placeholder="6"
                      value={manual.fiber}
                      onChangeText={(v) => setManual({ ...manual, fiber: v })}
                    />
                  </View>
                  <Button title="Log meal" onPress={logManual} disabled={!manual.name.trim() || !manual.calories} />
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  h1: { fontFamily: font.extrabold, fontSize: 34, color: colors.ink, letterSpacing: -1 },
  sub: { fontFamily: font.regular, fontSize: 15, color: colors.inkSoft, marginTop: 4 },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.full,
    marginBottom: 2,
    ...shadow.card,
  },
  scanBtnText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.onPrimary },
  todayCard: { backgroundColor: colors.card, borderRadius: radius.lg + 4, padding: 20, marginTop: 24, ...shadow.card },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  goalHeaderLabel: { fontFamily: font.bold, fontSize: 10.5, letterSpacing: 1.8, color: colors.inkFaint },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  editBtnText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.primary },
  ringValue: { fontFamily: font.extrabold, fontSize: 30, color: colors.ink, letterSpacing: -1 },
  ringLabel: { fontFamily: font.regular, fontSize: 11.5, color: colors.inkFaint, marginTop: 1 },
  remainRow: {
    marginTop: 18,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  remainInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  remainText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft },
  incompleteNote: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: 8,
  },
  analyticsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 4,
  },
  analyticsLinkText: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: colors.bgSoft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  macroLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLabelLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 7, height: 7, borderRadius: 3.5 },
  macroLabel: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink },
  macroNumsRow: { flexDirection: 'row', alignItems: 'baseline' },
  macroNums: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkFaint },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  empty: { backgroundColor: colors.bgSoft, borderRadius: radius.md, padding: 20 },
  emptyText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.inkSoft },
  logRow: {
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    ...shadow.card,
  },
  logTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logType: {
    fontFamily: font.semibold,
    fontSize: 10.5,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logName: { fontFamily: font.semibold, fontSize: 15.5, color: colors.ink, marginTop: 2 },
  trashBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,10,10,0.5)' },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: font.bold, fontSize: 22, color: colors.ink, letterSpacing: -0.4 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#003333',
    borderRadius: radius.lg,
    padding: 18,
  },
  builderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  builderTitle: { fontFamily: font.bold, fontSize: 16, color: '#F6FBF9', letterSpacing: -0.2 },
  builderSub: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: 'rgba(246,251,249,0.7)',
    marginTop: 3,
    lineHeight: 17,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14,
  },
  scanRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanRowTitle: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  scanRowSub: { fontFamily: font.regular, fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  macroInputLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  macroInputDot: { width: 5, height: 5, borderRadius: 2.5 },
  macroInputLabel: { fontFamily: font.medium, fontSize: 10.5, color: colors.inkSoft },
  macroInputHint: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: colors.inkFaint,
    marginTop: 2,
    marginBottom: -6,
  },
  macroInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.ink,
    paddingHorizontal: 2,
  },
  segment: { flexDirection: 'row', backgroundColor: colors.bgSoft, borderRadius: radius.full, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.full, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  searchInput: { flex: 1, height: 48, fontFamily: font.regular, fontSize: 15, color: colors.ink },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  resultName: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  resultMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  noResult: { fontFamily: font.regular, fontSize: 14, color: colors.inkSoft, paddingVertical: 20, textAlign: 'center' },
}));
