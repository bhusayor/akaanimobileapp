/**
 * Builds `src/data/foods.ts` — the app's only food table.
 *
 *   node scripts/build-food-data.js "<Akaani … App Import.csv>"
 *
 * Source: the Akaani West African Nutrition Data Model export. That file is the
 * single authority for both the names and the numbers; nothing here is merged
 * with, or checked against, any other table.
 *
 * One thing happens on the way in: ingredients that share an English name are
 * merged. The source splits "Cassava" into a tuber record and a leaves record
 * because they sit in different food groups, so a search for cassava returned
 * two identical-looking rows; merged, it returns one ingredient and the choice
 * between "Cassava, tuber, white flesh, raw" and "Cassava, leaves, fresh, raw".
 *
 * EVERY `variant_name_en` row is kept, exactly as the source names it — even
 * where two preparations happen to carry the same five figures. The wording is
 * the difference between them, and it is not ours to throw away.
 */
const fs = require('fs');
const path = require('path');

const csvPath = (process.argv[2] || '').replace(/^~/, process.env.HOME);
if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('usage: node scripts/build-food-data.js <App Import.csv>');
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); cur = ''; rows.push(row); row = []; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8').replace(/\r\n/g, '\n'));
const header = rows[0];
const records = rows
  .slice(1)
  .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));

/** Short, readable names for the source's food-group codes. */
const CATEGORY_LABELS = {
  CEREALS: 'Cereals',
  STARCHY_ROOTS_TUBERS: 'Starchy roots & tubers',
  LEGUMES: 'Legumes',
  VEGETABLES: 'Vegetables',
  FRUITS: 'Fruits',
  NUTS_SEEDS: 'Nuts & seeds',
  MEAT_POULTRY: 'Meat & poultry',
  EGGS: 'Eggs',
  FISH: 'Fish & seafood',
  MILK_DAIRY: 'Milk & dairy',
  FATS_OILS: 'Fats & oils',
  BEVERAGES: 'Beverages',
  MISCELLANEOUS: 'Miscellaneous',
  SOUPS_SAUCES: 'Soups & sauces',
};

// Category index = food_group_id − 1, so the array is ordered as the source is.
const categories = [];
for (const r of records) {
  const i = Number(r.food_group_id) - 1;
  const label = CATEGORY_LABELS[r.food_group_code];
  if (!label) throw new Error(`no label for food group ${r.food_group_code}`);
  if (categories[i] && categories[i] !== label) throw new Error(`group ${i} is both ${categories[i]} and ${label}`);
  categories[i] = label;
}

/** A blank cell means the source had no figure — it must never become 0. */
const num = (raw) => (raw === '' ? null : Number(raw));

/**
 * `SOURCE_COMPLETE` is the source vouching for the figure; the other two states
 * say it is the best available rather than a clean measurement.
 */
const quality = (status) => (status === 'SOURCE_COMPLETE' ? 0 : 1);

const groups = new Map();
for (const r of records) {
  if (!groups.has(r.food_code)) {
    groups.set(r.food_code, {
      id: r.food_code,
      nameEn: r.food_name_en,
      nameFr: r.food_name_fr,
      local: r.local_names,
      category: Number(r.food_group_id) - 1,
      variants: [],
    });
  }
  const g = groups.get(r.food_code);
  if (g.nameEn !== r.food_name_en) throw new Error(`inconsistent name for ${r.food_code}`);
  g.variants.push({
    order: records.indexOf(r), // the source's own ordering, used to break fold ties
    id: r.variant_code,
    nameEn: r.variant_name_en,
    nameFr: r.variant_name_fr,
    kcal: num(r.energy_kcal_per_100g),
    protein: num(r.protein_g_per_100g),
    carbs: num(r.carbohydrate_g_per_100g),
    fat: num(r.fat_g_per_100g),
    fibre: num(r.fiber_g_per_100g),
    quality: quality(r.quality_status),
  });
}

