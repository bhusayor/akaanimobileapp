/**
 * Client for the Akaani Nutrition Calculation API.
 *
 * Contract (per spec):
 *   POST /v1/nutrition/calculate  { items: [{ food_id, quantity, unit }] }
 *   → per-item nutrition + totals. Quantity is never guessed server-side.
 *
 * Set EXPO_PUBLIC_AKAANI_API_URL to point at a real deployment. With it unset
 * the calls resolve against `./local-foods`, which runs the same Akaani food
 * table and the same per-100 g arithmetic in-process.
 */
import {
  groupFoods,
  localCalculate,
  localGetFood,
  localSearchFoodGroups,
  localSearchFoods,
  LOCAL_LATENCY_MS,
  sumNutrition,
} from './local-foods';

/**
 * How trustworthy a figure is, as stated by the source table. `trace` means a
 * real reading of ~0 (the nutrient IS present, in trace amounts) — quite
 * different from a missing value, which is represented by a null Nutrient.
 */
export type Confidence = 'measured' | 'estimated' | 'trace';

/**
 * One nutrient. `null` means the source had no value for it — per the PRD this
 * is never silently coerced to 0, because "unknown" and "zero" are different
 * claims about a food.
 */
export type Nutrient = { value: number; confidence: Confidence } | null;

/** Field names match the API payload (British "fibre", as the PRD returns). */
export type Nutrition = {
  calories: Nutrient;
  protein_g: Nutrient;
  fat_g: Nutrient;
  carbs_g: Nutrient;
  fibre_g: Nutrient;
};

/** Numeric value of a nutrient, or `null` when unknown. */
export function nutrientValue(n: Nutrient): number | null {
  return n ? n.value : null;
}

/** Numeric value, falling back to 0 — only for places that must have a number. */
export function nutrientOrZero(n: Nutrient): number {
  return n ? n.value : 0;
}

/** One row of the backend's `portion_conversions` table, for a single food. */
export type PortionConversion = {
  unit: string;
  /** Grams that one of `unit` weighs for THIS food. Never assumed client-side. */
  grams: number;
  /** Optional display label, e.g. "1 sachet (40g)". */
  label?: string;
};

export type Food = {
  food_id: string;
  name: string;
  /** Food group, e.g. "Cereals". */
  category?: string;
  /** Units with a valid gram conversion for this food. May be empty. */
  portion_conversions: PortionConversion[];
  /**
   * The conversion the backend flags as this food's default serving.
   * `null` when no row is flagged — the client must NOT invent one.
   */
  default_serving: { quantity: number; unit: string } | null;
};

/**
 * One preparation of an ingredient — "Fonio, white, whole grains, raw".
 *
 * A `Food` in every respect: it carries a real `food_id`, `name` is the
 * source's own English name for this preparation, and it can be logged as is.
 * `name_fr` is the source's French name for the same record, so a French
 * speaker sees the preparation described in their language rather than a
 * translation the app invented.
 */
export type FoodVariant = Food & {
  /** The same preparation, in French. Empty when the source has none. */
  name_fr: string;
};

/**
 * An ingredient, with every preparation of it the food table holds.
 *
 * Search returns these rather than raw foods: typing "fonio" should surface one
 * ingredient the cook recognises, not twelve rows they have to read word by
 * word to tell apart. The variants are chosen from inside it.
 */
export type FoodGroup = {
  group_id: string;
  /** English name, e.g. "Fonio". */
  name: string;
  /** French name(s). The source occasionally lists several. */
  name_fr: string[];
  /** Local/common names, e.g. ["Acha", "acca", "findi", "hungry rice"]. */
  local_names: string[];
  category?: string;
  variants: FoodVariant[];
  /**
   * The alternate name the query actually matched, when it was not the English
   * one — so the row can explain itself ("matched Acha") instead of looking
   * like a mistake to someone who typed a word that isn't on screen.
   */
  matched_on?: string;
};

export type CalculateItem = { food_id: string; quantity: number; unit: string };

export type NutritionErrorCode = 'needs_quantity_in_grams' | 'unsupported_portion';

export type CalculatedItem = CalculateItem & {
  grams?: number;
  nutrition?: Nutrition;
  error?: { code: NutritionErrorCode; message: string };
};

