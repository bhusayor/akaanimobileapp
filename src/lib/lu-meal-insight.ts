/**
 * What Lu says about a scanned meal, given the user's goal and their day so far.
 *
 * Lu gives context and options; it never decides what the user may eat. Every
 * line here is something the user can act on or ignore — "Add to Track" is
 * always available whatever Lu says.
 *
 * Free users get the same advice without the figures, matching Lu in chat.
 */
import type { Goals, WellnessGoal } from './store';
import { formatQuantity } from './units';

export type MealMacros = { calories: number; protein: number; carbs: number; fat: number; fiber: number };

export type LuInsight = {
  id: string;
  tone: 'positive' | 'neutral' | 'heads-up';
  text: string;
  /** An option Lu offers. The only kind today is "try a smaller portion". */
  action?: { label: string; portion: number };
};

const GOAL_LABEL: Record<WellnessGoal, string> = {
  lose_weight: 'Lose Weight',
  gain_weight: 'Gain Weight',
  build_muscle: 'Build Muscle',
  eat_healthier: 'Eat Healthier',
  boost_energy: 'Boost Energy',
  stay_consistent: 'Stay Consistent',
};

/** Rounds to the nearest quarter portion, never below a quarter. */
const nearestQuarter = (n: number) => Math.max(0.25, Math.round(n * 4) / 4);

export function portionLabel(p: number): string {
  if (p === 1) return '1 serving';
  return `${formatQuantity(p)} serving${p > 1 ? 's' : ''}`;
}

export function luMealInsights({
  meal,
  portion,
  goals,
  wellnessGoals,
  caloriesToday,
  premium,
}: {
  /** Already scaled to `portion`. */
  meal: MealMacros;
  portion: number;
  goals: Goals;
  wellnessGoals: WellnessGoal[];
  /** Calories already tracked today, before this meal. */
  caloriesToday: number;
  premium: boolean;
}): LuInsight[] {
  const out: LuInsight[] = [];
  const remaining = goals.calories - caloriesToday;
  const kcal = (n: number) => `${Math.round(n)} kcal`;

  // --- The calorie budget comes first: it's the one that changes what to do next. ---
  if (remaining <= 0) {
    out.push({
      id: 'over',
      tone: 'heads-up',
      text: premium
        ? `You've already reached today's ${kcal(goals.calories)} target. You can still track this — it's your call — or I can suggest a smaller portion.`
        : "You've already reached today's calorie target. You can still track this — it's your call — or I can suggest a smaller portion.",
      action: portion > 0.5 ? { label: 'Suggest a smaller portion', portion: 0.5 } : undefined,
    });
  } else if (meal.calories > remaining * 1.1) {
    // The quarter-step portion closest to what's left — a suggestion, not a ration.
    const perServing = meal.calories / portion;
    const fits = nearestQuarter(remaining / perServing);
    out.push({
      id: 'over-remaining',
      tone: 'heads-up',
      text: premium
        ? `This meal is quite high in calories compared with what you have remaining today (${kcal(remaining)} left). You can still track it, or I can suggest a smaller portion.`
        : 'This meal is quite high in calories compared with what you have remaining today. You can still track it, or I can suggest a smaller portion.',
      action: fits < portion ? { label: `Try ${portionLabel(fits)}`, portion: fits } : undefined,
    });
  } else if (meal.calories > remaining) {
    out.push({
      id: 'close',
      tone: 'neutral',
      text: "This brings you to about today's calorie target — a nice place to finish the day.",
    });
  } else if (portion < 1) {
    out.push({
      id: 'fits',
      tone: 'positive',
      text: premium
        ? `That portion fits within what you have left today, with ${kcal(remaining - meal.calories)} to spare.`
        : 'That portion fits within what you have left today.',
    });
  }

  // --- Then the goal the user set. First goal wins; one goal line keeps Lu brief. ---
  const goal = wellnessGoals[0] ?? fromTarget(goals.target);
  const line = goal ? goalLine(goal, meal, premium) : undefined;
  if (line) out.push(line);

  return out;
}

function fromTarget(target: Goals['target']): WellnessGoal | undefined {
  if (target === 'lose') return 'lose_weight';
  if (target === 'gain') return 'gain_weight';
  return undefined;
}

function goalLine(goal: WellnessGoal, m: MealMacros, premium: boolean): LuInsight | undefined {
  const label = GOAL_LABEL[goal];
  const g = (n: number, what: string) => (premium ? ` (${Math.round(n)} g ${what})` : '');

  switch (goal) {
    case 'build_muscle':
      if (m.protein >= 25)
        return { id: 'goal', tone: 'positive', text: `This meal gives you a good amount of protein${g(m.protein, 'protein')} for your ${label} goal.` };
      if (m.protein < 15)
        return { id: 'goal', tone: 'neutral', text: `This one is light on protein${g(m.protein, 'protein')} for your ${label} goal. Eggs, fish, chicken or beans on the side would help.` };
      return { id: 'goal', tone: 'neutral', text: `A moderate amount of protein${g(m.protein, 'protein')} for ${label}. A protein side would make it a stronger meal for your goal.` };

    case 'lose_weight':
      if (m.calories <= 500 && m.protein >= 20)
        return { id: 'goal', tone: 'positive', text: `A filling choice for your ${label} goal — good protein for the calories.` };
      if (m.calories > 700)
        return { id: 'goal', tone: 'neutral', text: `This sits on the heavier side for ${label}. A smaller swallow or rice portion with more vegetables would lighten it.` };
      if (m.fiber >= 8)
        return { id: 'goal', tone: 'positive', text: `Good fibre here${g(m.fiber, 'fibre')} — it'll help keep you full, which suits ${label}.` };
      return undefined;

    case 'gain_weight':
      if (m.calories >= 600)
        return { id: 'goal', tone: 'positive', text: `A solid, energy-dense meal for your ${label} goal.` };
      return { id: 'goal', tone: 'neutral', text: `Fairly light for ${label}. Plantain, avocado, groundnuts or an extra spoon of stew would add energy.` };

    case 'eat_healthier':
      if (m.fiber >= 6)
        return { id: 'goal', tone: 'positive', text: `Nice — good fibre${g(m.fiber, 'fibre')} for your ${label} goal.` };
      return { id: 'goal', tone: 'neutral', text: `Adding vegetables, beans or fruit alongside would bring more fibre for ${label}.` };

    case 'boost_energy':
      if (m.carbs >= 45 && m.protein >= 15)
        return { id: 'goal', tone: 'positive', text: `Carbs and protein together — steady energy, which suits your ${label} goal.` };
      if (m.carbs < 25)
        return { id: 'goal', tone: 'neutral', text: `Low in carbs, so it may not carry you far for ${label}. A side of yam, rice or fruit would help.` };
      return undefined;

    case 'stay_consistent':
      return { id: 'goal', tone: 'positive', text: 'Tracking this keeps your day complete — consistency is what counts for your goal.' };
  }
}
