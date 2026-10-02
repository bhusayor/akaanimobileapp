import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { font, macroColor, radius, themedStyles, useColors, type MacroKey } from '../theme';
import { LockedText } from './Locked';

/** What a meal is worth. `null` means the source had no figure — never zero. */
export type Macros = {
  calories?: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fibre: number | null;
};

/**
 * Spelled out, because "P 18g · C 78g · F 16g · Fb 12g" is a cipher.
 *
 * The figures blur for anyone without Premium — the labels, colours and layout
 * do not, so a free user still sees which nutrients a meal is made of.
 *
 * Each nutrient gets its name and the colour it wears everywhere else in the
 * app, so the chips under a logged meal and the bars on the daily goal card
 * teach each other. Order matches the goal card, top to bottom.
 */
const ORDER: { key: Exclude<MacroKey, 'calories'>; label: string }[] = [
  { key: 'protein', label: 'protein' },
  { key: 'carbs', label: 'carbs' },
  { key: 'fat', label: 'fat' },
  { key: 'fibre', label: 'fibre' },
];

/** Whole numbers where they are whole, one decimal where they are not. */
const show = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function MacroChips({
  macros,
  compact,
  style,
}: {
  macros: Macros;
  /** Tighter type and spacing, for dense list rows. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const colors = useColors();
  const values: Record<string, number | null> = {
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    fibre: macros.fibre,
  };

  return (
    <View style={[styles.row, style]}>
      {ORDER.map(({ key, label }) => {
        const value = values[key];
        return (
          <View key={key} style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: macroColor(colors, key) }]} />
            {value == null ? (
              <Text style={[styles.value, compact && styles.valueCompact]}>—</Text>
            ) : (
              <LockedText style={[styles.value, compact && styles.valueCompact]}>
                {`${show(value)}g`}
              </LockedText>
            )}
            <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * The calorie figure, as a badge. Calories are the number people look for
 * first, so they get size and a border rather than a place in the chip run.
 */
export function CalorieBadge({ calories, compact }: { calories: number | null; compact?: boolean }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <View style={[styles.dot, { backgroundColor: colors.macroCalories }]} />
      {calories == null ? (
        <Text style={[styles.badgeValue, compact && styles.badgeValueCompact]}>—</Text>
      ) : (
        <LockedText style={[styles.badgeValue, compact && styles.badgeValueCompact]}>
          {show(calories)}
        </LockedText>
      )}
      <Text style={styles.badgeUnit}>kcal</Text>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  value: { fontFamily: font.semibold, fontSize: 12.5, color: colors.ink },
  valueCompact: { fontSize: 11.5 },
  label: { fontFamily: font.regular, fontSize: 12, color: colors.inkSoft },
  labelCompact: { fontSize: 11 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeCompact: { paddingHorizontal: 9, paddingVertical: 4 },
  badgeValue: { fontFamily: font.bold, fontSize: 15, color: colors.ink, letterSpacing: -0.3 },
  badgeValueCompact: { fontSize: 13 },
  badgeUnit: { fontFamily: font.medium, fontSize: 11, color: colors.inkSoft },
}));
