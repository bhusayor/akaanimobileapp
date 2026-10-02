/**
 * Units for ingredient quantities.
 *
 * The app measures by WEIGHT only: grams, ounces and pounds.
 *
 * All three are exact, food-independent definitions — an ounce is 28.349523125 g
 * whether you are weighing egusi or beef — so converting between them is
 * arithmetic, not estimation, and they need no data from the backend.
 *
 * Volume and count units (tsp, tbsp, cup, piece, plate …) are deliberately NOT
 * offered: a cup of palm oil and a cup of ugu leaves weigh different amounts,
 * so their gram values can only come from the API's `portion_conversions` for
 * that specific food_id. The plumbing for that is still here; the moment the
 * backend supplies conversions, add the units to ALLOWED_PORTION_UNITS.
 *
 * Requests always leave in a unit the API can price: mass units are converted
 * to grams first, portion units are sent through untouched.
 */
import type { CalculateItem, PortionConversion } from '../api/nutrition';

/**
 * Exact grams per unit. `oz` and `lb` are the international avoirdupois
 * definitions — both are exact, not approximations.
 */
export const MASS_UNITS: Record<string, number> = {
  g: 1,
  oz: 28.349523125,
  lb: 453.59237,
};

/** Display order for the always-available weight units. */
export const MASS_UNIT_ORDER = ['g', 'oz', 'lb'] as const;

/**
 * Density-dependent portion units the app exposes. Empty by product decision:
 * the app measures by weight. Re-add 'cup' / 'tsp' here once the backend has a
 * `portion_conversions` row for them and the picker will show them per food.
 */
export const ALLOWED_PORTION_UNITS = new Set<string>();

/** Is this a unit the picker will actually show for the given food? */
export function isOfferedUnit(unit: string, conversions: PortionConversion[]): boolean {
  if (isMassUnit(unit)) return true;
  return ALLOWED_PORTION_UNITS.has(unit) && conversions.some((c) => c.unit === unit);
}

export function isMassUnit(unit: string): boolean {
  return Object.prototype.hasOwnProperty.call(MASS_UNITS, unit);
}

/** Grams for a mass quantity, or null when the unit is food-specific. */
export function massToGrams(quantity: number, unit: string): number | null {
  const factor = MASS_UNITS[unit];
  return factor == null ? null : quantity * factor;
}

/** Grams expressed in `unit`, or null when the unit is food-specific. */
export function gramsToMass(grams: number, unit: string): number | null {
  const factor = MASS_UNITS[unit];
  return factor == null ? null : grams / factor;
}

/**
 * Restate a quantity in a different weight unit, keeping the actual weight the
 * same — 113.4 g becomes 4 oz, not 113.4 oz. Null if either unit is not a
 * weight unit, in which case the caller should leave the number alone.
 */
export function convertQuantity(quantity: number, from: string, to: string): number | null {
  if (from === to) return quantity;
  const grams = massToGrams(quantity, from);
  return grams == null ? null : gramsToMass(grams, to);
}

/** How many decimals are worth showing for a quantity in `unit`. */
export function quantityDecimals(unit: string): number {
  if (unit === 'g') return 1;
  if (unit === 'oz') return 2;
  if (unit === 'lb') return 3;
  return 2;
}

/** Number → text for the quantity input: trims trailing zeros, keeps "100". */
export function formatForInput(value: number, unit: string): string {
  let out = value.toFixed(quantityDecimals(unit));
  // Only trim inside the decimal part, or "100" would become "1".
  if (out.includes('.')) out = out.replace(/0+$/, '').replace(/\.$/, '');
  return out === '' || out === '-' ? '0' : out;
}

/**
 * The units to offer for one food: every weight unit, plus whichever portion
 * units the API has a conversion for.
 */
export function unitsForFood(conversions: PortionConversion[]): {
  mass: string[];
  portion: PortionConversion[];
} {
  const portion = conversions.filter(
    (c) => !isMassUnit(c.unit) && ALLOWED_PORTION_UNITS.has(c.unit)
  );
  return { mass: [...MASS_UNIT_ORDER], portion };
}

/** How much one tap of +/- moves the quantity, given the unit in play. */
export function stepFor(unit: string): number {
  if (unit === 'g') return 10;
  if (unit === 'oz') return 0.5; // half-ounce
  if (unit === 'lb') return 0.25; // quarter-pound
  return 1;
}

const VULGAR: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** 0.5 → "½", 1.5 → "1½", 2 → "2". Display only — inputs stay decimal. */
export function formatQuantity(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 100) / 100;
  const glyph = VULGAR[String(frac)];
  if (!glyph) return String(Number(n.toFixed(2)));
  return whole === 0 ? glyph : `${whole}${glyph}`;
}

/**
 * Build the payload item. A mass quantity is normalised to grams so the request
 * only ever uses units the backend can resolve; portion units pass straight on.
 */
export function toApiItem(foodId: string, quantity: number, unit: string): CalculateItem {
  const grams = massToGrams(quantity, unit);
  return grams == null
    ? { food_id: foodId, quantity, unit }
    : { food_id: foodId, quantity: grams, unit: 'g' };
}
