import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Mars, NonBinary, ShieldQuestion, Venus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SetupScreen } from '../../components/setup-flow';
import { PressableScale } from '../../components/ui';
import { Gender, useStore } from '../../lib/store';
import { font, motion, radius, shadow, themedStyles, useColors } from '../../theme';

const OPTIONS: { value: Gender; label: string; Icon: typeof Mars; accent: string }[] = [
  { value: 'woman', label: 'Woman', Icon: Venus, accent: '#E05B84' },
  { value: 'man', label: 'Man', Icon: Mars, accent: '#438BC9' },
  { value: 'non_binary', label: 'Non-binary', Icon: NonBinary, accent: '#8B5FD0' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', Icon: ShieldQuestion, accent: '#DA7000' },
];

export default function GenderScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { personalization, savePersonalization } = useStore();
  const [gender, setGender] = useState<Gender | null>(personalization.gender);

  const next = (nextGender = gender) => {
    savePersonalization({ ...personalization, gender: nextGender });
    router.push({ pathname: '/setup/age', params: { source } } as never);
  };

  return (
    <SetupScreen
      step={3}
      title="How do you identify?"
      description="Choose what feels right for you."
      onContinue={() => next()}
      onSkip={() => next(null)}
    >
      <Animated.View entering={FadeInDown.delay(100).duration(motion.slow)} style={styles.grid}>
        {OPTIONS.map(({ value, label, Icon, accent }) => {
          const active = gender === value;
          return (
            <PressableScale
              key={value}
              onPress={() => setGender(value)}
              style={[styles.card, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              scaleTo={0.96}
            >
              <View style={[styles.orbit, { borderColor: `${accent}55` }]}>
                <View style={[styles.icon, { backgroundColor: `${accent}1F` }]}>
                  <Icon size={34} color={active ? colors.onPrimary : accent} strokeWidth={2.1} />
                </View>
              </View>
              <Text style={[styles.label, active && { color: colors.onPrimary }]}>{label}</Text>
              <View style={[styles.check, active && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}>
                {active && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
              </View>
            </PressableScale>
          );
        })}
      </Animated.View>
    </SetupScreen>
  );
}

const useStyles = themedStyles((colors) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 34 },
  card: { flexBasis: '46%', flexGrow: 1, height: 184, borderRadius: radius.lg + 4, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 14, ...shadow.card },
  orbit: { width: 94, height: 94, borderRadius: 47, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: font.bold, fontSize: 15.5, color: colors.ink, textAlign: 'center' },
  check: { position: 'absolute', top: 13, right: 13, width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
}));
