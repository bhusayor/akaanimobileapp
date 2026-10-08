/**
 * Hands the latest scan from the camera to the review screen.
 *
 * A module value rather than route params: the result is structured, and the
 * review screen only makes sense straight after a scan. If it is opened any
 * other way (deep link, reload) there is no session and it sends the user back
 * to the camera.
 */
import type { ScanResult } from '../api/scan';

export type ScanSession = { photoUri: string; result: ScanResult };

let current: ScanSession | null = null;

export function setScanSession(s: ScanSession | null) {
  current = s;
}

export function getScanSession(): ScanSession | null {
  return current;
}
