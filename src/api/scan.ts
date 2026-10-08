/**
 * Scan Your Meal — photo → named meal → nutrition.
 *
 * The order matters and follows the feature spec:
 *   1. A vision model looks at the photo and names the dish. It is shown the
 *      Akaani meal catalogue and asked to point at an entry when one fits.
 *   2. Akaani's own data wins. If the dish is in the catalogue (by the id the
 *      model picked, or by name), its per-serving figures are used as-is.
 *   3. Only when Akaani has nothing for the dish does the model's own estimate
 *      stand in, and the result is labelled as an estimate.
 *
 * Where the vision call runs:
 *   - EXPO_PUBLIC_PLATFORM_API_URL set → POST /v1/scan/identify and
 *     /v1/scan/estimate on platform-api, which holds the OpenAI key. Both need
 *     the signed-in user's bearer token (see `api/platform.ts`). Request body
 *     is `IdentifyRequest` / `EstimateRequest`; the envelope's `data` is an
 *     `AiMealReading`.
 *   - Development builds only: EXPO_PUBLIC_OPENAI_API_KEY calls OpenAI straight
 *     from the device, so the feature can be tried before the backend exists.
 *     An EXPO_PUBLIC_ value ships inside the JS bundle, so this path is
 *     compiled out of release builds — never put a real key in production.
 *   - Neither → a demo recogniser that cycles through known dishes, flagged
 *     `demo` so the review screen can say so.
 */
import { MEALS, type Meal } from '../data/meals';
import { PlatformApiError, platformRequest, usingPlatformApi } from './platform';

export type ScanSource = 'akaani' | 'ai';

/** Nutrition for ONE serving, as the source describes a serving. */
export type ScanResult = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** What "one serving" means here — "1 serving", "about 350 g". */
  servingLabel: string;
  /** Present when the figures are Akaani's own. */
  mealId?: string;
  source: ScanSource;
  /** How sure the model was about what it saw. Absent for typed lookups. */
  confidence?: 'high' | 'medium' | 'low';
  /** Components the model could see on the plate, for the review screen. */
  components: string[];
  /** True when no recogniser is configured and this is a canned result. */
  demo?: boolean;
};

export class ScanError extends Error {
  code: 'not_food' | 'network' | 'unrecognised' | 'session_expired';
  constructor(message: string, code: ScanError['code']) {
    super(message);
    this.name = 'ScanError';
    this.code = code;
  }
}

/** What the model returns, both from the backend and from OpenAI directly. */
export type AiMealReading = {
  is_food: boolean;
  name: string;
  /** Id from the catalogue the model was shown, or null if nothing fits. */
  akaani_meal_id: string | null;
  components: string[];
  portion_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  confidence: 'high' | 'medium' | 'low';
};

export type IdentifyRequest = {
  image_base64: string;
  catalog: { id: string; name: string }[];
};

export type EstimateRequest = {
  name: string;
  catalog: { id: string; name: string }[];
};

const OPENAI_KEY = __DEV__ ? (process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '') : '';
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';
const TIMEOUT_MS = 30000;

/** Which recogniser this build will use — shown on the camera screen in dev. */
export const scanMode: 'backend' | 'openai-dev' | 'demo' = usingPlatformApi
  ? 'backend'
  : OPENAI_KEY
    ? 'openai-dev'
    : 'demo';

const CATALOG = MEALS.map((m) => ({ id: m.id, name: m.name }));

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Photo → result. Throws `ScanError` for "not food" and failed calls. */
export async function scanMealPhoto(imageBase64: string, signal?: AbortSignal): Promise<ScanResult> {
  if (scanMode === 'demo') return demoRecognise(signal);

  const reading =
    scanMode === 'backend'
      ? await backend<AiMealReading>(
          '/v1/scan/identify',
          { image_base64: imageBase64, catalog: CATALOG } satisfies IdentifyRequest,
          signal
        )
      : await openAi(
          [
            { type: 'text', text: catalogPrompt() },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' },
            },
          ],
          signal
        );

  if (!reading.is_food) {
    throw new ScanError("That doesn't look like a meal. Try again with the plate in frame.", 'not_food');
  }
  return resolve(reading);
}

