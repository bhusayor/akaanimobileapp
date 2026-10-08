import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AlertCircle, Camera, ImageIcon, RefreshCcw, ScanLine, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanMealPhoto, ScanError, scanMode } from '../api/scan';
import { Button, PressableScale } from '../components/ui';
import { setScanSession } from '../lib/scan-session';
import { useStore } from '../lib/store';
import { font, radius, themedStyles, useColors } from '../theme';

const { width: W } = Dimensions.get('window');
const FRAME = W * 0.78;

/** Shown in turn while the photo is analysed, so a slow call never looks stuck. */
const ANALYZE_STEPS = ['Reading your plate…', 'Checking the Akaani kitchen…', 'Working out the nutrition…'];

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
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const { signOut } = useStore();

  const analyzing = photoUri != null && error == null;

  // Cycle the status line while a scan is in flight.
  useEffect(() => {
    if (!analyzing) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, ANALYZE_STEPS.length - 1)), 1400);
    return () => clearInterval(id);
  }, [analyzing]);

  // Leaving the screen mid-scan cancels the request.
  useEffect(() => () => abortRef.current?.abort(), []);

  const analyze = async (uri: string, base64: string | null | undefined) => {
    setPhotoUri(uri);
    setError(null);
    if (!base64) {
      setError("We couldn't read that photo. Try taking it again.");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await scanMealPhoto(base64, controller.signal);
      if (controller.signal.aborted) return;
      setScanSession({ photoUri: uri, result });
      router.replace('/scan-review');
    } catch (err) {
      if (controller.signal.aborted) return;
      setSessionExpired(err instanceof ScanError && err.code === 'session_expired');
      setError(err instanceof ScanError ? err.message : 'Something went wrong reading your plate. Please try again.');
    }
  };

  const capture = async () => {
    if (!cameraReady) return;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.4, base64: true });
      if (photo?.uri) analyze(photo.uri, photo.base64);
    } catch {
      setError("The camera didn't take that photo. Please try again.");
    }
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.4,
    });
    const asset = res.canceled ? null : res.assets[0];
    if (asset) analyze(asset.uri, asset.base64);
  };

  const reset = () => {
    abortRef.current?.abort();
    setPhotoUri(null);
    setError(null);
  };

  /* ---- permission gate ---- */
  if (!permission?.granted && !photoUri) {
    return (
      <View style={[styles.gate, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <PressableScale onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={colors.ink} strokeWidth={2.4} />
        </PressableScale>
        <View style={styles.gateBody}>
          <View style={styles.gateIcon}>
            <Camera size={34} color={colors.secondary} strokeWidth={2} />
          </View>
          <Text style={styles.gateTitle}>Scan your meal</Text>
          <Text style={styles.gateText}>
            Take a photo of your food and Akaani will name it and estimate the calories, protein,
            carbs and fat. You review everything before it goes into Track.
          </Text>
          <Button
            title={permission?.canAskAgain === false ? 'Enable camera in Settings' : 'Allow camera access'}
            onPress={() => requestPermission()}
            style={{ alignSelf: 'stretch', marginTop: 28 }}
          />
          <Button
            title="Choose a photo instead"
            variant="ghost"
            onPress={pickFromLibrary}
            style={{ alignSelf: 'stretch', marginTop: 12 }}
          />
        </View>
      </View>
    );
  }

  /* ---- analyzing / error ---- */
  if (photoUri) {
    return (
      <View style={{ flex: 1, backgroundColor: '#001414' }}>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} contentFit="cover" />
        <View style={styles.photoScrim} />
        <PressableScale onPress={reset} style={[styles.closeBtnFloat, { top: insets.top + 10 }]}>
          <X size={22} color="#FFFFFF" strokeWidth={2.4} />
        </PressableScale>

        {error ? (
          <Animated.View entering={FadeIn} style={[styles.errorSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.errorIcon}>
              <AlertCircle size={24} color={colors.secondary} strokeWidth={2.2} />
            </View>
            <Text style={styles.errorTitle}>{"Couldn't scan that"}</Text>
            <Text style={styles.errorText}>{error}</Text>
            {sessionExpired ? (
              <Button
                title="Sign in again"
                onPress={() => {
                  signOut();
                  router.replace('/(auth)/login');
                }}
                style={{ alignSelf: 'stretch', marginTop: 18 }}
              />
            ) : (
              <Button
                title="Try again"
                onPress={reset}
                icon={<RefreshCcw size={17} color={colors.onPrimary} strokeWidth={2.4} />}
                style={{ alignSelf: 'stretch', marginTop: 18 }}
              />
            )}
            <Button
              title="Log it by hand"
              variant="ghost"
              onPress={() => router.back()}
              style={{ alignSelf: 'stretch', marginTop: 10 }}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn} style={styles.analyzeWrap}>
            <ActivityIndicator size="large" color="#F08A1D" />
            <Animated.Text key={step} entering={FadeIn.duration(250)} style={styles.analyzeTitle}>
              {ANALYZE_STEPS[step]}
            </Animated.Text>
            <Text style={styles.analyzeSub}>{"You'll review it before anything is tracked"}</Text>
          </Animated.View>
        )}
      </View>
    );
  }

  /* ---- live camera ---- */
  return (
    <View style={{ flex: 1, backgroundColor: '#001414' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
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
          {__DEV__ && scanMode === 'demo' && (
            <Text style={styles.devNote}>Demo recogniser — see src/api/scan.ts to connect a real one</Text>
          )}
        </View>
        <View style={[styles.shutterRow, { paddingBottom: insets.bottom + 26 }]}>
          <PressableScale onPress={pickFromLibrary} style={styles.sideBtn} scaleTo={0.9}>
            <ImageIcon size={22} color="#FFFFFF" strokeWidth={2.2} />
          </PressableScale>
          <PressableScale
            onPress={capture}
            disabled={!cameraReady}
            style={[styles.shutter, !cameraReady && { opacity: 0.5 }]}
            scaleTo={0.88}
          >
            <View style={styles.shutterInner} />
          </PressableScale>
          <View style={styles.sideBtnSpacer} />
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
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnSpacer: { width: 52 },
  devNote: { fontFamily: font.medium, fontSize: 11.5, color: 'rgba(255,255,255,0.7)', paddingHorizontal: 32, textAlign: 'center' },
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
  errorSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
  },
  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: { fontFamily: font.bold, fontSize: 20, color: colors.ink, letterSpacing: -0.4, marginTop: 12 },
  errorText: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21, color: colors.inkSoft, textAlign: 'center', marginTop: 6 },
}));
