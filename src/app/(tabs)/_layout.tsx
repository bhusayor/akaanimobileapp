import { Tabs } from 'expo-router';
import { Home, LineChart, MessageCircle, Search, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../../components/ui';
import { themedStyles, useColors, font, motion, radius, shadow } from '../../theme';

const TABS = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'track', label: 'Track', Icon: LineChart },
  { name: 'search', label: 'Search', Icon: Search },
  { name: 'chat', label: 'Lu', Icon: MessageCircle },
  { name: 'profile', label: 'Profile', Icon: User },
];

function TabButton({
  label,
  Icon,
  active,
  onPress,
}: {
  label: string;
  Icon: typeof Home;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const v = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(active ? 1 : 0, { duration: motion.fast, easing: motion.ease });
  }, [active, v]);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -2 * v.value }, { scale: 1 + 0.1 * v.value }],
  }));
  return (
    <PressableScale onPress={onPress} style={styles.tabBtn} scaleTo={0.92} haptic={!active}>
      <Animated.View style={iconStyle}>
        <Icon
          size={22}
          color={active ? colors.primary : colors.inkFaint}
          strokeWidth={active ? 2.5 : 2}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, active && { color: colors.primary, fontFamily: font.bold }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

export default function TabLayout() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [barW, setBarW] = useState(0);
  const idx = useSharedValue(0);

  const cell = barW / TABS.length;
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(idx.value * cell + cell / 2 - 14, {
          duration: motion.base,
          easing: motion.ease,
        }),
      },
    ],
  }));

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={({ state, navigation }) => {
        idx.value = state.index;
        return (
          <View style={[styles.dockWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.dock} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
              {barW > 0 && <Animated.View style={[styles.indicator, indicatorStyle]} />}
              {TABS.map((tab, i) => (
                <TabButton
                  key={tab.name}
                  label={tab.label}
                  Icon={tab.Icon}
                  active={state.index === i}
                  onPress={() => {
                    const route = state.routes[i];
                    if (state.index !== i) navigation.navigate(route.name);
                  }}
                />
              ))}
            </View>
          </View>
        );
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}

const useStyles = themedStyles((colors) => ({
  dockWrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dock: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingVertical: 10,
    ...shadow.float,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    left: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  tabBtn: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 4 },
  tabLabel: { fontFamily: font.medium, fontSize: 10, color: colors.inkFaint },
}));