/**
 * The user corrected the name — look it up again. Akaani's catalogue first,
 * then a typed-name estimate from the model.
 */
export async function lookupMealByName(name: string, signal?: AbortSignal): Promise<ScanResult> {
  const trimmed = name.trim();
  const meal = matchAkaaniMeal(null, trimmed);
  if (meal) return fromAkaani(meal, []);

  if (scanMode === 'demo') {
    throw new ScanError(
      `"${trimmed}" isn't in the Akaani kitchen yet, and estimates need the scan service.`,
      'unrecognised'
    );
  }
  const reading =
    scanMode === 'backend'
      ? await backend<AiMealReading>(
          '/v1/scan/estimate',
          { name: trimmed, catalog: CATALOG } satisfies EstimateRequest,
          signal
        )
      : await openAi(
          [{ type: 'text', text: `${catalogPrompt()}\n\nThere is no photo. The meal is: "${trimmed}".` }],
          signal
        );
  // The user typed this, so keep their wording even if the model tidied it.
  const result = resolve({ ...reading, is_food: true });
  // No photo was read, so there is no photo confidence to report.
  return { ...result, confidence: undefined, name: result.mealId ? result.name : trimmed };
}

/* ------------------------------------------------------------------ */
/* Akaani first                                                        */
/* ------------------------------------------------------------------ */

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));

const STOP_WORDS = new Set(['and', 'with', 'the', 'a', 'of', 'nigerian', 'style', 'plate', 'bowl']);

/**
 * The catalogue entry for this dish, if Akaani has one. The model's id is
 * trusted only when it exists; otherwise the names must overlap closely, so
 * "Jollof Rice" finds "Party Jollof Rice" but "Fried Rice" does not.
 */
export function matchAkaaniMeal(id: string | null, name: string): Meal | undefined {
  if (id) {
    const byId = MEALS.find((m) => m.id === id);
    if (byId) return byId;
  }
  const want = normalise(name);
  if (want.length === 0) return undefined;
  let best: { meal: Meal; score: number } | undefined;
  for (const meal of MEALS) {
    const have = normalise(meal.name);
    const shared = want.filter((w) => have.includes(w)).length;
    // Every word the user/model said must appear, and they must cover most of the dish name.
    if (shared !== want.length) continue;
    const score = shared / have.length;
    if (score >= 0.6 && (!best || score > best.score)) best = { meal, score };
  }
  return best?.meal;
}

function fromAkaani(meal: Meal, components: string[], confidence?: ScanResult['confidence']): ScanResult {
  return {
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber,
    servingLabel: '1 serving',
    mealId: meal.id,
    source: 'akaani',
    confidence,
    components,
  };
}

function resolve(reading: AiMealReading): ScanResult {
  const meal = matchAkaaniMeal(reading.akaani_meal_id, reading.name);
  if (meal) return fromAkaani(meal, reading.components, reading.confidence);

  if (!(reading.calories > 0)) {
    throw new ScanError("We couldn't estimate that one. Try a clearer photo, or type the name.", 'unrecognised');
  }
  const r = (n: number) => Math.max(0, Math.round(n));
  return {
    name: reading.name,
    calories: r(reading.calories),
    protein: r(reading.protein_g),
    carbs: r(reading.carbs_g),
    fat: r(reading.fat_g),
    fiber: r(reading.fibre_g),
    servingLabel: reading.portion_grams > 0 ? `about ${roundTo(reading.portion_grams, 10)} g` : 'as pictured',
    source: 'ai',
    confidence: reading.confidence,
    components: reading.components,
  };
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/* ------------------------------------------------------------------ */
/* Transports                                                          */
/* ------------------------------------------------------------------ */

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener?.('abort', onAbort);
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', onAbort);
    },
  };
}

