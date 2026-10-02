import { ChevronRight, Layers, Plus, Search as SearchIcon, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  calculateNutrition,
  nutrientValue,
  searchFoodGroups,
  type Food,
  type FoodGroup,
  type FoodVariant,
  type Nutrition,
} from '../api/nutrition';
import { toApiItem } from '../lib/units';
import { font, radius, shadow, themedStyles, useColors } from '../theme';
import { LockedText } from './Locked';
import { CalorieBadge, MacroChips } from './MacroChips';
import { PressableScale } from './ui';

/** What a row says about itself under its name: where it sits, what else it is called. */
function subtitleFor(group: FoodGroup): string {
  const parts: string[] = [];
  // The name the query matched leads — it explains why this row is on screen.
  if (group.matched_on) parts.push(group.matched_on);
  else if (group.local_names.length) parts.push(group.local_names.slice(0, 2).join(', '));
  else if (group.name_fr.length && group.name_fr[0] !== group.name) parts.push(group.name_fr[0]);
  if (group.category) parts.push(group.category);
  return parts.join(' · ');
}

const REFERENCE_GRAMS = 100;

/** food_id → what 100 g of it comes to, filled in by one batched call. */
type Priced = Record<string, Nutrition | undefined>;

function usePricing(foods: Food[]): { priced: Priced; pricing: boolean } {
  const [priced, setPriced] = useState<Priced>({});
  const [pricing, setPricing] = useState(false);
  // Identity of the set, so re-renders with the same foods do not refetch.
  const key = foods.map((f) => f.food_id).join(',');

  useEffect(() => {
    if (!key) return;
    const ids = key.split(',');
    const controller = new AbortController();
    setPricing(true);
    calculateNutrition(
      ids.map((id) => toApiItem(id, REFERENCE_GRAMS, 'g')),
      controller.signal
    )
      .then((res) => {
        const next: Priced = {};
        res.items.forEach((row) => (next[row.food_id] = row.nutrition));
        setPriced((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {})
      .finally(() => setPricing(false));
    return () => controller.abort();
  }, [key]);

  return { priced, pricing };
}

function nutritionToMacros(n?: Nutrition) {
  return {
    calories: nutrientValue(n?.calories ?? null),
    protein: nutrientValue(n?.protein_g ?? null),
    carbs: nutrientValue(n?.carbs_g ?? null),
    fat: nutrientValue(n?.fat_g ?? null),
    fibre: nutrientValue(n?.fibre_g ?? null),
  };
}

/**
 * The preparations of one ingredient, per 100 g.
 *
 * The table stores raw, boiled, dried and fermented as separate records with
 * genuinely different figures, so the choice matters and the sheet shows what
 * it costs rather than making the cook guess from the wording.
 */
function VariantSheet({
  group,
  onPick,
  onClose,
}: {
  group: FoodGroup | null;
  onPick: (variant: FoodVariant) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const variants = useMemo(() => group?.variants ?? [], [group]);
  const { priced, pricing } = usePricing(variants);

  const alsoCalled = group
    ? [...group.local_names, ...group.name_fr.filter((n) => n !== group.name)]
    : [];

  return (
    <Modal visible={group !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{group?.name}</Text>
              {alsoCalled.length > 0 && (
                <Text style={styles.sheetAlso} numberOfLines={2}>
                  also called {alsoCalled.join(', ')}
                </Text>
              )}
            </View>
            <PressableScale onPress={onClose} style={styles.closeBtn} scaleTo={0.85}>
              <X size={19} color={colors.ink} strokeWidth={2.4} />
            </PressableScale>
          </View>

          <View style={styles.sheetNote}>
            <Text style={styles.sheetNoteText}>
              {variants.length} preparations · figures per {REFERENCE_GRAMS} g
            </Text>
            {pricing && <ActivityIndicator size="small" color={colors.inkFaint} />}
          </View>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {variants.map((variant, i) => {
              const macros = nutritionToMacros(priced[variant.food_id]);
              return (
                <PressableScale
                  key={variant.food_id}
                  onPress={() => onPick(variant)}
                  haptic={false}
                  style={[styles.variantRow, i > 0 && styles.divided]}
                >
                  <View style={{ flex: 1, gap: 7 }}>
                    <Text style={styles.variantName}>{variant.name}</Text>
                    {variant.name_fr.length > 0 && (
                      <Text style={styles.variantNameFr}>{variant.name_fr}</Text>
                    )}
                    <View style={styles.variantMetaRow}>
                      <CalorieBadge calories={macros.calories} compact />
                      <MacroChips compact style={{ flex: 1 }} macros={macros} />
                    </View>
                  </View>
                  <Plus size={18} color={colors.secondary} strokeWidth={2.6} />
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Ingredient search for the meal builder.
 *
 * Searches by ingredient rather than by record: typing "fonio" answers with
 * Fonio once, not with twelve rows whose names differ in the middle. English,
 * French and local names all match, so "acha", "riz" and "niébé" work as well
 * as "fonio", "rice" and "cowpea". Picking the preparation happens second,
 * where the figures are on screen to choose between.
 */
export function IngredientSearch({ onPick }: { onPick: (food: Food) => void }) {
  const styles = useStyles();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<FoodGroup[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState<FoodGroup | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setSearching(true);
    const t = setTimeout(() => {
      searchFoodGroups(query, controller.signal)
        .then(setGroups)
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const shown = groups.slice(0, 8);
  // Only the one-preparation ingredients need a price on the row; the rest show
  // their figures in the sheet, where there is room for one per preparation.
  // A fresh array each render is fine — usePricing keys on the ids, not the array.
  const { priced } = usePricing(shown.filter((g) => g.variants.length === 1).map((g) => g.variants[0]));

  const pick = (variant: FoodVariant) => {
    setOpen(null);
    onPick(variant);
  };

  return (
    <>
      <View style={styles.searchBox}>
        <SearchIcon size={18} color={colors.inkFaint} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search ingredients — any language"
          placeholderTextColor={colors.inkFaint}
          autoCorrect={false}
          style={styles.searchInput}
        />
        {searching ? (
          <ActivityIndicator size="small" color={colors.inkFaint} />
        ) : query.length > 0 ? (
          <PressableScale onPress={() => setQuery('')} scaleTo={0.8} haptic={false}>
            <X size={17} color={colors.inkFaint} strokeWidth={2.4} />
          </PressableScale>
        ) : null}
      </View>

      <Text style={styles.resultsCaption}>
        {!query.trim()
          ? 'Popular ingredients'
          : groups.length > shown.length
            ? // Say so rather than let a count disagree with the rows under it.
              `Closest ${shown.length} of ${groups.length}`
            : `${groups.length} ingredient${groups.length === 1 ? '' : 's'}`}
      </Text>

      <View style={styles.results}>
        {shown.map((group, i) => {
          const only = group.variants.length === 1 ? group.variants[0] : null;
          const calories = only
            ? nutrientValue(priced[only.food_id]?.calories ?? null)
            : null;
          return (
            <PressableScale
              key={group.group_id}
              onPress={() => (only ? pick(only) : setOpen(group))}
              haptic={false}
              style={[styles.resultRow, i > 0 && styles.divided]}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.resultName} numberOfLines={2}>
                  {group.name}
                </Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {subtitleFor(group)}
                </Text>
              </View>

              {only ? (
                <>
                  <View style={styles.resultAmountRow}>
                    <Text style={styles.resultAmount}>{REFERENCE_GRAMS} g ·</Text>
                    {calories == null ? (
                      <Text style={styles.resultAmount}>—</Text>
                    ) : (
                      <LockedText style={styles.resultAmount}>
                        {String(Math.round(calories))}
                      </LockedText>
                    )}
                    <Text style={styles.resultAmount}>kcal</Text>
                  </View>
                  <Plus size={18} color={colors.secondary} strokeWidth={2.6} />
                </>
              ) : (
                <>
                  <View style={styles.countChip}>
                    <Layers size={12} color={colors.secondary} strokeWidth={2.4} />
                    <Text style={styles.countChipText}>{group.variants.length}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.inkFaint} strokeWidth={2.4} />
                </>
              )}
            </PressableScale>
          );
        })}
        {!searching && shown.length === 0 && (
          <Text style={styles.noResult}>
            Nothing matched “{query}”. Try the English, French or local name.
          </Text>
        )}
      </View>

      <VariantSheet group={open} onPick={pick} onClose={() => setOpen(null)} />
    </>
  );
}

const useStyles = themedStyles((colors) => ({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    marginTop: 8,
    ...shadow.card,
  },
  searchInput: { flex: 1, height: 52, fontFamily: font.regular, fontSize: 15, color: colors.ink },
  resultsCaption: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  results: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  divided: { borderTopWidth: 1, borderTopColor: colors.line },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  resultName: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  resultMeta: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkSoft },
  resultAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  resultAmount: { fontFamily: font.medium, fontSize: 12, color: colors.inkFaint },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  countChipText: { fontFamily: font.bold, fontSize: 12, color: colors.secondary },
  noResult: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.inkSoft,
    padding: 20,
    textAlign: 'center',
  },
  sheetRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,10,10,0.5)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontFamily: font.bold, fontSize: 21, color: colors.ink, letterSpacing: -0.4 },
  sheetAlso: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 3 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 22,
    marginTop: 16,
    marginBottom: 4,
  },
  sheetNoteText: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: colors.inkFaint,
    textTransform: 'uppercase',
  },
  variantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  variantName: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink, lineHeight: 19 },
  variantNameFr: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: colors.inkSoft,
    lineHeight: 17,
    marginTop: -3,
  },
  variantMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
}));
