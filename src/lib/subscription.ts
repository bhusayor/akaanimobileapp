import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useBilling } from './billing';

/**
 * Who is entitled to what.
 *
 * The rule the whole app hangs off is short: exact macro numbers — calories,
 * protein, carbs, fat, fibre — are blurred on every surface until the user is
 * on Premium. Nutrition tags, the meal database, Explore, streaks and meal
 * logging stay free. A handful of whole features (grocery list, next week's
 * plan, the photo walkthrough, Lu's swaps and plan rebuilds) are Premium-only.
 *
 * Premium access is derived from the store-verified RevenueCat entitlement.
 */

export type BillingCycle = 'monthly' | 'yearly';

/** Everything Free gets, in the order it is shown on the paywall. */
export const FREE_FEATURES: { title: string; body: string }[] = [
  { title: 'Meal database', body: 'Browse all 200+ Nigerian and African meals — names, photos, descriptions' },
  { title: 'Nutrition tags', body: 'High-Protein, Keto-Friendly, Gut Friendly and Low-Calorie tags on every meal' },
  { title: 'Explore', body: 'All categories and filters, fully accessible' },
  { title: 'Macro dashboard', body: 'Your daily dashboard is visible — the numbers stay blurred until you upgrade' },
  { title: 'Weekly meal plan', body: "Generate this week's plan — macros blurred inside it" },
  { title: 'Meal logging', body: 'Log any meal you cook, as many as you like' },
  { title: 'Streak tracking', body: 'Full streak tracking — free forever' },
  { title: 'Lu, your food guide', body: 'General chat, meals by goal, and the goals you set at onboarding' },
  { title: 'Recipe instructions', body: 'Step-by-step written instructions for every meal' },
];

/**
 * Everything Premium adds, in the order it is shown.
 *
 * Lu's five separate unlocks — exact figures, memory, swaps, rebuilds, custom
 * meals — are one line here. Split out they read as five ways of saying "Lu is
 * better", which makes the list look padded rather than generous.
 */
export const PREMIUM_FEATURES: { title: string; body: string }[] = [
  {
    title: 'Full macro data',
    body: 'Calories, protein, carbs, fat and fibre unlocked everywhere — nothing blurred',
  },
  {
    title: 'Lu, fully unlocked',
    body: 'Exact macros in conversation, meal swaps, week rebuilds, meals of your own, and a Lu that remembers every meal you have talked about',
  },
  {
    title: 'Build meals from ingredients',
    body: 'Search the food table, set each portion, and log exactly what went on the plate',
  },
  { title: 'Next week planning', body: "Generate next week's plan mid-week" },
  { title: 'Grocery list', body: 'Auto-generated from your weekly plan in one tap' },
  { title: 'Image walkthrough', body: 'Step-by-step cooking mode with a photo for every step' },
];

/**
 * The plate behind each paywall.
 *
 * Wikimedia Commons, like the rest of the app's photography — a stable CDN, no
 * API key, and permissive licensing (CC BY / CC BY-SA). Each one was picked to
 * say what is being sold before a word is read: a number on a scale for "every
 * number", a market for the grocery list, a row of boxes for next week, a pan
 * mid-cook for the photo steps, a finished plate for Lu.
 */
const SHOT = {
  /** A tomato on a kitchen scale, reading 314 — food with a number on it. */
  measured:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/2023_Elektroniczna_waga_kuchenna.jpg/1280px-2023_Elektroniczna_waga_kuchenna.jpg',
  /** Owode Market, Offa, Kwara State — greens on the stand. */
  market:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/A_vegetable_stand_in_Owode_Market%2C_Offa%2C_Kwara_State.jpg/1280px-A_vegetable_stand_in_Owode_Market%2C_Offa%2C_Kwara_State.jpg',
  /** Four identical prepped boxes — a week, already decided. */
  prep:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Meal_prep_recipe_%2845165261135%29.jpg/1280px-Meal_prep_recipe_%2845165261135%29.jpg',
  /** A pan part-way through, wooden spoon still in it. */
  cooking:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Making_Stir-Fry_%283286445383%29.jpg/1280px-Making_Stir-Fry_%283286445383%29.jpg',
  /** Hands chopping peppers beside a bowl of tomatoes — a meal, itemised. */
  itemised:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Chopping_vegetables_and_preparing_spices_for_a_traditional_meal.jpg/1280px-Chopping_vegetables_and_preparing_spices_for_a_traditional_meal.jpg',
  /** Jollof and chicken, plated — the dish you would ask Lu about. */
  plated:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/A_Nigeria_Jollof_Rice_with_chicken.jpg/1280px-A_Nigeria_Jollof_Rice_with_chicken.jpg',
} as const;

