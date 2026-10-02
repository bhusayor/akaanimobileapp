/**
 * The meal being assembled across MealReviewScreen → IngredientEditScreen.
 *
 * Context rather than Zustand, to match the rest of the app (`store.tsx`,
 * `theme-mode.tsx`). Deliberately NOT persisted — a draft dies with the flow.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  calculateNutrition,
  sumNutrition,
  type Food,
  type Nutrition,
  type PortionConversion,
} from '../api/nutrition';
import type { LoggedMeal } from './store';
import { toApiItem } from './units';

export type MealType = LoggedMeal['mealType'];

export type MealIngredientItem = {
  /** Client-side row id — a meal can legitimately hold the same food twice. */
  id: string;
  food_id: string;
  name: string;
  quantity: number;
  unit: string;
  included: boolean;
  /**
   * True when the backend flagged no default serving for this food. The client
   * must not invent one, so the row asks the user to set a portion instead.
   */
  needsPortion: boolean;
  /**
   * True while the quantity is still the reference amount the food arrived
   * with (100 g) rather than something the user chose. The food table has no
   * serving sizes, so that number is a placeholder — the UI says so until it is
   * edited.
   */
  defaultPortion: boolean;
  /** Units with a gram conversion for this food, straight from the API. */
  portion_conversions: PortionConversion[];
  /** Gram weight of this portion, as resolved by the API — never computed here. */
  grams?: number;
  nutrition?: Nutrition;
  /** Last per-item calculation error, shown inline on the card. */
  error?: string;
};

type DraftState = {
  items: MealIngredientItem[];
  name: string;
  mealType: MealType;
  /** How many portions the finished dish makes. */
  servings: number;
  /** How many of those portions were actually eaten. */
  eaten: number;
  /** Included rows only. */
  includedItems: MealIngredientItem[];
  totals: Nutrition;
  addFood: (food: Food) => Promise<void>;
  removeItem: (id: string) => void;
  toggleIncluded: (id: string) => void;
  updateItem: (id: string, patch: Partial<MealIngredientItem>) => void;
  setName: (v: string) => void;
  setMealType: (v: MealType) => void;
  setServings: (v: number) => void;
  setEaten: (v: number) => void;
  reset: () => void;
};

const Ctx = createContext<DraftState | null>(null);

const rowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function MealDraftProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MealIngredientItem[]>([]);
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [servings, setServingsState] = useState(1);
  const [eaten, setEatenState] = useState(1);

  /** You cannot eat more portions than the dish makes, so raise/lower together. */
  const setServings = useCallback((v: number) => {
    const makes = Math.max(1, Math.min(50, Math.round(v)));
    setServingsState(makes);
    setEatenState((prev) => Math.min(prev, makes));
  }, []);

  const setEaten = useCallback((v: number) => {
    setEatenState((prev) => {
      const capped = Math.max(0.5, Math.min(servings, Math.round(v * 2) / 2));
      return Number.isFinite(capped) ? capped : prev;
    });
  }, [servings]);

  const updateItem = useCallback((id: string, patch: Partial<MealIngredientItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const addFood = useCallback(async (food: Food) => {
    const id = rowId();
    const hasDefault = food.default_serving !== null;
    const item: MealIngredientItem = {
      id,
      food_id: food.food_id,
      name: food.name,
      // No default flagged on the backend → leave it unset and ask the user.
      quantity: food.default_serving?.quantity ?? 0,
      unit: food.default_serving?.unit ?? 'g',
      included: hasDefault,
      needsPortion: !hasDefault,
      defaultPortion: hasDefault,
      portion_conversions: food.portion_conversions,
    };
    setItems((prev) => [...prev, item]);
    if (!hasDefault) return;

    try {
      const res = await calculateNutrition([toApiItem(item.food_id, item.quantity, item.unit)]);
      const row = res.items[0];
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                // Express the backend's default serving in grams — same portion,
                // just a unit everyone can read. The gram figure is the API's.
                ...(row?.grams != null ? { quantity: row.grams, unit: 'g' } : {}),
                grams: row?.grams,
                nutrition: row?.nutrition,
                error: row?.error?.message,
              }
            : it
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, error: 'Could not load nutrition' } : it))
      );
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const toggleIncluded = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        // A row with no portion set has no nutrition to contribute — keep it out.
        it.id === id && !it.needsPortion ? { ...it, included: !it.included } : it
      )
    );
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setName('');
    setServingsState(1);
    setEatenState(1);
    setMealType('lunch');
  }, []);

  const includedItems = useMemo(() => items.filter((it) => it.included), [items]);

  const totals = useMemo(
    () => sumNutrition(includedItems.map((it) => it.nutrition)),
    [includedItems]
  );

  const value = useMemo<DraftState>(
    () => ({
      items,
      name,
      mealType,
      servings,
      eaten,
      includedItems,
      totals,
      addFood,
      removeItem,
      toggleIncluded,
      updateItem,
      setName,
      setMealType,
      setServings,
      setEaten,
      reset,
    }),
    [items, name, mealType, servings, eaten, includedItems, totals, addFood, removeItem,
     toggleIncluded, updateItem, setServings, setEaten, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMealDraft(): DraftState {
  const s = useContext(Ctx);
  if (!s) throw new Error('useMealDraft must be used inside MealDraftProvider');
  return s;
}
