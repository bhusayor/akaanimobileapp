import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, Check, RefreshCcw, ScanLine, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedBlock, LockedText, UnlockRow } from '../components/Locked';
import { SuccessModal } from '../components/modals';
import { Button, Chip, PressableScale } from '../components/ui';
import { currentMealType, MEALS } from '../data/meals';
import { LoggedMeal, todayKey, useStore } from '../lib/store';
import { useEntitlement } from '../lib/subscription';
import { font, radius, shadow, themedStyles, useColors } from '../theme';

const { width: W } = Dimensions.get('window');
const FRAME = W * 0.78;

type ScanResult = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealId?: string;
  source: 'akaani' | 'estimate';
};

/**
 * Simulated recognizer — stands in for a real vision API.
 * Alternates between dishes from the Akaani database (exact macros)
 * and common Nigerian foods outside it (typical serving estimates).
 */
const ESTIMATED_FOODS: Omit<ScanResult, 'source'>[] = [
  { name: 'Meat Pie', calories: 385, protein: 11, carbs: 38, fat: 21, fiber: 2 },
  { name: 'Chicken Shawarma', calories: 460, protein: 28, carbs: 42, fat: 19, fiber: 4 },
  { name: 'Puff Puff (4 pieces)', calories: 340, protein: 6, carbs: 52, fat: 12, fiber: 2 },
  { name: 'Boli & Groundnut', calories: 410, protein: 12, carbs: 58, fat: 15, fiber: 5 },
  { name: 'Chin Chin (1 cup)', calories: 320, protein: 5, carbs: 44, fat: 14, fiber: 1 },
];

let scanCounter = 0;
function recognizeMeal(): ScanResult {
  scanCounter++;
  if (scanCounter % 2 === 1) {
    const m = MEALS[(scanCounter * 5) % MEALS.length];
    return {
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      fiber: m.fiber,
      mealId: m.id,
      source: 'akaani',
    };
  }
  const f = ESTIMATED_FOODS[(scanCounter >> 1) % ESTIMATED_FOODS.length];
  return { ...f, source: 'estimate' };
}

const MEAL_TYPES: LoggedMeal['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

function ScanFrame() {
  const styles = useStyles();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [y]);
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * (FRAME - 4) }] }));
  return (
    <View style={styles.frame} pointerEvents="none">
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <View key={corner} style={[styles.corner, styles[`corner_${corner}`]]} />
      ))}
      <Animated.View style={[styles.scanLine, lineStyle]} />
    </View>
  );
}

