import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumPill } from '../../components/Locked';
import { LuMascot } from '../../components/LuMascot';
import { PressableScale } from '../../components/ui';
import { MEALS } from '../../data/meals';
import { useStore } from '../../lib/store';
import { useEntitlement, usePaywall, type LockedFeature } from '../../lib/subscription';
import { themedStyles, useColors, font, radius, shadow } from '../../theme';

type Msg = { id: string; from: 'lu' | 'me'; text: string; locked?: LockedFeature };

/** Lu's history only survives the session on Free — remembering is Premium. */
const HISTORY_KEY = 'akaani/lu-history/v1';

const LOCK_CTA: Record<LockedFeature, string> = {
  macros: 'See the exact numbers',
  'lu-macros': 'See the exact numbers',
  'lu-swap': 'Unlock meal swaps',
  'lu-plan': 'Unlock plan rebuilds',
  'lu-custom': 'Unlock custom meals',
  'lu-history': 'Let Lu remember',
  grocery: 'Unlock grocery lists',
  'next-week': "Unlock next week's plan",
  walkthrough: 'Unlock photo steps',
  ingredients: 'Unlock the ingredient builder',
};

const SUGGESTIONS = [
  'What should I cook tonight?',
  'How do I make jollof smoky?',
  'High-protein Nigerian meals?',
  'Is egusi healthy?',
];

/**
 * Lu's answer, and the Premium thing the free version of it had to hold back.
 *
 * Free Lu is not a worse Lu — it gives the same recommendation, by goal, with
 * the same reasoning. What it does not give is the exact figure, and it never
 * touches the weekly plan. Every branch below that would have quoted a number
 * has a directional twin, so a free answer is a complete sentence rather than
 * a redacted one.
 */