// --- merge ingredients that share an English name ----------------------------------
const byName = new Map();
let mergedGroups = 0;
for (const g of groups.values()) {
  const key = g.nameEn.toLowerCase();
  const first = byName.get(key);
  if (!first) {
    byName.set(key, g);
    continue;
  }
  // Keep every name either record answers to, and every preparation.
  first.variants.push(...g.variants);
  first.variants.sort((a, b) => a.order - b.order);
  const merge = (a, b) => [...new Set([...a.split(';'), ...b.split(';')].map((s) => s.trim()).filter(Boolean))].join('; ');
  first.nameFr = merge(first.nameFr, g.nameFr);
  first.local = merge(first.local, g.local);
  // The food group with more preparations is the one the name mostly means.
  if (g.variants.length > first.variants.length - g.variants.length) first.category = g.category;
  mergedGroups++;
}

const list = [...byName.values()].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
const totalVariants = list.reduce((n, g) => n + g.variants.length, 0);

const q = (s) => JSON.stringify(s);
const cell = (n) => (n === null ? 'null' : String(n));

const out = [];
out.push(`/**
 * The Akaani food table: ${list.length} ingredients over ${totalVariants} preparations, per 100 g.
 *
 * Generated by \`scripts/build-food-data.js\` from the Akaani West African
 * Nutrition Data Model export — the single source for both the names and the
 * numbers. Do not hand-edit.
 *
 * A \`null\` nutrient means the source had no figure for it. It is NEVER read as
 * zero: "unknown" and "none" are different claims about a food.
 *
 * Every preparation the source lists is here, named as it names them. The only
 * reshaping is that ${mergedGroups} ingredients sharing an English name (the source splits
 * e.g. cassava tuber from cassava leaves) were merged into one, so a search
 * does not return the same ingredient twice. No figure was changed.
 */

/** Food-group names, indexed as the source orders them. */
export const FOOD_CATEGORIES: string[] = [
${categories.map((c) => `  ${q(c)},`).join('\n')}
];

/**
 * One preparation of an ingredient, per 100 g.
 *
 * Kept as a tuple to keep the bundle small:
 *   [id, name_en, name_fr, kcal, protein_g, carbs_g, fat_g, fibre_g, quality]
 *
 * \`quality\` is 0 when the source marked the record complete and 1 when it
 * flagged the values as lower-quality or still under review.
 */
export type FoodVariantRow = [
  id: string,
  nameEn: string,
  nameFr: string,
  kcal: number | null,
  protein: number | null,
  carbs: number | null,
  fat: number | null,
  fibre: number | null,
  quality: 0 | 1,
];

export type FoodGroupRow = [
  id: string,
  nameEn: string,
  /** French name(s), "; " separated — the source sometimes lists several. */
  nameFr: string,
  /** Local and common names, "; " separated. Empty when the source lists none. */
  localNames: string,
  /** Index into FOOD_CATEGORIES. */
  categoryIndex: number,
  variants: FoodVariantRow[],
];

export const FOOD_GROUPS: FoodGroupRow[] = [`);

for (const g of list) {
  out.push(`  [${q(g.id)}, ${q(g.nameEn)}, ${q(g.nameFr)}, ${q(g.local)}, ${g.category}, [`);
  for (const v of g.variants) {
    out.push(
      `    [${q(v.id)}, ${q(v.nameEn)}, ${q(v.nameFr)}, ${cell(v.kcal)}, ${cell(v.protein)}, ${cell(v.carbs)}, ${cell(v.fat)}, ${cell(v.fibre)}, ${v.quality}],`
    );
  }
  out.push(`  ]],`);
}
out.push(`];
`);

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'foods.ts'), out.join('\n'));
console.log(
  `wrote src/data/foods.ts — ${list.length} ingredients, ${totalVariants} preparations ` +
    `(merged ${mergedGroups} same-named ingredients; every variant_name_en row kept)`
);
