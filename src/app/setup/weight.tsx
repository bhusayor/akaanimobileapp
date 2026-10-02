import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { RulerOption, ScalePicker, SetupScreen, UnitToggle } from '../../components/setup-flow';
import { useStore } from '../../lib/store';
import { motion } from '../../theme';

const KG_MIN = 35;
const KG_MAX = 200;
const KG_PER_LB = 0.45359237;

export default function WeightScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { personalization, savePersonalization } = useStore();
  const [unit, setUnit] = useState<'kg' | 'lb'>(personalization.weightUnit);
  const [weightKg, setWeightKg] = useState(personalization.weightKg ?? 70);
  const didApplyHydratedWeight = useRef(personalization.weightKg != null);

  useEffect(() => {
    if (personalization.weightKg == null || didApplyHydratedWeight.current) return;
    didApplyHydratedWeight.current = true;
    setWeightKg(personalization.weightKg);
    setUnit(personalization.weightUnit);
  }, [personalization.weightKg, personalization.weightUnit]);

  const options = useMemo<RulerOption[]>(
    () =>
      unit === 'kg'
        ? Array.from({ length: (KG_MAX - KG_MIN) * 10 + 1 }, (_, index) => {
            const value = KG_MIN + index / 10;
            return { value, label: index % 10 === 0 ? String(Math.round(value)) : undefined };
          })
        : Array.from({ length: (440 - 77) * 10 + 1 }, (_, index) => {
            const pounds = 77 + index / 10;
            return { value: pounds * KG_PER_LB, label: index % 10 === 0 ? String(Math.round(pounds)) : undefined };
          }),
    [unit]
  );

  const next = (value: number | null) => {
    savePersonalization({
      ...personalization,
      weightKg: value == null ? null : Math.round(value * 10) / 10,
      weightUnit: unit,
    });
    router.push({ pathname: '/setup/bmi', params: { source } } as never);
  };

  return (
    <SetupScreen
      step={6}
      title="Your current weight"
      description="We use your weight to tailor your nutrition plan."
      onContinue={() => next(weightKg)}
      onSkip={() => next(null)}
      measurementLayout
    >
      <Animated.View entering={FadeInDown.delay(80).duration(motion.slow)} style={{ flex: 1, marginTop: 18 }}>
        <UnitToggle
          value={unit}
          options={[{ value: 'kg', label: 'KG' }, { value: 'lb', label: 'LB' }]}
          onChange={setUnit}
        />
        <ScalePicker
          options={options}
          value={weightKg}
          formatValue={(value) => unit === 'kg' ? value.toFixed(1) : (value / KG_PER_LB).toFixed(1)}
          unitLabel={unit}
          formatInputValue={(value) => (unit === 'kg' ? value : value / KG_PER_LB).toFixed(1)}
          parseInputValue={(value) => Number(value) * (unit === 'kg' ? 1 : KG_PER_LB)}
          onChange={setWeightKg}
        />
      </Animated.View>
    </SetupScreen>
  );
}
