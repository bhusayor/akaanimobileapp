import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Gender } from '../lib/store';
import { font, motion, radius, shadow, themedStyles, useColors } from '../theme';
import { Button, PressableScale } from './ui';
import { AgeCharacter } from './age-character';

const TOTAL_STEPS = 8;
const TICK_WIDTH = 14;

export function SetupScreen({
  step,
  title,
  description,
  children,
  onContinue,
  onSkip,
  continueLabel = 'Continue',
  measurementLayout = false,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onContinue: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  measurementLayout?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const compactMeasurements = measurementLayout && windowHeight < 700;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        directionalLockEnabled
        scrollEnabled={!measurementLayout}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (measurementLayout ? 88 : 122),
          flexGrow: 1,
          ...(measurementLayout ? { height: '100%' } : {}),
        }}
      >
        <View style={[styles.navRow, compactMeasurements && { marginBottom: 8 }]}>
          <PressableScale onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={21} color={colors.ink} strokeWidth={2.3} />
          </PressableScale>
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View key={index} style={[styles.progressBit, index < step && styles.progressBitActive]} />
            ))}
          </View>
          {onSkip ? (
            <PressableScale onPress={onSkip} haptic={false} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </PressableScale>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <Animated.View entering={FadeInDown.duration(motion.slow).easing(motion.enter)}>
          {!measurementLayout && <Text style={styles.step}>STEP {step} OF {TOTAL_STEPS}</Text>}
          <Text style={[styles.title, measurementLayout && styles.measurementTitle, compactMeasurements && { fontSize: 22, lineHeight: 26 }]}>{title}</Text>
          <Text style={[styles.description, measurementLayout && styles.measurementDescription, compactMeasurements && { fontSize: 12, lineHeight: 16 }]}>{description}</Text>
        </Animated.View>

        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button title={continueLabel} onPress={onContinue} />
      </View>
    </View>
  );
}

