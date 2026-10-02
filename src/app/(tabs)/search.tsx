import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, PressableScale } from '../../components/ui';
import { COLLECTIONS, CUISINES, Meal, MEALS, MealType } from '../../data/meals';
import { font, motion, radius, themedStyles, useColors } from '../../theme';

const { width: W } = Dimensions.get('window');
const GAP = 3;
const TILE = (W - GAP * 2) / 3;

const TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

type Filters = {
  collections: string[];
  cuisines: string[];
  types: MealType[];
};

const EMPTY: Filters = { collections: [], cuisines: [], types: [] };

const countFilters = (f: Filters) => f.collections.length + f.cuisines.length + f.types.length;

/**
 * Instagram-style mosaic. React Native has no masonry layout, so the meals are
 * dealt into three column stacks by hand — every 7th tile is double height,
 * and each tile goes to whichever column is currently shortest.
 */
function splitColumns(meals: Meal[]): { meal: Meal; tall: boolean }[][] {
  const columns: { meal: Meal; tall: boolean }[][] = [[], [], []];
  const heights = [0, 0, 0];
  meals.forEach((meal, i) => {
    const tall = i % 7 === 3;
    const target = heights.indexOf(Math.min(...heights));
    columns[target].push({ meal, tall });
    heights[target] += tall ? 2 : 1;
  });
  return columns;
}

