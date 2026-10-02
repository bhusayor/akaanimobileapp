import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Clock,
  Flame,
  SendHorizonal,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UtensilsCrossed,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { LockedBlock, LockedText, UnlockRow } from '../../components/Locked';
import { LuMascot } from '../../components/LuMascot';
import { AppModal, SuccessModal } from '../../components/modals';
import { Button, PressableScale } from '../../components/ui';
import { COLLECTIONS, collectionCount, CUISINES, currentMealType } from '../../data/meals';
import { logsForDate, personalizationCompletion, planForDay, todayKey, useStore } from '../../lib/store';
import { useEntitlement } from '../../lib/subscription';
import { font, motion, radius, shadow, themedStyles, useColors } from '../../theme';

const { width: W } = Dimensions.get('window');

/** Homepage previews this many cards; the rest live behind "See all". */
const PREVIEW_COUNT = 6;

const LU_PROMPTS = [
  '💪 High-protein meals',
  '🔥 Party jollof smoke?',
  '🥑 Low-carb swallows',
  '🌶️ Fix bitter ayamase',
  '⚡ 20-minute dinners',
];

/* ---------------- animated pieces ---------------- */

function PulsingDot({ size = 8 }: { size?: number }) {
  const colors = useColors();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0, { duration: 800 })),
      -1
    );
  }, [v]);
  const halo = useAnimatedStyle(() => ({
    opacity: 0.5 - v.value * 0.5,
    transform: [{ scale: 1 + v.value * 1.6 }],
  }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary },
          halo,
        ]}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary }} />
    </View>
  );
}

function ProfileProgressRing({ complete, total }: { complete: number; total: number }) {
  const colors = useColors();
  const percent = Math.round((complete / total) * 100);
  const radiusValue = 31;
  const circumference = Math.PI * 2 * radiusValue;

  return (
    <View style={stylesForRing.ringWrap} accessibilityLabel={`Profile ${percent}% complete`}>
      <Svg width={82} height={82} viewBox="0 0 82 82">
        <Circle cx="41" cy="41" r={radiusValue} fill="none" stroke={colors.line} strokeWidth={7} />
        <Circle
          cx="41"
          cy="41"
          r={radiusValue}
          fill="none"
          stroke={colors.secondary}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - percent / 100)}
          transform="rotate(-90 41 41)"
        />
      </Svg>
      <Text style={[stylesForRing.ringNumber, { color: colors.ink }]}>{percent}%</Text>
    </View>
  );
}

const stylesForRing = StyleSheet.create({
  ringWrap: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center' },
  ringNumber: { position: 'absolute', fontFamily: font.extrabold, fontSize: 17, letterSpacing: -0.5 },
});

function StreakFlame({ count, onPress }: { count: number; onPress: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [pulse]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.14 }, { rotate: `${(pulse.value - 0.5) * 9}deg` }],
  }));
  return (
    <PressableScale onPress={onPress} style={styles.iconPill} scaleTo={0.88}>
      <Animated.View style={style}>
        <Flame size={17} color={colors.secondary} fill={colors.secondary} strokeWidth={2} />
      </Animated.View>
      <Text style={styles.iconPillText}>{count}</Text>
    </PressableScale>
  );
}

function SpinningPlate({ uri, size }: { uri: string; size: number }) {
  const colors = useColors();
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 46000, easing: Easing.linear }), -1);
  }, [spin]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: colors.bgSoft },
          shadow.float,
          style,
        ]}
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={500} />
      </Animated.View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -7,
          left: -7,
          width: size + 14,
          height: size + 14,
          borderRadius: (size + 14) / 2,
          borderWidth: 1.5,
          borderColor: colors.line,
        }}
      />
    </View>
  );
}