export function UnitToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.unitToggle}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.unitBtn, active && { backgroundColor: colors.primary }]}
            scaleTo={0.94}
            haptic={!active}
          >
            <Text style={[styles.unitText, active && { color: colors.onPrimary }]}>{option.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function useTickSound() {
  const player = useAudioPlayer(require('../../assets/sounds/ruler-tick.wav'));
  const lastPlayedAt = useRef(0);

  useEffect(() => {
    player.volume = 0.14;
  }, [player]);

  return useCallback(() => {
    // Browsers require an explicit activation before audio playback is allowed.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.userActivation?.hasBeenActive) return;
    const now = Date.now();
    if (now - lastPlayedAt.current < 55) return;
    lastPlayedAt.current = now;
    player.seekTo(0).then(() => player.play()).catch(() => {});
  }, [player]);
}

/** A realistic pencil portrait that morphs with the user's selection. */
export function BodyCharacter({
  mode,
  progress,
  heightProgress,
  gender,
  age,
  compact = false,
  snapshot = false,
  measurement = false,
  reference = false,
  displayHeight,
}: {
  mode: 'height' | 'weight';
  progress: number;
  heightProgress: number;
  gender?: Gender | null;
  age?: number | null;
  compact?: boolean;
  snapshot?: boolean;
  measurement?: boolean;
  reference?: boolean;
  displayHeight?: number;
}) {
  const styles = useStyles();
  const heightScale = reference ? 1 : 0.78 + heightProgress * 0.38;
  const scaleX = useSharedValue(mode === 'weight' ? 0.74 + progress * 0.62 : 1);
  const scaleY = useSharedValue(heightScale);

  useEffect(() => {
    scaleX.value = withTiming(mode === 'weight' ? 0.74 + progress * 0.62 : 1, {
      duration: motion.fast,
      easing: motion.ease,
    });
    scaleY.value = withTiming(reference ? 1 : 0.78 + heightProgress * 0.38, {
      duration: motion.fast,
      easing: motion.ease,
    });
  }, [heightProgress, mode, progress, reference, scaleX, scaleY]);

  const characterStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 0.78 + scaleX.value * 0.22 }],
  }));

  return (
    <View style={[styles.characterStage, compact && styles.characterStageCompact, snapshot && styles.characterStageSnapshot, measurement && styles.characterStageMeasurement, reference && styles.characterStageReference, displayHeight != null && { height: displayHeight + 8, width: displayHeight * 0.67 }]}>
      <Animated.View style={[styles.standingShadow, shadowStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 160 28">
          <Defs>
            <RadialGradient id="groundShadow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#18211F" stopOpacity="0.26" />
              <Stop offset="55%" stopColor="#18211F" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#18211F" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="80" cy="14" rx="76" ry="11" fill="url(#groundShadow)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.characterFrame, compact && styles.characterFrameCompact, snapshot && styles.characterFrameSnapshot, measurement && styles.characterFrameMeasurement, reference && styles.characterFrameReference, displayHeight != null && { height: displayHeight, width: displayHeight * 0.67, marginBottom: 8 }, characterStyle]}>
        <AgeCharacter age={age} gender={gender} />
      </Animated.View>
    </View>
  );
}

export type RulerOption = { value: number; label?: string };

const AnimatedDialGroup = Animated.createAnimatedComponent(G);

function nearestOption(options: RulerOption[], target: number) {
  let nearest = options[0];
  let distance = Math.abs(options[0].value - target);
  options.forEach((option) => {
    const nextDistance = Math.abs(option.value - target);
    if (nextDistance < distance) {
      nearest = option;
      distance = nextDistance;
    }
  });
  return nearest;
}

function MeasurementValue({
  value,
  formatValue,
  unitLabel,
  options,
  onChange,
  formatInputValue,
  parseInputValue,
  dark = false,
  reference = false,
}: {
  value: number;
  formatValue: (value: number) => string;
  unitLabel: string;
  options: RulerOption[];
  onChange: (value: number) => void;
  formatInputValue: (value: number) => string;
  parseInputValue: (value: string) => number;
  dark?: boolean;
  reference?: boolean;
}) {
  const styles = useStyles();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatInputValue(value));
  const inputRef = useRef<TextInput>(null);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (editing) return;
    pulse.value = 0.965;
    pulse.value = withTiming(1, { duration: 150, easing: motion.ease });
  }, [editing, pulse, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.72 + pulse.value * 0.28,
  }));

  const beginEditing = () => {
    setDraft(formatInputValue(value));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commit = () => {
    const parsed = parseInputValue(draft);
    if (draft.trim() && Number.isFinite(parsed)) {
      onChange(nearestOption(options, parsed).value);
      Haptics.selectionAsync().catch(() => {});
    }
    setEditing(false);
  };

  return (
    <Animated.View style={[styles.measurementValueWrap, reference && styles.measurementValueReference, animatedStyle]}>
      {editing ? (
        <View style={styles.measurementInputRow}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={(text) => setDraft(text.replace(/[^0-9.]/g, '').slice(0, 6))}
            onBlur={commit}
            onSubmitEditing={commit}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
            style={[styles.measurementInput, reference && styles.measurementInputReference, dark && styles.measurementInputDark]}
            accessibilityLabel="Type measurement"
          />
          {!!unitLabel && <Text style={[styles.measurementUnit, dark && styles.measurementUnitDark]}>{unitLabel}</Text>}
        </View>
      ) : (
        <PressableScale
          onPress={beginEditing}
          haptic={false}
          scaleTo={0.98}
          style={styles.measurementPressable}
          accessibilityLabel={`${formatValue(value)} ${unitLabel}. Tap to type`}
        >
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.measurementNumber, reference && styles.measurementNumberReference, dark && styles.measurementNumberDark]}>{formatValue(value)}</Text>
          {!!unitLabel && <Text style={[styles.measurementUnit, dark && styles.measurementUnitDark]}>{unitLabel}</Text>}
        </PressableScale>
      )}
    </Animated.View>
  );
}