function MosaicTile({ meal, tall }: { meal: Meal; tall: boolean }) {
  const styles = useStyles();
  const router = useRouter();
  return (
    <Animated.View entering={FadeIn.duration(motion.fast)}>
      <PressableScale
        onPress={() => router.push(`/meal/${meal.id}`)}
        scaleTo={0.97}
        style={[styles.tile, { height: tall ? TILE * 2 + GAP : TILE }]}
      >
        <Image source={{ uri: meal.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <View style={styles.tileScrim} />
        <Text style={styles.tileName} numberOfLines={2}>
          {meal.name}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <PressableScale onPress={onPress} scaleTo={0.95} style={[styles.chip, active && styles.chipOn]}>
      {active && <Check size={13} color={colors.onPrimary} strokeWidth={3} />}
      <Text style={[styles.chipText, active && { color: colors.onPrimary }]}>{label}</Text>
    </PressableScale>
  );
}

export default function SearchScreen() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ collection?: string; cuisine?: string }>();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<Filters>(EMPTY);

  // Deep links from other screens land here pre-filtered.
  useEffect(() => {
    if (params.collection) setFilters((f) => ({ ...f, collections: [String(params.collection)] }));
  }, [params.collection]);
  useEffect(() => {
    if (params.cuisine) setFilters((f) => ({ ...f, cuisines: [String(params.cuisine)] }));
  }, [params.cuisine]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEALS.filter((m) => {
      if (
        q &&
        !(
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
        )
      )
        return false;
      if (filters.collections.length && !filters.collections.some((c) => m.collections.includes(c)))
        return false;
      if (filters.cuisines.length && !filters.cuisines.includes(m.cuisine)) return false;
      if (filters.types.length && !filters.types.some((t) => m.mealType.includes(t))) return false;
      return true;
    });
  }, [query, filters]);

  const columns = useMemo(() => splitColumns(results), [results]);

  const openSheet = () => {
    setDraft(filters);
    setSheet(true);
  };

  const toggle = <K extends keyof Filters>(key: K, value: Filters[K][number]) => {
    setDraft((d) => {
      const list = d[key] as string[];
      const next = list.includes(value as string)
        ? list.filter((v) => v !== value)
        : [...list, value as string];
      return { ...d, [key]: next } as Filters;
    });
  };

  const active = countFilters(filters);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Search bar sits at the very top, filter button beside it */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchBox}>
          <SearchIcon size={18} color={colors.inkFaint} strokeWidth={2.3} />
          <TextInput
            placeholder="Search meals, tags, kitchens…"
            placeholderTextColor={colors.inkFaint}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <PressableScale onPress={() => setQuery('')} scaleTo={0.85} haptic={false}>
              <X size={17} color={colors.inkFaint} strokeWidth={2.4} />
            </PressableScale>
          )}
        </View>
        <PressableScale
          onPress={openSheet}
          scaleTo={0.92}
          style={[styles.filterBtn, active > 0 && { backgroundColor: colors.primary }]}
        >
          <SlidersHorizontal
            size={18}
            color={active > 0 ? colors.onPrimary : colors.ink}
            strokeWidth={2.3}
          />
          {active > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{active}</Text>
            </View>
          )}
        </PressableScale>
      </View>

      {/* Active filters read back as removable pills */}
      {active > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.activeRow}
        >
          {filters.types.map((t) => (
            <PressableScale
              key={t}
              onPress={() => setFilters((f) => ({ ...f, types: f.types.filter((x) => x !== t) }))}
              scaleTo={0.94}
              style={styles.activePill}
            >
              <Text style={styles.activePillText}>{t[0].toUpperCase() + t.slice(1)}</Text>
              <X size={12} color={colors.onPrimary} strokeWidth={3} />
            </PressableScale>
          ))}
          {filters.collections.map((id) => (
            <PressableScale
              key={id}
              onPress={() =>
                setFilters((f) => ({ ...f, collections: f.collections.filter((x) => x !== id) }))
              }
              scaleTo={0.94}
              style={styles.activePill}
            >
              <Text style={styles.activePillText}>
                {COLLECTIONS.find((c) => c.id === id)?.name ?? id}
              </Text>
              <X size={12} color={colors.onPrimary} strokeWidth={3} />
            </PressableScale>
          ))}
          {filters.cuisines.map((id) => (
            <PressableScale
              key={id}
              onPress={() =>
                setFilters((f) => ({ ...f, cuisines: f.cuisines.filter((x) => x !== id) }))
              }
              scaleTo={0.94}
              style={styles.activePill}
            >
              <Text style={styles.activePillText}>
                {CUISINES.find((c) => c.id === id)?.name ?? id}
              </Text>
              <X size={12} color={colors.onPrimary} strokeWidth={3} />
            </PressableScale>
          ))}
          <PressableScale onPress={() => setFilters(EMPTY)} scaleTo={0.94} style={styles.clearPill}>
            <Text style={styles.clearPillText}>Clear all</Text>
          </PressableScale>
        </ScrollView>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mosaic}>
          {columns.map((column, i) => (
            <View key={i} style={styles.mosaicCol}>
              {column.map(({ meal, tall }) => (
                <MosaicTile key={meal.id} meal={meal} tall={tall} />
              ))}
            </View>
          ))}
        </View>
        {results.length === 0 && (
          <Animated.View entering={FadeInDown.duration(motion.base)} style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing matches</Text>
            <Text style={styles.emptyText}>
              Loosen a filter, or ask Lu — she knows dishes we haven&apos;t added yet.
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Filter sheet */}
      <Modal visible={sheet} transparent animationType="fade" onRequestClose={() => setSheet(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheet(false)} />
          <Animated.View
            entering={SlideInDown.duration(motion.base).easing(motion.enter)}
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <PressableScale onPress={() => setDraft(EMPTY)} haptic={false} scaleTo={0.94}>
                <Text style={styles.reset}>Reset</Text>
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 430 }}>
              <Text style={styles.groupLabel}>MEAL TIME</Text>
              <View style={styles.chipWrap}>
                {TYPES.map((t) => (
                  <FilterChip
                    key={t.key}
                    label={t.label}
                    active={draft.types.includes(t.key)}
                    onPress={() => toggle('types', t.key)}
                  />
                ))}
              </View>

              <Text style={styles.groupLabel}>COLLECTIONS</Text>
              <View style={styles.chipWrap}>
                {COLLECTIONS.map((c) => (
                  <FilterChip
                    key={c.id}
                    label={c.name}
                    active={draft.collections.includes(c.id)}
                    onPress={() => toggle('collections', c.id)}
                  />
                ))}
              </View>

              <Text style={styles.groupLabel}>KITCHENS</Text>
              <View style={[styles.chipWrap, { marginBottom: 8 }]}>
                {CUISINES.map((c) => (
                  <FilterChip
                    key={c.id}
                    label={c.name}
                    active={draft.cuisines.includes(c.id)}
                    onPress={() => toggle('cuisines', c.id)}
                  />
                ))}
              </View>
            </ScrollView>

            <Button
              title={`Show ${
                MEALS.filter((m) => {
                  if (draft.collections.length && !draft.collections.some((c) => m.collections.includes(c)))
                    return false;
                  if (draft.cuisines.length && !draft.cuisines.includes(m.cuisine)) return false;
                  if (draft.types.length && !draft.types.some((t) => m.mealType.includes(t))) return false;
                  return true;
                }).length
              } meals`}
              onPress={() => {
                setFilters(draft);
                setSheet(false);
              }}
              style={{ marginTop: 14 }}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    height: 46,
  },
  searchInput: { flex: 1, height: '100%', fontFamily: font.regular, fontSize: 15, color: colors.ink },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontFamily: font.bold, fontSize: 9.5, color: '#FFFFFF' },
  activeRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  activePillText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.onPrimary },
  clearPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  clearPillText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.inkSoft },
  mosaic: { flexDirection: 'row', gap: GAP },
  mosaicCol: { width: TILE, gap: GAP },
  tile: {
    width: TILE,
    backgroundColor: colors.bgSoft,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tileScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,16,14,0.22)' },
  tileName: {
    fontFamily: font.semibold,
    fontSize: 11.5,
    lineHeight: 14.5,
    color: '#FFFFFF',
    padding: 8,
  },
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  sheetRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,10,10,0.5)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 14,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: font.bold, fontSize: 22, color: colors.ink, letterSpacing: -0.4 },
  reset: { fontFamily: font.semibold, fontSize: 14, color: colors.secondary },
  groupLabel: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.inkFaint,
    marginTop: 20,
    marginBottom: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: font.medium, fontSize: 13, color: colors.ink },
}));
