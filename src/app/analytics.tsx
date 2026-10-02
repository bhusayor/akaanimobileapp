import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Flame, Target, TrendingUp, Utensils } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedBlock, LockedText, UnlockRow } from '../components/Locked';
import { PressableScale } from '../components/ui';
import { logsForDate, todayKey, totalsFor, useStore, weekDates } from '../lib/store';
import { font, macroColor, motion, radius, shadow, themedStyles, useColors } from '../theme';

/** Colours come from the theme at render time — see `macroColor`. */
const MACROS = [
  { key: 'protein', label: 'Protein', macro: 'protein' },
  { key: 'carbs', label: 'Carbs', macro: 'carbs' },
  { key: 'fat', label: 'Fat', macro: 'fat' },
  { key: 'fiber', label: 'Fibre', macro: 'fibre' },
] as const;

function WeekBar({
  value,
  max,
  index,
  active,
}: {
  value: number;
  max: number;
  index: number;
  active: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const h = useSharedValue(0);
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  useEffect(() => {
    h.value = withDelay(index * 45, withTiming(pct, { duration: 520, easing: motion.enter }));
  }, [pct, h, index]);
  const style = useAnimatedStyle(() => ({
    height: `${Math.max(h.value * 100, value > 0 ? 4 : 2)}%`,
  }));
  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          { backgroundColor: active ? colors.secondary : colors.primarySoft },
          style,
        ]}
      />
    </View>
  );
}