/** Descending marks put taller measurements physically above shorter ones. */
export function VerticalRulerPicker({
  options,
  value,
  formatValue,
  unitLabel,
  onChange,
  formatInputValue = (next) => String(Math.round(next)),
  parseInputValue = (next) => Number(next),
  height = 330,
  character,
  indicatorPosition,
}: {
  options: RulerOption[];
  value: number;
  formatValue: (value: number) => string;
  unitLabel: string;
  onChange: (value: number) => void;
  formatInputValue?: (value: number) => string;
  parseInputValue?: (value: string) => number;
  height?: number;
  character?: React.ReactNode;
  indicatorPosition?: number;
}) {
  const styles = useStyles();
  const listRef = useRef<FlatList<RulerOption>>(null);
  const lastIndex = useRef(-1);
  const lastEmittedValue = useRef(value);
  const previousOptions = useRef(options);
  const userScrolling = useRef(false);
  const [ready, setReady] = useState(false);
  const playTick = useTickSound();
  const indicatorY = indicatorPosition ?? Math.max(64, height * 0.19);
  const VERTICAL_TICK_HEIGHT = Math.max(5, height / 52) * (options[1].value - options[0].value);
  const previousTickHeight = useRef(VERTICAL_TICK_HEIGHT);
  const rulerOptions = useMemo(() => [...options].reverse(), [options]);
  const selectedIndex = useMemo(() => rulerOptions.indexOf(nearestOption(rulerOptions, value)), [rulerOptions, value]);
  const initialOffset = useRef({ x: 0, y: selectedIndex * VERTICAL_TICK_HEIGHT });

  useEffect(() => {
    if (!ready) return;
    const optionsChanged = previousOptions.current !== options;
    const sizeChanged = previousTickHeight.current !== VERTICAL_TICK_HEIGHT;
    previousOptions.current = options;
    previousTickHeight.current = VERTICAL_TICK_HEIGHT;
    if (!optionsChanged && !sizeChanged && Math.abs(lastEmittedValue.current - value) < 0.001 && lastIndex.current >= 0) return;
    lastIndex.current = selectedIndex;
    lastEmittedValue.current = value;
    userScrolling.current = false;
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: selectedIndex * VERTICAL_TICK_HEIGHT, animated: false }));
  }, [options, ready, selectedIndex, value, VERTICAL_TICK_HEIGHT]);

  const update = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!userScrolling.current) return;
    const index = Math.max(0, Math.min(rulerOptions.length - 1, Math.round(event.nativeEvent.contentOffset.y / VERTICAL_TICK_HEIGHT)));
    if (index === lastIndex.current) return;
    lastIndex.current = index;
    lastEmittedValue.current = rulerOptions[index].value;
    onChange(rulerOptions[index].value);
    if (index % 2 === 0) playTick();
  };

  return (
    <View style={[styles.referenceHeightStage, { height }]}>
      <View pointerEvents="none" style={[styles.heightGuide, { top: indicatorY }]}>
        <View style={styles.heightGuideDot} />
      </View>
      {!!character && <View pointerEvents="none" style={styles.heightCharacterSlot}>{character}</View>}
      <View style={[styles.heightReadout, { top: indicatorY - 57 }]}>
        <MeasurementValue
          value={value}
          formatValue={formatValue}
          unitLabel={unitLabel}
          options={options}
          onChange={onChange}
          formatInputValue={formatInputValue}
          parseInputValue={parseInputValue}
          reference
        />
      </View>

      <View style={[styles.verticalRail, { height }]} onLayout={() => setReady(true)}>
        <FlatList
          ref={listRef}
          key={unitLabel || 'imperial'}
          data={rulerOptions}
          nestedScrollEnabled
          contentOffset={initialOffset.current}
          initialNumToRender={rulerOptions.length}
          removeClippedSubviews={false}
          bounces={false}
          keyExtractor={(_, index) => String(index)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: indicatorY - VERTICAL_TICK_HEIGHT / 2, paddingBottom: height - indicatorY - VERTICAL_TICK_HEIGHT / 2 }}
          snapToInterval={VERTICAL_TICK_HEIGHT}
          decelerationRate={0.992}
          scrollEventThrottle={16}
          onScroll={update}
          onScrollBeginDrag={() => { userScrolling.current = true; }}
          onTouchStart={() => { userScrolling.current = true; }}
          {...(Platform.OS === 'web' ? { onWheel: () => { userScrolling.current = true; } } : {})}
          onMomentumScrollEnd={() => Haptics.selectionAsync().catch(() => {})}
          getItemLayout={(_, index) => ({ length: VERTICAL_TICK_HEIGHT, offset: VERTICAL_TICK_HEIGHT * index, index })}
          renderItem={({ item, index }) => {
            const major = !!item.label;
            const medium = !major && index % 5 === 0;
            return (
              <View style={[styles.verticalTickCell, { height: VERTICAL_TICK_HEIGHT }]}>
                {major && !!item.label && <Text style={styles.verticalTickLabel}>{item.label}</Text>}
                <View style={[styles.verticalTick, medium && styles.verticalTickMedium, major && styles.verticalTickMajor]} />
              </View>
            );
          }}
        />
        <View pointerEvents="none" style={[styles.verticalNeedle, { top: indicatorY }]} />
      </View>
    </View>
  );
}