async function backend<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  try {
    return await platformRequest<T>(path, { method: 'POST', body, signal, timeoutMs: TIMEOUT_MS });
  } catch (err) {
    if (!(err instanceof PlatformApiError)) throw err;
    if (err.sessionExpired) {
      throw new ScanError('Your session has expired. Sign in again to scan meals.', 'session_expired');
    }
    if (err.status === 404) {
      throw new ScanError('Meal scanning isn\'t available on the server yet.', 'network');
    }
    // platform-api's messages are written for users ("You've scanned a lot of meals this hour…").
    throw new ScanError(err.message, 'network');
  }
}

const SYSTEM_PROMPT = `You identify meals for akaani, a nutrition app focused on Nigerian and West African food.
Name the dish the way a Nigerian home cook would (e.g. "Jollof Rice & Fried Plantain").
If the dish matches an entry in the Akaani catalogue, set akaani_meal_id to that id; otherwise null.
Always estimate the portion shown (portion_grams) and its nutrition for that whole portion.
If the image is not food, set is_food to false and use 0 for the numbers.
Be honest about uncertainty through the confidence field.`;

const READING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'is_food', 'name', 'akaani_meal_id', 'components', 'portion_grams',
    'calories', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g', 'confidence',
  ],
  properties: {
    is_food: { type: 'boolean' },
    name: { type: 'string' },
    akaani_meal_id: { type: ['string', 'null'] },
    components: { type: 'array', items: { type: 'string' } },
    portion_grams: { type: 'number' },
    calories: { type: 'number' },
    protein_g: { type: 'number' },
    carbs_g: { type: 'number' },
    fat_g: { type: 'number' },
    fibre_g: { type: 'number' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
} as const;

const catalogPrompt = () =>
  `Akaani catalogue (id: name):\n${CATALOG.map((m) => `${m.id}: ${m.name}`).join('\n')}`;

/** Development-only direct call. See the header comment before touching this. */
async function openAi(content: unknown[], signal?: AbortSignal): Promise<AiMealReading> {
  const t = withTimeout(signal);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'meal_reading', strict: true, schema: READING_SCHEMA },
        },
      }),
      signal: t.signal,
    });
    if (!res.ok) throw new Error(`OpenAI request failed (${res.status})`);
    const body = await res.json();
    return JSON.parse(body.choices[0].message.content) as AiMealReading;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError' && signal?.aborted) throw err;
    throw new ScanError("Couldn't read your plate just now. Check your connection and try again.", 'network');
  } finally {
    t.done();
  }
}

/* ------------------------------------------------------------------ */
/* Demo recogniser — no service configured                             */
/* ------------------------------------------------------------------ */

const DEMO_ESTIMATES: AiMealReading[] = [
  { is_food: true, name: 'Meat Pie', akaani_meal_id: null, components: ['pastry', 'minced beef', 'potato'], portion_grams: 150, calories: 385, protein_g: 11, carbs_g: 38, fat_g: 21, fibre_g: 2, confidence: 'medium' },
  { is_food: true, name: 'Chicken Shawarma', akaani_meal_id: null, components: ['flatbread', 'chicken', 'cabbage', 'mayonnaise'], portion_grams: 320, calories: 640, protein_g: 34, carbs_g: 52, fat_g: 31, fibre_g: 4, confidence: 'high' },
  { is_food: true, name: 'Puff Puff (4 pieces)', akaani_meal_id: null, components: ['fried dough'], portion_grams: 120, calories: 340, protein_g: 6, carbs_g: 52, fat_g: 12, fibre_g: 2, confidence: 'medium' },
];

let demoCounter = 0;
async function demoRecognise(signal?: AbortSignal): Promise<ScanResult> {
  await new Promise<void>((done, fail) => {
    const timer = setTimeout(done, 2000);
    signal?.addEventListener?.('abort', () => {
      clearTimeout(timer);
      fail(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    });
  });
  demoCounter++;
  const result =
    demoCounter % 2 === 1
      ? fromAkaani(MEALS[(demoCounter * 5) % MEALS.length], [], 'high')
      : resolve(DEMO_ESTIMATES[(demoCounter >> 1) % DEMO_ESTIMATES.length]);
  return { ...result, demo: true };
}