function StatTile({
  Icon,
  value,
  label,
  color,
  locked,
}: {
  Icon: typeof Flame;
  value: string;
  label: string;
  color: string;
  /** Set on macro figures. Counts of days and meals are not macro data. */
  locked?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={styles.statTile}>
      <Icon size={17} color={color} strokeWidth={2.3} />
      {locked ? (
        <LockedBlock radius={radius.sm} bleed={5}>
          <Text style={styles.statValue}>{value}</Text>
        </LockedBlock>
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Everything analytical about the week — reached from the Track daily card. */
export default function AnalyticsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logs, goals } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const tKey = todayKey();
  const week = useMemo(() => weekDates(weekOffset), [weekOffset]);

  const weekData = useMemo(
    () =>
      week.map((d) => {
        const key = todayKey(d);
        const dayLogs = logsForDate(logs, key);
        return { date: d, key, logs: dayLogs, totals: totalsFor(dayLogs) };
      }),
    [week, logs]
  );

  const weekMax = Math.max(goals.calories, ...weekData.map((d) => d.totals.calories));
  const loggedDays = weekData.filter((d) => d.logs.length > 0).length;
  const weekTotal = weekData.reduce((a, d) => a + d.totals.calories, 0);
  const avg = loggedDays ? Math.round(weekTotal / loggedDays) : 0;
  const goalDays = weekData.filter(
    (d) => d.totals.calories >= goals.calories && goals.calories > 0
  ).length;
  const mealsLogged = weekData.reduce((a, d) => a + d.logs.length, 0);

  const macroAvg = MACROS.map((m) => {
    const total = weekData.reduce((a, d) => a + d.totals[m.key], 0);
    const value = loggedDays ? Math.round(total / loggedDays) : 0;
    return { ...m, value, goal: goals[m.key] };
  });

  const best = weekData.reduce(
    (a, d) => (d.totals.calories > a.totals.calories ? d : a),
    weekData[0]
  );


  const byType = useMemo(() => {
    const acc: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    weekData.forEach((d) => d.logs.forEach((l) => (acc[l.mealType] = (acc[l.mealType] ?? 0) + 1)));
    return acc;
  }, [weekData]);

  const weekLabel =
    weekOffset === 0
      ? 'This week'
      : weekOffset === -1
        ? 'Last week'
        : `${Math.abs(weekOffset)} weeks ago`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <View>
          <Text style={styles.title}>Weekly analytics</Text>
          <Text style={styles.sub}>{weekLabel}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 16 }}
      >
        <UnlockRow label="Subscribe to see your week in numbers" />

        {/* Calories chart */}
        <Animated.View
          entering={FadeInDown.duration(motion.base).easing(motion.enter)}
          style={styles.card}
        >
          <View style={styles.switchRow}>
            <PressableScale
              onPress={() => setWeekOffset(weekOffset - 1)}
              style={styles.arrow}
              scaleTo={0.88}
            >
              <ChevronLeft size={19} color={colors.ink} strokeWidth={2.4} />
            </PressableScale>
            <Text style={styles.switchLabel}>{weekLabel}</Text>
            <PressableScale
              onPress={() => weekOffset < 0 && setWeekOffset(weekOffset + 1)}
              style={[styles.arrow, weekOffset === 0 && { opacity: 0.3 }]}
              scaleTo={0.88}
            >
              <ChevronRight size={19} color={colors.ink} strokeWidth={2.4} />
            </PressableScale>
          </View>

          <View style={styles.chart}>
            {weekData.map((d, i) => (
              <View key={d.key} style={styles.chartCol}>
                <LockedBlock radius={radius.sm} bleed={4}>
                  <LockedText style={styles.chartVal}>
                    {d.totals.calories > 0 ? String(d.totals.calories) : ''}
                  </LockedText>
                </LockedBlock>
                <WeekBar
                  value={d.totals.calories}
                  max={weekMax}
                  index={i}
                  active={d.key === tKey}
                />
                <Text
                  style={[
                    styles.chartDay,
                    d.key === tKey && { color: colors.secondary, fontFamily: font.bold },
                  ]}
                >
                  {d.date.toLocaleDateString('en-NG', { weekday: 'narrow' })}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.goalLineRow}>
            <View style={styles.goalDot} />
            <Text style={styles.goalLineText}>Goal: {goals.calories} kcal/day</Text>
          </View>
        </Animated.View>

        {/* Headline numbers */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(motion.base).easing(motion.enter)}
          style={styles.statRow}
        >
          <StatTile Icon={Flame} value={`${avg}`} label="avg kcal/day" color={colors.secondary} locked />
          <StatTile Icon={Target} value={`${goalDays}/7`} label="goal days" color={colors.success} />
          <StatTile
            Icon={Utensils}
            value={`${mealsLogged}`}
            label="meals logged"
            color={colors.primary}
          />
        </Animated.View>

        {/* Macro averages */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(motion.base).easing(motion.enter)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Average macros per logged day</Text>
          <LockedBlock radius={radius.sm} style={{ gap: 14, marginTop: 16 }}>
            {macroAvg.map((m) => (
              <View key={m.key} style={{ gap: 6 }}>
                <View style={styles.macroLabelRow}>
                  <View style={styles.macroLabelLeft}>
                    <View
                      style={[styles.macroDot, { backgroundColor: macroColor(colors, m.macro) }]}
                    />
                    <Text style={styles.macroLabel}>{m.label}</Text>
                  </View>
                  <View style={styles.macroNumsRow}>
                    <LockedText style={styles.macroNums}>{String(m.value)}</LockedText>
                    <Text style={styles.macroNums}>/{m.goal}g</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: macroColor(colors, m.macro),
                        width: `${Math.min(100, m.goal > 0 ? (m.value / m.goal) * 100 : 0)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </LockedBlock>
        </Animated.View>

        {/* Consistency */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(motion.base).easing(motion.enter)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Consistency</Text>
          <View style={styles.dayDots}>
            {weekData.map((d) => (
              <View key={d.key} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                <View
                  style={[
                    styles.dayDot,
                    d.logs.length > 0 && { backgroundColor: colors.success },
                    d.key === tKey && { borderWidth: 2, borderColor: colors.secondary },
                  ]}
                >
                  <Text
                    style={[styles.dayDotText, d.logs.length > 0 && { color: colors.onPrimary }]}
                  >
                    {d.logs.length || ''}
                  </Text>
                </View>
                <Text style={styles.chartDay}>
                  {d.date.toLocaleDateString('en-NG', { weekday: 'narrow' })}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.note}>
            {loggedDays === 7
              ? 'A full week logged. That is the hard part done.'
              : `${loggedDays} of 7 days logged — ${7 - loggedDays} to go for a clean week.`}
          </Text>
        </Animated.View>

        {/* Meal split */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(motion.base).easing(motion.enter)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>What you logged</Text>
          <View style={{ gap: 10, marginTop: 14 }}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
              <View key={t} style={styles.splitRow}>
                <Text style={styles.splitLabel}>{t[0].toUpperCase() + t.slice(1)}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${mealsLogged ? (byType[t] / mealsLogged) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.splitCount}>{byType[t]}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Biggest day */}
        {best && best.totals.calories > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(motion.base).easing(motion.enter)}
            style={[styles.card, styles.highlight]}
          >
            <TrendingUp size={18} color={colors.secondary} strokeWidth={2.4} />
            <View style={styles.highlightBody}>
              <Text style={styles.highlightLine}>
                Biggest day was {best.date.toLocaleDateString('en-NG', { weekday: 'long' })} at
              </Text>
              <LockedBlock radius={radius.sm} bleed={4}>
                <LockedText style={styles.highlightLine}>{String(best.totals.calories)}</LockedText>
              </LockedBlock>
              <Text style={styles.highlightLine}>
                kcal across {best.logs.length} meal{best.logs.length === 1 ? '' : 's'}.
              </Text>
            </View>
          </Animated.View>
        )}
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
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, ...shadow.card },
  cardTitle: { fontFamily: font.bold, fontSize: 16.5, color: colors.ink, letterSpacing: -0.3 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: { fontFamily: font.semibold, fontSize: 15.5, color: colors.ink },
  chart: { flexDirection: 'row', gap: 8, height: 160, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
  chartVal: { fontFamily: font.medium, fontSize: 9.5, color: colors.inkFaint },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 7 },
  chartDay: { fontFamily: font.medium, fontSize: 11.5, color: colors.inkFaint },
  goalLineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  goalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  goalLineText: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkSoft },
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
    ...shadow.card,
  },
  statValue: { fontFamily: font.bold, fontSize: 18, color: colors.ink },
  statLabel: { fontFamily: font.medium, fontSize: 11, color: colors.inkFaint },
  macroLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLabelLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 7, height: 7, borderRadius: 3.5 },
  macroLabel: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink },
  macroNumsRow: { flexDirection: 'row', alignItems: 'baseline' },
  macroNums: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkFaint },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bgSoft,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  dayDots: { flexDirection: 'row', gap: 6, marginTop: 16 },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotText: { fontFamily: font.bold, fontSize: 13, color: colors.inkFaint },
  note: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 16 },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  splitLabel: { fontFamily: font.medium, fontSize: 13, color: colors.ink, width: 74 },
  splitCount: { fontFamily: font.semibold, fontSize: 13, color: colors.inkFaint, width: 20, textAlign: 'right' },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  highlightText: { flex: 1, fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  highlightBody: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 4,
  },
  highlightLine: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
}));
