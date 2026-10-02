import { Check, Pencil, TriangleAlert } from 'lucide-react-native';
import { Text, View } from 'react-native';
import type { MealIngredientItem } from '../lib/meal-draft';
import { formatQuantity } from '../lib/units';
import { font, radius, shadow, themedStyles, useColors } from '../theme';
import { LockedText } from './Locked';
import { PressableScale } from './ui';

/** "234 g" or "½ tsp (2g)" — grams always come from the API, never computed here. */
export function portionLabel(item: MealIngredientItem): string {
  if (item.needsPortion) return 'Set portion';
  // Already in grams — no point restating the gram weight in brackets.
  const base =
    item.unit === 'g'
      ? `${Math.round(item.quantity)} g`
      : `${formatQuantity(item.quantity)} ${item.unit}${
          item.grams != null ? ` (${Math.round(item.grams)}g)` : ''
        }`;
  // Say plainly that this is the reference amount, not a measured portion.
  return item.defaultPortion ? `${base} · default` : base;
}

/**
 * One ingredient row. The whole card opens the editor — the portion is drawn as
 * a chip with a pencil so that is obvious — and the checkbox is a separate hit
 * target that only toggles inclusion.
 */
export function IngredientCard({
  item,
  onPress,
  onToggle,
}: {
  item: MealIngredientItem;
  onPress: () => void;
  onToggle: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const cal = item.nutrition?.calories ?? null;
  // Both "no portion at all" and "still on the default" want the amber tint.
  const provisional = item.needsPortion || item.defaultPortion;

  return (
    <PressableScale onPress={onPress} scaleTo={0.985} style={styles.card}>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.row}>
          <View style={[styles.portionChip, provisional && styles.portionChipWarn]}>
            <Pencil
              size={12}
              color={provisional ? colors.secondary : colors.primary}
              strokeWidth={2.6}
            />
            <Text style={[styles.portionText, provisional && { color: colors.secondary }]}>
              {portionLabel(item)}
            </Text>
          </View>

          {!item.needsPortion &&
            !item.error &&
            (cal ? (
              <LockedText style={styles.cal}>
                {`${cal.confidence === 'estimated' ? '~' : ''}${Math.round(cal.value)} cal`}
              </LockedText>
            ) : (
              <Text style={styles.cal}>—</Text>
            ))}
        </View>

        {item.needsPortion ? (
          <View style={styles.warnRow}>
            <TriangleAlert size={12} color={colors.secondary} strokeWidth={2.4} />
            <Text style={styles.warnText}>No default serving — tap to choose one</Text>
          </View>
        ) : item.defaultPortion ? (
          <View style={styles.warnRow}>
            <TriangleAlert size={12} color={colors.secondary} strokeWidth={2.4} />
            <Text style={styles.warnText}>Reference amount — tap to set what you used</Text>
          </View>
        ) : item.error ? (
          <Text style={styles.errText} numberOfLines={2}>
            {item.error}
          </Text>
        ) : null}
      </View>

      {/* Checkbox — its own press target, so it never opens the editor. */}
      <PressableScale
        onPress={onToggle}
        scaleTo={0.85}
        disabled={item.needsPortion}
        style={[
          styles.check,
          item.included && { backgroundColor: colors.primary, borderColor: colors.primary },
          item.needsPortion && { opacity: 0.4 },
        ]}
      >
        {item.included && <Check size={15} color={colors.onPrimary} strokeWidth={3} />}
      </PressableScale>
    </PressableScale>
  );
}

const useStyles = themedStyles((colors) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow.card,
  },
  name: { fontFamily: font.semibold, fontSize: 15.5, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  portionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  portionChipWarn: { backgroundColor: colors.secondarySoft },
  portionText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.primary },
  cal: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkFaint },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  warnText: { fontFamily: font.medium, fontSize: 11.5, color: colors.secondary },
  errText: { fontFamily: font.medium, fontSize: 11.5, color: colors.danger },
  check: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
