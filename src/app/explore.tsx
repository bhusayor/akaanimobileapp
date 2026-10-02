import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/ui';
import { Collection, COLLECTIONS, collectionCount } from '../data/meals';
import { font, motion, radius, shadow, themedStyles, useColors } from '../theme';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 20 * 2 - 12) / 2;

function CollectionCard({ item, index }: { item: Collection; index: number }) {
  const styles = useStyles();
  const router = useRouter();
  const count = collectionCount(item.id);
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 12) * 40)
        .duration(motion.base)
        .easing(motion.enter)}
    >
      <PressableScale
        onPress={() => router.push(`/collection/${item.id}`)}
        style={styles.card}
        scaleTo={0.98}
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <View style={styles.scrim} />
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{count}</Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.blurb} numberOfLines={2}>
          {item.blurb}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

/** "See all" for the home Explore rail — every collection, in a grid. */
export default function ExploreScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <View>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.sub}>{COLLECTIONS.length} ways to pick dinner</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 40 }}
      >
        <View style={styles.grid}>
          {COLLECTIONS.map((c, i) => (
            <CollectionCard key={c.id} item={c} index={i} />
          ))}
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 10,
    paddingBottom: 14,
    ...shadow.card,
  },
  imageWrap: {
    height: CARD_W * 0.66,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgSoft,
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,16,14,0.12)' },
  countPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 26,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  countPillText: { fontFamily: font.bold, fontSize: 11, color: colors.secondary },
  name: {
    fontFamily: font.semibold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.ink,
    marginTop: 10,
    marginLeft: 4,
  },
  blurb: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkFaint,
    marginTop: 3,
    marginLeft: 4,
    minHeight: 32,
  },
}));