export default function ScanScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addLog } = useStore();
  const { premium } = useEntitlement();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [mealType, setMealType] = useState<LoggedMeal['mealType']>(currentMealType());
  const [logged, setLogged] = useState(false);

  const capture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
      if (!photo?.uri) return;
      setPhotoUri(photo.uri);
      setAnalyzing(true);
      setTimeout(() => {
        setResult(recognizeMeal());
        setAnalyzing(false);
      }, 2200);
    } catch {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setPhotoUri(null);
    setResult(null);
    setAnalyzing(false);
  };

  const logIt = () => {
    if (!result) return;
    addLog({
      mealId: result.mealId,
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      mealType,
      date: todayKey(),
    });
    setLogged(true);
  };

  /* ---- permission gate ---- */
  if (!permission?.granted) {
    return (
      <View style={[styles.gate, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <PressableScale onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <View style={styles.gateBody}>
          <View style={styles.gateIcon}>
            <Camera size={34} color={colors.secondary} strokeWidth={2} />
          </View>
          <Text style={styles.gateTitle}>Scan your plate</Text>
          <Text style={styles.gateText}>
            Point your camera at any meal and Akaani will name it and estimate the calories, protein,
            carbs and fat — ready to log in one tap.
          </Text>
          <Button
            title={permission?.canAskAgain === false ? 'Enable camera in Settings' : 'Allow camera access'}
            onPress={() => requestPermission()}
            style={{ alignSelf: 'stretch', marginTop: 28 }}
          />
        </View>
      </View>
    );
  }

  /* ---- result / analyzing ---- */
  if (photoUri) {
    return (
      <View style={{ flex: 1, backgroundColor: '#001414' }}>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} contentFit="cover" />
        <View style={styles.photoScrim} />
        <PressableScale onPress={() => (analyzing ? null : reset())} style={[styles.closeBtnFloat, { top: insets.top + 10 }]}>
          <X size={22} color="#FFFFFF" strokeWidth={2.4} />
        </PressableScale>

        {analyzing ? (
          <Animated.View entering={FadeIn} style={styles.analyzeWrap}>
            <ActivityIndicator size="large" color="#F08A1D" />
            <Text style={styles.analyzeTitle}>Reading your plate…</Text>
            <Text style={styles.analyzeSub}>Checking the Akaani kitchen first</Text>
          </Animated.View>
        ) : result ? (
          <Animated.View entering={FadeInDown.duration(350)} style={[styles.resultSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.sourceBadge, result.source === 'akaani' ? styles.sourceAkaani : styles.sourceEstimate]}>
              <Text style={styles.sourceBadgeText}>
                {result.source === 'akaani' ? '✓ FROM THE AKAANI KITCHEN' : '≈ AI ESTIMATE · TYPICAL SERVING'}
              </Text>
            </View>
            <Text style={styles.resultName}>{result.name}</Text>
            <LockedBlock radius={radius.md} style={styles.resultMacros}>
              {[
                { label: 'Kcal', value: result.calories, color: colors.macroCalories },
                { label: 'Protein', value: `${result.protein}g`, color: colors.macroProtein },
                { label: 'Carbs', value: `${result.carbs}g`, color: colors.macroCarbs },
                { label: 'Fat', value: `${result.fat}g`, color: colors.macroFat },
              ].map((m) => (
                <View key={m.label} style={styles.resultMacroCell}>
                  <View style={[styles.resultMacroDot, { backgroundColor: m.color }]} />
                  <LockedText style={styles.resultMacroValue}>{String(m.value)}</LockedText>
                  <Text style={styles.resultMacroLabel}>{m.label}</Text>
                </View>
              ))}
            </LockedBlock>
            <UnlockRow label="Subscribe to see what this plate is worth" style={{ marginTop: 14 }} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {MEAL_TYPES.map((t) => (
                <Chip key={t} small label={t[0].toUpperCase() + t.slice(1)} active={mealType === t} onPress={() => setMealType(t)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <PressableScale onPress={reset} style={styles.rescanBtn} scaleTo={0.92}>
                <RefreshCcw size={18} color={colors.ink} strokeWidth={2.2} />
              </PressableScale>
              <Button
                title="Log this meal"
                onPress={logIt}
                icon={<Check size={18} color={colors.onPrimary} strokeWidth={2.6} />}
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        ) : null}

        <SuccessModal
          visible={logged}
          title="Meal logged!"
          message={
            result
              ? premium
                ? `${result.name} — ${result.calories} kcal added to today.`
                : `${result.name} added to today.`
              : undefined
          }
          buttonLabel="Back to Track"
          onClose={() => {
            setLogged(false);
            router.back();
          }}
        />
      </View>
    );
  }

  /* ---- live camera ---- */
  return (
    <View style={{ flex: 1, backgroundColor: '#001414' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      <View style={styles.cameraOverlay} pointerEvents="box-none">
        <PressableScale onPress={() => router.back()} style={[styles.closeBtnFloat, { top: insets.top + 10 }]}>
          <X size={22} color="#FFFFFF" strokeWidth={2.4} />
        </PressableScale>
        <View style={styles.frameWrap} pointerEvents="none">
          <ScanFrame />
          <View style={styles.hintPill}>
            <ScanLine size={14} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.hintText}>Centre your plate in the frame</Text>
          </View>
        </View>
        <View style={[styles.shutterRow, { paddingBottom: insets.bottom + 26 }]}>
          <PressableScale onPress={capture} style={styles.shutter} scaleTo={0.88}>
            <View style={styles.shutterInner} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  gate: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  gateIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  gateTitle: { fontFamily: font.extrabold, fontSize: 28, color: colors.ink, letterSpacing: -0.7 },
  gateText: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 12,
  },
  cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  closeBtnFloat: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: 42, height: 42, borderColor: '#FFFFFF', borderWidth: 0 },
  corner_tl: { top: 0, left: 0, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: 22 },
  corner_tr: { top: 0, right: 0, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: 22 },
  corner_bl: { bottom: 0, left: 0, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: 22 },
  corner_br: { bottom: 0, right: 0, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: 22 },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F08A1D',
    shadowColor: '#F08A1D',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  hintText: { fontFamily: font.medium, fontSize: 13, color: '#FFFFFF' },
  shutterRow: { alignItems: 'center' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
  photoScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 16, 16, 0.35)',
  },
  analyzeWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  analyzeTitle: { fontFamily: font.bold, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.4 },
  analyzeSub: { fontFamily: font.regular, fontSize: 13.5, color: 'rgba(255,255,255,0.75)' },
  resultSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    ...shadow.float,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  sourceAkaani: { backgroundColor: colors.primarySoft },
  sourceEstimate: { backgroundColor: colors.secondarySoft },
  sourceBadgeText: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2, color: colors.ink },
  resultName: { fontFamily: font.extrabold, fontSize: 26, color: colors.ink, letterSpacing: -0.6, marginTop: 10 },
  resultMacros: {
    flexDirection: 'row',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: 16,
  },
  resultMacroCell: { flex: 1, alignItems: 'center', gap: 3 },
  resultMacroDot: { width: 6, height: 6, borderRadius: 3 },
  resultMacroValue: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  resultMacroLabel: { fontFamily: font.regular, fontSize: 11, color: colors.inkFaint },
  rescanBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
}));
