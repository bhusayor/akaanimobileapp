import { Text, View } from 'react-native';
import type { PortionConversion } from '../api/nutrition';
import { unitsForFood } from '../lib/units';
import { font, radius, themedStyles, useColors } from '../theme';
import { PressableScale } from './ui';

/**
 * Weight units — g, oz, lb — offered for every food, because each is an exact
 * definition rather than a per-food measurement. Density-dependent portions
 * (cup, tsp …) would appear alongside them only when the API supplies a
 * conversion for that specific food.
 */
export function UnitPicker({
  conversions,
  value,
  onChange,
}: {
  conversions: PortionConversion[];
  value: string;
  onChange: (unit: string) => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const { mass, portion } = unitsForFood(conversions);

  const units: { unit: string; grams?: number }[] = [
    // Weight units need no gram caption — they are exact by definition, and the
    // "= 113 g" line under the quantity already shows what is being priced.
    ...mass.map((unit) => ({ unit })),
    // A portion unit does need one: a cup means nothing without its weight.
    ...portion.map((c) => ({ unit: c.unit, grams: c.grams })),
  ];

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>Measure in</Text>
      <View style={styles.row}>
        {units.map(({ unit, grams }) => {
          const active = unit === value;
          return (
            <PressableScale
              key={unit}
              onPress={() => onChange(unit)}
              scaleTo={0.95}
              style={[
                styles.pill,
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.pillText, active && { color: colors.onPrimary }]}>{unit}</Text>
              {grams != null && (
                <Text
                  style={[styles.pillSub, active && { color: colors.onPrimary, opacity: 0.75 }]}
                >
                  {grams >= 100 ? Math.round(grams) : Math.round(grams * 10) / 10}g
                </Text>
              )}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  label: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft },
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  pillText: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  pillSub: { fontFamily: font.regular, fontSize: 11, color: colors.inkFaint },
}));
