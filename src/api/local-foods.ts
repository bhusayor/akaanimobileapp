/**
 * The Akaani food table, served locally.
 *
 * This is the same data and the same arithmetic the backend performs, running
 * in-process so the app works before `EXPO_PUBLIC_AKAANI_API_URL` is pointed at
 * a deployment. Every number comes from `src/data/foods.ts`, generated from the
 * Akaani West African Nutrition Data Model export.
 *
 * Core rule, straight from the PRD:
 *   one record per food, per 100 g → value × (grams / 100)
 *   a nutrient the source lacks stays null; it never becomes 0.
 */
import {
  FOOD_CATEGORIES,
  FOOD_GROUPS,
  type FoodGroupRow,
  type FoodVariantRow,
} from '../data/foods';
import type {
  CalculatedItem,
  CalculateItem,
  CalculateResponse,
  Food,
  FoodGroup,
  FoodVariant,
  Nutrient,
  Nutrition,
} from './nutrition';

export const LOCAL_LATENCY_MS = 160;

/**
 * The source vouches for a record as a whole rather than nutrient by nutrient,
 * so every figure in a row carries that row's standing.
 */
const CONFIDENCE = ['measured', 'estimated'] as const;

const VARIANT_BY_ID = new Map<string, FoodVariantRow>();
const GROUP_OF_VARIANT = new Map<string, FoodGroupRow>();
const GROUP_BY_ID = new Map<string, FoodGroupRow>();
for (const group of FOOD_GROUPS) {
  GROUP_BY_ID.set(group[0], group);
  for (const variant of group[5]) {
    VARIANT_BY_ID.set(variant[0], variant);
    GROUP_OF_VARIANT.set(variant[0], group);
  }
}

/**
 * Ingredients people actually cook with, to fill the search list before anything
 * is typed. Ids, not names, so a wording change in the source cannot silently
 * empty the list.
 */
const POPULAR_GROUP_IDS = [
  'FD000040', // Rice
  'FD000209', // Chicken
  'FD000138', // Tomato
  'FD000127', // Onion
  'FD000274', // Palm oil
  'FD000231', // Egg
  'FD000087', // Cowpea
  'FD000066', // Plantain
  'FD000074', // Yam
  'FD000053', // Cassava
  'FD000195', // Melon seed (egusi)
  'FD000206', // Beef meat
  'FD000191', // Groundnut
  'FD000250', // Sardine
  'FD000130', // Pumpkin (ugu leaves)
  'FD000126', // Okra
];

/**
 * Two-decimal rounding that agrees with the backend's Python `round(x, 2)`.
 *
 * `Math.round(x * 100) / 100` does not: multiplying first introduces float
 * error and rounds half-up, so 0.5 × 0.37 lands on 0.19 where Python gives
 * 0.18. Python rounds the exact binary value and breaks a true tie to the even
 * digit, so both behaviours are reproduced here — otherwise the app would show
 * figures a cent off from the server's for ~2% of values.
 */
function round(n: number): number {
  if (!Number.isFinite(n)) return n;
  const sign = n < 0 ? -1 : 1;
  const a = Math.abs(n);
  // Exact decimal expansion, far enough out to tell a true tie from a near one.
  const expanded = a.toFixed(20);
  const dot = expanded.indexOf('.');
  const third = expanded[dot + 3];
  const tail = expanded.slice(dot + 4);
  if (third === '5' && /^0+$/.test(tail)) {
    // Exactly halfway → round half to even, as Python does. Read the truncated
    // hundredths off the string so no float error creeps back in.
    const truncated = Number(expanded.slice(0, dot) + expanded.slice(dot + 1, dot + 3));
    const even = truncated % 2 === 0 ? truncated : truncated + 1;
    return (sign * even) / 100;
  }
  return sign * Number(a.toFixed(2));
}

function scale(variant: FoodVariantRow, factor: number): Nutrition {
  const confidence = CONFIDENCE[variant[8]];
  const at = (value: number | null): Nutrient =>
    value === null ? null : { value: round(value * factor), confidence };
  return {
    calories: at(variant[3]),
    protein_g: at(variant[4]),
    carbs_g: at(variant[5]),
    fat_g: at(variant[6]),
    fibre_g: at(variant[7]),
  };
}

