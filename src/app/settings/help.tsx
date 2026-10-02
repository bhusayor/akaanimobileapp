import { ChevronDown, MessageSquare, Vibrate } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale, ScreenHeader } from '../../components/ui';
import { useShakeFeedback } from '../../lib/shake';
import { useStore } from '../../lib/store';
import { font, motion, radius, shadow, themedStyles, useColors } from '../../theme';

const FAQS = [
  {
    q: 'How does Lu estimate macros?',
    a: 'Every meal in our database is portioned per serving by hand, using Nigerian household measures. When you scan a plate, Lu matches it to the closest meal and scales by the portion it sees — treat it as a good estimate, not a lab result.',
  },
  {
    q: 'Can I log a meal that is not in the app?',
    a: 'Yes. On the Track tab tap the plus, switch to Manual entry, and put in the name and macros. It counts towards your day exactly like a database meal.',
  },
  {
    q: 'Why is my streak showing the wrong number?',
    a: 'A streak day counts once at least one meal is logged. If you log yesterday’s dinner today it will fill the gap, but the streak only recalculates when the app reopens.',
  },
  {
    q: 'How do I change my daily goals?',
    a: 'Profile → Your food → Daily goals. Calories, protein, carbs, fat and fibre can each be set independently, and the Track ring updates immediately.',
  },
  {
    q: 'Is my data sent anywhere?',
    a: 'No. Everything — your logs, goals, preferences and profile picture — is stored on this device only. Deleting your account wipes it all locally.',
  },
];

function Faq({ q, a, index }: { q: string; a: string; index: number }) {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const spin = useSharedValue(0);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 180}deg` }] }));

  const toggle = () => {
    spin.value = withTiming(open ? 0 : 1, { duration: motion.fast, easing: motion.ease });
    setOpen(!open);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45)
        .duration(motion.base)
        .easing(motion.enter)}
      style={styles.faq}
    >
      <PressableScale onPress={toggle} scaleTo={0.99} style={styles.faqHead} haptic={false}>
        <Text style={styles.faqQ}>{q}</Text>
        <Animated.View style={chevron}>
          <ChevronDown size={18} color={colors.inkFaint} strokeWidth={2.4} />
        </Animated.View>
      </PressableScale>
      {open && (
        <Animated.View entering={FadeInDown.duration(motion.fast)}>
          <Text style={styles.faqA}>{a}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function HelpScreen() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useStore();
  const { openFeedback } = useShakeFeedback();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Help & feedback" sub="Answers, and a way to reach us" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}
      >
        <Animated.View entering={FadeInDown.duration(motion.base).easing(motion.enter)}>
          <PressableScale onPress={openFeedback} style={styles.cta} scaleTo={0.98}>
            <View style={styles.ctaIcon}>
              <MessageSquare size={18} color={colors.onPrimary} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Send feedback</Text>
              <Text style={styles.ctaSub}>Tell us what broke, or what you wish existed</Text>
            </View>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(motion.base).easing(motion.enter)}>
          <PressableScale
            onPress={() => updateSettings({ shakeToFeedback: !settings.shakeToFeedback })}
            style={styles.shakeRow}
            scaleTo={0.98}
          >
            <Vibrate size={17} color={colors.secondary} strokeWidth={2.3} />
            <Text style={styles.shakeText}>
              {settings.shakeToFeedback
                ? 'Shake-to-feedback is on — shake the phone anywhere to report something.'
                : 'Shake-to-feedback is off. Tap to turn it back on.'}
            </Text>
          </PressableScale>
        </Animated.View>

        <Text style={styles.groupLabel}>FREQUENT QUESTIONS</Text>
        {FAQS.map((f, i) => (
          <Faq key={f.q} q={f.q} a={f.a} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    ...shadow.card,
  },
  ctaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  ctaSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  shakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    padding: 14,
  },
  shakeText: { flex: 1, fontFamily: font.medium, fontSize: 12.5, lineHeight: 18, color: colors.inkSoft },
  groupLabel: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.8,
    color: colors.inkFaint,
    marginTop: 18,
    marginLeft: 4,
  },
  faq: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, ...shadow.card },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQ: { flex: 1, fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  faqA: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 20, color: colors.inkSoft, marginTop: 10 },
}));
