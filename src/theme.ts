import { StyleSheet } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useAppScheme } from './lib/theme-mode';

/** Light — clean neutral canvas, white cards. */
export const lightColors = {
  bg: '#F7F7F7',
  bgSoft: '#ECECEC',
  card: '#FFFFFF',
  line: '#E8E8E8',

  primary: '#003333',
  secondary: '#DA7000',

  ink: '#1C2321',
  inkSoft: '#5C6662',
  inkFaint: '#96A09B',
  onPrimary: '#F6FBF9',

  success: '#2E7D5B',
  danger: '#C0442C',
  secondarySoft: '#F6E7D4',
  primarySoft: '#E3EBE9',
  dangerSoft: '#FBEAE5',

  // One hue per nutrient, used by every bar, dot and chip in the app so a
  // colour always means the same thing. Checked for colour-blind separation
  // against each other and for contrast against the surfaces they sit on;
  // fibre used to be a grey that read as "no colour" next to the other four.
  macroCalories: '#4FB6D9',
  macroProtein: '#3AA46C',
  macroCarbs: '#EBB23E',
  macroFat: '#E05B4B',
  macroFibre: '#8B5FD0',
} as const;

export type Palette = { [K in keyof typeof lightColors]: string };

/**
 * Dark — deep teal derived from #003333. Screens are translucent so the
 * root linear gradient (#001414 → #003333) shows through.
 */
export const darkColors: Palette = {
  bg: 'rgba(0, 18, 18, 0.25)',
  bgSoft: 'rgba(255, 255, 255, 0.07)',
  card: '#073B39',
  line: 'rgba(255, 255, 255, 0.10)',

  primary: '#EAF6F2', // primary buttons flip to light on dark
  secondary: '#F08A1D',

  ink: '#F2F7F5',
  inkSoft: '#AFC3BE',
  inkFaint: '#71887F',
  onPrimary: '#01302E',

  success: '#5BC896',
  danger: '#E5735F',
  secondarySoft: 'rgba(240, 138, 29, 0.18)',
  primarySoft: 'rgba(234, 246, 242, 0.12)',
  dangerSoft: 'rgba(229, 115, 95, 0.16)',

  // Same four hues — they hold up on the dark card. Fibre's violet does not, so
  // dark mode gets its own lighter step rather than an automatic flip.
  macroCalories: '#4FB6D9',
  macroProtein: '#3AA46C',
  macroCarbs: '#EBB23E',
  macroFat: '#E05B4B',
  macroFibre: '#A87DE8',
};

/** Gradient stops for the dark-mode app background. */
export const darkBgGradient = ['#001414', '#002A2A', '#003333'] as const;

export function useColors(): Palette {
  return useAppScheme() === 'dark' ? darkColors : lightColors;
}

/** The five nutrients, in the order they are shown everywhere. */
export const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fibre'] as const;

export type MacroKey = (typeof MACRO_KEYS)[number];

/** Nutrient → its colour in the current theme. */
export function macroColor(colors: Palette, key: MacroKey): string {
  return {
    calories: colors.macroCalories,
    protein: colors.macroProtein,
    carbs: colors.macroCarbs,
    fat: colors.macroFat,
    fibre: colors.macroFibre,
  }[key];
}

/**
 * Theme-aware StyleSheet factory. Write styles once against the palette;
 * the hook returns the right (cached) sheet for the current appearance.
 *
 *   const useStyles = themedStyles((colors) => ({ ... }));
 *   const styles = useStyles(); // inside the component
 */
export function themedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T) {
  const cache: { light?: T; dark?: T } = {};
  return function useStyles(): T {
    const scheme = useAppScheme();
    if (!cache[scheme]) {
      cache[scheme] = StyleSheet.create(factory(scheme === 'dark' ? darkColors : lightColors));
    }
    return cache[scheme]!;
  };
}

/**
 * Motion — smooth and quick. Deliberately no springs with low damping:
 * everything eases out instead of overshooting and wobbling.
 */
export const motion = {
  press: 110,
  fast: 180,
  base: 280,
  slow: 440,
  /** Standard decelerate curve — fast start, soft landing. */
  ease: Easing.bezier(0.22, 0.61, 0.36, 1),
  /** For things entering the screen. */
  enter: Easing.out(Easing.cubic),
} as const;

export const font = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extrabold: 'Outfit_800ExtraBold',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  float: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;
