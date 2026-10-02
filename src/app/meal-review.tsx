import { useRouter } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nutrientOrZero, usingLiveApi, type Nutrient } from '../api/nutrition';
import { formatQuantity } from '../lib/units';
import { IngredientCard } from '../components/IngredientCard';
import { IngredientSearch } from '../components/IngredientSearch';
import { LockedText } from '../components/Locked';
import { SuccessModal } from '../components/modals';
import { Button, PressableScale, ScreenHeader } from '../components/ui';
import { useMealDraft } from '../lib/meal-draft';
import { todayKey, useStore } from '../lib/store';
import { useEntitlement } from '../lib/subscription';
import { font, radius, shadow, themedStyles, useColors } from '../theme';

/** Label + big number + −/+ , used for both "this makes" and "I ate". */
function StepperRow({
  label,
  value,
  suffix,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: {
  label: string;
  value: string;
  suffix: string;
  onDec: () => void;
  onInc: () => void;
  decDisabled?: boolean;
  incDisabled?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepLabel}>{label}</Text>
      <PressableScale
        onPress={onDec}
        disabled={decDisabled}
        scaleTo={0.88}
        style={[styles.stepBtn, decDisabled && { opacity: 0.35 }]}
      >
        <Minus size={17} color={colors.ink} strokeWidth={2.6} />
      </PressableScale>
      <View style={styles.stepValueBox}>
        <Text style={styles.stepValue}>{value}</Text>
        <Text style={styles.stepSuffix}>{suffix}</Text>
      </View>
      <PressableScale
        onPress={onInc}
        disabled={incDisabled}
        scaleTo={0.88}
        style={[styles.stepBtn, incDisabled && { opacity: 0.35 }]}
      >
        <Plus size={17} color={colors.ink} strokeWidth={2.6} />
      </PressableScale>
    </View>
  );
}

