import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Lock, Sparkles } from 'lucide-react-native';
import React, { createContext, useContext } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useEntitlement, usePaywall, type LockedFeature } from '../lib/subscription';
import { useAppScheme } from '../lib/theme-mode';
import { font, radius, themedStyles, useColors } from '../theme';
import { PressableScale } from './ui';

/** True when this user should be seeing blurs and locks. */
export function useLocked(): boolean {
  return !useEntitlement().premium;
}

/**
 * The smear that stands in for a gaussian blur: nine copies of the number, one
 * at the centre and eight around it, each drawn faintly. Where the copies
 * overlap you get a solid core, and where they don't you get soft edges — the
 * same thing a blur does, built out of glyphs.
 *
 * Offsets are in units of one blur step; the third number is how strongly that
 * copy is painted.
 */
/** How far the frost spreads past the content it covers, in points. */
const BLEED = 7;

/** Font size at which a lone blurred figure earns its own pane of glass. */
const FROST_ABOVE = 18;

/**
 * True inside a `LockedBlock`. A blurred number that sits in an already-frosted
 * panel skips its own frost — one blur layer per region, not one per figure.
 */
const Frosted = createContext(false);

const SMEAR: [number, number, number][] = [
  [0, 0, 0.3],
  [-1, 0, 0.19],
  [1, 0, 0.19],
  [0, -1, 0.19],
  [0, 1, 0.19],
  [-0.72, -0.72, 0.14],
  [0.72, -0.72, 0.14],
  [-0.72, 0.72, 0.14],
  [0.72, 0.72, 0.14],
];

/**
 * A number the user has not paid to see.
 *
 * The first version of this used `color: 'transparent'` with a wide
 * `textShadowRadius`, which is the standard Android text-blur trick — but iOS
 * draws no shadow for a fully transparent glyph, so on a phone it rendered as
 * nothing at all. `expo-blur` would work, but it is a native module this
 * project does not carry and Android's BlurView needs an experimental flag to
 * blur anything at all. So the blur is built from the text itself (see SMEAR),
 * which looks the same on both platforms and needs no install.
 *
 * The step scales with the font size — a 30pt ring value needs a wider smear
 * than a 12pt chip to be equally unreadable.
 *
 * The real figure is still in the render tree, which is fine for a local mock:
 * when there is a server, the gate belongs in the response, not the paint.
 */
export function LockedText({
  children,
  style,
  locked,
  blur,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  /** Defaults to "locked for anyone without Premium". */
  locked?: boolean;
  /** Override the blur step in points, when the automatic one reads wrong. */
  blur?: number;
}) {
  const styles = useStyles();
  const auto = useLocked();
  const inPanel = useContext(Frosted);
  const hide = locked ?? auto;

  if (!hide) return <Text style={style}>{children}</Text>;

  const flat = StyleSheet.flatten(style) ?? {};
  const size = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const step = blur ?? Math.max(1.6, size * 0.18);

  // A smear that ends up under glass can be lighter than one doing the job
  // alone — see the frost decision at the bottom of this function.
  const covered = inPanel || size >= FROST_ABOVE;
  const gain = covered ? 1 : 1.45;

  const smeared = (
    <View
      style={styles.smear}
      accessible
      accessibilityLabel="Hidden — subscribe to see this number"
    >
      {/* Invisible, but it is the copy that gives the row its width. */}
      <Text style={[style, styles.hidden]}>{children}</Text>
      {SMEAR.map(([dx, dy, alpha], i) => (
        <Text
          key={i}
          selectable={false}
          style={[
            style,
            StyleSheet.absoluteFillObject,
            {
              opacity: Math.min(1, alpha * gain),
              transform: [{ translateX: dx * step }, { translateY: dy * step }],
            },
          ]}
        >
          {children}
        </Text>
      ))}
    </View>
  );

  // Inside a frosted panel the region's own blur already covers this figure, so
  // it would only cost a native view and read heavier than its neighbours.
  //
  // A big lone figure — the calorie ring, a running total — gets its own small
  // pane of glass, because the smear alone looks thin at that size. Small ones
  // do not: a meal grid is a dozen cards, and a blur view per card is where
  // scrolling starts to stutter. Below that size the smear reads as a blur on
  // its own anyway.
  if (inPanel || size < FROST_ABOVE) return smeared;
  return (
    <LockedBlock radius={4} bleed={4} intensity={22} locked>
      {smeared}
    </LockedBlock>
  );
}

/**
 * A whole readout the user has not paid to see — frosted as one panel rather
 * than number by number.
 *
 * A macro row is a single fact made of five figures, their labels and their
 * bars. Blurring only the digits left the labels and colour bars crisp around
 * smudged numbers, which reads as a rendering fault rather than a lock. Frosting
 * the region says "this is behind a wall" in one gesture.
 *
 * `expo-blur` does the visible work: a real gaussian on iOS, and on Android the
 * Dimezis implementation, which has to be asked for explicitly. Any number
 * inside should still be wrapped in `LockedText`, so the figure stays
 * unreadable even where the platform quietly declines to blur.
 */
