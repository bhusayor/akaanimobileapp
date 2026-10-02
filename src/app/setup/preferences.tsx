import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, PressableScale } from '../../components/ui';
import { useStore } from '../../lib/store';
import { themedStyles, useColors, font, radius } from '../../theme';

const DIETS = ['No restrictions', 'Pescatarian', 'Vegetarian', 'Low carb', 'High protein', 'Diabetic friendly'];
const ALLERGIES = ['Peanuts', 'Shellfish', 'Eggs', 'Dairy', 'Gluten', 'Fish'];
const FAVOURITES = ['Rice Dishes', 'Soups & Swallows', 'Street Food', 'Yam & Plantain', 'Beans & Pulses', 'Grills'];
const SPICE = ['Mild', 'Medium', 'Hot', 'Ata rodo mode'];

export default function Preferences() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, savePrefs } = useStore();
  const [diets, setDiets] = useState<string[]>(prefs.diets);
  const [allergies, setAllergies] = useState<string[]>(prefs.allergies);
  const [favourites, setFavourites] = useState<string[]>(prefs.favourites);
  const [spice, setSpice] = useState(prefs.spice);

  const toggle = (list: string[], set: (v: string[]) => void, item: string) =>
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);

  const next = () => {
    savePrefs({ diets, allergies, spice, favourites });
    router.push('/setup/personalize' as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)}>
          <Text style={styles.step}>Step 1 of 8</Text>
          <Text style={styles.title}>Food you’ll love</Text>
          <Text style={styles.sub}>Tell Lu what fits your taste and routine.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(450)}>
          <Text style={styles.label}>Dietary style</Text>
          <View style={styles.wrap}>
            {DIETS.map((d) => (
              <Chip key={d} label={d} active={diets.includes(d)} onPress={() => toggle(diets, setDiets, d)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <Text style={styles.label}>Allergies</Text>
          <View style={styles.wrap}>
            {ALLERGIES.map((a) => (
              <Chip key={a} label={a} active={allergies.includes(a)} onPress={() => toggle(allergies, setAllergies, a)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(450)}>
          <Text style={styles.label}>Spice tolerance</Text>
          <View style={styles.spiceRow}>
            {SPICE.map((s, i) => (
              <PressableScale
                key={s}
                onPress={() => setSpice(i)}
                style={[styles.spiceCell, spice === i && styles.spiceCellActive]}
              >
                <View style={{ flexDirection: 'row' }}>
                  {Array.from({ length: i + 1 }).map((_, j) => (
                    <Flame
                      key={j}
                      size={15}
                      color={spice === i ? colors.secondary : colors.inkFaint}
                      strokeWidth={2.4}
                      fill={spice === i ? colors.secondary : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={[styles.spiceText, spice === i && { color: colors.ink, fontFamily: font.semibold }]}>
                  {s}
                </Text>
              </PressableScale>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(450)}>
          <Text style={styles.label}>What do you love most?</Text>
          <View style={styles.wrap}>
            {FAVOURITES.map((f) => (
              <Chip key={f} label={f} active={favourites.includes(f)} onPress={() => toggle(favourites, setFavourites, f)} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title="Continue" onPress={next} />
      </View>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  step: {
    fontFamily: font.semibold,
    fontSize: 12.5,
    color: colors.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: { fontFamily: font.extrabold, fontSize: 32, color: colors.ink, letterSpacing: -0.8, marginTop: 10 },
  sub: { fontFamily: font.regular, fontSize: 15.5, lineHeight: 23, color: colors.inkSoft, marginTop: 8 },
  label: { fontFamily: font.semibold, fontSize: 16.5, color: colors.ink, marginTop: 32, marginBottom: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spiceRow: { flexDirection: 'row', gap: 8 },
  spiceCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  spiceCellActive: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
  spiceText: { fontFamily: font.medium, fontSize: 11.5, color: colors.inkFaint },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.bg,
  },
}));