/**
 * The locked things a user can bump into, and what the paywall should say when
 * they do, over the photograph that shows it. `feature` travels to the paywall
 * as a route param.
 */
export const LOCKED_COPY = {
  macros: {
    title: 'See every number',
    body: 'Calories, protein, carbs, fat and fibre — unblurred across every meal, your dashboard and your week.',
    image: SHOT.measured,
  },
  grocery: {
    title: 'Your week, as a shopping list',
    body: "Premium turns this week's plan into a grocery list in one tap, sorted by aisle and tickable as you shop.",
    image: SHOT.market,
  },
  'next-week': {
    title: 'Plan next week today',
    body: "Premium lets you generate next week's plan mid-week, so you can shop and prep ahead.",
    image: SHOT.prep,
  },
  ingredients: {
    title: 'Weigh the whole plate',
    body: 'Premium builds a meal ingredient by ingredient — search the food table, set each portion, and log exactly what you ate rather than a rough guess.',
    image: SHOT.itemised,
  },
  walkthrough: {
    title: 'Cook with pictures',
    body: 'Premium adds a photo to every step, so you can see what the pot should look like — not just read about it.',
    image: SHOT.cooking,
  },
  'lu-macros': {
    title: 'Ask Lu for the real figures',
    body: 'Free Lu points you in the right direction. Premium Lu gives you the exact calories and macros for any meal.',
    image: SHOT.plated,
  },
  'lu-swap': {
    title: 'Swap any meal',
    body: "Premium lets you ask Lu to replace any meal in your plan and keep the rest of the week intact.",
    image: SHOT.plated,
  },
  'lu-plan': {
    title: 'Rebuild your week',
    body: 'Premium lets Lu regenerate the whole weekly plan around your goals whenever you want a fresh one.',
    image: SHOT.prep,
  },
  'lu-custom': {
    title: 'Add your own meals',
    body: 'Premium lets you tell Lu about meals that are not in the database, and log them like any other.',
    image: SHOT.plated,
  },
  'lu-history': {
    title: 'Lu remembers everything',
    body: 'Premium keeps every past meal and conversation, so Lu picks up exactly where you left off.',
    image: SHOT.plated,
  },
} as const;

export type LockedFeature = keyof typeof LOCKED_COPY;

export type Entitlement = {
  /** The only thing screens should branch on. */
  premium: boolean;
  status: 'subscribed' | 'trial' | 'expired' | 'free';
  /** Days left on the store-managed trial. */
  daysLeft: number;
  trialUsed: boolean;
  billing: BillingCycle | null;
};

export function useEntitlement(): Entitlement {
  const { customerInfo, offering } = useBilling();
  const active = customerInfo?.entitlements.active.premium;
  const premium = active?.isActive === true;
  const trial = premium && active.periodType?.toUpperCase() === 'TRIAL';
  const expiry = active?.expirationDate ? Date.parse(active.expirationDate) : NaN;
  const daysLeft = trial && Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - Date.now()) / 86_400_000)) : 0;
  const billing = offering?.annual?.product.identifier === active?.productIdentifier ? 'yearly'
    : offering?.monthly?.product.identifier === active?.productIdentifier ? 'monthly' : null;
  return { premium, status: trial ? 'trial' : premium ? 'subscribed' : 'free', daysLeft, trialUsed: trial, billing };
}

/** Every locked feature opens the same universal Akaani Pro paywall. */
export function usePaywall(): (feature?: LockedFeature) => void {
  const router = useRouter();
  return useCallback(
    (_feature?: LockedFeature) => router.push('/paywall'),
    [router]
  );
}