export function LockedBlock({
  children,
  locked,
  intensity = 28,
  radius: corner = 0,
  bleed = BLEED,
  style,
}: {
  children: React.ReactNode;
  /** Defaults to "locked for anyone without Premium". */
  locked?: boolean;
  /** 1–100. Higher is milkier; past ~40 the shapes underneath disappear. */
  intensity?: number;
  /** Corner radius for the frosted panel. */
  radius?: number;
  /** How far the frost spreads past the content. Smaller for inline figures. */
  bleed?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const dark = useAppScheme() === 'dark';
  const auto = useLocked();
  const hide = locked ?? auto;

  // The wrapper is rendered either way and carries the caller's layout, so a
  // Premium user's screen measures out exactly like a free user's.
  //
  // The frost is inset by a negative BLEED rather than filling the box exactly:
  // a panel that stops dead on the last glyph looks cropped, and softening a
  // few points into the card around it is what makes it read as glass.
  const spread = { top: -bleed, left: -bleed, right: -bleed, bottom: -bleed };
  const round = corner > 0 ? { borderRadius: corner + bleed } : undefined;

  return (
    <View style={[styles.block, style]}>
      <Frosted.Provider value={hide}>{children}</Frosted.Provider>
      {hide && (
        <>
          <BlurView
            pointerEvents="none"
            intensity={intensity}
            tint={dark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[styles.frost, spread, round]}
          />
          {/* A breath of the surface colour on top, so the panel reads as
              frosted glass rather than as something that failed to load. */}
          <View
            pointerEvents="none"
            style={[
              styles.frost,
              spread,
              round,
              { backgroundColor: dark ? 'rgba(7,59,57,0.20)' : 'rgba(255,255,255,0.20)' },
            ]}
          />
        </>
      )}
    </View>
  );
}

/** The little gold "PREMIUM" tag that marks a locked control. */
export function PremiumPill({ label = 'PREMIUM', style }: { label?: string; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.pill, style]}>
      <Lock size={9.5} color={colors.secondary} strokeWidth={3} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

/**
 * The inline nudge that sits under a blurred readout. One line of what is
 * hidden, one tap to the paywall — never a wall in the middle of a screen the
 * user is allowed to be on.
 */
export function UnlockRow({
  feature = 'macros',
  label = 'Subscribe to see your numbers',
  style,
}: {
  feature?: LockedFeature;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const colors = useColors();
  const openPaywall = usePaywall();
  const { premium } = useEntitlement();
  if (premium) return null;
  return (
    <PressableScale onPress={() => openPaywall(feature)} scaleTo={0.98} style={[styles.unlockRow, style]}>
      <Lock size={13} color={colors.secondary} strokeWidth={2.6} />
      <Text style={styles.unlockLabel} numberOfLines={1}>
        {label}
      </Text>
      {/* Always "Subscribe now" — the trial belongs on the paywall, where the
          price is. Selling "free" next to a blur reads as a taunt. */}
      <Text style={styles.unlockCta}>Subscribe now</Text>
    </PressableScale>
  );
}

/**
 * Counts the trial down where the user can see it. Renders nothing outside a
 * trial, so it can sit permanently in a layout.
 */
export function TrialNote({ style }: { style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const { status, daysLeft } = useEntitlement();
  if (status !== 'trial') return null;
  return (
    <PressableScale
      onPress={() => router.push('/settings/subscription')}
      scaleTo={0.98}
      style={[styles.trialRow, style]}
    >
      <Sparkles size={13} color={colors.success} strokeWidth={2.6} />
      <Text style={styles.trialText} numberOfLines={1}>
        Premium trial — {daysLeft} day{daysLeft === 1 ? '' : 's'} left
      </Text>
      <Text style={styles.trialCta}>Manage</Text>
    </PressableScale>
  );
}

const useStyles = themedStyles((colors) => ({
  block: { position: 'relative' },
  frost: { position: 'absolute' },
  smear: { position: 'relative' },
  hidden: { opacity: 0 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  pillText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    color: colors.secondary,
    letterSpacing: 0.9,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  unlockLabel: { flex: 1, fontFamily: font.medium, fontSize: 12.5, color: colors.ink },
  unlockCta: { fontFamily: font.bold, fontSize: 12.5, color: colors.secondary },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  trialText: { flex: 1, fontFamily: font.medium, fontSize: 12.5, color: colors.ink },
  trialCta: { fontFamily: font.bold, fontSize: 12.5, color: colors.primary },
}));
