import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

/** What the user picked in Settings. `system` follows the OS appearance. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** What the UI actually paints. */
export type Scheme = 'light' | 'dark';

type ThemeModeState = {
  mode: ThemeMode;
  scheme: Scheme;
  setMode: (m: ThemeMode) => void;
  /** False until the saved preference has been read back from storage. */
  hydrated: boolean;
};

const KEY = 'akaani/theme-mode';

const Ctx = createContext<ThemeModeState | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw === 'light' || raw === 'dark' || raw === 'system') setModeState(raw);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);

  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeModeState>(
    () => ({ mode, scheme, setMode, hydrated }),
    [mode, scheme, setMode, hydrated]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Read + change the appearance preference. Use in Settings. */
export function useThemeMode(): ThemeModeState {
  const s = useContext(Ctx);
  if (!s) throw new Error('useThemeMode must be used inside ThemeModeProvider');
  return s;
}

/**
 * The scheme to paint with — the user's override when set, the OS otherwise.
 * Falls back to the OS if no provider is mounted, so it is safe in any tree.
 */
export function useAppScheme(): Scheme {
  const ctx = useContext(Ctx);
  const system = useColorScheme();
  if (ctx) return ctx.scheme;
  return system === 'dark' ? 'dark' : 'light';
}
