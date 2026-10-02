import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  ChevronRight,
  CreditCard,
  Flame,
  LifeBuoy,
  LogOut,
  Mail,
  Moon,
  Pencil,
  Ruler,
  Salad,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Sun,
  Target,
  Trash2,
  Vibrate,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Share, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedText, TrialNote } from '../../components/Locked';
import { ConfirmModal } from '../../components/modals';
import { PressableScale } from '../../components/ui';
import {
  logsForDate,
  personalizationCompletion,
  todayKey,
  totalsFor,
  useStore,
  weekDates,
} from '../../lib/store';
import { useEntitlement } from '../../lib/subscription';
import { ThemeMode, useThemeMode } from '../../lib/theme-mode';
import { font, motion, radius, shadow, themedStyles, useColors } from '../../theme';

const THEME_OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
  { mode: 'system', label: 'System', Icon: Smartphone },
];

const SEG_PAD = 4;

/** Light / Dark / System picker with a pill that slides to the active option. */
function ThemeSegment() {
  const styles = useStyles();
  const colors = useColors();
  const { mode, setMode } = useThemeMode();
  const [width, setWidth] = useState(0);

  const index = Math.max(0, THEME_OPTIONS.findIndex((o) => o.mode === mode));
  const cell = width > 0 ? (width - SEG_PAD * 2) / THEME_OPTIONS.length : 0;

  const x = useSharedValue(0);
  const settled = useRef(false);
  useEffect(() => {
    if (cell <= 0) return;
    const to = index * cell;
    // Snap on first measure, glide on every change after that.
    if (settled.current) x.value = withTiming(to, { duration: motion.base, easing: motion.ease });
    else {
      x.value = to;
      settled.current = true;
    }
  }, [index, cell, x]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.segment} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {cell > 0 && <Animated.View style={[styles.segmentPill, { width: cell }, pillStyle]} />}
      {THEME_OPTIONS.map(({ mode: m, label, Icon }) => {
        const active = m === mode;
        return (
          <PressableScale
            key={m}
            onPress={() => setMode(m)}
            scaleTo={0.96}
            haptic={!active}
            style={styles.segmentBtn}
          >
            <Icon
              size={16}
              color={active ? colors.onPrimary : colors.inkSoft}
              strokeWidth={active ? 2.5 : 2}
            />
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={{ marginTop: 28 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  Icon,
  label,
  value,
  onPress,
  first,
  danger,
  tint,
}: {
  Icon: typeof Target;
  label: string;
  value?: string;
  onPress: () => void;
  first?: boolean;
  danger?: boolean;
  tint?: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  const color = danger ? colors.danger : (tint ?? colors.primary);
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.row, !first && styles.rowDivider]}
      scaleTo={0.99}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {!!value && <Text style={styles.rowValue}>{value}</Text>}
      <ChevronRight size={18} color={colors.inkFaint} strokeWidth={2.2} />
    </PressableScale>
  );
}

function ToggleRow({
  Icon,
  label,
  hint,
  value,
  onChange,
  first,
}: {
  Icon: typeof Target;
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  first?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.row, !first && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Icon size={18} color={colors.primary} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.line, true: colors.primary }}
        thumbColor={colors.card}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    goals,
    prefs,
    personalization,
    logs,
    settings,
    updateSettings,
    signOut,
    deleteAccount,
  } = useStore();
  const { status, daysLeft } = useEntitlement();
  const { mode: themeMode, scheme } = useThemeMode();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const profileProgress = personalizationCompletion(personalization);

  const initials = (user?.name ?? 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const stats = useMemo(() => {
    const week = weekDates(0);
    const daysLogged = week.filter((d) => logsForDate(logs, todayKey(d)).length > 0).length;
    const todayCal = totalsFor(logsForDate(logs, todayKey())).calories;
    return { daysLogged, todayCal, totalLogs: logs.length };
  }, [logs]);

  const themeHint =
    themeMode === 'system'
      ? `Following your device — ${scheme}`
      : themeMode === 'dark'
        ? 'Always dark'
        : 'Always light';

  const shareApp = async () => {
    try {
      await Share.share({
        message:
          'I plan every meal with Lu on Akaani — Nigerian food, real macros, zero guesswork. Get it here: https://akaani.app',
      });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 120,
        }}
      >
        <Animated.View entering={FadeInDown.duration(motion.base).easing(motion.enter)}>
          <Text style={styles.h1}>Profile</Text>
        </Animated.View>

        {/* Identity */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(motion.base).easing(motion.enter)}
          style={styles.userCard}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" transition={250} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name ?? 'Guest'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email ?? '—'}
            </Text>
          </View>
          <PressableScale
            onPress={() => router.push('/settings/profile')}
            style={styles.editBtn}
            scaleTo={0.94}
          >
            <Pencil size={14} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.editBtnText}>Edit</Text>
          </PressableScale>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(110).duration(motion.base).easing(motion.enter)}
          style={styles.statsRow}
        >
          <View style={styles.statCell}>
            <Flame size={18} color={colors.secondary} strokeWidth={2.2} />
            <LockedText style={styles.statValue}>{String(stats.todayCal)}</LockedText>
            <Text style={styles.statLabel}>kcal today</Text>
          </View>
          <View style={styles.statCell}>
            <Salad size={18} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.statValue}>{stats.daysLogged}/7</Text>
            <Text style={styles.statLabel}>days this week</Text>
          </View>
          <View style={styles.statCell}>
            <Target size={18} color={colors.success} strokeWidth={2.2} />
            <Text style={styles.statValue}>{stats.totalLogs}</Text>
            <Text style={styles.statLabel}>meals logged</Text>
          </View>
        </Animated.View>

        <TrialNote style={{ marginTop: 14 }} />

        {/* Your food */}
        <Animated.View entering={FadeInDown.delay(160).duration(motion.base).easing(motion.enter)}>
          <Section title="YOUR FOOD">
            <Row
              first
              Icon={SlidersHorizontal}
              label="Food preferences"
              value={prefs.favourites.length ? `${prefs.favourites.length} favourites` : 'Not set'}
              onPress={() => router.push('/setup/preferences')}
            />
            <Row
              Icon={Ruler}
              label="Meal personalization"
              value={profileProgress.missing.length ? 'Tune my plan' : 'Ready'}
              onPress={() => router.push({ pathname: '/setup/personalize', params: { source: 'profile' } } as never)}
            />
            <Row
              Icon={Target}
              label="Daily goals"
              value={`${goals.calories} kcal`}
              onPress={() => router.push('/setup/goals')}
            />
          </Section>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(200).duration(motion.base).easing(motion.enter)}>
          <Section title="ACCOUNT">
            <Row
              first
              Icon={Pencil}
              label="Edit profile"
              value="Name & photo"
              onPress={() => router.push('/settings/profile')}
            />
            <Row
              Icon={BadgeCheck}
              label="Change password"
              onPress={() => router.push('/settings/password')}
            />
            <Row
              Icon={CreditCard}
              label="Manage subscription"
              value={
                status === 'subscribed'
                  ? 'Premium'
                  : status === 'trial'
                    ? `Trial — ${daysLeft}d left`
                    : 'Free'
              }
              onPress={() => router.push('/settings/subscription')}
            />
          </Section>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInDown.delay(240).duration(motion.base).easing(motion.enter)}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.sectionCard}>
            <ToggleRow
              first
              Icon={Vibrate}
              label="Shake to send feedback"
              hint="Shake the phone anywhere to report something"
              value={settings.shakeToFeedback}
              onChange={(v) => updateSettings({ shakeToFeedback: v })}
            />
            <View style={[styles.themeBlock, styles.rowDivider]}>
              <View style={styles.rowIcon}>
                <Sun size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, gap: 12 }}>
                <View>
                  <Text style={styles.rowLabel}>Appearance</Text>
                  <Text style={styles.rowHint}>{themeHint}</Text>
                </View>
                <ThemeSegment />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.delay(280).duration(motion.base).easing(motion.enter)}>
          <Section title="SUPPORT">
            <Row
              first
              Icon={LifeBuoy}
              label="Help & feedback"
              onPress={() => router.push('/settings/help')}
            />
            <Row Icon={Mail} label="Contact us" onPress={() => router.push('/settings/contact')} />
            <Row Icon={Share2} label="Share the Lu app" onPress={shareApp} />
          </Section>
        </Animated.View>

        {/* Danger zone */}
        <Animated.View entering={FadeInDown.delay(320).duration(motion.base).easing(motion.enter)}>
          <Section title="ACCOUNT ACTIONS">
            <Row
              first
              Icon={LogOut}
              label="Log out"
              onPress={() => setConfirmSignOut(true)}
              tint={colors.inkSoft}
            />
            <Row
              danger
              Icon={Trash2}
              label="Delete account"
              onPress={() => setConfirmDelete(true)}
            />
          </Section>
          <Text style={styles.version}>Akaani · v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      <ConfirmModal
        visible={confirmSignOut}
        title="Log out"
        message="You can sign back in any time — your data stays on this device."
        confirmLabel="Log out"
        onConfirm={() => {
          signOut();
          router.replace('/(auth)/login');
        }}
        onClose={() => setConfirmSignOut(false)}
      />

      <ConfirmModal
        visible={confirmDelete}
        title="Delete account?"
        message="This erases your account, meal logs, goals and preferences from this device. It cannot be undone."
        confirmLabel="Delete everything"
        danger
        onConfirm={() => {
          deleteAccount();
          router.replace('/(auth)/signup');
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  h1: { fontFamily: font.extrabold, fontSize: 34, color: colors.ink, letterSpacing: -1 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 24,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.line },
  avatarText: { fontFamily: font.bold, fontSize: 20, color: colors.onPrimary },
  userName: { fontFamily: font.bold, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
  userEmail: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  editBtnText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.primary },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCell: {
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
  sectionTitle: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.8,
    color: colors.inkFaint,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  rowHint: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  rowValue: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkFaint },
  themeBlock: { flexDirection: 'row', gap: 13, paddingVertical: 16 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.full,
    padding: SEG_PAD,
  },
  segmentPill: {
    position: 'absolute',
    top: SEG_PAD,
    bottom: SEG_PAD,
    left: SEG_PAD,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  segmentText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft },
  segmentTextActive: { color: colors.onPrimary },
  version: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: 24,
  },
}));
