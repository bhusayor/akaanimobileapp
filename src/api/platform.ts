/**
 * Client for the Akaani platform-api (github.com/useakaani/platform-api).
 *
 * Set EXPO_PUBLIC_PLATFORM_API_URL to the server root, e.g.
 * http://192.168.1.20:30123 in development or the deployed host. Paths below
 * include the /v1 prefix.
 *
 * Separate from EXPO_PUBLIC_AKAANI_API_URL (the nutrition client in
 * `nutrition.ts`) because platform-api's /v1/nutrition/calculate takes a
 * different payload from the one the meal builder sends; pointing both at the
 * same server today would break the builder.
 *
 * Every response is wrapped as { success, status_code, message, data }; this
 * module unwraps `data` and turns failures into `PlatformApiError` carrying the
 * server's own message ("Invalid email/password", …).
 */
import { clearToken, getToken } from '../lib/session';

export const PLATFORM_API_URL = (process.env.EXPO_PUBLIC_PLATFORM_API_URL ?? '').replace(/\/+$/, '');

/** False → login/signup stay local-only and scan uses its dev/demo fallbacks. */
export const usingPlatformApi = PLATFORM_API_URL.length > 0;

const DEFAULT_TIMEOUT_MS = 15000;

export class PlatformApiError extends Error {
  /** HTTP status, or 0 when the request never got a response. */
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'PlatformApiError';
    this.status = status;
  }
  /** The token was missing, expired or rejected — the user must sign in again. */
  get sessionExpired() {
    return this.status === 401;
  }
}

/** `getPublicFields()` on the server's User entity. */
export type PlatformUser = {
  _id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  username?: string;
  email_verified?: boolean;
  isonboarded?: boolean;
};

export type AuthResponse = { token: string; user: PlatformUser };

export async function platformRequest<T>(
  path: string,
  {
    method = 'GET',
    body,
    auth = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener?.('abort', onAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${PLATFORM_API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      // A rejected token is useless from here on — drop it so nothing keeps sending it.
      if (res.status === 401 && token) await clearToken();
      throw new PlatformApiError(json?.message || `Request failed (${res.status})`, res.status);
    }
    return (json?.data ?? json) as T;
  } catch (err) {
    if (err instanceof PlatformApiError) throw err;
    if ((err as Error)?.name === 'AbortError' && signal?.aborted) throw err;
    throw new PlatformApiError(
      (err as Error)?.name === 'AbortError'
        ? 'The server took too long to respond.'
        : "Couldn't reach Akaani. Check your connection and try again.",
      0
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

/* ---- Auth ---- */

export function login(email: string, password: string) {
  return platformRequest<AuthResponse>('/v1/auth/login', {
    method: 'POST',
    body: { email: email.trim(), password },
    auth: false,
  });
}

export function signup(input: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
}) {
  return platformRequest<AuthResponse>('/v1/auth/signup', { method: 'POST', body: input, auth: false });
}

/** The signed-in user — also a cheap way to check the saved token still works. */
export function whoami(signal?: AbortSignal) {
  return platformRequest<PlatformUser>('/v1/users/whoami', { signal });
}

export function displayName(u: PlatformUser): string {
  return [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email.split('@')[0];
}