export type CalculateResponse = { items: CalculatedItem[]; totals: Nutrition };

export class NutritionApiError extends Error {
  code?: NutritionErrorCode | 'network' | 'http';
  status?: number;
  constructor(message: string, code?: NutritionApiError['code'], status?: number) {
    super(message);
    this.name = 'NutritionApiError';
    this.code = code;
    this.status = status;
  }
}

/** True when a thrown error means "this unit has no gram conversion for this food". */
export function isPortionError(err: unknown): err is NutritionApiError {
  return (
    err instanceof NutritionApiError &&
    (err.code === 'needs_quantity_in_grams' || err.code === 'unsupported_portion')
  );
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_AKAANI_API_URL ?? '';

/** When false every call in this module is served by the local fixture. */
export const usingLiveApi = API_BASE_URL.length > 0;

/** All-unknown nutrition — the identity value for sums. */
export const EMPTY_NUTRITION: Nutrition = {
  calories: null,
  protein_g: null,
  fat_g: null,
  carbs_g: null,
  fibre_g: null,
};

export { sumNutrition };

/** Scales every known nutrient; unknowns stay unknown. */
export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  const at = (cell: Nutrient): Nutrient =>
    cell && { value: Math.round(cell.value * factor * 100) / 100, confidence: cell.confidence };
  return {
    calories: at(n.calories),
    protein_g: at(n.protein_g),
    fat_g: at(n.fat_g),
    carbs_g: at(n.carbs_g),
    fibre_g: at(n.fibre_g),
  };
}

const TIMEOUT_MS = 12000;

async function request<T>(path: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // Caller-driven cancellation (debounced edits) chains into our timeout controller.
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener?.('abort', onAbort);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      // The API signals portion problems with a machine-readable code; surface it
      // as-is so the UI can revert the unit picker rather than guess a conversion.
      const code = body?.error?.code ?? body?.code;
      throw new NutritionApiError(
        body?.error?.message ?? body?.message ?? `Request failed (${res.status})`,
        code === 'needs_quantity_in_grams' || code === 'unsupported_portion' ? code : 'http',
        res.status
      );
    }
    return body as T;
  } catch (err) {
    if (err instanceof NutritionApiError) throw err;
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new NutritionApiError((err as Error)?.message ?? 'Network error', 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

/** POST /v1/nutrition/calculate — the one endpoint that owns portion maths. */
export async function calculateNutrition(
  items: CalculateItem[],
  signal?: AbortSignal
): Promise<CalculateResponse> {
  if (!usingLiveApi) return localCalculate(items, signal);
  return request<CalculateResponse>(
    '/v1/nutrition/calculate',
    { method: 'POST', body: JSON.stringify({ items }) },
    signal
  );
}

/**
 * Food lookup — supplies `portion_conversions` so the unit picker can be
 * constrained per food. Endpoint path is assumed; confirm against the real API.
 */
export async function getFood(foodId: string, signal?: AbortSignal): Promise<Food> {
  if (!usingLiveApi) return localGetFood(foodId, signal);
  return request<Food>(`/v1/foods/${encodeURIComponent(foodId)}`, { method: 'GET' }, signal);
}

/** Food search, for building a meal by hand. Endpoint path is assumed. */
export async function searchFoods(query: string, signal?: AbortSignal): Promise<Food[]> {
  if (!usingLiveApi) return localSearchFoods(query, signal);
  const res = await request<{ foods: Food[] }>(
    `/v1/foods/search?q=${encodeURIComponent(query)}`,
    { method: 'GET' },
    signal
  );
  return res.foods ?? [];
}

/**
 * Food search, grouped by ingredient — what the meal builder actually shows.
 *
 * The grouping and the English/French/local naming come from the client-side
 * food table either way. Against a live API the returned foods are folded into
 * that same index by `food_id`; anything the index does not recognise is
 * returned as an ingredient of its own rather than dropped.
 */
export async function searchFoodGroups(query: string, signal?: AbortSignal): Promise<FoodGroup[]> {
  if (!usingLiveApi) return localSearchFoodGroups(query, signal);
  return groupFoods(await searchFoods(query, signal));
}

export { LOCAL_LATENCY_MS };