function MacroBar({
  value,
  unit,
  label,
  color,
  max,
  delay,
}: {
  value: number;
  unit: string;
  label: string;
  color: string;
  max: number;
  delay: number;
}) {
  const styles = useStyles();
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = 0;
    h.value = withDelay(delay, withTiming(Math.min(1, value / max), { duration: 700 }));
  }, [value, max, delay, h]);
  const fill = useAnimatedStyle(() => ({ height: `${Math.max(h.value * 100, 8)}%` }));
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroTrack}>
        <Animated.View style={[styles.macroFill, { backgroundColor: color }, fill]} />
      </View>
      <View>
        <LockedText style={styles.macroValue}>
          {`${value}${unit ? ` ${unit}` : ''}`}
        </LockedText>
        <Text style={styles.macroName}>{label}</Text>
      </View>
    </View>
  );
}

/** Suggested questions for Lu — a plain scroll strip, nothing auto-moving. */
function PromptRow({ onPress }: { onPress: (prompt: string) => void }) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      style={{ marginTop: 14, overflow: 'visible' }}
    >
      {LU_PROMPTS.map((p) => (
        <PressableScale
          key={p}
          onPress={() => onPress(p.replace(/^\S+\s/, ''))}
          style={styles.promptChip}
          scaleTo={0.95}
        >
          <Text style={styles.promptChipText}>{p}</Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

function SectionHeader({
  label,
  link,
  onLink,
}: {
  label: string;
  link?: string;
  onLink?: () => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionRule} />
      {!!link && (
        <PressableScale onPress={onLink} haptic={false}>
          <Text style={styles.sectionLink}>{link}</Text>
        </PressableScale>
      )}
    </View>
  );
}

function ReactionButton({
  Icon,
  active,
  activeColor,
  onPress,
}: {
  Icon: typeof ThumbsUp;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <PressableScale
      onPress={() => {
        pop.value = withSequence(
          withTiming(1.22, { duration: motion.press, easing: motion.ease }),
          withTiming(1, { duration: motion.fast, easing: motion.ease })
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={[styles.reactBtn, active && { borderColor: activeColor }]}
      scaleTo={0.82}
      haptic={false}
    >
      <Animated.View style={popStyle}>
        <Icon
          size={17}
          color={active ? activeColor : colors.inkSoft}
          fill={active ? activeColor : 'transparent'}
          strokeWidth={2}
        />
      </Animated.View>
    </PressableScale>
  );
}

/* ---------------- screen ---------------- */

export default function HomeScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logs, personalization } = useStore();
  const { premium } = useEntitlement();
  const [ask, setAsk] = useState('');
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null);
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [dislikeReason, setDislikeReason] = useState('');
  const [thanksOpen, setThanksOpen] = useState(false);

  const now = new Date();
  const mealType = currentMealType(now);
  const todayPlan = useMemo(() => planForDay(now.getDay()), [now.getDay()]);
  const heroMeal = todayPlan[mealType];
  const firstName = user?.name.split(' ')[0] ?? 'Chef';
  const initials = (user?.name ?? 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const daypart = mealType === 'breakfast' ? 'morning' : mealType === 'lunch' ? 'afternoon' : 'evening';
  const profileProgress = personalizationCompletion(personalization);
  const personalizationRoute = {
    goals: '/setup/personalize',
    gender: '/setup/gender',
    age: '/setup/age',
    height: '/setup/height',
    weight: '/setup/weight',
  }[profileProgress.missing[0] ?? 'goals'];

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    if (logsForDate(logs, todayKey(d)).length === 0) d.setDate(d.getDate() - 1);
    while (logsForDate(logs, todayKey(d)).length > 0) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return Math.max(count, 1);
  }, [logs]);

  const goAskLu = (text: string) => {
    const q = text.trim();
    setAsk('');
    if (q) router.push({ pathname: '/(tabs)/chat', params: { q } });
    else router.push('/(tabs)/chat');
  };

  const shareMeal = async () => {
    try {
      await Share.share({
        message: premium
          ? `${heroMeal.name} — ${heroMeal.calories} kcal, ready in ${heroMeal.time} min. Found it on Akaani, the Nigerian food app. 🍲`
          : `${heroMeal.name} — ready in ${heroMeal.time} min. Found it on Akaani, the Nigerian food app. 🍲`,
      });
    } catch {}
  };

  const submitDislike = () => {
    setDislikeOpen(false);
    setReaction('down');
    setDislikeReason('');
    setThanksOpen(true);
  };

  const dateLine = now
    .toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top bar */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.topBar}>
        <PressableScale onPress={() => router.push('/(tabs)/profile')} style={styles.avatar} scaleTo={0.9}>
          <Text style={styles.avatarText}>{initials}</Text>
        </PressableScale>
        <View style={{ marginLeft: 2 }}>
          <Text style={styles.kicker}>{dateLine}</Text>
          <Text style={styles.greeting}>
            Good {daypart}, {firstName}
            <Text style={{ color: colors.secondary }}>.</Text>
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <StreakFlame count={streak} onPress={() => router.push('/streak')} />
        <PressableScale onPress={() => router.push('/notifications')} style={styles.iconPill} scaleTo={0.88}>
          <Bell size={17} color={colors.ink} strokeWidth={2.1} />
          <View style={styles.bellDot} />
        </PressableScale>
      </Animated.View>

      {profileProgress.missing.length > 0 && (
        <Animated.View entering={FadeInDown.delay(60).duration(450)}>
          <PressableScale
            onPress={() => router.push({ pathname: personalizationRoute, params: { source: 'home' } } as never)}
            style={styles.personalizeCard}
            scaleTo={0.98}
          >
            <ProfileProgressRing complete={profileProgress.complete} total={profileProgress.total} />
            <View style={{ flex: 1 }}>
              <View style={styles.personalizeEyebrow}>
                <Sparkles size={13} color={colors.secondary} fill={colors.secondary} />
                <Text style={styles.personalizeKicker}>YOUR PROFILE</Text>
              </View>
              <Text style={styles.personalizeTitle}>Make every pick more personal</Text>
              <Text style={styles.personalizeBody}>Add {profileProgress.missing.length} more {profileProgress.missing.length === 1 ? 'detail' : 'details'} for sharper recommendations.</Text>
              <View style={styles.personalizeCta}>
                <Text style={styles.personalizeCtaText}>Continue setup</Text>
                <ArrowRight size={15} color={colors.secondary} strokeWidth={2.5} />
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      )}

      {/* Ask Lu */}
      <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.luCard}>
        <View style={styles.luTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.luTitle}>What are we{'\n'}eating today?</Text>
            <Text style={styles.luSub}>Ask Lu — recipes, macros, cravings.</Text>
          </View>
          <LuMascot size={60} />
        </View>
        <View style={styles.luInputRow}>
          <TextInput
            value={ask}
            onChangeText={setAsk}
            onSubmitEditing={() => goAskLu(ask)}
            returnKeyType="send"
            placeholder="Jollof for 2? A low-carb swallow? Ask…"
            placeholderTextColor="rgba(28,35,33,0.45)"
            style={styles.luInput}
          />
          <PressableScale onPress={() => goAskLu(ask)} style={styles.luSend} scaleTo={0.86}>
            <SendHorizonal size={17} color="#FFFFFF" strokeWidth={2.4} />
          </PressableScale>
        </View>
        <PromptRow onPress={goAskLu} />
      </Animated.View>

      {/* Daily recommendation */}
      <Animated.View entering={FadeInDown.delay(150).duration(450)}>
        <SectionHeader label="TODAY'S PICK" link="Full week" onLink={() => router.push('/week')} />
        <View style={styles.mealCard}>
          <View style={styles.mealTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.nowRow}>
                <PulsingDot size={7} />
                <Text style={styles.nowText}>{mealType.toUpperCase()} · RECOMMENDED NOW</Text>
              </View>
              <Text style={styles.mealName}>{heroMeal.name}</Text>
              <View style={styles.mealMetaRow}>
                <View style={styles.metaChip}>
                  <Clock size={13} color={colors.inkSoft} strokeWidth={2.4} />
                  <Text style={styles.metaChipText}>{heroMeal.time} min</Text>
                </View>
                <View style={styles.metaChip}>
                  <UtensilsCrossed size={13} color={colors.inkSoft} strokeWidth={2.4} />
                  <Text style={styles.metaChipText}>{heroMeal.servings} servings</Text>
                </View>
              </View>
            </View>
            <SpinningPlate uri={heroMeal.image} size={124} />
          </View>

          <View style={styles.tagRow}>
            {heroMeal.tags.slice(0, 3).map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.macrosLabel}>MACROS PER SERVING</Text>
          <LockedBlock radius={radius.md} style={styles.macrosRow}>
            <MacroBar value={heroMeal.protein} unit="g" label="Protein" color={colors.macroProtein} max={60} delay={80} />
            <MacroBar value={heroMeal.carbs} unit="g" label="Carbs" color={colors.macroCarbs} max={100} delay={150} />
            <MacroBar value={heroMeal.fat} unit="g" label="Fat" color={colors.macroFat} max={60} delay={220} />
            <MacroBar value={heroMeal.fiber} unit="g" label="Fibre" color={colors.macroFibre} max={15} delay={290} />
            <MacroBar value={heroMeal.calories} unit="" label="Kcal" color={colors.macroCalories} max={800} delay={360} />
          </LockedBlock>
          <UnlockRow label="Subscribe to see full macros" style={{ marginTop: 14 }} />

          {/* Reactions + cook */}
          <View style={styles.actionRow}>
            <ReactionButton
              Icon={ThumbsUp}
              active={reaction === 'up'}
              activeColor={colors.success}
              onPress={() => setReaction(reaction === 'up' ? null : 'up')}
            />
            <ReactionButton
              Icon={ThumbsDown}
              active={reaction === 'down'}
              activeColor={colors.danger}
              onPress={() => (reaction === 'down' ? setReaction(null) : setDislikeOpen(true))}
            />
            <PressableScale onPress={shareMeal} style={styles.reactBtn} scaleTo={0.82}>
              <Share2 size={17} color={colors.inkSoft} strokeWidth={2} />
            </PressableScale>
            <PressableScale onPress={() => router.push(`/meal/${heroMeal.id}`)} style={styles.cookBtn} scaleTo={0.96}>
              <Text style={styles.cookBtnText}>Cook this meal</Text>
              <ArrowUpRight size={17} color={colors.onPrimary} strokeWidth={2.5} />
            </PressableScale>
          </View>
        </View>
      </Animated.View>

      {/* Explore — collections */}
      <Animated.View entering={FadeInDown.delay(200).duration(450)}>
        <SectionHeader label="EXPLORE" link="See all" onLink={() => router.push('/explore')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {COLLECTIONS.slice(0, PREVIEW_COUNT).map((c) => (
            <PressableScale
              key={c.id}
              onPress={() => router.push(`/collection/${c.id}`)}
              style={styles.catCard}
              scaleTo={0.98}
            >
              <View style={styles.catImageWrap}>
                <Image source={{ uri: c.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
              </View>
              <Text style={styles.catName} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={styles.catCount}>{collectionCount(c.id)} meals</Text>
            </PressableScale>
          ))}
          <PressableScale
            onPress={() => router.push('/explore')}
            style={[styles.catCard, styles.seeAllCard]}
            scaleTo={0.98}
          >
            <View style={styles.seeAllCircle}>
              <ArrowRight size={20} color={colors.onPrimary} strokeWidth={2.4} />
            </View>
            <Text style={styles.seeAllText}>See all</Text>
            <Text style={styles.catCount}>{COLLECTIONS.length} collections</Text>
          </PressableScale>
        </ScrollView>
      </Animated.View>

      {/* Travel through food — cuisines */}
      <Animated.View entering={FadeInDown.delay(240).duration(450)}>
        <SectionHeader
          label="TRAVEL THROUGH FOOD"
          link="See all"
          onLink={() => router.push('/cuisines')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
          snapToInterval={W - 48 + 14}
          decelerationRate="fast"
        >
          {CUISINES.slice(0, PREVIEW_COUNT).map((r) => (
            <PressableScale
              key={r.id}
              onPress={() => router.push(`/cuisine/${r.id}`)}
              style={styles.regionCard}
              scaleTo={0.99}
            >
              <Image source={{ uri: r.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
              <View style={styles.regionScrim} />
              <View style={{ flex: 1, justifyContent: 'flex-end', padding: 22 }}>
                <Text style={styles.regionName}>{r.name}</Text>
                <Text style={styles.regionBlurb}>{r.blurb}</Text>
                <View style={styles.regionLinkRow}>
                  <Text style={styles.regionLink}>Explore</Text>
                  <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
            </PressableScale>
          ))}
          <PressableScale
            onPress={() => router.push('/cuisines')}
            style={[styles.regionCard, styles.regionSeeAll]}
            scaleTo={0.99}
          >
            <View style={styles.seeAllCircle}>
              <ArrowRight size={22} color={colors.onPrimary} strokeWidth={2.4} />
            </View>
            <Text style={styles.regionSeeAllTitle}>See all kitchens</Text>
            <Text style={styles.regionSeeAllSub}>{CUISINES.length} cuisines to travel through</Text>
          </PressableScale>
        </ScrollView>
      </Animated.View>

      {/* Dislike reason modal */}
      <AppModal visible={dislikeOpen} onClose={() => setDislikeOpen(false)}>
        <Text style={styles.modalTitle}>Not your taste?</Text>
        <Text style={styles.modalSub}>
          Tell Lu why — it sharpens tomorrow's recommendations.
        </Text>
        <TextInput
          value={dislikeReason}
          onChangeText={setDislikeReason}
          placeholder="e.g. Too spicy for me, I don't eat seafood…"
          placeholderTextColor={colors.inkFaint}
          multiline
          style={styles.reasonInput}
        />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Button title="Cancel" variant="ghost" onPress={() => setDislikeOpen(false)} style={{ flex: 1, height: 50 }} />
          <Button title="Send to Lu" onPress={submitDislike} style={{ flex: 1, height: 50 }} />
        </View>
      </AppModal>

      <SuccessModal
        visible={thanksOpen}
        title="Noted!"
        message="Lu will steer your plan away from meals like this."
        buttonLabel="Thanks, Lu"
        onClose={() => setThanksOpen(false)}
      />
    </ScrollView>
  );
}

const useStyles = themedStyles((colors) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.bold, fontSize: 15, color: colors.onPrimary },
  kicker: { fontFamily: font.semibold, fontSize: 9.5, letterSpacing: 1.6, color: colors.inkFaint },
  greeting: { fontFamily: font.bold, fontSize: 16.5, color: colors.ink, letterSpacing: -0.3, marginTop: 1 },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    minWidth: 40,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    ...shadow.card,
  },
  iconPillText: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  personalizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 17,
    borderRadius: radius.lg + 5,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadow.card,
  },
  personalizeEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  personalizeKicker: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.4, color: '#F08A1D' },
  personalizeTitle: { fontFamily: font.extrabold, fontSize: 18.5, lineHeight: 21, color: colors.ink, letterSpacing: -0.4, marginTop: 6 },
  personalizeBody: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: colors.inkSoft, marginTop: 4 },
  personalizeCta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  personalizeCtaText: { fontFamily: font.bold, fontSize: 11.5, color: colors.secondary },
  luCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#003333',
    borderRadius: radius.lg + 8,
    padding: 22,
    paddingBottom: 20,
  },
  luTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  luTitle: {
    fontFamily: font.extrabold,
    fontSize: 27,
    lineHeight: 31,
    color: '#F6FBF9',
    letterSpacing: -0.7,
  },
  luSub: { fontFamily: font.regular, fontSize: 13.5, color: 'rgba(246,251,249,0.65)', marginTop: 8 },
  luInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingLeft: 18,
    paddingRight: 6,
    height: 54,
    marginTop: 18,
  },
  luInput: { flex: 1, fontFamily: font.regular, fontSize: 14.5, color: '#1C2321', height: '100%' },
  luSend: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DA7000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  promptChipText: { fontFamily: font.medium, fontSize: 12.5, color: 'rgba(246,251,249,0.92)' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 14,
  },
  sectionLabel: { fontFamily: font.bold, fontSize: 13, letterSpacing: 2.2, color: colors.ink },
  sectionRule: { flex: 1, height: 1, backgroundColor: colors.line },
  sectionLink: { fontFamily: font.semibold, fontSize: 13, color: colors.secondary },
  mealCard: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: radius.lg + 8,
    padding: 20,
    ...shadow.card,
  },
  mealTopRow: { flexDirection: 'row', alignItems: 'center' },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  nowText: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.4, color: colors.secondary },
  mealName: {
    fontFamily: font.extrabold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    letterSpacing: -0.6,
    marginTop: 8,
  },
  mealMetaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  metaChipText: { fontFamily: font.semibold, fontSize: 12, color: colors.inkSoft },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  tagText: { fontFamily: font.medium, fontSize: 12, color: colors.secondary },
  divider: { height: 1, backgroundColor: colors.line, marginTop: 18 },
  macrosLabel: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.inkFaint,
    marginTop: 16,
  },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingRight: 8 },
  macroItem: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  macroTrack: {
    width: 5,
    height: 32,
    borderRadius: 3,
    backgroundColor: colors.bgSoft,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  macroFill: { width: '100%', borderRadius: 3 },
  macroValue: { fontFamily: font.bold, fontSize: 13.5, color: colors.ink },
  macroName: { fontFamily: font.regular, fontSize: 11, color: colors.inkFaint, marginTop: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  reactBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  cookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: radius.full,
    marginLeft: 4,
  },
  cookBtnText: { fontFamily: font.semibold, fontSize: 14.5, color: colors.onPrimary },
  catCard: {
    width: 156,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 10,
    paddingBottom: 14,
    ...shadow.card,
  },
  catImageWrap: { height: 118, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.bgSoft },
  seeAllCard: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 10 },
  seeAllCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  catName: { fontFamily: font.semibold, fontSize: 15, color: colors.ink, marginTop: 12, marginLeft: 4 },
  catCount: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint, marginTop: 2, marginLeft: 4 },
  regionCard: {
    width: W - 48,
    height: 220,
    borderRadius: radius.lg + 4,
    overflow: 'hidden',
    backgroundColor: '#003333',
  },
  regionScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 16, 14, 0.42)',
  },
  regionName: { fontFamily: font.extrabold, fontSize: 27, color: '#FFFFFF', letterSpacing: -0.7 },
  regionBlurb: { fontFamily: font.regular, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  regionLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  regionLink: { fontFamily: font.semibold, fontSize: 13.5, color: '#FFFFFF', textDecorationLine: 'underline' },
  regionSeeAll: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  regionSeeAllTitle: { fontFamily: font.bold, fontSize: 19, color: colors.ink, letterSpacing: -0.4 },
  regionSeeAllSub: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft },
  modalTitle: { fontFamily: font.bold, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  modalSub: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  reasonInput: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    padding: 14,
    fontFamily: font.regular,
    fontSize: 14.5,
    color: colors.ink,
    textAlignVertical: 'top',
    marginTop: 6,
  },
}));
