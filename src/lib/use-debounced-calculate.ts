/**
 * Live nutrition for the single ingredient being edited.
 *
 * Debounces edits, cancels the in-flight request when input changes again, and
 * guards against out-of-order responses. Only ever sends ONE item — the whole
 * meal is never recalculated from this hook.
 */
import { useEffect, useRef, useState } from 'react';
import {
  calculateNutrition,
  isPortionError,
  type Nutrition,
  type NutritionErrorCode,
} from '../api/nutrition';
import { toApiItem } from './units';

export type PortionProblem = { code: NutritionErrorCode; message: string };

export function useDebouncedCalculate({
  foodId,
  quantity,
  unit,
  enabled = true,
  delay = 350,
  initialNutrition,
}: {
  foodId: string;
  quantity: number;
  unit: string;
  enabled?: boolean;
  delay?: number;
  initialNutrition?: Nutrition;
}) {
  const [nutrition, setNutrition] = useState<Nutrition | null>(initialNutrition ?? null);
  /** Gram weight the API resolved for this portion. */
  const [grams, setGrams] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portionError, setPortionError] = useState<PortionProblem | null>(null);
  /** Monotonic request id — a slow reply from an older edit is discarded. */
  const seq = useRef(0);

  useEffect(() => {
    if (!enabled || !foodId || !(quantity > 0)) {
      setLoading(false);
      return;
    }

    const mine = ++seq.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPortionError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await calculateNutrition(
          [toApiItem(foodId, quantity, unit)],
          controller.signal
        );
        if (mine !== seq.current) return;
        const row = res.items[0];
        if (row?.error) {
          setPortionError(row.error);
        } else if (row?.nutrition) {
          setNutrition(row.nutrition);
          setGrams(row.grams);
        }
        setLoading(false);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || mine !== seq.current) return;
        if (isPortionError(err)) {
          setPortionError({ code: err.code as NutritionErrorCode, message: err.message });
        } else {
          setError('Could not update nutrition. Check your connection.');
        }
        setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [foodId, quantity, unit, enabled, delay]);

  return { nutrition, grams, loading, error, portionError };
}
