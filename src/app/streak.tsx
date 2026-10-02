import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Flame } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/ui';
import { logsForDate, todayKey, useStore, weekDates } from '../lib/store';
import { font, radius, shadow, themedStyles, useColors } from '../theme';

function useStreakStats(logs: ReturnType<typeof useStore>['logs']) {
  return useMemo(() => {
    // current streak: consecutive logged days ending today (or yesterday)
    let current = 0;
    const d = new Date();
    if (logsForDate(logs, todayKey(d)).length === 0) d.setDate(d.getDate() - 1);
    while (logsForDate(logs, todayKey(d)).length > 0) {
      current++;
      d.setDate(d.getDate() - 1);
    }
    // best streak across the last 90 days
    let best = current;
    let run = 0;
    const scan = new Date();
    scan.setDate(scan.getDate() - 90);
    for (let i = 0; i <= 90; i++) {
      run = logsForDate(logs, todayKey(scan)).length > 0 ? run + 1 : 0;
      best = Math.max(best, run);
      scan.setDate(scan.getDate() + 1);
    }
    // last 28 days grid, oldest first
    const grid: { key: string; logged: boolean; isToday: boolean }[] = [];
    const g = new Date();
    g.setDate(g.getDate() - 27);
    for (let i = 0; i < 28; i++) {
      const key = todayKey(g);
      grid.push({ key, logged: logsForDate(logs, key).length > 0, isToday: key === todayKey() });
      g.setDate(g.getDate() + 1);
    }
    const totalDays = grid.filter((x) => x.logged).length;
    return { current, best, grid, totalDays };
  }, [logs]);
}

export default function StreakScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logs } = useStore();
  const { current, best, grid, totalDays } = useStreakStats(logs);
  const week = useMemo(() => weekDates(0), []);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [pulse]);
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.12 }, { rotate: `${(pulse.value - 0.5) * 8}deg` }],
  }));

  const displayStreak = Math.max(current, 1);
  const message =
    current >= 7
      ? "You're on fire — a full week strong!"
      : current >= 3
        ? 'Solid rhythm. Keep the pot bubbling.'
        : 'Log a meal every day to grow your flame.';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <Text style={styles.headerTitle}>Your streak</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero flame */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.heroCard}>
          <Animated.View style={flameStyle}>
            <Flame size={72} color={colors.secondary} fill={colors.secondary} strokeWidth={1.5} />
          </Animated.View>
          <Text style={styles.heroCount}>{displayStreak}</Text>
          <Text style={styles.heroUnit}>day{displayStreak === 1 ? '' : 's'} streak</Text>
          <Text style={styles.heroMessage}>{message}</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{best}</Text>
            <Text style={styles.statLabel}>best streak</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>days logged · 28d</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{Math.round((totalDays / 28) * 100)}%</Text>
            <Text style={styles.statLabel}>consistency</Text>
          </View>
        </Animated.View>

        {/* This week */}
        <Animated.View entering={FadeInDown.delay(180).duration(450)}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <View style={styles.weekRow}>
            {week.map((d) => {
              const key = todayKey(d);
              const logged = logsForDate(logs, key).length > 0;
              const isToday = key === todayKey();
              return (
                <View key={key} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                  <View
                    style={[
                      styles.weekDot,
                      logged && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                      isToday && !logged && { borderColor: colors.secondary, borderStyle: 'dashed' },
                    ]}
                  >
                    {logged && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.weekDay, isToday && { color: colors.secondary, fontFamily: font.bold }]}>
                    {d.toLocaleDateString('en-NG', { weekday: 'narrow' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* 28-day heat grid */}
        <Animated.View entering={FadeInDown.delay(260).duration(450)}>
          <Text style={styles.sectionLabel}>LAST 28 DAYS</Text>
          <View style={styles.gridCard}>
            <View style={styles.grid}>
              {grid.map((cell) => (
                <View
                  key={cell.key}
                  style={[
                    styles.gridCell,
                    cell.logged && { backgroundColor: colors.secondary },
                    cell.isToday && { borderWidth: 2, borderColor: colors.primary },
                  ]}
                />
              ))}
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.gridCell, { width: 12, height: 12 }]} />
              <Text style={styles.legendText}>missed</Text>
              <View style={[styles.gridCell, { width: 12, height: 12, backgroundColor: colors.secondary, marginLeft: 12 }]} />
              <Text style={styles.legendText}>logged</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340).duration(450)} style={styles.tipCard}>
          <Text style={styles.tipText}>
            🔥 Streaks count any day you log at least one meal — cooked, scanned, or typed in.
          </Text>
        </Animated.View>
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
  headerTitle: { fontFamily: font.extrabold, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg + 8,
    paddingVertical: 34,
    paddingHorizontal: 24,
    ...shadow.card,
  },
  heroCount: { fontFamily: font.extrabold, fontSize: 64, color: colors.ink, letterSpacing: -2, marginTop: 6 },
  heroUnit: {
    fontFamily: font.bold,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.secondary,
  },
  heroMessage: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft, marginTop: 12, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCell: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
    ...shadow.card,
  },
  statValue: { fontFamily: font.bold, fontSize: 20, color: colors.ink },
  statLabel: { fontFamily: font.medium, fontSize: 10.5, color: colors.inkFaint },
  sectionLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.inkFaint,
    marginTop: 30,
    marginBottom: 14,
  },
  weekRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 10,
    ...shadow.card,
  },
  weekDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDay: { fontFamily: font.medium, fontSize: 11.5, color: colors.inkFaint },
  gridCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, ...shadow.card },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  gridCell: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.bgSoft },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, justifyContent: 'center' },
  legendText: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint },
  tipCard: { backgroundColor: colors.secondarySoft, borderRadius: radius.md, padding: 16, marginTop: 24 },
  tipText: { fontFamily: font.medium, fontSize: 13, lineHeight: 19, color: colors.ink },
}));
