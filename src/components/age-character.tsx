import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gender } from '../lib/store';

const ART = {
  woman: require('../../assets/images/characters/woman-ages.png'),
  man: require('../../assets/images/characters/man-ages.png'),
  non_binary: require('../../assets/images/characters/neutral-ages.png'),
  prefer_not_to_say: require('../../assets/images/characters/neutral-ages.png'),
};

function AgeLayer({ source, index, active, width, height, portrait }: {
  source: number; index: number; active: boolean; width: number; height: number; portrait: boolean;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(active ? 1 : 0);
  useEffect(() => { opacity.value = withTiming(active ? 1 : 0, { duration: reduced ? 0 : 260 }); }, [active, opacity, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  // The sheet has three aligned full-body portraits; crop in the view, never
  // paint age marks over a face. Align each figure's centre, not its panel edge.
  const imageHeight = portrait ? height * 5 : height;
  const imageWidth = imageHeight * 1.5;
  const cropWidth = portrait ? width : Math.min(width, height * 0.46);
  const centre = [307, 768, 1230][index] / 1536;
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: (width - cropWidth) / 2, width: cropWidth, height, overflow: 'hidden' }, style]}>
    <Image source={source} contentFit="fill" cachePolicy="memory-disk" style={{ position: 'absolute', width: imageWidth, height: imageHeight, left: cropWidth / 2 - centre * imageWidth, top: portrait ? -height * 0.04 : 0 }} />
  </Animated.View>;
}

/** Illustrative life-stage artwork, not a prediction of someone's appearance. */
export function AgeCharacter({ age, gender, portrait = false }: { age?: number | null; gender?: Gender | null; portrait?: boolean }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const stage = (age ?? 28) < 35 ? 0 : (age ?? 28) < 60 ? 1 : 2;
  return <View style={{ width: '100%', height: '100%', overflow: 'hidden' }} onLayout={event => setSize(event.nativeEvent.layout)}
    accessible accessibilityRole="image" accessibilityLabel={`${['Younger', 'Middle-aged', 'Older'][stage]} character illustration`}>
    {size.width > 0 && [0, 1, 2].map(index => <AgeLayer key={index} index={index} active={index === stage} source={ART[gender ?? 'prefer_not_to_say']} width={size.width} height={size.height} portrait={portrait} />)}
  </View>;
}
