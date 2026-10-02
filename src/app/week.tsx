import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, ShoppingBasket } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UnlockRow } from '../components/Locked';
import { MealRow } from '../components/MealCard';
import { PressableScale } from '../components/ui';
import { planForDay, todayKey, weekDates } from '../lib/store';
import { useEntitlement, usePaywall } from '../lib/subscription';
import { themedStyles, useColors, font, radius } from '../theme';

export default function WeekScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { premium } = useEntitlement();
  const openPaywall = usePaywall();

  // This week is free. Planning the next one ahead is Premium, so a free user
  // can see the tab and what it is for, but tapping it opens the paywall.
  const [offset, setOffset] = useState(0);
  const week = useMemo(() => weekDates(offset), [offset]);
  const tKey = todayKey();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <View>
          <Text style={styles.title}>{offset === 0 ? 'Your week, planned' : 'Next week, planned'}</Text>
          <Text style={styles.sub}>Breakfast, lunch & dinner — sorted</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {[0, 1].map((o) => {
          const on = offset === o;
          const locked = o === 1 && !premium;
          return (
            <PressableScale
              key={o}
              onPress={() => (locked ? openPaywall('next-week') : setOffset(o))}
              scaleTo={0.97}
              style={[styles.tab, on && styles.tabOn]}
            >
              {locked && <Lock size={12} color={colors.inkFaint} strokeWidth={2.6} />}
              <Text style={[styles.tabText, on && styles.tabTextOn]}>
                {o === 0 ? 'This week' : 'Next week'}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
      >
        {/* The list is built from the week you are looking at, so it belongs
            here rather than somewhere with no week attached to it. */}
        <PressableScale
          onPress={() =>
            premium ? router.push(`/grocery?week=${offset}`) : openPaywall('grocery')
          }
          scaleTo={0.98}
          style={styles.groceryBtn}
        >
          <View style={styles.groceryIcon}>
            <ShoppingBasket size={17} color={colors.onPrimary} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.groceryTitle}>Grocery list</Text>
            <Text style={styles.grocerySub}>
              Everything {offset === 0 ? 'this week' : 'next week'} needs, in one tap
            </Text>
          </View>
          {!premium && <Lock size={15} color={colors.inkFaint} strokeWidth={2.6} />}
        </PressableScale>

        {!premium && (
          <UnlockRow
            feature="next-week"
            label="Subscribe to plan next week"
            style={{ marginTop: 12 }}
          />
        )}
        {week.map((d, di) => {
          const plan = planForDay(d.getDay(), offset);
          const isToday = todayKey(d) === tKey;
          return (
            <Animated.View key={d.toISOString()} entering={FadeInDown.delay(di * 70).duration(400)}>
              <View style={styles.dayRow}>
                <Text style={[styles.dayName, isToday && { color: colors.secondary }]}>
                  {d.toLocaleDateString('en-NG', { weekday: 'long' })}
                </Text>
                {isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                )}
                <Text style={styles.dayDate}>
                  {d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                <MealRow meal={plan.breakfast} tag="Breakfast" />
                <MealRow meal={plan.lunch} tag="Lunch" />
                <MealRow meal={plan.dinner} tag="Dinner" />
              </View>
            </Animated.View>
          );
        })}
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
    paddingBottom: 18,
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
  groceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 4,
  },
  groceryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groceryTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  grocerySub: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkSoft, marginTop: 1 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgSoft,
  },
  tabOn: { backgroundColor: colors.primary },
  tabText: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  tabTextOn: { color: colors.onPrimary },
  title: { fontFamily: font.extrabold, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 26,
    marginBottom: 12,
  },
  dayName: { fontFamily: font.bold, fontSize: 18, color: colors.ink, letterSpacing: -0.3 },
  todayBadge: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  todayBadgeText: { fontFamily: font.semibold, fontSize: 11, color: colors.secondary },
  dayDate: { fontFamily: font.medium, fontSize: 13, color: colors.inkFaint, marginLeft: 'auto' },
}));
