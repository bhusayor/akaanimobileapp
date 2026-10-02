import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { MEALS, mealById, planForDay } from '../data/meals';

export type LoggedMeal = {
  id: string; // unique log id
  mealId?: string; // present when from database
  name: string;
  /**
   * `null` means the source had no figure for this nutrient — it is NOT zero.
   * Only ever null for meals built from the food table, where a nutrient can
   * genuinely be missing; typed entries and scans always supply numbers.
   */
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string; // yyyy-mm-dd
};

export type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  target: 'maintain' | 'lose' | 'gain';
};

export type WellnessGoal =
  | 'lose_weight'
  | 'gain_weight'
  | 'build_muscle'
  | 'eat_healthier'
  | 'boost_energy'
  | 'stay_consistent';

export type Gender = 'woman' | 'man' | 'non_binary' | 'prefer_not_to_say';

/** Optional details used to make meal recommendations feel personal. */
export type Personalization = {
  wellnessGoals: WellnessGoal[];
  gender: Gender | null;
  heightCm: number | null;
  heightUnit: 'cm' | 'in';
  weightKg: number | null;
  weightUnit: 'kg' | 'lb';
  age: number | null;
};

/** Settings that live on the device, not on the plate. */
export type Settings = {
  /** Shake the phone anywhere in the app to open the feedback sheet. */
  shakeToFeedback: boolean;
  /** Legacy local subscription fields retained only to read older saved data.
   * Access is now determined by the store purchase in `lib/billing.tsx`. */
  plan: 'free' | 'plus';
  /** ISO timestamp the 7-day trial began, or null if the user never started one. */
  trialStartedAt: string | null;
  /** Set when the user ends the trial early. The trial still counts as used. */
  trialCancelled: boolean;
  /** Which price the user is on. Null while they are not paying. */
  billing: 'monthly' | 'yearly' | null;
};

export type Prefs = {
  diets: string[];
  allergies: string[];
  spice: number; // 0..3
  favourites: string[]; // category names
};

type User = { name: string; email: string; avatar?: string | null };

type State = {
  hydrated: boolean;
  seenOnboarding: boolean;
  user: User | null;
  setupDone: boolean;
  prefs: Prefs;
  goals: Goals;
  personalization: Personalization;
  logs: LoggedMeal[];
  groceryTicks: Record<string, boolean>;
  settings: Settings;
  completeOnboarding: () => void;
  signIn: (name: string, email: string, avatar?: string | null) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<User>) => void;
  savePrefs: (p: Prefs) => void;
  saveGoals: (g: Goals, done?: boolean) => void;
  savePersonalization: (p: Personalization, done?: boolean) => void;
  addLog: (log: Omit<LoggedMeal, 'id'>) => void;
  removeLog: (id: string) => void;
  toggleGrocery: (key: string) => void;
  /** Clears ticks. Pass a key prefix (`w0:`) to clear just one week. */
  resetGroceries: (prefix?: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Wipes everything on this device — account, logs, goals, preferences. */
  deleteAccount: () => void;
};

const DEFAULT_GOALS: Goals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
  fiber: 30,
  target: 'maintain',
};
const DEFAULT_PREFS: Prefs = { diets: [], allergies: [], spice: 2, favourites: [] };
export const DEFAULT_PERSONALIZATION: Personalization = {
  wellnessGoals: [],
  gender: null,
  heightCm: null,
  heightUnit: 'cm',
  weightKg: null,
  weightUnit: 'kg',
  age: null,
};
const DEFAULT_SETTINGS: Settings = {
  shakeToFeedback: true,
  plan: 'free',
  trialStartedAt: null,
  trialCancelled: false,
  billing: null,
};

const KEY = 'akaani/v1';

