import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BodyCharacter, RulerOption, SetupScreen, UnitToggle, VerticalRulerPicker } from '../../components/setup-flow';
import { useStore } from '../../lib/store';
import { motion } from '../../theme';

const CM_MIN = 130;
const CM_MAX = 220;

function imperialLabel(inches: number) {
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
}

export default function HeightScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { personalization, savePersonalization } = useStore();
  const [unit, setUnit] = useState<'cm' | 'in'>(personalization.heightUnit);
  const [heightCm, setHeightCm] = useState(personalization.heightCm ?? 170);
  const didApplyHydratedHeight = useRef(personalization.heightCm != null);
  const [rulerHeight, setRulerHeight] = useState(0);
  const heightProgress = Math.max(0, Math.min(1, (heightCm - CM_MIN) / (CM_MAX - CM_MIN)));
  const characterHeight = Math.max(100, rulerHeight - 90) * (0.88 + heightProgress * 0.12);

  useEffect(() => {
    if (personalization.heightCm == null || didApplyHydratedHeight.current) return;
    didApplyHydratedHeight.current = true;
    setHeightCm(personalization.heightCm);
    setUnit(personalization.heightUnit);
  }, [personalization.heightCm, personalization.heightUnit]);

  const options = useMemo<RulerOption[]>(
    () =>
      unit === 'cm'
        ? Array.from({ length: CM_MAX - CM_MIN + 1 }, (_, index) => {
            const value = CM_MIN + index;
            return { value, label: value % 10 === 0 ? String(value) : undefined };
          })
        : Array.from({ length: 38 }, (_, index) => {
            const inches = 51 + index;
            return { value: inches * 2.54, label: inches % 6 === 0 ? imperialLabel(inches) : undefined };
          }),
    [unit]
  );

  const next = (value: number | null) => {
    savePersonalization({
      ...personalization,
      heightCm: value == null ? null : Math.round(value * 10) / 10,
      heightUnit: unit,
    });
    router.push({ pathname: '/setup/weight', params: { source } } as never);
  };

  return (
    <SetupScreen
      step={5}
      title="Your height"
      description="We use your height to personalize your nutrition plan."
      onContinue={() => next(heightCm)}
      onSkip={() => next(null)}
      measurementLayout
    >
      <Animated.View entering={FadeInDown.delay(80).duration(motion.slow)} style={{ flex: 1, marginTop: 18 }}>
        <UnitToggle
          value={unit}
          options={[{ value: 'cm', label: 'CM' }, { value: 'in', label: 'FT / IN' }]}
          onChange={setUnit}
        />
        <View style={{ flex: 1, marginTop: 20 }} onLayout={(event) => setRulerHeight(event.nativeEvent.layout.height)}>
          {rulerHeight > 0 && (
          <VerticalRulerPicker
            options={options}
            value={heightCm}
            height={rulerHeight}
            indicatorPosition={rulerHeight - characterHeight - 16}
            formatValue={(value) => unit === 'cm' ? String(Math.round(value)) : imperialLabel(Math.round(value / 2.54))}
            unitLabel={unit === 'cm' ? 'cm' : ''}
            formatInputValue={(value) => String(Math.round(unit === 'cm' ? value : value / 2.54))}
            parseInputValue={(value) => Number(value) * (unit === 'cm' ? 1 : 2.54)}
            onChange={setHeightCm}
            character={(
              <BodyCharacter
                mode="height"
                progress={Math.max(0, Math.min(1, (heightCm - CM_MIN) / (CM_MAX - CM_MIN)))}
                heightProgress={Math.max(0, Math.min(1, (heightCm - CM_MIN) / (CM_MAX - CM_MIN)))}
                gender={personalization.gender}
                age={personalization.age}
                reference
                displayHeight={characterHeight}
              />
            )}
          />
          )}
        </View>
      </Animated.View>
    </SetupScreen>
  );
}
