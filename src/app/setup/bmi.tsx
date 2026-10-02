import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView,
  Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, LinearTransition, useAnimatedStyle,
  useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { Button, PressableScale } from '../../components/ui';
import { calculateBmi } from '../../lib/health';
import { useStore } from '../../lib/store';
import { font, motion, themedStyles, useColors } from '../../theme';

// Adult reference ranges: cdc.gov/bmi/adult-calculator/bmi-categories.html
const RANGES = [
  { name: 'Below range', interval: 'Below 18.5', color: '#A795D4', span: 3.5, description: 'This is the adult underweight category. BMI is one part of the picture, alongside your health and eating habits.' },
  { name: 'Within range', interval: '18.5 to <25', color: '#79B99B', span: 6.5, description: 'This is the adult healthy-weight category. BMI alone cannot describe your fitness, nutrition or body composition.' },
  { name: 'Above range', interval: '25 to <30', color: '#DDB365', span: 5, description: 'This is the adult overweight category. BMI does not distinguish muscle from body fat.' },
  { name: 'Higher range', interval: '30 and above', color: '#D8957D', span: 10, description: 'This is the adult obesity category. A fuller assessment considers your medical history and other health measures.' },
] as const;

function rangeIndex(bmi: number) {
  return bmi < 18.5 ? 0 : bmi < 25 ? 1 : bmi < 30 ? 2 : 3;
}

function Arrow({ back = false, down = false, color }: { back?: boolean; down?: boolean; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" style={{ transform: [{ rotate: down ? '90deg' : back ? '180deg' : '0deg' }] }}>
      <Path d="M5 12h14m-6-6 6 6-6 6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function MeasurementMark({ height }: { height?: boolean }) {
  const colors = useColors();
  return (
    <Svg width={24} height={28} viewBox="0 0 24 28">
      {height ? <>
        <Rect x="6" y="2" width="12" height="24" rx="2" stroke={colors.inkSoft} strokeWidth="1.4" fill="none" />
        {[6, 10, 14, 18, 22].map((y, i) => <Line key={y} x1="6" y1={y} x2={i % 2 ? 11 : 14} y2={y} stroke={colors.inkSoft} strokeWidth="1.3" />)}
      </> : <>
        <Rect x="2" y="5" width="20" height="20" rx="5" stroke={colors.inkSoft} strokeWidth="1.4" fill="none" />
        <Path d="M6 13a6 6 0 0 1 12 0Z" stroke={colors.inkSoft} strokeWidth="1.3" fill="none" />
        <Path d="m12 13 3-4" stroke={colors.secondary} strokeWidth="1.7" strokeLinecap="round" />
      </>}
    </Svg>
  );
}

function ResultNumber({ value }: { value: number }) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const fontSize = (width < 350 ? 76 : 108) * (value >= 100 ? 0.75 : 1);
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reducedMotion) { setDisplay(value); return; }
    let frame = 0;
    const started = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - started) / 700);
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, value]);
  return <Text numberOfLines={1} adjustsFontSizeToFit accessibilityLabel={`BMI ${value.toFixed(1)}`} style={[styles.resultNumber, { fontSize, lineHeight: fontSize + 10 }]}>{display.toFixed(1)}</Text>;
}

