import { useRouter } from 'expo-router';
import {
  Bell,
  BellOff,
  ChefHat,
  CheckCheck,
  ChevronLeft,
  Flame,
  MessageCircle,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/ui';
import { font, radius, shadow, themedStyles, useColors } from '../theme';

type Notice = {
  id: string;
  Icon: typeof Bell;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const INITIAL: Notice[] = [
  {
    id: 'n1',
    Icon: ChefHat,
    title: 'Lunch is ready to cook',
    body: "Today's pick — Party Jollof Rice, 60 minutes, 540 kcal per serving.",
    time: '12:05',
    read: false,
  },
  {
    id: 'n2',
    Icon: Flame,
    title: 'Streak alert',
    body: "You're one meal away from keeping today's streak alive. Log something!",
    time: '10:30',
    read: false,
  },
  {
    id: 'n3',
    Icon: MessageCircle,
    title: 'Lu replied',
    body: '"For smoky jollof, foil under the lid then high heat for the last 3 minutes…"',
    time: 'Yesterday',
    read: false,
  },
  {
    id: 'n4',
    Icon: ShoppingBasket,
    title: 'Grocery list refreshed',
    body: "New week, new list — 32 items curated from this week's meal plan.",
    time: 'Monday',
    read: true,
  },
  {
    id: 'n5',
    Icon: Sparkles,
    title: 'New meals in the kitchen',
    body: 'Gizdodo and Agege Bread French Toast just joined the database.',
    time: 'Last week',
    read: true,
  },
];

export default function NotificationsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Notice[]>(INITIAL);
  const unread = items.filter((n) => !n.read).length;

  const markAll = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markOne = (id: string) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>{unread ? `${unread} unread` : 'All caught up'}</Text>
        </View>
        {unread > 0 && (
          <PressableScale onPress={markAll} style={styles.markAllBtn} scaleTo={0.92}>
            <CheckCheck size={15} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </PressableScale>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 10 }}
      >
        {items.length === 0 && (
          <View style={styles.emptyWrap}>
            <BellOff size={38} color={colors.inkFaint} strokeWidth={1.8} />
            <Text style={styles.emptyText}>Nothing here yet</Text>
          </View>
        )}
        {items.map((n, i) => (
          <Animated.View key={n.id} entering={FadeInDown.delay(i * 60).duration(350)}>
            <PressableScale onPress={() => markOne(n.id)} style={[styles.row, !n.read && styles.rowUnread]} scaleTo={0.98}>
              <View style={[styles.iconWrap, !n.read && { backgroundColor: colors.secondarySoft }]}>
                <n.Icon size={19} color={!n.read ? colors.secondary : colors.inkSoft} strokeWidth={2.1} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.rowTitle, !n.read && { fontFamily: font.bold }]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.rowBody} numberOfLines={2}>
                  {n.body}
                </Text>
              </View>
              <Text style={styles.rowTime}>{n.time}</Text>
            </PressableScale>
          </Animated.View>
        ))}
        <Text style={styles.footNote}>
          Meal reminders and Lu replies will appear here. Push notifications arrive with the full release.
        </Text>
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
  title: { fontFamily: font.extrabold, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  markAllText: { fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow.card,
  },
  rowUnread: { borderWidth: 1.5, borderColor: colors.secondarySoft },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.ink, flexShrink: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondary },
  rowBody: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  rowTime: { fontFamily: font.medium, fontSize: 11.5, color: colors.inkFaint },
  emptyWrap: { alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyText: { fontFamily: font.semibold, fontSize: 16, color: colors.inkSoft },
  footNote: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
  },
}));