function luReply(
  input: string,
  { name, premium }: { name?: string; premium: boolean }
): { text: string; locked?: LockedFeature } {
  const q = input.toLowerCase();

  // --- Things only Premium Lu can actually do ---
  if (/\b(swap|replace|change)\b.*\b(meal|lunch|dinner|breakfast|plan)\b/.test(q)) {
    if (!premium)
      return {
        text: "Swapping meals in your weekly plan is a Premium thing — I'd replace that one meal and leave the rest of your week alone. Want to see what else Premium opens up?",
        locked: 'lu-swap',
      };
    return {
      text: "Done — I've swapped it for something with a similar shape to your day. Open the weekly plan and tell me if the new one works for you.",
    };
  }
  if (/(regenerate|rebuild|new plan|redo my week|plan my week|another plan)/.test(q)) {
    if (!premium)
      return {
        text: 'Rebuilding the whole week is a Premium move. I can still talk you through what to cook tonight, though — what are you in the mood for?',
        locked: 'lu-plan',
      };
    return {
      text: "Fresh week coming up — I've rebuilt it around your goals and kept your favourites in. Have a look and I'll adjust anything you don't like.",
    };
  }
  if (/(custom meal|my own meal|add a meal|not in the (app|database)|can'?t find)/.test(q)) {
    if (!premium)
      return {
        text: "Adding meals that aren't in our database is Premium — tell me the dish and I'd save it for you with its macros worked out. For now you can still type it into Track by hand.",
        locked: 'lu-custom',
      };
    return {
      text: 'Tell me the dish and roughly what went into it, and I\'ll add it to your meals so you can log it like any other.',
    };
  }

  // --- Cooking talk, free for everyone ---
  if (/jollof/.test(q))
    return {
      text: 'For that party-jollof smokiness: cook on low with foil under the lid, then crank the heat for the last 3 minutes so the bottom catches slightly. That "bottom pot" is the flavour. 🔥 Want my full party jollof recipe?',
    };
  if (/egusi/.test(q))
    return premium
      ? {
          text: "Egusi is actually a nutrition win — melon seeds are rich in protein, healthy fats and magnesium. One serving of our egusi runs ~620 kcal with 32g protein. Pair it with a smaller swallow portion if you're cutting.",
        }
      : {
          text: "Egusi is actually a nutrition win — melon seeds are rich in protein, healthy fats and magnesium. It sits at the richer end of our kitchen, so pair it with a smaller swallow portion if you're cutting.",
          locked: 'lu-macros',
        };
  if (/protein/.test(q)) {
    const top = [...MEALS].sort((a, b) => b.protein - a.protein).slice(0, 3);
    return premium
      ? {
          text: `Top high-protein picks in our kitchen: ${top.map((m) => `${m.name} (${m.protein}g)`).join(', ')}. Suya is your best friend on a cut — lean beef, big flavour.`,
        }
      : {
          text: `Top high-protein picks in our kitchen: ${top.map((m) => m.name).join(', ')}. Suya is your best friend on a cut — lean beef, big flavour.`,
          locked: 'lu-macros',
        };
  }
  if (/tonight|dinner|cook/.test(q))
    return premium
      ? {
          text: "It's a good evening for catfish pepper soup — light, spicy and only 260 kcal per serving. If you want something heartier, seafood okra with eba comes together in 40 minutes. Which mood are you in?",
        }
      : {
          text: "It's a good evening for catfish pepper soup — one of the lightest dinners in the kitchen, and properly spicy. If you want something heartier, seafood okra with eba comes together in 40 minutes. Which mood are you in?",
          locked: 'lu-macros',
        };
  if (/breakfast/.test(q))
    return {
      text: 'Classic move: akara & pap on a slow morning, or boiled yam with egg sauce when you need fuel fast (30 mins). Moi moi meal-preps beautifully for weekday breakfasts too.',
    };
  if (/ayamase|ofada/.test(q))
    return {
      text: "Ayamase secret: boil the green pepper blend down properly before it touches the oil, and don't skip the iru. Bitterness usually means the peppers were under-cooked or the palm oil was over-bleached.",
    };
  if (/spic|pepper|hot/.test(q))
    return {
      text: 'To tame the heat without losing flavour, deseed the scotch bonnets and balance with a little more onion and tomato. To raise it… add one more ata rodo and say a prayer. 🌶️',
    };
  if (/swallow|semo|eba|fufu|amala/.test(q))
    return {
      text: 'Pairing guide: egusi loves pounded yam, okra draws best with eba, ewedu was made for amala, and pepper soup honestly prefers to fly solo with agidi.',
    };
  if (/lose|weight|diet|calorie|macro/.test(q))
    return premium
      ? {
          text: "You don't need to abandon Nigerian food to hit your goals — pepper soup, efo riro and moi moi are all under 400 kcal a serving. Set your calorie goal in Profile and I'll keep your week's plan inside it.",
        }
      : {
          text: "You don't need to abandon Nigerian food to hit your goals — pepper soup, efo riro and moi moi are among the lightest things we cook. Set your calorie goal in Profile and I'll keep your week's plan pointed at it.",
          locked: 'lu-macros',
        };
  if (/hi|hello|hey|how far/.test(q))
    return {
      text: `How far${name ? `, ${name}` : ''}! 👋🏾 I'm Lu — ask me anything about Nigerian food: recipes, substitutions, macros, or what to cook with whatever's in your kitchen.`,
    };
  return {
    text: "Good question! I'm best with Nigerian food — try asking me about a dish (jollof, egusi, suya…), what to cook tonight, or how a meal fits your goals.",
  };
}

function TypingDot({ delay }: { delay: number }) {
  const styles = useStyles();
  const v = useSharedValue(0.3);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })), -1)
    );
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.8 + v.value * 0.3 }] }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