/**
 * The table holds per-100 g records and no portion sizes, so 100 g — the amount
 * the data itself is expressed in — is the only defensible starting quantity.
 * It is NOT a serving size. Real servings need `portion_conversions`.
 */
const REFERENCE_GRAMS = 100;

function toFood(variant: FoodVariantRow, group: FoodGroupRow | undefined): Food {
  return {
    food_id: variant[0],
    name: variant[1],
    category: group ? FOOD_CATEGORIES[group[4]] : undefined,
    // Grams is the only unit this table can price. tsp/cup/piece require the
    // backend's portion_conversions table, which this dataset does not include.
    portion_conversions: [{ unit: 'g', grams: 1 }],
    default_serving: { quantity: REFERENCE_GRAMS, unit: 'g' },
  };
}

const abortError = () => {
  const err = new Error('Aborted');
  err.name = 'AbortError';
  return err;
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const t = setTimeout(resolve, ms);
    signal?.addEventListener?.('abort', () => {
      clearTimeout(t);
      reject(abortError());
    });
  });

/**
 * Nigerian and West African kitchen names → the wording the table uses.
 *
 * Search only. This never touches a nutrition figure; it just means typing
 * "egusi" finds "Melon seed" instead of nothing. The table's own French and
 * local-name columns cover far more than this list — these are the dish and
 * street names a food table would never carry.
 */
const SEARCH_ALIASES: Record<string, string> = {
  egusi: 'melon seed',
  ugu: 'pumpkin',
  // Gari, and the eba made from it, are cassava — the ingredient, not just the
  // one preparation whose name happens to spell "gari" out.
  eba: 'cassava',
  gari: 'cassava',
  garri: 'cassava',
  iru: 'locust bean',
  dawadawa: 'locust bean',
  'ata rodo': 'pepper',
  tatashe: 'pepper',
  titus: 'mackerel',
  'moi moi': 'cowpea',
  akara: 'cowpea',
  suya: 'beef meat',
  dodo: 'plantain',
  pap: 'maize porridge',
  ogi: 'maize porridge',
  crayfish: 'shrimp',
  amala: 'yam',
  shaki: 'tripe',
  nkwobi: 'tripe',
  'kuli kuli': 'groundnut',
  ewedu: 'jute mallow',
  okro: 'okra',
  agege: 'bread',
  zobo: 'hibiscus',
  kunu: 'millet',
  bitterleaf: 'vernonia',
  tuwo: 'maize',
  fufu: 'cassava',
  ponmo: 'beef tripe',
};

/**
 * Accent-insensitive lowercase.
 *
 * Typed on a phone, "mais" has to find "Maïs" and "epinard" has to find
 * "Épinard" — nobody long-presses a key to search. `String.normalize` is not
 * dependable across the JS engines React Native ships, so the fold is an
 * explicit table over the Latin-1 letters this dataset actually contains.
 */
const ACCENTS: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a', æ: 'ae',
  ç: 'c',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ñ: 'n',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o', ø: 'o', œ: 'oe',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ý: 'y', ÿ: 'y',
  '’': "'", '‘': "'", '«': '"', '»': '"',
};

function fold(text: string): string {
  return text.toLowerCase().replace(/[àáâãäåæçèéêëìíîïñòóôõöøœùúûüýÿ’‘«»]/g, (c) => ACCENTS[c] ?? c);
}

/** "; "-separated source fields → a trimmed list, empty entries dropped. */
const splitNames = (field: string): string[] =>
  field
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * A preparation, named exactly as the source names it in both languages. The
 * app does not shorten or re-word either one: the distinction between two
 * preparations often lives in the wording, so trimming it would be trimming the
 * only thing that tells them apart.
 */
function toVariant(group: FoodGroupRow, variant: FoodVariantRow): FoodVariant {
  return {
    ...toFood(variant, group),
    name_fr: variant[2],
  };
}

function toGroup(group: FoodGroupRow, matchedOn?: string): FoodGroup {
  return {
    group_id: group[0],
    name: group[1],
    name_fr: splitNames(group[2]),
    local_names: splitNames(group[3]),
    category: FOOD_CATEGORIES[group[4]],
    variants: group[5].map((v) => toVariant(group, v)),
    ...(matchedOn ? { matched_on: matchedOn } : {}),
  };
}

