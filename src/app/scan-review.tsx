import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, Check, Minus, Pencil, Plus, Search, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lookupMealByName, ScanError, type ScanResult } from '../api/scan';
import { LockedBlock, LockedText, UnlockRow } from '../components/Locked';
import { LuMascot } from '../components/LuMascot';
import { SuccessModal } from '../components/modals';
import { Button, Chip, PressableScale } from '../components/ui';
import { currentMealType } from '../data/meals';
import { luMealInsights, portionLabel, type LuInsight } from '../lib/lu-meal-insight';
import { getScanSession } from '../lib/scan-session';
import { LoggedMeal, logsForDate, todayKey, totalsFor, useStore } from '../lib/store';
import { useEntitlement } from '../lib/subscription';
import { font, radius, shadow, themedStyles, useColors } from '../theme';

const MEAL_TYPES: LoggedMeal['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MIN_PORTION = 0.25;
const MAX_PORTION = 4;
const HERO = 300;

export default function ScanReviewScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addLog, logs, goals, personalization } = useStore();
  const { premium } = useEntitlement();

  const session = useMemo(getScanSession, []);
  const [result, setResult] = useState<ScanResult | undefined>(session?.result);
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState<LoggedMeal['mealType']>(currentMealType());
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  // Opened without a scan behind it (deep link, reload) — back to the camera.
  useEffect(() => {
    if (!session) router.replace('/scan');
  }, [session, router]);

  const scaled = useMemo(() => {
    if (!result) return null;
    const at = (n: number) => Math.round(n * portion);
    return {
      calories: at(result.calories),
      protein: at(result.protein),
      carbs: at(result.carbs),
      fat: at(result.fat),
      fiber: at(result.fiber),
    };
  }, [result, portion]);

  const caloriesToday = useMemo(() => totalsFor(logsForDate(logs, todayKey())).calories, [logs]);

  const insights = useMemo<LuInsight[]>(
    () =>
      scaled
        ? luMealInsights({
            meal: scaled,
            portion,
            goals,
            wellnessGoals: personalization.wellnessGoals,
            caloriesToday,
            premium,
          })
        : [],
    [scaled, portion, goals, personalization.wellnessGoals, caloriesToday, premium]
  );

  if (!session || !result || !scaled) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const startEditing = () => {
    setDraftName(result.name);
    setLookupError(null);
    setEditing(true);
  };

  const lookUp = async () => {
    const name = draftName.trim();
    if (!name || lookingUp) return;
    if (name.toLowerCase() === result.name.toLowerCase()) {
      setEditing(false);
      return;
    }
    setLookingUp(true);
    setLookupError(null);
    try {
      const next = await lookupMealByName(name);
      setResult({ ...next, components: next.components.length ? next.components : result.components });
      setPortion(1);
      setEditing(false);
    } catch (err) {
      setLookupError(err instanceof ScanError ? err.message : "Couldn't look that up. Please try again.");
    } finally {
      setLookingUp(false);
    }
  };

  const stepPortion = (delta: number) =>
    setPortion((p) => Math.max(MIN_PORTION, Math.min(MAX_PORTION, Math.round((p + delta) * 4) / 4)));

  const addToTrack = () => {
    addLog({
      mealId: result.mealId,
      name: portion === 1 ? result.name : `${result.name} · ${portionLabel(portion)}`,
      ...scaled,
      mealType,
      date: todayKey(),
    });
    setLogged(true);
  };

  const fromAkaani = result.source === 'akaani';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* The photo they took, so they can check it against what we found. */}
        <View style={{ height: HERO }}>
          <Image source={{ uri: session.photoUri }} style={{ flex: 1 }} contentFit="cover" />
          <View style={styles.heroScrim} />
        </View>

        <Animated.View entering={FadeInDown.duration(350)} style={styles.sheet}>
          <View style={[styles.sourceBadge, fromAkaani ? styles.sourceAkaani : styles.sourceEstimate]}>
            <Text style={styles.sourceBadgeText}>
              {fromAkaani ? '✓ FROM THE AKAANI KITCHEN' : '≈ AI ESTIMATE'}
            </Text>
          </View>

          {/* Name — tap to correct it if we got the dish wrong. */}
          {editing ? (
            <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 12 }}>
              <Text style={styles.fieldLabel}>What is it?</Text>
              <View style={styles.nameEditRow}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={lookUp}
                  placeholder="e.g. Jollof rice and chicken"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.nameInput}
                />
                <PressableScale onPress={lookUp} style={styles.lookupBtn} scaleTo={0.9} disabled={lookingUp}>
                  {lookingUp ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Search size={18} color={colors.onPrimary} strokeWidth={2.4} />
                  )}
                </PressableScale>
                <PressableScale onPress={() => setEditing(false)} style={styles.cancelBtn} scaleTo={0.9}>
                  <X size={18} color={colors.ink} strokeWidth={2.4} />
                </PressableScale>
              </View>
              {lookupError && <Text style={styles.lookupError}>{lookupError}</Text>}
            </Animated.View>
          ) : (
            <PressableScale onPress={startEditing} scaleTo={0.98} style={styles.nameRow}>
              <Text style={styles.name}>{result.name}</Text>
              <View style={styles.editPill}>
                <Pencil size={12} color={colors.primary} strokeWidth={2.4} />
                <Text style={styles.editPillText}>Not right?</Text>
              </View>
            </PressableScale>
          )}

          <Text style={styles.sourceNote}>
            {fromAkaani
              ? 'Nutrition from the Akaani kitchen, per serving.'
              : `Not in the Akaani kitchen yet, so this is estimated from ${
                  result.confidence ? 'your photo' : 'the name'
                }. Check the portion before adding it.`}
            {result.confidence === 'low' && ' We weren\'t very sure about this one.'}
          </Text>

          {result.components.length > 0 && (
            <View style={styles.componentRow}>
              {result.components.slice(0, 6).map((c) => (
                <View key={c} style={styles.component}>
                  <Text style={styles.componentText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          {result.demo && (
            <View style={styles.demoBanner}>
              <Text style={styles.demoText}>
                Demo result. Connect the scan service (see src/api/scan.ts) to recognise real photos.
              </Text>
            </View>
          )}

          {/* Portion */}
          <View style={styles.portionCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.portionLabel}>Portion</Text>
              <Text style={styles.portionSub}>1 serving = {result.servingLabel}</Text>
            </View>
            <PressableScale
              onPress={() => stepPortion(-0.25)}
              disabled={portion <= MIN_PORTION}
              scaleTo={0.88}
              style={[styles.stepBtn, portion <= MIN_PORTION && { opacity: 0.35 }]}
            >
              <Minus size={17} color={colors.ink} strokeWidth={2.6} />
            </PressableScale>
            <Text style={styles.portionValue}>{portionLabel(portion)}</Text>
            <PressableScale
              onPress={() => stepPortion(0.25)}
              disabled={portion >= MAX_PORTION}
              scaleTo={0.88}
              style={[styles.stepBtn, portion >= MAX_PORTION && { opacity: 0.35 }]}
            >
              <Plus size={17} color={colors.ink} strokeWidth={2.6} />
            </PressableScale>
          </View>

          {/* Macros */}
          <LockedBlock radius={radius.md} style={styles.macros}>
            {[
              { label: 'Kcal', value: `${scaled.calories}`, color: colors.macroCalories },
              { label: 'Protein', value: `${scaled.protein}g`, color: colors.macroProtein },
              { label: 'Carbs', value: `${scaled.carbs}g`, color: colors.macroCarbs },
              { label: 'Fat', value: `${scaled.fat}g`, color: colors.macroFat },
              { label: 'Fibre', value: `${scaled.fiber}g`, color: colors.macroFibre },
            ].map((m) => (
              <View key={m.label} style={styles.macroCell}>
                <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                <LockedText style={styles.macroValue}>{m.value}</LockedText>
                <Text style={styles.macroLabel}>{m.label}</Text>
              </View>
            ))}
          </LockedBlock>
          <UnlockRow label="Subscribe to see what this plate is worth" style={{ marginTop: 12 }} />

          {/* Lu — context and options, never a verdict. */}
          <Animated.View layout={LinearTransition.duration(250)} style={styles.luCard}>
            <View style={styles.luHeader}>
              <LuMascot size={34} />
              <View style={{ flex: 1 }}>
                <Text style={styles.luName}>Lu</Text>
                <Text style={styles.luSub}>On this meal and your goal</Text>
              </View>
            </View>
            {insights.length === 0 ? (
              <Text style={styles.luText}>{"Looks good. Add it to Track whenever you're ready."}</Text>
            ) : (
              insights.map((ins) => (
                <Animated.View key={`${ins.id}-${ins.text}`} entering={FadeIn.duration(250)} style={styles.luLine}>
                  <View
                    style={[
                      styles.luDot,
                      {
                        backgroundColor:
                          ins.tone === 'positive'
                            ? colors.success
                            : ins.tone === 'heads-up'
                              ? colors.secondary
                              : colors.inkFaint,
                      },
                    ]}
                  />
                  <View style={{ flex: 1, gap: 10 }}>
                    <Text style={styles.luText}>{ins.text}</Text>
                    {ins.action && (
                      <PressableScale
                        onPress={() => setPortion(ins.action!.portion)}
                        scaleTo={0.95}
                        style={styles.luAction}
                      >
                        <Text style={styles.luActionText}>{ins.action.label}</Text>
                      </PressableScale>
                    )}
                  </View>
                </Animated.View>
              ))
            )}
          </Animated.View>

          {/* Meal type */}
          <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Add to</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {MEAL_TYPES.map((t) => (
              <Chip
                key={t}
                small
                label={t[0].toUpperCase() + t.slice(1)}
                active={mealType === t}
                onPress={() => setMealType(t)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <PressableScale onPress={() => router.back()} style={[styles.floatBtn, { top: insets.top + 10 }]}>
        <X size={22} color="#FFFFFF" strokeWidth={2.4} />
      </PressableScale>

      {/* Footer — the user always decides. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <PressableScale onPress={() => router.replace('/scan')} style={styles.retakeBtn} scaleTo={0.92}>
          <Camera size={19} color={colors.ink} strokeWidth={2.2} />
        </PressableScale>
        <Button
          title="Add to Track"
          onPress={addToTrack}
          disabled={editing}
          icon={<Check size={18} color={colors.onPrimary} strokeWidth={2.6} />}
          style={{ flex: 1 }}
        />
      </View>

      <SuccessModal
        visible={logged}
        title="Added to Track"
        message={
          premium
            ? `${result.name} — ${scaled.calories} kcal added to ${mealType}.`
            : `${result.name} added to ${mealType}.`
        }
        buttonLabel="Back to Track"
        onClose={() => {
          setLogged(false);
          router.replace('/(tabs)/track');
        }}
      />
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: 'rgba(0, 16, 16, 0.25)',
  },
  floatBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -radius.xl,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    minHeight: 500,
  },
  sourceBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
  sourceAkaani: { backgroundColor: colors.primarySoft },
  sourceEstimate: { backgroundColor: colors.secondarySoft },
  sourceBadgeText: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2, color: colors.ink },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  name: { flex: 1, fontFamily: font.extrabold, fontSize: 26, color: colors.ink, letterSpacing: -0.6 },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgSoft,
  },
  editPillText: { fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  fieldLabel: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft, marginBottom: 8 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: font.regular,
    fontSize: 15.5,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  lookupBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupError: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 18, color: colors.danger, marginTop: 8 },
  sourceNote: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.inkSoft, marginTop: 8 },
  componentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  component: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: colors.bgSoft },
  componentText: { fontFamily: font.medium, fontSize: 12, color: colors.inkSoft },
  demoBanner: { backgroundColor: colors.secondarySoft, borderRadius: radius.md, padding: 12, marginTop: 14 },
  demoText: { fontFamily: font.medium, fontSize: 12, lineHeight: 17, color: colors.secondary },
  portionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  portionLabel: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  portionSub: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  portionValue: { fontFamily: font.bold, fontSize: 15, color: colors.ink, minWidth: 82, textAlign: 'center' },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macros: {
    flexDirection: 'row',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: 12,
  },
  macroCell: { flex: 1, alignItems: 'center', gap: 3 },
  macroDot: { width: 6, height: 6, borderRadius: 3 },
  macroValue: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  macroLabel: { fontFamily: font.regular, fontSize: 11, color: colors.inkFaint },
  luCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
    ...shadow.card,
  },
  luHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  luName: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  luSub: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint },
  luLine: { flexDirection: 'row', gap: 10 },
  luDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  luText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.ink },
  luAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondarySoft,
  },
  luActionText: { fontFamily: font.semibold, fontSize: 13, color: colors.secondary },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 14,
    ...shadow.float,
  },
  retakeBtn: {
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
