import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Grip, Minus, Plus, Volume2, VolumeX } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SetupScreen, useTickSound } from '../../components/setup-flow';
import { PressableScale } from '../../components/ui';
import { AgeCharacter } from '../../components/age-character';
import { useStore } from '../../lib/store';
import { font, motion, radius, shadow, themedStyles, useColors } from '../../theme';

const MIN_AGE = 13;
const MAX_AGE = 120;

export default function AgeScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { personalization, savePersonalization, hydrated } = useStore();
  const [age, setAge] = useState(personalization.age ?? 28);
  const [editing, setEditing] = useState(false);
  const [draftAge, setDraftAge] = useState(String(personalization.age ?? 28));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const ageRef = useRef(age);
  const touched = useRef(false);
  useEffect(() => {
    if (!hydrated || touched.current) return;
    const savedAge = personalization.age ?? 28;
    ageRef.current = savedAge;
    setAge(savedAge);
    setDraftAge(String(savedAge));
  }, [hydrated, personalization.age]);
  const playTick = useTickSound();
  const { width, height: screenHeight } = useWindowDimensions();
  const compact = screenHeight < 760;
  const dialSize = Math.min(compact ? 232 : 270, width - 48);

  const chooseAge = (next: number, withSound = true) => {
    touched.current = true;
    const clamped = Math.max(MIN_AGE, Math.min(MAX_AGE, Math.round(next)));
    if (clamped === ageRef.current) return;
    ageRef.current = clamped;
    setAge(clamped);
    setDraftAge(String(clamped));
    if (withSound && soundEnabled) playTick();
  };

  const setFromTouch = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX - dialSize / 2;
    const y = event.nativeEvent.locationY - dialSize / 2;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const next = Math.round(MIN_AGE + (angle / (Math.PI * 2)) * (MAX_AGE - MIN_AGE));
    chooseAge(next);
  };

  const nudge = (amount: number) => {
    chooseAge(age + amount);
    Haptics.selectionAsync().catch(() => {});
  };

  const submitTypedAge = () => {
    const parsed = Number(draftAge);
    if (draftAge.trim() && Number.isFinite(parsed)) chooseAge(parsed);
    else setDraftAge(String(age));
    setEditing(false);
  };

  const beginEditing = () => {
    setDraftAge(String(age));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const progress = (age - MIN_AGE) / (MAX_AGE - MIN_AGE);
  const angle = progress * Math.PI * 2 - Math.PI / 2;
  const pointerRadius = dialSize * 0.433;
  const pointerX = dialSize / 2 + Math.cos(angle) * pointerRadius - 12;
  const pointerY = dialSize / 2 + Math.sin(angle) * pointerRadius - 12;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (event) => {
      const x = event.nativeEvent.locationX - dialSize / 2;
      const y = event.nativeEvent.locationY - dialSize / 2;
      return Math.sqrt(x * x + y * y) > dialSize * 0.27;
    },
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: setFromTouch,
    onPanResponderMove: setFromTouch,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });

  const next = (nextAge: number | null) => {
    savePersonalization({ ...personalization, age: nextAge });
    router.push({ pathname: '/setup/height', params: { source } } as never);
  };

  return (
    <SetupScreen
      step={4}
      title="Your age"
      description="Drag the orbit or tap the number to type."
      onContinue={() => next(age)}
      onSkip={() => next(null)}
    >
      <Animated.View entering={FadeInDown.delay(90).duration(motion.slow)} style={[styles.content, compact && styles.contentCompact]}>
        <View
          style={[styles.dial, { width: dialSize, height: dialSize, borderRadius: dialSize / 2 }]}
          {...panResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel="Age"
          accessibilityValue={{ min: MIN_AGE, max: MAX_AGE, now: age }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => nudge(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        >
            <View style={styles.ringOuter} />
            <View style={styles.ringMiddle} />
            <View style={styles.ringInner} />
            {Array.from({ length: 30 }).map((_, index) => {
              const tickAngle = (index / 30) * Math.PI * 2 - Math.PI / 2;
              const radius = dialSize * 0.381;
              return (
                <View
                  key={index}
                  style={[
                    styles.tick,
                    {
                      left: dialSize / 2 + Math.cos(tickAngle) * radius - 1,
                      top: dialSize / 2 + Math.sin(tickAngle) * radius - 5,
                      transform: [{ rotate: `${(index / 30) * 360}deg` }],
                    },
                    index / 30 <= progress && styles.tickActive,
                  ]}
                />
              );
            })}
            <View style={[styles.pointer, { left: pointerX, top: pointerY }]}> 
              <Grip size={14} color="#FFFFFF" strokeWidth={3} />
            </View>
            <PressableScale onPress={beginEditing} style={styles.center} haptic={false} scaleTo={0.97}>
              <View pointerEvents="none" style={styles.portrait}><AgeCharacter age={age} gender={personalization.gender} portrait /></View>
              {editing ? (
                <TextInput
                  ref={inputRef}
                  value={draftAge}
                  onChangeText={(text) => setDraftAge(text.replace(/[^0-9]/g, '').slice(0, 3))}
                  onBlur={submitTypedAge}
                  onSubmitEditing={submitTypedAge}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  selectTextOnFocus
                  style={styles.ageInput}
                  accessibilityLabel="Type your age"
                />
              ) : (
                <Text style={styles.age}>{age}</Text>
              )}
              <Text style={styles.years}>{editing ? '13–120' : 'tap to type'}</Text>
            </PressableScale>
        </View>

        <Text style={styles.portraitNote}>A little illustration of your life stage.</Text>

        <View style={styles.controls}>
          <PressableScale onPress={() => nudge(-1)} style={styles.controlBtn} scaleTo={0.9}>
            <Minus size={22} color={colors.ink} strokeWidth={2.5} />
          </PressableScale>
          <View style={styles.hintGroup}>
            <Text style={styles.dragHint}>Drag the orbit</Text>
            <PressableScale onPress={() => setSoundEnabled((current) => !current)} haptic={false} style={styles.soundBtn}>
              {soundEnabled ? <Volume2 size={16} color={colors.inkSoft} /> : <VolumeX size={16} color={colors.inkFaint} />}
            </PressableScale>
          </View>
          <PressableScale onPress={() => nudge(1)} style={styles.controlBtn} scaleTo={0.9}>
            <Plus size={22} color={colors.ink} strokeWidth={2.5} />
          </PressableScale>
        </View>

        <View style={styles.quickRow}>
          {[18, 25, 40, 65, 90].map((value) => (
            <PressableScale key={value} onPress={() => chooseAge(value)} style={[styles.quick, age === value && styles.quickActive]} scaleTo={0.92}>
              <Text style={[styles.quickText, age === value && { color: colors.onPrimary }]}>{value}</Text>
            </PressableScale>
          ))}
        </View>
      </Animated.View>
    </SetupScreen>
  );
}

const useStyles = themedStyles((colors) => ({
  content: { alignItems: 'center', marginTop: 36 },
  contentCompact: { marginTop: 16 },
  dial: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, ...shadow.float },
  ringOuter: { position: 'absolute', inset: 12, borderRadius: 123, borderWidth: 1, borderColor: colors.line },
  ringMiddle: { position: 'absolute', inset: 43, borderRadius: 92, borderWidth: 1, borderColor: colors.secondarySoft },
  ringInner: { position: 'absolute', inset: 73, borderRadius: 62, backgroundColor: colors.bgSoft },
  tick: { position: 'absolute', width: 2, height: 10, borderRadius: 1, backgroundColor: colors.line },
  tickActive: { backgroundColor: colors.secondary },
  pointer: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  center: { zIndex: 5, width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  portrait: { width: 84, height: 72 },
  portraitNote: { marginTop: 14, fontFamily: font.regular, fontSize: 10, color: colors.inkFaint },
  age: { fontFamily: font.extrabold, fontSize: 43, lineHeight: 47, color: colors.ink, letterSpacing: -1.5 },
  ageInput: { width: 104, padding: 0, fontFamily: font.extrabold, fontSize: 43, lineHeight: 47, color: colors.ink, textAlign: 'center' },
  years: { fontFamily: font.semibold, fontSize: 10, color: colors.inkSoft, letterSpacing: 0.9, textTransform: 'uppercase' },
  controls: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 },
  controlBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hintGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dragHint: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  soundBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 22 },
  quick: { width: 48, height: 40, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  quickActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickText: { fontFamily: font.bold, fontSize: 13, color: colors.inkSoft },
}));