const Ctx = createContext<State | null>(null);

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [setupDone, setSetupDone] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [personalization, setPersonalization] = useState<Personalization>(DEFAULT_PERSONALIZATION);
  const [logs, setLogs] = useState<LoggedMeal[]>([]);
  const [groceryTicks, setGroceryTicks] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const s = JSON.parse(raw);
          setSeenOnboarding(!!s.seenOnboarding);
          setUser(s.user ?? null);
          setSetupDone(!!s.setupDone);
          setPrefs(s.prefs ?? DEFAULT_PREFS);
          setGoals(s.goals ?? DEFAULT_GOALS);
          setPersonalization({ ...DEFAULT_PERSONALIZATION, ...(s.personalization ?? {}) });
          setLogs(s.logs ?? []);
          setGroceryTicks(s.groceryTicks ?? {});
          setSettings({ ...DEFAULT_SETTINGS, ...(s.settings ?? {}) });
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        seenOnboarding,
        user,
        setupDone,
        prefs,
        goals,
        personalization,
        logs,
        groceryTicks,
        settings,
      })
    ).catch(() => {});
  }, [
    hydrated,
    seenOnboarding,
    user,
    setupDone,
    prefs,
    goals,
    personalization,
    logs,
    groceryTicks,
    settings,
  ]);

  const completeOnboarding = useCallback(() => setSeenOnboarding(true), []);
  const signIn = useCallback(
    (name: string, email: string, avatar: string | null = null) => setUser({ name, email, avatar }),
    []
  );
  const updateProfile = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    setSetupDone(false);
  }, []);
  const savePrefs = useCallback((p: Prefs) => setPrefs(p), []);
  const saveGoals = useCallback((g: Goals, done?: boolean) => {
    setGoals(g);
    if (done) setSetupDone(true);
  }, []);
  const savePersonalization = useCallback((p: Personalization, done?: boolean) => {
    setPersonalization(p);
    if (done) setSetupDone(true);
  }, []);
  const addLog = useCallback((log: Omit<LoggedMeal, 'id'>) => {
    setLogs((prev) => [{ ...log, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...prev]);
  }, []);
  const removeLog = useCallback((id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);
  const toggleGrocery = useCallback((key: string) => {
    setGroceryTicks((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const resetGroceries = useCallback((prefix?: string) => {
    if (!prefix) return setGroceryTicks({});
    setGroceryTicks((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(prefix)))
    );
  }, []);
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);
  const deleteAccount = useCallback(() => {
    setUser(null);
    setSetupDone(false);
    setPrefs(DEFAULT_PREFS);
    setGoals(DEFAULT_GOALS);
    setPersonalization(DEFAULT_PERSONALIZATION);
    setLogs([]);
    setGroceryTicks({});
    setSettings(DEFAULT_SETTINGS);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const value = useMemo<State>(
    () => ({
      hydrated,
      seenOnboarding,
      user,
      setupDone,
      prefs,
      goals,
      personalization,
      logs,
      groceryTicks,
      settings,
      completeOnboarding,
      signIn,
      signOut,
      updateProfile,
      savePrefs,
      saveGoals,
      savePersonalization,
      addLog,
      removeLog,
      toggleGrocery,
      resetGroceries,
      updateSettings,
      deleteAccount,
    }),
    [hydrated, seenOnboarding, user, setupDone, prefs, goals, personalization, logs, groceryTicks, settings,
     completeOnboarding, signIn, signOut, updateProfile, savePrefs, saveGoals, savePersonalization,
     addLog, removeLog, toggleGrocery, resetGroceries, updateSettings, deleteAccount]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): State {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

/** Optional details that power the meal-personalization prompt. */
export function personalizationCompletion(profile: Personalization): {
  complete: number;
  total: number;
  missing: Array<'goals' | 'gender' | 'age' | 'height' | 'weight'>;
} {
  const missing: Array<'goals' | 'gender' | 'age' | 'height' | 'weight'> = [];
  if (profile.wellnessGoals.length === 0) missing.push('goals');
  if (profile.gender == null) missing.push('gender');
  if (profile.age == null) missing.push('age');
  if (profile.heightCm == null) missing.push('height');
  if (profile.weightKg == null) missing.push('weight');
  return { complete: 5 - missing.length, total: 5, missing };
}

// ---- Derived helpers ----

export function logsForDate(logs: LoggedMeal[], key: string): LoggedMeal[] {
  return logs.filter((l) => l.date === key);
}

export type DayTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /**
   * Nutrients where at least one meal had no figure, so the total is a lower
   * bound rather than the full picture.
   */
  incomplete: { calories: boolean; protein: boolean; carbs: boolean; fat: boolean; fiber: boolean };
};

/** Sums what is known. An unknown nutrient is skipped, never counted as zero. */
export function totalsFor(logs: LoggedMeal[]): DayTotals {
  const keys = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const incomplete = { calories: false, protein: false, carbs: false, fat: false, fiber: false };
  for (const log of logs) {
    for (const key of keys) {
      const v = log[key];
      if (v == null) incomplete[key] = true;
      else totals[key] += v;
    }
  }
  return { ...totals, incomplete };
}

/** Monday-first week containing `anchor`, offset by `weekOffset` weeks (0 = this week, -1 = last week). */
export function weekDates(weekOffset = 0, anchor = new Date()): Date[] {
  const d = new Date(anchor);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

/**
 * Build the curated grocery list from a week's meal plan, grouped by section.
 *
 * `weekOffset` follows `planForDay`: 0 is this week, 1 is next. Tick keys carry
 * the offset, so ticking off tomatoes for this week does not cross them off
 * next week's shop as well.
 */
export function weeklyGroceries(
  weekOffset = 0
): { section: string; items: { key: string; name: string; qty: string }[] }[] {
  const seen = new Map<string, { name: string; qty: string }>();
  for (let day = 0; day < 7; day++) {
    const plan = planForDay(day, weekOffset);
    for (const meal of [plan.breakfast, plan.lunch, plan.dinner]) {
      for (const ing of meal.ingredients) {
        const k = ing.name.toLowerCase();
        if (!seen.has(k)) seen.set(k, { name: ing.name, qty: ing.qty });
      }
    }
  }
  const sections: Record<string, { key: string; name: string; qty: string }[]> = {
    'Proteins & Fish': [],
    'Vegetables & Peppers': [],
    'Grains & Swallows': [],
    'Oils & Seasoning': [],
    Others: [],
  };
  const match = (n: string) => {
    const s = n.toLowerCase();
    if (/(beef|chicken|fish|prawn|shrimp|gizzard|egg|meat|shaki|ponmo|liver|periwinkle|mackerel|catfish|stockfish)/.test(s))
      return 'Proteins & Fish';
    if (/(pepper|tomato|onion|leaf|leaves|ugu|spinach|okra|carrot|pea|corn|bean(?!s,)|cabbage|greens|plantain|scent)/.test(s))
      return 'Vegetables & Peppers';
    if (/(rice|yam|garri|fufu|bread|ogi|pap|oat|flour)/.test(s)) return 'Grains & Swallows';
    if (/(oil|salt|season|spice|curry|thyme|crayfish|iru|locust|nutmeg|cinnamon|bay|yaji|paste|stock|butter|milk|honey|sugar)/.test(s))
      return 'Oils & Seasoning';
    return 'Others';
  };
  for (const [key, item] of seen) {
    sections[match(item.name)].push({ key: `w${weekOffset}:${key}`, ...item });
  }
  return Object.entries(sections)
    .filter(([, items]) => items.length > 0)
    .map(([section, items]) => ({ section, items: items.sort((a, b) => a.name.localeCompare(b.name)) }));
}

export { MEALS, mealById, planForDay };
