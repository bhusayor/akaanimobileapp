import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus, Trash2, TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MealTypeSelector } from '../components/MealTypeSelector';
import { NutritionSummary } from '../components/NutritionSummary';
import { Button, PressableScale, ScreenHeader } from '../components/ui';
import { UnitPicker } from '../components/UnitPicker';
import { useMealDraft } from '../lib/meal-draft';
import {
  convertQuantity,
  formatForInput,
  gramsToMass,
  isOfferedUnit,
  massToGrams,
  stepFor,
} from '../lib/units';
import { useDebouncedCalculate } from '../lib/use-debounced-calculate';
import { font, radius, shadow, themedStyles, useColors } from '../theme';

/** Titled card — one per group of related fields. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!hint && <Text style={styles.sectionHint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

export default function IngredientEditScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, removeItem, mealType, setMealType } = useMealDraft();

  const item = items.find((it) => it.id === String(id));

  // Local edit buffer — nothing lands on the draft until "Done".
  const [qtyText, setQtyText] = useState(() =>
    item && !item.needsPortion ? String(item.quantity) : ''
  );
  // Fall back to grams if the stored unit isn't one the picker offers (e.g. the
  // API defaulted this food to "piece" and we never resolved it to grams).
  const [unit, setUnit] = useState(() =>
    item && isOfferedUnit(item.unit, item.portion_conversions) ? item.unit : 'g'
  );
  const [localMealType, setLocalMealType] = useState(mealType);
  /** Last unit the API accepted — we roll back to this on a portion error. */
  const lastValidUnit = useRef(item?.unit ?? 'g');
  /**
   * The exact weight behind whatever is in the box. Switching units reads from
   * this rather than from the rounded text, so g → oz → g lands back on the
   * number you started with instead of drifting a little each time.
   */
  const exactGrams = useRef<number | null>(
    item && !item.needsPortion ? massToGrams(item.quantity, item.unit) : null
  );

  const quantity = Number(qtyText);
  const quantityValid = qtyText.trim() !== '' && Number.isFinite(quantity) && quantity > 0;

  const { nutrition, grams, loading, error, portionError } = useDebouncedCalculate({
    foodId: item?.food_id ?? '',
    quantity: quantityValid ? quantity : 0,
    unit,
    enabled: !!item,
    initialNutrition: item?.nutrition,
  });

  // The API refused this unit — restore the previous one rather than guessing a
  // conversion locally, and let the inline message explain why.
  useEffect(() => {
    if (portionError && unit !== lastValidUnit.current) setUnit(lastValidUnit.current);
  }, [portionError, unit]);

  useEffect(() => {
    if (!portionError && !loading && nutrition) lastValidUnit.current = unit;
  }, [portionError, loading, nutrition, unit]);

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Ingredient" />
        <Text style={styles.missing}>This ingredient is no longer in the meal.</Text>
      </View>
    );
  }

  /** Every change to the number goes through here so `exactGrams` stays true. */
  const setQuantity = (text: string) => {
    setQtyText(text);
    const n = Number(text);
    exactGrams.current = Number.isFinite(n) && n > 0 ? massToGrams(n, unit) : null;
  };

  const step = (dir: number) => {
    const base = quantityValid ? quantity : 0;
    const next = Math.max(0, Math.round((base + dir * stepFor(unit)) * 1000) / 1000);
    setQuantity(formatForInput(next, unit));
  };

  /** Same weight, different unit — 113.4 g becomes 4 oz. */
  const changeUnit = (next: string) => {
    if (next === unit) return;
    const grams = exactGrams.current ?? (quantityValid ? massToGrams(quantity, unit) : null);
    const converted = grams != null ? gramsToMass(grams, next) : null;
    if (converted != null) {
      setQtyText(formatForInput(converted, next));
      exactGrams.current = grams;
    } else if (quantityValid) {
      // Non-weight unit: fall back to a plain restatement if one is possible.
      const plain = convertQuantity(quantity, unit, next);
      if (plain != null) setQtyText(formatForInput(plain, next));
    }
    setUnit(next);
  };

  const done = () => {
    if (!quantityValid) return;
    updateItem(item.id, {
      quantity,
      unit,
      grams: grams ?? item.grams,
      nutrition: nutrition ?? item.nutrition,
      needsPortion: false,
      // The amount is now the user's, not the table's reference figure.
      defaultPortion: false,
      included: true,
      error: undefined,
    });
    setMealType(localMealType);
    router.back();
  };

  const remove = () => {
    removeItem(item.id);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={item.name} sub="Adjust the portion" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1 — how much */}
          <Section title="How much?">
            <View style={styles.qtyRow}>
              <PressableScale onPress={() => step(-1)} style={styles.stepBtn} scaleTo={0.88}>
                <Minus size={20} color={colors.ink} strokeWidth={2.6} />
              </PressableScale>

              <View style={styles.qtyField}>
                <TextInput
                  value={qtyText}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.qtyInput}
                  selectTextOnFocus
                />
                {/* Absolute, so the number stays centred in the field regardless. */}
                <Text style={styles.qtyUnit} pointerEvents="none">
                  {unit}
                </Text>
              </View>

              <PressableScale onPress={() => step(1)} style={styles.stepBtn} scaleTo={0.88}>
                <Plus size={20} color={colors.ink} strokeWidth={2.6} />
              </PressableScale>
            </View>

            {!quantityValid ? (
              <Text style={styles.invalid}>Enter a quantity greater than zero.</Text>
            ) : (
              // Grams needs no restating; oz/lb do.
              unit !== 'g' &&
              grams != null && <Text style={styles.gramsLine}>= {Math.round(grams)} g</Text>
            )}

            <View style={styles.divider} />

            <UnitPicker conversions={item.portion_conversions} value={unit} onChange={changeUnit} />

            {portionError && (
              <View style={styles.errorBox}>
                <TriangleAlert size={14} color={colors.danger} strokeWidth={2.4} />
                <Text style={styles.errorText}>
                  No gram conversion for this unit yet — try grams.
                </Text>
              </View>
            )}
            {!!error && !portionError && (
              <View style={styles.errorBox}>
                <TriangleAlert size={14} color={colors.danger} strokeWidth={2.4} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </Section>

          {/* 2 — live macros */}
          <NutritionSummary
            nutrition={quantityValid ? nutrition : null}
            loading={loading}
            title="THIS INGREDIENT"
          />

          {/* 3 — meal-level settings. Servings lives on the review screen, with
              the totals it actually divides. */}
          <Section title="Meal" hint="Applies to the whole meal">
            <MealTypeSelector value={localMealType} onChange={setLocalMealType} label="" />
          </Section>

          <PressableScale onPress={remove} style={styles.removeBtn} scaleTo={0.98}>
            <Trash2 size={16} color={colors.danger} strokeWidth={2.2} />
            <Text style={styles.removeText}>Remove from meal</Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button title="Done" variant="secondary" onPress={done} disabled={!quantityValid} />
      </View>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 190, gap: 16 },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    gap: 14,
    ...shadow.card,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: font.bold, fontSize: 10.5, letterSpacing: 1.6, color: colors.inkFaint },
  sectionHint: { fontFamily: font.semibold, fontSize: 12, color: colors.secondary },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  invalid: { fontFamily: font.medium, fontSize: 12.5, color: colors.danger, textAlign: 'center' },
  gramsLine: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.secondary,
    textAlign: 'center',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyField: {
    flex: 1,
    height: 64,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
  },
  qtyInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: font.extrabold,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.8,
  },
  qtyUnit: {
    position: 'absolute',
    right: 14,
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.inkFaint,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12.5,
    color: colors.danger,
    lineHeight: 17,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    marginTop: 4,
  },
  removeText: { fontFamily: font.semibold, fontSize: 14.5, color: colors.danger },
  missing: {
    fontFamily: font.regular,
    fontSize: 14.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 40,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 16,
    ...shadow.float,
  },
}));
