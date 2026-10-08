import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MealDraftProvider } from '../lib/meal-draft';
import { BillingProvider } from '../lib/billing';
import { ShakeFeedbackProvider } from '../lib/shake';
import { StoreProvider } from '../lib/store';
import { ThemeModeProvider, useAppScheme, useThemeMode } from '../lib/theme-mode';
import { darkBgGradient, lightColors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <RootNavigator />
    </ThemeModeProvider>
  );
}

function RootNavigator() {
  const dark = useAppScheme() === 'dark';
  const { hydrated } = useThemeMode();
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  // Wait for the saved appearance too, so the first frame never flashes the wrong theme.
  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: dark ? '#001414' : lightColors.bg }}>
        {dark && (
          <LinearGradient
            colors={[...darkBgGradient]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 1 }}
          />
        )}
        <StoreProvider>
          <BillingProvider>
          <MealDraftProvider>
            <ShakeFeedbackProvider>
              <StatusBar style={dark ? 'light' : 'dark'} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: dark ? 'transparent' : lightColors.bg },
                  animation: 'fade_from_bottom',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="setup" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="meal/[id]" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', animation: 'fade', animationDuration: 180 }} />
                <Stack.Screen name="grocery" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="explore" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="week" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="streak" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="scan-review" options={{ animation: 'fade' }} />
                <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="cuisines" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="collection/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="cuisine/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="meal-review" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="ingredient-edit" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </ShakeFeedbackProvider>
          </MealDraftProvider>
          </BillingProvider>
        </StoreProvider>
      </View>
    </GestureHandlerRootView>
  );
}