export default function MealReviewScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addLog } = useStore();
  const { premium } = useEntitlement();
  const {
    items,
    name,
    setName,
    mealType,
    servings,
    includedItems,
    totals,
    addFood,
    toggleIncluded,
    setServings,
    eaten,
    setEaten,
    reset,
  } = useMealDraft();

  const [logged, setLogged] = useState(false);

  // The builder is Premium and has a paywall of its own. Anyone who reaches
  // the screen without it — a deep link, or a plan that lapsed mid-build —
  // gets that paywall rather than a half-usable form.
  useEffect(() => {
    if (!premium) router.replace('/paywall');
  }, [premium, router]);

  const canConfirm = includedItems.length > 0;
  const totalCalories = nutrientOrZero(totals.calories);
  /** Fraction of the whole dish that ends up in the log. */
  const share = servings > 0 ? eaten / servings : 1;
  const perServingCalories = servings > 0 ? totalCalories / servings : totalCalories;
  const loggedCalories = totalCalories * share;

  /** Included rows the user has not adjusted off the reference amount. */
  const untouched = useMemo(
    () => includedItems.filter((it) => it.defaultPortion).length,
    [includedItems]
  );

  const suggestedName = useMemo(() => {
    if (includedItems.length === 0) return '';
    const [first, ...rest] = includedItems;
    return rest.length ? `${first.name} +${rest.length}` : first.name;
  }, [includedItems]);

  const confirm = () => {
    if (!canConfirm) return;
    // Log the portion eaten, not the whole dish: total × (eaten / makes).
    // An unknown nutrient stays unknown — writing 0 would claim the food has
    // none of it, which is a different (and false) statement.
    const portion = (cell: Nutrient): number | null =>
      cell == null ? null : Math.round(cell.value * share);
    addLog({
      name: name.trim() || suggestedName || 'Custom meal',
      calories: portion(totals.calories),
      protein: portion(totals.protein_g),
      carbs: portion(totals.carbs_g),
      fat: portion(totals.fat_g),
      fiber: portion(totals.fibre_g),
      mealType,
      date: todayKey(),
    });
    setLogged(true);
  };

  const closeAndGoBack = () => {
    setLogged(false);
    reset();
    router.replace('/(tabs)/track');
  };

  if (!premium) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Review meal"
        sub={items.length ? `${includedItems.length} of ${items.length} included` : 'Add your ingredients'}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 220 }}
        keyboardShouldPersistTaps="handled"
      >
        {!usingLiveApi && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>
              Running the Akaani food table on-device. Set EXPO_PUBLIC_AKAANI_API_URL to
              use the live nutrition API instead.
            </Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Meal name</Text>
        <View style={styles.nameBox}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={suggestedName || 'e.g. Sunday lunch'}
            placeholderTextColor={colors.inkFaint}
            style={styles.nameInput}
          />
        </View>

        {/* Add ingredients — by ingredient, not by table row. An ingredient with
            several preparations opens a sheet to choose between them. */}
        <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Add ingredients</Text>
        <IngredientSearch onPick={addFood} />

        {/* The meal */}
        {items.length > 0 && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: 26 }]}>In this meal</Text>
            <View style={{ gap: 10, marginTop: 8 }}>
              {items.map((it, i) => (
                <Animated.View key={it.id} entering={FadeInDown.delay(Math.min(i, 6) * 40).duration(300)}>
                  <IngredientCard
                    item={it}
                    onPress={() => router.push({ pathname: '/ingredient-edit', params: { id: it.id } })}
                    onToggle={() => toggleIncluded(it.id)}
                  />
                </Animated.View>
              ))}
            </View>
          </>
        )}

        {includedItems.length > 0 && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: 26 }]}>Servings</Text>
            <View style={styles.servingsCard}>
              <StepperRow
                label="This makes"
                value={`${servings}`}
                suffix={servings === 1 ? 'serving' : 'servings'}
                onDec={() => setServings(servings - 1)}
                onInc={() => setServings(servings + 1)}
                decDisabled={servings <= 1}
              />
              <View style={styles.perServingRow}>
                <Text style={styles.perServingLabel}>Per serving</Text>
                <LockedText style={styles.perServingValue}>
                  {`${Math.round(perServingCalories)} cal`}
                </LockedText>
              </View>

              <View style={styles.cardDivider} />

              <StepperRow
                label="I ate"
                value={formatQuantity(eaten)}
                suffix={eaten === 1 ? 'serving' : 'servings'}
                onDec={() => setEaten(eaten - 0.5)}
                onInc={() => setEaten(eaten + 0.5)}
                decDisabled={eaten <= 0.5}
                incDisabled={eaten >= servings}
              />
            </View>
          </>
        )}

        {items.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Search above to add what went on the plate. Each ingredient gets a default portion you
              can adjust.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer — running total + confirm */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>
              {servings > 1
                ? `${formatQuantity(eaten)} of ${servings} servings`
                : `${includedItems.length} item${includedItems.length === 1 ? '' : 's'} included`}
            </Text>
            <LockedText style={styles.totalValue}>{`${Math.round(loggedCalories)} cal`}</LockedText>
          </View>
          {servings > 1 && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalLabel}>Whole dish</Text>
              <LockedText style={styles.wholeDish}>{`${Math.round(totalCalories)} cal`}</LockedText>
            </View>
          )}
        </View>
        {untouched > 0 && (
          <Text style={styles.untouchedNote}>
            {untouched} ingredient{untouched === 1 ? '' : 's'} still at the default amount — tap a
            card to set what you actually used.
          </Text>
        )}
        <Button title="Confirm meal" variant="secondary" onPress={confirm} disabled={!canConfirm} />
      </View>

      <SuccessModal
        visible={logged}
        title="Meal logged!"
        message={
          premium
            ? `${Math.round(loggedCalories)} cal added to today's plate.`
            : "Added to today's plate."
        }
        buttonLabel="Done"
        onClose={closeAndGoBack}
      />
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  devBanner: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 18,
  },
  devBannerText: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, lineHeight: 17 },
  fieldLabel: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft, marginBottom: 6 },
  nameBox: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
  },
  nameInput: { height: 52, fontFamily: font.regular, fontSize: 15.5, color: colors.ink },
  empty: { backgroundColor: colors.bgSoft, borderRadius: radius.md, padding: 20, marginTop: 24 },
  emptyText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.inkSoft },
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
    gap: 14,
    ...shadow.float,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontFamily: font.medium, fontSize: 12, color: colors.inkFaint },
  totalValue: { fontFamily: font.extrabold, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
  wholeDish: { fontFamily: font.semibold, fontSize: 15, color: colors.inkSoft },
  untouchedNote: {
    fontFamily: font.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.secondary,
    marginTop: -4,
  },
  servingsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 8,
    gap: 14,
    ...shadow.card,
  },
  cardDivider: { height: 1, backgroundColor: colors.line },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepLabel: { flex: 1, fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  stepValueBox: { alignItems: 'center', minWidth: 74 },
  stepValue: { fontFamily: font.bold, fontSize: 19, color: colors.ink },
  stepSuffix: { fontFamily: font.regular, fontSize: 11, color: colors.inkFaint },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perServingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  perServingLabel: { fontFamily: font.medium, fontSize: 13, color: colors.inkSoft },
  perServingValue: { fontFamily: font.bold, fontSize: 15, color: colors.secondary },
}));