/**
 * Every name this ingredient answers to, folded once and cached.
 *
 * `group` holds the names shown on the row (English, French, local); `deep`
 * additionally holds every preparation name in both languages, so "white rice"
 * still finds Rice even though no name at the ingredient level says "white".
 */
type Haystack = { names: string[]; group: string; deep: string };
const HAYSTACKS = new Map<string, Haystack>();

function haystack(group: FoodGroupRow): Haystack {
  const cached = HAYSTACKS.get(group[0]);
  if (cached) return cached;
  const names = [group[1], ...splitNames(group[2]), ...splitNames(group[3])];
  const built: Haystack = {
    names,
    group: fold(names.join(' | ')),
    deep: fold(group[5].map((v) => `${v[1]} | ${v[2]}`).join(' | ')),
  };
  HAYSTACKS.set(group[0], built);
  return built;
}

/**
 * Does `text` contain `term` at the start of a word?
 *
 * Plain `includes` makes "gari" a hit on "mar-gari-ne" and "yam" a hit on
 * "coco-yam", which is how a search for gari ends up recommending margarine.
 * A hit mid-word is still a hit, just a much weaker one.
 */
function containsWord(text: string, term: string): boolean {
  let from = 0;
  for (;;) {
    const at = text.indexOf(term, from);
    if (at === -1) return false;
    if (at === 0 || /[\s,;:/()[\]'"|-]/.test(text[at - 1])) return true;
    from = at + 1;
  }
}

/** An alternate name worth printing on the row — short, and not the English one. */
const ALT_NAME_MAX = 34;

/**
 * How well an ingredient answers to `term`, and which of its names did it.
 *
 * Ranked so an exact name beats a prefix beats a whole-word mention beats a
 * fragment, and so a match on the ingredient itself always outranks one buried
 * in a preparation — searching "rice" should lead with Rice, not with "Moui
 * naagdme: rice with fish".
 */
function scoreGroup(group: FoodGroupRow, term: string): { score: number; matched?: string } {
  const hay = haystack(group);
  const tokens = term.split(/\s+/).filter(Boolean);

  if (tokens.every((t) => hay.group.includes(t))) {
    // Which single name carried it, for the "also called" line.
    let matched: string | undefined;
    let best = 0;
    hay.names.forEach((name, i) => {
      const folded = fold(name);
      const rank =
        folded === term ? 4 : folded.startsWith(term) ? 3 : containsWord(folded, term) ? 2 : folded.includes(term) ? 1 : 0;
      if (rank > best) {
        best = rank;
        // Index 0 is the English name, already on the row. A whole recipe title
        // is a name in the data but not a useful "also called" — skip those.
        matched = i > 0 && name.length <= ALT_NAME_MAX && fold(name) !== fold(hay.names[0]) ? name : undefined;
      }
    });
    return { score: [45, 35, 60, 80, 100][best], matched };
  }

  // Not in the ingredient's own names — try its preparations.
  if (tokens.every((t) => `${hay.group} | ${hay.deep}`.includes(t))) return { score: 25 };
  return { score: 0 };
}

/** The ingredient a given food_id belongs to, or undefined if unknown. */
export function groupIdForFood(foodId: string): string | undefined {
  return GROUP_OF_VARIANT.get(foodId)?.[0];
}

/**
 * Folds a flat list of foods into ingredients, preserving the order they came
 * in. Foods the table does not recognise become one-preparation ingredients of
 * their own — a search result is never dropped just because it is unfamiliar.
 */
export function groupFoods(foods: Food[]): FoodGroup[] {
  const out: FoodGroup[] = [];
  const seen = new Set<string>();
  for (const food of foods) {
    const group = GROUP_OF_VARIANT.get(food.food_id);
    if (!group) {
      out.push({
        group_id: food.food_id,
        name: food.name,
        name_fr: [],
        local_names: [],
        category: food.category,
        variants: [{ ...food, name_fr: '' }],
      });
      continue;
    }
    if (seen.has(group[0])) continue;
    seen.add(group[0]);
    out.push(toGroup(group));
  }
  return out;
}

const MAX_GROUP_RESULTS = 30;

/**
 * Ingredient search over English, French and local names.
 *
 * An empty query returns the curated shortlist above.
 */
export async function localSearchFoodGroups(
  query: string,
  signal?: AbortSignal
): Promise<FoodGroup[]> {
  await sleep(LOCAL_LATENCY_MS, signal);
  // Punctuation the user types ("rice, white") must not become a token that no
  // haystack can match — the table stores it, the query should not depend on it.
  const q = fold(query).replace(/[,;:.]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) {
    return POPULAR_GROUP_IDS.map((id) => GROUP_BY_ID.get(id))
      .filter((g): g is FoodGroupRow => !!g)
      .map((g) => toGroup(g));
  }

  // The words typed, then the table's wording for them, so "egusi" and "melon
  // seed" reach the same ingredient. The alias never outranks a direct hit.
  const terms: { term: string; penalty: number }[] = [{ term: q, penalty: 0 }];
  const alias = SEARCH_ALIASES[q];
  if (alias) terms.push({ term: fold(alias).replace(/[,;:.]+/g, ' ').trim(), penalty: 5 });

  const hits = new Map<string, { group: FoodGroupRow; score: number; matched?: string }>();
  for (const { term, penalty } of terms) {
    for (const group of FOOD_GROUPS) {
      const { score, matched } = scoreGroup(group, term);
      if (score === 0) continue;
      const total = score - penalty;
      const prev = hits.get(group[0]);
      if (!prev || total > prev.score) hits.set(group[0], { group, score: total, matched });
    }
  }

  return [...hits.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.group[1].length - b.group[1].length || // the plainer name first: "Rice" before "Rice flour"
        a.group[1].localeCompare(b.group[1])
    )
    .slice(0, MAX_GROUP_RESULTS)
    .map((hit) => toGroup(hit.group, hit.matched));
}

/** Flat food search, kept for callers that want records rather than ingredients. */
export async function localSearchFoods(query: string, signal?: AbortSignal): Promise<Food[]> {
  const groups = await localSearchFoodGroups(query, signal);
  return groups.flatMap((g) => g.variants);
}

export async function localGetFood(foodId: string, signal?: AbortSignal): Promise<Food> {
  await sleep(LOCAL_LATENCY_MS, signal);
  const variant = VARIANT_BY_ID.get(foodId);
  if (!variant) throw new Error(`Unknown food_id: ${foodId}`);
  return toFood(variant, GROUP_OF_VARIANT.get(foodId));
}

export async function localCalculate(
  items: CalculateItem[],
  signal?: AbortSignal
): Promise<CalculateResponse> {
  await sleep(LOCAL_LATENCY_MS, signal);

  const out: CalculatedItem[] = items.map((item) => {
    const variant = VARIANT_BY_ID.get(item.food_id);
    if (!variant) {
      return {
        ...item,
        error: { code: 'unsupported_portion' as const, message: `Unknown food: ${item.food_id}` },
      };
    }
    if (item.unit !== 'g') {
      // Refuse rather than estimate — exactly what the real API does when no
      // portion_conversions row exists for this food and unit.
      return {
        ...item,
        error: {
          code: 'needs_quantity_in_grams' as const,
          message: `No gram conversion for "${item.unit}" on ${variant[1]}`,
        },
      };
    }
    const grams = item.quantity;
    return { ...item, grams: round(grams), nutrition: scale(variant, grams / 100) };
  });

  return { items: out, totals: sumNutrition(out.map((i) => i.nutrition)) };
}

/**
 * Adds nutrients across items. A nutrient is null only when every contributor
 * was null; when some were known and some were not, the sum is a lower bound,
 * so its confidence degrades to "estimated".
 */
export function sumNutrition(list: (Nutrition | undefined)[]): Nutrition {
  const keys = ['calories', 'protein_g', 'fat_g', 'carbs_g', 'fibre_g'] as const;
  const totals = {} as Nutrition;
  for (const key of keys) {
    let sum = 0;
    let known = 0;
    let missing = 0;
    let estimated = false;
    for (const n of list) {
      const cell = n?.[key];
      if (!cell) {
        if (n) missing++;
        continue;
      }
      sum += cell.value;
      known++;
      if (cell.confidence === 'estimated') estimated = true;
    }
    totals[key] = known
      ? { value: round(sum), confidence: estimated || missing > 0 ? 'estimated' : 'measured' }
      : null;
  }
  return totals;
}
