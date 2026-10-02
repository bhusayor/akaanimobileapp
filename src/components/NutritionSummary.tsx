import { ActivityIndicator, Text, View } from 'react-native';
import type { Nutrient, Nutrition } from '../api/nutrition';
import { font, macroColor, radius, themedStyles, useColors } from '../theme';
import { LockedBlock, LockedText, UnlockRow } from './Locked';

/** Label → the theme key that colours it. */
const MACRO_KEY = {
  Calories: 'calories',
  Protein: 'protein',
  Carbs: 'carbs',
  Fat: 'fat',
  Fibre: 'fibre',
} as const;

const show = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Live macro readout. `loading` only dims the numbers — it never blocks the
 * screen. A nutrient the source has no figure for shows "—", never 0, and an
 * estimated figure is marked with "~". Without Premium the figures themselves
 * are blurred, but the units, labels and colours stay put.
 */
export function NutritionSummary({
  nutrition,
  loading,
  title = 'NUTRITION',
}: {
  nutrition: Nutrition | null;
  loading?: boolean;
  title?: string;
}) {
  const styles = useStyles();
  const colors = useColors();

  const cells: { label: keyof typeof MACRO_KEY; cell: Nutrient; unit: string }[] = [
    { label: 'Calories', cell: nutrition?.calories ?? null, unit: 'kcal' },
    { label: 'Protein', cell: nutrition?.protein_g ?? null, unit: 'g' },
    { label: 'Carbs', cell: nutrition?.carbs_g ?? null, unit: 'g' },
    { label: 'Fat', cell: nutrition?.fat_g ?? null, unit: 'g' },
    { label: 'Fibre', cell: nutrition?.fibre_g ?? null, unit: 'g' },
  ];

  const anyEstimated = cells.some((c) => c.cell?.confidence === 'estimated');

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{title}</Text>
        {loading && <ActivityIndicator size="small" color={colors.inkFaint} />}
      </View>
      <LockedBlock radius={radius.sm} style={[styles.row, loading && { opacity: 0.45 }]}>
        {cells.map((c) => (
          <View key={c.label} style={styles.cell}>
            <View style={[styles.dot, { backgroundColor: macroColor(colors, MACRO_KEY[c.label]) }]} />
            {c.cell ? (
              <View style={styles.valueRow}>
                <LockedText style={styles.value}>
                  {`${c.cell.confidence === 'estimated' ? '~' : ''}${show(c.cell.value)}`}
                </LockedText>
                <Text style={styles.unit}> {c.unit}</Text>
              </View>
            ) : (
              <Text style={styles.unknown}>—</Text>
            )}
            <Text style={styles.label}>{c.label}</Text>
          </View>
        ))}
      </LockedBlock>
      {anyEstimated && <Text style={styles.footnote}>~ estimated in the source data</Text>}
      <UnlockRow label="Subscribe to see exact nutrition" style={{ marginTop: 12 }} />
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 18 },
  title: { fontFamily: font.bold, fontSize: 10.5, letterSpacing: 1.6, color: colors.inkFaint },
  row: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1, gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontFamily: font.bold, fontSize: 14.5, color: colors.ink },
  unknown: { fontFamily: font.bold, fontSize: 14.5, color: colors.inkFaint },
  unit: { fontFamily: font.regular, fontSize: 9.5, color: colors.inkFaint },
  label: { fontFamily: font.regular, fontSize: 10.5, color: colors.inkSoft },
  footnote: { fontFamily: font.regular, fontSize: 10.5, color: colors.inkFaint },
}));
