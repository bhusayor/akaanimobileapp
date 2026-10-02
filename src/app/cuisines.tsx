import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/ui';
import { CUISINES, cuisineCount } from '../data/meals';
import { font, motion, radius, themedStyles, useColors } from '../theme';

/** "See all" for the home Travel rail — every cuisine, stacked. */
export default function CuisinesScreen() {
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
          <Text style={styles.title}>Travel through food</Text>
          <Text style={styles.sub}>{CUISINES.length} kitchens, one appetite</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 14 }}
      >
        {CUISINES.map((c, i) => (
          <Animated.View
            key={c.id}
            entering={FadeInDown.delay(Math.min(i, 10) * 45)
              .duration(motion.base)
              .easing(motion.enter)}
          >
            <PressableScale
              onPress={() => router.push(`/cuisine/${c.id}`)}
              style={styles.card}
              scaleTo={0.99}
            >
              <Image source={{ uri: c.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={350} />
              <View style={styles.scrim} />
              <View style={styles.cardBody}>
                <Text style={styles.count}>{cuisineCount(c.id)} MEALS</Text>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.blurb}>{c.blurb}</Text>
                <View style={styles.linkRow}>
                  <Text style={styles.link}>Explore</Text>
                  <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
            </PressableScale>
          </Animated.View>
        ))}
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
  card: {
    height: 180,
    borderRadius: radius.lg + 4,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    justifyContent: 'flex-end',
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 16, 14, 0.45)' },
  cardBody: { padding: 20 },
  count: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.6, color: 'rgba(255,255,255,0.75)' },
  name: {
    fontFamily: font.extrabold,
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginTop: 5,
  },
  blurb: { fontFamily: font.regular, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  link: { fontFamily: font.semibold, fontSize: 13.5, color: '#FFFFFF', textDecorationLine: 'underline' },
}));
