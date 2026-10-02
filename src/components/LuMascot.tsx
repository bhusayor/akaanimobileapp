import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { themedStyles, useColors } from '../theme';

/**
 * Lu — the app's little chef mascot, built from pure views.
 * Bobs gently, blinks every few seconds, hat tilts with the bob.
 */
export function LuMascot({ size = 64 }: { size?: number }) {
  const styles = useStyles();
  const bob = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    blink.value = withRepeat(
      withSequence(
        withDelay(2600, withTiming(0.08, { duration: 90 })),
        withTiming(1, { duration: 120 })
      ),
      -1
    );
  }, [bob, blink]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * -3 }, { rotate: `${(bob.value - 0.5) * 4}deg` }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const s = size / 64; // scale factor from the 64px base design

  return (
    <Animated.View style={[{ width: size, height: size * 1.18 }, bodyStyle]}>
      {/* Chef hat */}
      <View style={[styles.hatPuff, { width: 34 * s, height: 22 * s, borderRadius: 12 * s, left: 15 * s, top: 0 }]} />
      <View style={[styles.hatPuff, { width: 16 * s, height: 16 * s, borderRadius: 8 * s, left: 8 * s, top: 5 * s }]} />
      <View style={[styles.hatPuff, { width: 16 * s, height: 16 * s, borderRadius: 8 * s, right: 8 * s, top: 5 * s }]} />
      <View style={[styles.hatBand, { width: 36 * s, height: 7 * s, borderRadius: 3 * s, left: 14 * s, top: 18 * s }]} />
      {/* Body */}
      <View
        style={[
          styles.body,
          { width: 52 * s, height: 48 * s, borderRadius: 20 * s, left: 6 * s, top: 24 * s },
        ]}
      >
        <View style={{ flexDirection: 'row', gap: 9 * s, marginTop: 12 * s }}>
          <Animated.View style={[styles.eye, { width: 7 * s, height: 9 * s, borderRadius: 4 * s }, eyeStyle]} />
          <Animated.View style={[styles.eye, { width: 7 * s, height: 9 * s, borderRadius: 4 * s }, eyeStyle]} />
        </View>
        <View
          style={[
            styles.smile,
            {
              width: 14 * s,
              height: 7 * s,
              borderBottomLeftRadius: 8 * s,
              borderBottomRightRadius: 8 * s,
              borderWidth: 2.2 * s,
              marginTop: 3 * s,
            },
          ]}
        />
        {/* cheeks */}
        <View style={[styles.cheek, { width: 7 * s, height: 4 * s, borderRadius: 3 * s, left: 6 * s, top: 24 * s }]} />
        <View style={[styles.cheek, { width: 7 * s, height: 4 * s, borderRadius: 3 * s, right: 6 * s, top: 24 * s }]} />
      </View>
      {/* Feet */}
      <View style={[styles.foot, { width: 12 * s, height: 8 * s, borderRadius: 5 * s, left: 14 * s, bottom: 0 }]} />
      <View style={[styles.foot, { width: 12 * s, height: 8 * s, borderRadius: 5 * s, right: 14 * s, bottom: 0 }]} />
    </Animated.View>
  );
}

const useStyles = themedStyles((colors) => ({
  hatPuff: { position: 'absolute', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBE0D2' },
  hatBand: { position: 'absolute', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBE0D2', zIndex: 2 },
  body: {
    position: 'absolute',
    backgroundColor: colors.secondary,
    alignItems: 'center',
  },
  eye: { backgroundColor: '#20211C' },
  smile: {
    borderColor: '#20211C',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  cheek: { position: 'absolute', backgroundColor: '#FFC08A', opacity: 0.9 },
  foot: { position: 'absolute', backgroundColor: colors.primary },
}));
