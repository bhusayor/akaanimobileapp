/**
 * The platform-api bearer token.
 *
 * Kept out of the AsyncStorage blob in `store.tsx` on purpose: the token is a
 * 120-day credential, so on a phone it lives in the Keychain / Keystore via
 * SecureStore. SecureStore has no web implementation, so the web build falls
 * back to AsyncStorage.
 *
 * Also held in memory so `api/platform.ts` can attach it synchronously.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore keys allow only letters, digits, ".", "-" and "_".
const KEY = 'akaani.platform-token';

let token: string | null = null;

export function getToken(): string | null {
  return token;
}

/** Reads the saved token into memory. Call once at start-up. */
export async function loadToken(): Promise<string | null> {
  try {
    token = Platform.OS === 'web' ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  } catch {
    token = null;
  }
  return token;
}

export async function saveToken(next: string): Promise<void> {
  token = next;
  if (Platform.OS === 'web') await AsyncStorage.setItem(KEY, next);
  else await SecureStore.setItemAsync(KEY, next);
}

export async function clearToken(): Promise<void> {
  token = null;
  try {
    if (Platform.OS === 'web') await AsyncStorage.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing saved, or storage unavailable — the in-memory token is gone either way.
  }
}