export default function ChatScreen() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useStore();
  const { premium } = useEntitlement();
  const openPaywall = usePaywall();
  const firstName = user?.name.split(' ')[0];
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'hello',
      from: 'lu',
      text: `How far${firstName ? `, ${firstName}` : ''}! I'm Lu — your Nigerian food guide. Recipes, macros, what to cook tonight… ask me anything. 🍲`,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  /** Set once the saved thread has been read, so saving can't race the read. */
  const restored = useRef(false);
  const { q } = useLocalSearchParams<{ q?: string }>();
  const consumedQ = useRef<string | null>(null);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    setInput('');
    setMessages((prev) => [...prev, { id: `me-${Date.now()}`, from: 'me', text: t }]);
    setTyping(true);
    setTimeout(() => {
      const reply = luReply(t, { name: firstName, premium });
      setMessages((prev) => [...prev, { id: `lu-${Date.now()}`, from: 'lu', ...reply }]);
      setTyping(false);
    }, 1100 + Math.random() * 600);
  };

  // Premium is the only plan where the thread survives a restart. Free users
  // still get a full conversation — it just starts fresh each time.
  //
  // Nothing is written back until the read has finished, or the opening "How
  // far" message would overwrite the saved thread before it loaded.
  useEffect(() => {
    if (!premium) return;
    let live = true;
    AsyncStorage.getItem(HISTORY_KEY)
      .then((raw) => {
        if (!live || !raw) return;
        const saved = JSON.parse(raw) as Msg[];
        if (Array.isArray(saved) && saved.length > 1) setMessages(saved);
      })
      .catch(() => {})
      .finally(() => {
        if (live) restored.current = true;
      });
    return () => {
      live = false;
    };
  }, [premium]);

  useEffect(() => {
    if (!premium || !restored.current) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-60))).catch(() => {});
  }, [premium, messages]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, typing]);

  // A question typed on the home screen arrives via the `q` param — send it once.
  useEffect(() => {
    const text = typeof q === 'string' ? q : undefined;
    if (text && consumedQ.current !== text) {
      consumedQ.current = text;
      send(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.avatar}>
          <LuMascot size={34} />
        </View>
        <View>
          <Text style={styles.headerName}>Lu</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Your Nigerian food guide</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <Animated.View
            key={m.id}
            entering={m.from === 'me' ? FadeInUp.duration(300) : FadeInDown.duration(300)}
            style={[styles.bubble, m.from === 'me' ? styles.bubbleMe : styles.bubbleLu]}
          >
            <Text style={[styles.bubbleText, m.from === 'me' && { color: colors.onPrimary }]}>{m.text}</Text>
            {!!m.locked && !premium && (
              <PressableScale
                onPress={() => openPaywall(m.locked)}
                scaleTo={0.97}
                style={styles.lockedChip}
              >
                <PremiumPill />
                <Text style={styles.lockedChipText}>{LOCK_CTA[m.locked]}</Text>
              </PressableScale>
            )}
          </Animated.View>
        ))}
        {typing && (
          <Animated.View entering={FadeInDown.duration(250)} style={[styles.bubble, styles.bubbleLu, styles.typing]}>
            <TypingDot delay={0} />
            <TypingDot delay={150} />
            <TypingDot delay={300} />
          </Animated.View>
        )}
      </ScrollView>

      {messages.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}
        >
          {SUGGESTIONS.map((s) => (
            <PressableScale key={s} onPress={() => send(s)} style={styles.suggestion} scaleTo={0.94}>
              <Text style={styles.suggestionText}>{s}</Text>
            </PressableScale>
          ))}
        </ScrollView>
      )}

      <View style={[styles.inputBar, { paddingBottom: 12 }]}>
        <TextInput
          placeholder="Ask Lu about any Nigerian meal…"
          placeholderTextColor={colors.inkFaint}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          style={styles.input}
        />
        <PressableScale onPress={() => send(input)} style={styles.sendBtn} scaleTo={0.86}>
          <Send size={18} color={colors.onPrimary} strokeWidth={2.3} />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((colors) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 3,
  },
  headerName: { fontFamily: font.bold, fontSize: 19, color: colors.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  statusText: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkSoft },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleLu: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderBottomLeftRadius: 6,
    ...shadow.card,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleText: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21, color: colors.ink },
  lockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  lockedChipText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.secondary },
  typing: { flexDirection: 'row', gap: 5, paddingVertical: 16 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.inkFaint },
  suggestion: {
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  suggestionText: { fontFamily: font.medium, fontSize: 13, color: colors.ink },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.full,
    paddingHorizontal: 18,
    fontFamily: font.regular,
    fontSize: 14.5,
    color: colors.ink,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