function RangeExplorer({ bmi }: { bmi: number }) {
  const styles = useStyles();
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const actual = rangeIndex(bmi);
  const [selected, setSelected] = useState(actual);
  const [width, setWidth] = useState(0);
  const markerX = useSharedValue(0);
  const fraction = Math.max(0, Math.min(1, (bmi - 15) / 25));
  useEffect(() => { setSelected(actual); }, [actual]);
  useEffect(() => {
    markerX.value = withTiming(fraction * width, { duration: reducedMotion ? 0 : 700, easing: motion.ease });
  }, [fraction, markerX, reducedMotion, width]);
  const markerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: markerX.value }] }));
  const detail = RANGES[selected];

  return (
    <View style={styles.explorer}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionLabel}>THE ADULT RANGES</Text>
        <Text style={styles.smallHint}>Tap a colour to explore</Text>
      </View>
      <View style={styles.spectrum} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {RANGES.map((range, index) => (
          <Pressable key={range.name} onPress={() => setSelected(index)} accessibilityRole="button"
            accessibilityLabel={`${range.name}, ${range.interval}`} accessibilityState={{ selected: selected === index }}
            style={[styles.spectrumSegment, { flex: range.span, opacity: selected === index ? 1 : 0.48 }]}>
            {Array.from({ length: Math.round(range.span * 2) }).map((_, tick) => (
              <View key={tick} style={[styles.spectrumTick, { backgroundColor: range.color }]} />
            ))}
          </Pressable>
        ))}
        <Animated.View pointerEvents="none" style={[styles.spectrumMarker, markerStyle]}>
          <View style={[styles.markerDot, { backgroundColor: colors.ink }]} />
          <View style={[styles.markerStem, { backgroundColor: colors.ink }]} />
        </Animated.View>
      </View>
      <View style={styles.spectrumLabels}>
        {[{ text: '15', x: 0 }, { text: '18.5', x: 14 }, { text: '25', x: 40 }, { text: '30', x: 60 }, { text: '40+', x: 100 }].map(({ text, x }) => (
          <Text key={text} style={[styles.spectrumLabel, { left: `${x}%`, marginLeft: x === 0 ? 0 : x === 100 ? -26 : -13 }]}>{text}</Text>
        ))}
      </View>
      <Animated.View key={selected} entering={reducedMotion ? undefined : FadeIn.duration(180)} style={styles.rangeDetail}>
        <View style={styles.rangeDetailHeading}>
          <View style={[styles.rangeDot, { backgroundColor: detail.color }]} />
          <Text style={styles.rangeName}>{detail.name}</Text>
          <Text style={styles.rangeInterval}>{detail.interval}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function BmiScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { personalization, savePersonalization } = useStore();
  const { heightCm, weightKg, age } = personalization;
  const bmi = calculateBmi(heightCm, weightKg);
  const isAdult = age != null && age >= 20;
  const category = bmi == null ? null : RANGES[rangeIndex(bmi)];
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<'height' | 'weight' | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const entering = reducedMotion ? undefined : FadeInDown.duration(400);
  const heightInches = Math.round((heightCm ?? 0) / 2.54);
  const heightLabel = heightCm == null ? 'Add height' : personalization.heightUnit === 'cm'
    ? `${Number(heightCm.toFixed(1))} cm` : `${Math.floor(heightInches / 12)}′ ${heightInches % 12}″`;
  const weightLabel = weightKg == null ? 'Add weight' : personalization.weightUnit === 'kg'
    ? `${Number(weightKg.toFixed(1))} kg` : `${(weightKg / 0.45359237).toFixed(1)} lb`;
  const editUnit = editing === 'height' ? (personalization.heightUnit === 'cm' ? 'cm' : 'in') : personalization.weightUnit;
  const minimum = editing === 'height' ? (editUnit === 'cm' ? 130 : 51) : (editUnit === 'kg' ? 35 : 77);
  const maximum = editing === 'height' ? (editUnit === 'cm' ? 220 : 88) : (editUnit === 'kg' ? 200 : 440);

  const editMeasurement = (field: 'height' | 'weight') => {
    const initial = field === 'height'
      ? (heightCm ?? 170) / (personalization.heightUnit === 'cm' ? 1 : 2.54)
      : (weightKg ?? 70) / (personalization.weightUnit === 'kg' ? 1 : 0.45359237);
    setDraft(String(Number(initial.toFixed(1))));
    setError('');
    setEditing(field);
  };
  const saveMeasurement = () => {
    const number = Number(draft);
    if (!draft.trim() || !Number.isFinite(number) || number < minimum || number > maximum) {
      setError(`Enter ${minimum}–${maximum} ${editUnit}.`);
      return;
    }
    const converted = number * (editing === 'height' ? (editUnit === 'cm' ? 1 : 2.54) : (editUnit === 'kg' ? 1 : 0.45359237));
    savePersonalization({ ...personalization, [editing === 'height' ? 'heightCm' : 'weightKg']: Math.round(converted * 10) / 10 });
    setEditing(null);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
          <Arrow back color={colors.ink} />
        </PressableScale>
        <View style={styles.navProgress}>
          {Array.from({ length: 8 }).map((_, index) => <View key={index} style={[styles.progressBit, index < 7 && styles.progressActive]} />)}
        </View>
        <Text style={styles.step}>07 <Text style={styles.stepTotal}>/ 08</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={entering}>
          <Text style={styles.title}>Your BMI.</Text>
        </Animated.View>

        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).duration(450)} style={styles.result}>
          <View style={styles.resultHeading}>
            <Text style={styles.resultLabel}>BODY MASS INDEX</Text>
            <Text style={styles.resultUnit}>kg / m²</Text>
          </View>
          {bmi != null ? <>
            <View style={styles.numberRow}>
              <ResultNumber value={bmi} />
              <View style={styles.resultAnnotation}>
                <View style={[styles.annotationLine, { backgroundColor: isAdult ? category!.color : colors.inkFaint }]} />
                <Text style={styles.annotationText}>{isAdult ? category!.name.replace(' ', '\n') : 'Your\nmeasurement'}</Text>
              </View>
            </View>
          </> : <>
            <Text style={styles.emptyNumber}>—.—</Text>
            <Text style={styles.emptyTitle}>Add your measurements</Text>
            <Text style={styles.resultContext}>Height and weight unlock your BMI. Both are optional.</Text>
          </>}
        </Animated.View>

        {bmi != null && isAdult && <RangeExplorer bmi={bmi} />}
        {bmi != null && !isAdult && (
          <View style={styles.ageContext}>
            <Text style={styles.rangeDescription}>{age == null
              ? 'Add your age for range guidance.'
              : 'Under 20? BMI needs age- and sex-based interpretation.'}</Text>
          </View>
        )}

        <View style={styles.measurements}>
          <Text style={styles.sectionLabel}>YOUR MEASUREMENTS</Text>
          <View style={styles.measurementRow}>
            <PressableScale onPress={() => editMeasurement('height')} style={styles.measurement} accessibilityLabel={`Edit height, ${heightLabel}`}>
              <MeasurementMark height />
              <View style={styles.measurementText}><Text style={styles.measurementLabel}>Height</Text><Text style={[styles.measurementValue, width < 350 && { fontSize: 16 }]}>{heightLabel}</Text></View>
            </PressableScale>
            <View style={styles.measurementDivider} />
            <PressableScale onPress={() => editMeasurement('weight')} style={styles.measurement} accessibilityLabel={`Edit weight, ${weightLabel}`}>
              <MeasurementMark />
              <View style={styles.measurementText}><Text style={styles.measurementLabel}>Weight</Text><Text style={[styles.measurementValue, width < 350 && { fontSize: 16 }]}>{weightLabel}</Text></View>
            </PressableScale>
          </View>
          <Text style={styles.measurementHint}>Tap to update.</Text>
        </View>

        <Animated.View layout={reducedMotion ? undefined : LinearTransition.duration(200)} style={styles.more}>
          <Pressable onPress={() => setExpanded(current => !current)} accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel="What does BMI tell me?" style={styles.moreButton}>
            <Text style={styles.moreTitle}>What does BMI tell me?</Text>
            <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}><Arrow down color={colors.inkSoft} /></View>
          </Pressable>
          {expanded && <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(200)}>
            <Text style={styles.moreBody}>BMI compares weight with height. It does not separate muscle, fat and bone, or describe your health on its own.</Text>
            {isAdult && category && <Text style={[styles.moreBody, { marginTop: 10 }]}>{category.description}</Text>}
            {bmi != null && <Text style={styles.formula}>{Number(weightKg!.toFixed(1))} kg ÷ ({Number((heightCm! / 100).toFixed(3))} m)² = {bmi.toFixed(1)}</Text>}
            <Pressable onPress={() => Linking.openURL('https://www.cdc.gov/bmi/about/index.html').catch(() => {})} accessibilityRole="link"><Text style={styles.sourceLink}>Read the CDC guide ↗</Text></Pressable>
          </Animated.View>}
          <Text style={styles.note}>A screening estimate, not a diagnosis.</Text>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button title="Set my daily targets" onPress={() => router.push({ pathname: '/setup/goals', params: { flow: 'personalization', source } } as never)} />
      </View>

      <Modal visible={editing != null} transparent animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditing(null)} accessibilityLabel="Dismiss measurement editor" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Update your {editing}</Text>
            <Text style={styles.sheetDescription}>Your BMI updates when you save.</Text>
            <View style={styles.inputRow}>
              <TextInput autoFocus selectTextOnFocus keyboardType="decimal-pad" returnKeyType="done" value={draft}
                onChangeText={(text) => { setDraft(text.replace(/[^0-9.]/g, '').slice(0, 6)); setError(''); }}
                onSubmitEditing={saveMeasurement} style={styles.input} accessibilityLabel={`New ${editing} in ${editUnit}`} />
              <Text style={styles.inputUnit}>{editUnit}</Text>
            </View>
            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Button title="Save measurement" onPress={saveMeasurement} />
            <Pressable onPress={() => setEditing(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  nav: { paddingHorizontal: 22, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 20 },
  back: { width: 42, height: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  navProgress: { flex: 1, flexDirection: 'row', gap: 4 },
  progressBit: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.line },
  progressActive: { backgroundColor: colors.secondary },
  step: { fontFamily: font.bold, fontSize: 12, color: colors.ink },
  stepTotal: { color: colors.inkFaint, fontFamily: font.medium },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 22 },
  eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.9, color: colors.secondary },
  title: { fontFamily: font.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -1.1, color: colors.ink, marginTop: 8 },
  subtitle: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.inkSoft, marginTop: 5 },
  result: { paddingTop: 24, paddingBottom: 20 },
  resultHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultLabel: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.4, color: colors.inkSoft },
  resultUnit: { fontFamily: font.medium, fontSize: 11, color: colors.inkFaint },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  resultNumber: { flexShrink: 1, fontFamily: font.light, fontSize: 108, lineHeight: 118, letterSpacing: -7, color: colors.ink, fontVariant: ['tabular-nums'] },
  resultAnnotation: { flex: 1, minWidth: 62, gap: 8 },
  annotationLine: { width: 30, height: 3, borderRadius: 2 },
  annotationText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 18, color: colors.ink },
  resultContext: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft, marginTop: 0 },
  explorer: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionLabel: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.2, color: colors.inkSoft },
  smallHint: { fontFamily: font.regular, fontSize: 10, color: colors.inkSoft },
  spectrum: { height: 68, flexDirection: 'row', marginTop: 15 },
  spectrumSegment: { flexDirection: 'row', gap: 2, paddingHorizontal: 1, paddingTop: 12, paddingBottom: 4 },
  spectrumTick: { flex: 1, borderRadius: 3 },
  spectrumMarker: { position: 'absolute', left: -1, top: 2, alignItems: 'center', width: 2 },
  markerDot: { width: 8, height: 8, borderRadius: 4 },
  markerStem: { width: 2, height: 60, borderRadius: 1 },
  spectrumLabels: { height: 21, marginTop: 3 },
  spectrumLabel: { position: 'absolute', width: 26, fontFamily: font.medium, fontSize: 9, color: colors.inkSoft, textAlign: 'center' },
  rangeDetail: { minHeight: 42, paddingTop: 9, paddingBottom: 14 },
  rangeDetailHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rangeDot: { width: 6, height: 6, borderRadius: 3 },
  rangeName: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  rangeInterval: { marginLeft: 'auto', fontFamily: font.medium, fontSize: 11, color: colors.inkSoft },
  rangeDescription: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft, marginTop: 7 },
  measurements: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 },
  measurementRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  measurement: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 48 },
  measurementText: { flex: 1 },
  measurementLabel: { fontFamily: font.regular, fontSize: 11, color: colors.inkSoft },
  measurementValue: { fontFamily: font.bold, fontSize: 19, lineHeight: 24, color: colors.ink },
  measurementDivider: { height: 35, width: 1, backgroundColor: colors.line, marginHorizontal: 18 },
  measurementHint: { fontFamily: font.regular, fontSize: 10, color: colors.inkFaint, marginTop: 10 },
  more: { marginTop: 16 },
  moreButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moreTitle: { fontFamily: font.semibold, fontSize: 12, color: colors.inkSoft },
  moreBody: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  formula: { fontFamily: font.semibold, fontSize: 13, color: colors.ink, marginTop: 12 },
  sourceLink: { fontFamily: font.semibold, fontSize: 12, color: colors.secondary, paddingVertical: 14 },
  note: { fontFamily: font.regular, fontSize: 10, color: colors.inkFaint, marginTop: 3, marginBottom: 4 },
  footer: { paddingHorizontal: 22, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  ageContext: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 20 },
  emptyNumber: { fontFamily: font.light, fontSize: 90, lineHeight: 110, letterSpacing: -6, color: colors.inkFaint },
  emptyTitle: { fontFamily: font.semibold, fontSize: 17, lineHeight: 24, color: colors.ink, marginTop: 4, marginBottom: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,20,20,0.4)' },
  sheet: { paddingHorizontal: 24, paddingTop: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.card },
  sheetHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 22 },
  sheetTitle: { fontFamily: font.bold, fontSize: 24, color: colors.ink },
  sheetDescription: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginVertical: 22 },
  input: { minWidth: 130, fontFamily: font.bold, fontSize: 48, color: colors.ink, textAlign: 'center', padding: 4, borderBottomWidth: 2, borderBottomColor: colors.secondary },
  inputUnit: { fontFamily: font.semibold, fontSize: 16, color: colors.inkSoft },
  error: { fontFamily: font.medium, fontSize: 12, color: colors.danger, marginBottom: 14, textAlign: 'center' },
  cancel: { padding: 15, alignItems: 'center' },
  cancelText: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
}));
