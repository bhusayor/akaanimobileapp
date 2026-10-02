import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, UtensilsCrossed } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MealGrid } from '../../components/MealGrid';
import { Button, PressableScale } from '../../components/ui';
import { cuisineById, mealsInCuisine } from '../../data/meals';
import { font, motion, radius, themedStyles, useColors } from '../../theme';

const HERO_H = 240;

/** Every meal from one cuisine — the "travel through food" destination page. */
export default function CuisineScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const cuisine = useMemo(() => cuisineById(String(id)), [id]);
  const meals = useMemo(() => mealsInCuisine(String(id)), [id]);

  if (!cuisine) {
    return (
      <View style={styles.missing}>
        <UtensilsCrossed size={40} color={colors.inkFaint} />
        <Text style={styles.missingText}>Kitchen not found</Text>
        <Button title="Go back" variant="soft" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: cuisine.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={350}
          />
          <View style={styles.heroScrim} />
          <View style={[styles.heroText, { paddingTop: insets.top + 56 }]}>
            <Text style={styles.kicker}>TRAVEL THROUGH FOOD</Text>
            <Text style={styles.title}>{cuisine.name}</Text>
            <Text style={styles.blurb}>{cuisine.blurb}</Text>
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(motion.base).easing(motion.enter)}
          style={styles.body}
        >
          <Text style={styles.count}>
            {meals.length} meal{meals.length === 1 ? '' : 's'} from this kitchen
          </Text>
          <MealGrid meals={meals} />
          {meals.length === 0 && (
            <Text style={styles.empty}>This kitchen is still being stocked.</Text>
          )}
        </Animated.View>
      </ScrollView>

      <PressableScale onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]}>
        <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
      </PressableScale>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  hero: { height: HERO_H, backgroundColor: colors.bgSoft, justifyContent: 'flex-end' },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 16, 14, 0.48)' },
  heroText: { paddingHorizontal: 20, paddingBottom: 24 },
  kicker: { fontFamily: font.bold, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.8)' },
  title: {
    fontFamily: font.extrabold,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -0.9,
    marginTop: 6,
  },
  blurb: { fontFamily: font.regular, fontSize: 14.5, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  count: { fontFamily: font.medium, fontSize: 13, color: colors.inkFaint },
  empty: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingTop: 40,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
    backgroundColor: colors.bg,
  },
  missingText: { fontFamily: font.semibold, fontSize: 17, color: colors.inkSoft },
}));