/** Oversized weighing dial, cropped at the screen edges like a physical scale. */
export function ScalePicker({
  options,
  value,
  formatValue,
  unitLabel,
  onChange,
  formatInputValue = (next) => String(Math.round(next)),
  parseInputValue = (next) => Number(next),
}: {
  options: RulerOption[];
  value: number;
  formatValue: (value: number) => string;
  unitLabel: string;
  onChange: (value: number) => void;
  formatInputValue?: (value: number) => string;
  parseInputValue?: (value: string) => number;
}) {
  const styles = useStyles();
  const colors = useColors();
  const playTick = useTickSound();
  const [stageSize, setStageSize] = useState({ width: 350, height: 350 });
  const displayValue = Number(formatInputValue(value));
  const animatedValue = useSharedValue(displayValue);
  const gestureStart = useRef(0);
  const lastIndex = useRef(-1);
  const selectedIndex = options.indexOf(nearestOption(options, value));
  const dialWidth = stageSize.width + 40;
  const dialHeight = Math.max(110, Math.min(340, stageSize.height * 0.6));
  const dialRadius = dialWidth * 0.95;
  const dialCenterX = dialWidth / 2;
  const dialCenterY = dialRadius + 12;
  const dialProps = useAnimatedProps(() => ({
    transform: `rotate(${-animatedValue.value * 4} ${dialCenterX} ${dialCenterY})`,
  }));

  useEffect(() => {
    animatedValue.value = withTiming(displayValue, { duration: 100, easing: motion.ease });
  }, [animatedValue, displayValue]);

  const changeIndex = (index: number) => {
    const next = Math.max(0, Math.min(options.length - 1, index));
    if (next === lastIndex.current) return;
    lastIndex.current = next;
    onChange(options[next].value);
    playTick();
  };
  const gestureValues = useRef({ selectedIndex, changeIndex });
  gestureValues.current = { selectedIndex, changeIndex };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3,
    onPanResponderGrant: () => {
      gestureStart.current = gestureValues.current.selectedIndex;
      lastIndex.current = gestureValues.current.selectedIndex;
    },
    onPanResponderMove: (_, gesture) => {
      // One tenth per 3 pixels, with no initial scroll event to overwrite the default.
      gestureValues.current.changeIndex(gestureStart.current - Math.round(gesture.dx / 3));
    },
    onPanResponderRelease: () => { Haptics.selectionAsync().catch(() => {}); },
    onPanResponderTerminationRequest: () => false,
  }), []);

  const anchor = Math.floor(displayValue / 5) * 5;
  const min = Number(formatInputValue(options[0].value));
  const max = Number(formatInputValue(options[options.length - 1].value));
  const ticks = Array.from({ length: 121 }, (_, index) => anchor - 30 + index * 0.5)
    .filter((tick) => tick >= min && tick <= max);

  return (
    <View style={styles.referenceWeightStage} onLayout={(event) => setStageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      <View style={styles.weightReadout}>
        <MeasurementValue
          value={value}
          formatValue={formatValue}
          unitLabel={unitLabel}
          options={options}
          onChange={onChange}
          formatInputValue={formatInputValue}
          parseInputValue={parseInputValue}
        />
        <Text style={styles.tapValueHint}>Tap to type your weight</Text>
      </View>
      <View style={[styles.analogScale, { width: dialWidth, height: dialHeight }]}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Weight scale"
        accessibilityValue={{ min, max, now: displayValue, text: `${formatValue(value)} ${unitLabel}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => changeIndex(selectedIndex + (event.nativeEvent.actionName === 'increment' ? 1 : -1))}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${dialWidth} ${dialHeight}`}>
          <Circle cx={dialCenterX} cy={dialCenterY} r={dialRadius} fill={colors.card} stroke={colors.line} strokeWidth="1.5" />
            <AnimatedDialGroup animatedProps={dialProps}>
              {ticks.map((tick) => {
                const major = tick % 5 === 0;
                const whole = tick % 1 === 0;
                return (
                  <G key={tick} transform={`rotate(${tick * 4} ${dialCenterX} ${dialCenterY})`}>
                    <Line x1={dialCenterX} y1="23" x2={dialCenterX} y2={major ? 56 : whole ? 43 : 34}
                      stroke={major ? colors.ink : colors.inkFaint} strokeWidth={major ? 2 : 1} strokeLinecap="round" />
                    {major && <SvgText x={dialCenterX} y="80" textAnchor="middle" fontFamily={font.semibold} fontSize="17" fill={colors.ink}>{tick}</SvgText>}
                  </G>
                );
              })}
            </AnimatedDialGroup>
          <Path d={`M${dialCenterX} 20L${dialCenterX - 0.5} 57H${dialCenterX + 0.5}Z M${dialCenterX - 0.6} 90L${dialCenterX - 2.5} ${dialHeight - 15}Q${dialCenterX} ${dialHeight - 11} ${dialCenterX + 2.5} ${dialHeight - 15}L${dialCenterX + 0.6} 90Z`} fill={colors.ink} />
        </Svg>
      </View>
      <Text style={styles.analogHint}>Drag the dial left or right</Text>
    </View>
  );
}

export function RulerPicker({
  options,
  value,
  formatValue,
  unitLabel,
  onChange,
  formatInputValue = (next) => String(Math.round(next)),
  parseInputValue = (next) => Number(next),
  editUnitLabel,
}: {
  options: RulerOption[];
  value: number;
  formatValue: (value: number) => string;
  unitLabel: string;
  onChange: (value: number) => void;
  formatInputValue?: (value: number) => string;
  parseInputValue?: (value: string) => number;
  editUnitLabel?: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  const listRef = useRef<FlatList<RulerOption>>(null);
  const lastIndex = useRef(-1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(formatInputValue(value));
  const inputRef = useRef<TextInput>(null);
  const playTick = useTickSound();
  const [width, setWidth] = useState(0);
  const selectedIndex = useMemo(() => {
    let best = 0;
    let distance = Infinity;
    options.forEach((option, index) => {
      const next = Math.abs(option.value - value);
      if (next < distance) {
        best = index;
        distance = next;
      }
    });
    return best;
  }, [options, value]);

  useEffect(() => {
    if (!width) return;
    lastIndex.current = selectedIndex;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: selectedIndex * TICK_WIDTH, animated: false });
    });
  }, [width, options, selectedIndex]);

  const beginEditing = () => {
    setDraftValue(formatInputValue(value));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commitValue = () => {
    const parsed = parseInputValue(draftValue);
    if (draftValue.trim() && Number.isFinite(parsed)) {
      let nearest = options[0];
      let distance = Math.abs(options[0].value - parsed);
      options.forEach((option) => {
        const nextDistance = Math.abs(option.value - parsed);
        if (nextDistance < distance) {
          nearest = option;
          distance = nextDistance;
        }
      });
      onChange(nearest.value);
      Haptics.selectionAsync().catch(() => {});
    } else {
      setDraftValue(formatInputValue(value));
    }
    setEditing(false);
  };

  const update = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(0, Math.min(options.length - 1, Math.round(event.nativeEvent.contentOffset.x / TICK_WIDTH)));
    if (index === lastIndex.current) return;
    lastIndex.current = index;
    onChange(options[index].value);
    if (soundEnabled && index % 2 === 0) playTick();
  };

  return (
    <View style={styles.rulerCard} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.rulerValueRow}>
        {editing ? (
          <>
            <TextInput
              ref={inputRef}
              value={draftValue}
              onChangeText={(text) => setDraftValue(text.replace(/[^0-9.]/g, '').slice(0, 6))}
              onBlur={commitValue}
              onSubmitEditing={commitValue}
              keyboardType="decimal-pad"
              returnKeyType="done"
              selectTextOnFocus
              style={styles.rulerInput}
              accessibilityLabel="Type measurement"
            />
            <Text style={styles.rulerUnit}>{editUnitLabel ?? unitLabel}</Text>
          </>
        ) : (
          <PressableScale
            onPress={beginEditing}
            haptic={false}
            scaleTo={0.98}
            style={styles.rulerEditableValue}
            accessibilityLabel={`${formatValue(value)} ${unitLabel}. Tap to type`}
          >
            <Text style={styles.rulerValue}>{formatValue(value)}</Text>
            <Text style={styles.rulerUnit}>{unitLabel}</Text>
          </PressableScale>
        )}
        <PressableScale
          onPress={() => setSoundEnabled((current) => !current)}
          haptic={false}
          style={styles.soundButton}
          accessibilityLabel={soundEnabled ? 'Turn ruler sound off' : 'Turn ruler sound on'}
        >
          {soundEnabled ? <Volume2 size={17} color={colors.inkSoft} /> : <VolumeX size={17} color={colors.inkFaint} />}
        </PressableScale>
      </View>
      <View style={styles.rulerWindow}>
        {width > 0 && (
          <FlatList
            ref={listRef}
            data={options}
            horizontal
            keyExtractor={(_, index) => String(index)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: width / 2 - TICK_WIDTH / 2 }}
            snapToInterval={TICK_WIDTH}
            decelerationRate={0.992}
            scrollEventThrottle={16}
            onScroll={update}
            onMomentumScrollEnd={() => Haptics.selectionAsync().catch(() => {})}
            getItemLayout={(_, index) => ({ length: TICK_WIDTH, offset: TICK_WIDTH * index, index })}
            renderItem={({ item, index }) => {
              const major = index % 5 === 0;
              return (
                <View style={[styles.tickCell, { width: TICK_WIDTH }]}>
                  <View style={[styles.tick, major && styles.tickMajor]} />
                  {major && !!item.label && <Text style={styles.tickLabel}>{item.label}</Text>}
                </View>
              );
            }}
          />
        )}
        <View pointerEvents="none" style={styles.rulerNeedle} />
        <View pointerEvents="none" style={[styles.rulerNeedleDot, { backgroundColor: colors.secondary }]} />
      </View>
      <Text style={styles.rulerHint}>Swipe the ruler · tap the number to type</Text>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flex: 1, flexDirection: 'row', gap: 4 },
  progressBit: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  progressBitActive: { backgroundColor: colors.secondary },
  skipBtn: { width: 44, paddingVertical: 10, alignItems: 'flex-end' },
  skipText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft },
  step: { fontFamily: font.bold, fontSize: 10.5, letterSpacing: 1.5, color: colors.secondary },
  title: { fontFamily: font.extrabold, fontSize: 32, lineHeight: 37, letterSpacing: -0.9, color: colors.ink, marginTop: 8 },
  description: { fontFamily: font.regular, fontSize: 15, lineHeight: 21, color: colors.inkSoft, marginTop: 5 },
  measurementTitle: { fontSize: 24, lineHeight: 30, letterSpacing: -0.5, textAlign: 'center', marginTop: 0 },
  measurementDescription: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280, alignSelf: 'center', marginTop: 7 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg },
  unitToggle: { alignSelf: 'center', flexDirection: 'row', gap: 3, padding: 4, borderRadius: radius.full, backgroundColor: colors.bgSoft },
  unitBtn: { minWidth: 68, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full, alignItems: 'center' },
  unitText: { fontFamily: font.bold, fontSize: 12.5, color: colors.inkSoft },
  characterStage: { height: 330, marginTop: 6, alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  characterStageCompact: { height: 274, marginTop: 12 },
  characterStageSnapshot: { height: 202, marginTop: 0 },
  characterStageMeasurement: { width: 104, height: 320, marginTop: 0 },
  characterStageReference: { width: 190, height: 320, marginTop: 0 },
  standingShadow: { position: 'absolute', bottom: 0, width: 160, height: 28 },
  characterFrame: { width: 205, height: 278, marginBottom: 10, transformOrigin: 'center bottom' },
  characterFrameCompact: { width: 190, height: 240, marginBottom: 7 },
  characterFrameSnapshot: { width: 148, height: 192, marginBottom: 5 },
  characterFrameMeasurement: { width: 112, height: 250, marginBottom: 8 },
  characterFrameReference: { width: 162, height: 260, marginBottom: 8 },
  verticalMeasureLayout: { flex: 1, minWidth: 0, minHeight: 330, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  verticalValueZone: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  liveLabel: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.7, color: colors.secondary, marginBottom: 5 },
  liveLabelDark: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.7, color: '#FFB15F' },
  measurementValueWrap: { minHeight: 86, minWidth: 128, alignItems: 'center', justifyContent: 'center' },
  measurementValueReference: { minWidth: 98, minHeight: 48 },
  measurementPressable: { maxWidth: '100%', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, paddingHorizontal: 3 },
  measurementNumber: { maxWidth: 170, fontFamily: font.extrabold, fontSize: 66, lineHeight: 72, letterSpacing: -3.2, color: colors.ink, textAlign: 'center' },
  measurementNumberReference: { maxWidth: 125, fontSize: 38, lineHeight: 44, letterSpacing: -1.6 },
  measurementNumberDark: { color: '#FFFFFF' },
  measurementUnit: { fontFamily: font.bold, fontSize: 14, color: colors.inkSoft },
  measurementUnitDark: { color: '#A8C0BA' },
  measurementInputRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 },
  measurementInput: { minWidth: 120, height: 70, padding: 0, borderBottomWidth: 2, borderBottomColor: colors.secondary, fontFamily: font.extrabold, fontSize: 56, lineHeight: 64, color: colors.ink, textAlign: 'center' },
  measurementInputReference: { minWidth: 86, height: 48, fontSize: 36, lineHeight: 43 },
  measurementInputDark: { color: '#FFFFFF' },
  tapValueHint: { fontFamily: font.medium, fontSize: 10.5, color: colors.inkFaint, marginTop: 2 },
  referenceHeightStage: { position: 'relative', width: '100%', overflow: 'hidden' },
  heightGuide: { position: 'absolute', left: 6, right: 0, zIndex: 1, height: 1.5, backgroundColor: '#C8B7F2' },
  heightGuideDot: { position: 'absolute', left: -3, top: -3.5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8B7F2' },
  heightReadout: { position: 'absolute', left: 0, zIndex: 4, alignItems: 'flex-start' },
  heightCharacterSlot: { position: 'absolute', left: 8, right: 84, bottom: 0, top: 0, alignItems: 'center', justifyContent: 'flex-end', zIndex: 2 },
  verticalRail: { position: 'absolute', top: 0, right: 0, width: 84, overflow: 'hidden', zIndex: 3 },
  verticalTickCell: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  verticalTick: { width: 28, height: 1, borderRadius: 1, backgroundColor: colors.inkFaint },
  verticalTickMedium: { width: 38, backgroundColor: colors.inkFaint },
  verticalTickMajor: { width: 44, height: 1.5, backgroundColor: colors.inkSoft },
  verticalTickLabel: { marginRight: 7, minWidth: 30, fontFamily: font.medium, fontSize: 9.5, color: colors.inkSoft, textAlign: 'right' },
  verticalNeedle: { position: 'absolute', left: 27, right: 0, height: 2, marginTop: -1, borderRadius: 2, backgroundColor: '#C8B7F2' },
  verticalNeedleDot: { position: 'absolute', top: '50%', left: 7, width: 10, height: 10, marginTop: -5, borderRadius: 5 },
  verticalSoundButton: { position: 'absolute', left: 8, bottom: 8, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSoft },
  referenceWeightStage: { flex: 1, minHeight: 0, justifyContent: 'flex-end', marginTop: 4 },
  weightReadout: { flex: 1, minHeight: 66, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  analogScale: { alignSelf: 'center', overflow: 'hidden' },
  analogHint: { fontFamily: font.medium, fontSize: 11, color: colors.inkSoft, textAlign: 'center', marginTop: 8, marginBottom: 4 },
  weightGuide: { position: 'absolute', top: 93, bottom: 94, left: '50%', width: 1.5, marginLeft: -0.75, backgroundColor: '#C8B7F2', zIndex: 2 },
  weightGuideDot: { position: 'absolute', top: -4, left: -3.25, width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8B7F2' },
  scaleDial: { position: 'absolute', left: -20, right: -20, bottom: 25, height: 94, overflow: 'hidden' },
  scaleTickCell: { alignItems: 'center', paddingTop: 8 },
  scaleTick: { width: 1, height: 29, borderRadius: 1, backgroundColor: colors.line },
  scaleTickMedium: { height: 39, backgroundColor: colors.inkFaint },
  scaleTickMajor: { height: 49, width: 1.5, backgroundColor: colors.inkSoft },
  scaleTickLabel: { position: 'absolute', top: 64, fontFamily: font.medium, fontSize: 9.5, color: colors.inkSoft },
  scaleNeedle: { position: 'absolute', top: 0, left: '50%', width: 2, height: 51, marginLeft: -1, borderRadius: 1, backgroundColor: '#C8B7F2' },
  scaleHint: { position: 'absolute', bottom: 0, left: 0, right: 0, fontFamily: font.medium, fontSize: 10.5, color: colors.inkFaint, textAlign: 'center' },
  rulerCard: { marginTop: 18, backgroundColor: colors.card, borderRadius: radius.lg + 4, paddingTop: 12, paddingBottom: 12, overflow: 'hidden', ...shadow.card },
  rulerValueRow: { minHeight: 46, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 },
  rulerEditableValue: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, minWidth: 120 },
  rulerValue: { fontFamily: font.extrabold, fontSize: 38, color: colors.ink, letterSpacing: -1.2 },
  rulerInput: { minWidth: 96, height: 46, padding: 0, borderBottomWidth: 2, borderBottomColor: colors.secondary, fontFamily: font.extrabold, fontSize: 36, lineHeight: 42, color: colors.ink, textAlign: 'center' },
  rulerUnit: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  soundButton: { position: 'absolute', right: 14, top: 6, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgSoft, alignItems: 'center', justifyContent: 'center' },
  rulerWindow: { height: 74, marginTop: 2 },
  tickCell: { alignItems: 'center', paddingTop: 20 },
  tick: { width: 1.5, height: 19, borderRadius: 1, backgroundColor: colors.inkFaint },
  tickMajor: { height: 31, width: 2, backgroundColor: colors.inkSoft },
  tickLabel: { position: 'absolute', top: 53, fontFamily: font.medium, fontSize: 9, color: colors.inkFaint },
  rulerNeedle: { position: 'absolute', top: 6, bottom: 16, left: '50%', width: 2, marginLeft: -1, borderRadius: 1, backgroundColor: colors.secondary },
  rulerNeedleDot: { position: 'absolute', top: 2, left: '50%', width: 10, height: 10, marginLeft: -5, borderRadius: 5 },
  rulerHint: { fontFamily: font.medium, fontSize: 11, textAlign: 'center', color: colors.inkFaint, marginTop: 3 },
}));
