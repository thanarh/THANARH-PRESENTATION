/**
 * PIN & Quick-Auth utilities — Thanarah Portal
 *
 * PIN flow:
 *   1. After login  → setupPin(pin, refreshToken) — encrypts refresh token with AES-GCM derived from PIN
 *   2. Next visit   → verifyPin(pin) → returns refresh token or null (wrong PIN)
 *
 * Passkey (biometric) refresh flow:
 *   1. After login  → storePasskeyRefresh(refreshToken)
 *   2. Biometric OK → getPasskeyRefresh() → feed into /api/auth/refresh
 */

const PIN_SALT_KEY    = 'thanarah_pin_salt';
const PIN_CIPHER_KEY  = 'thanarah_pin_cipher'; // AES-GCM encrypted refresh token
const PIN_ATTEMPTS    = 'thanarah_pin_attempts';
const PASSKEY_RT_KEY  = 'thanarah_passkey_rt';

export const MAX_PIN_ATTEMPTS = 5;

// ── Detection ──────────────────────────────────────────────────────────────────

export function hasPinSet(): boolean {
  return !!localStorage.getItem(PIN_CIPHER_KEY);
}

export function getPinAttempts(): number {
  return parseInt(localStorage.getItem(PIN_ATTEMPTS) || '0', 10);
}

export function hasPasskeyRefresh(): boolean {
  return !!localStorage.getItem(PASSKEY_RT_KEY);
}

// ── Internal helpers ───────────────────────────────────────────────────────────

/** Encode binary to base64 string */
function b64e(arr: Uint8Array<ArrayBuffer>): string {
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

/** Decode base64 string to Uint8Array backed by a plain ArrayBuffer */
function b64d(s: string): Uint8Array<ArrayBuffer> {
  const raw = atob(s);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function deriveKey(pin: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(n);
  const arr = new Uint8Array(buf) as Uint8Array<ArrayBuffer>;
  crypto.getRandomValues(arr);
  return arr;
}

// ── PIN setup ─────────────────────────────────────────────────────────────────

export async function setupPin(pin: string, refreshToken: string): Promise<void> {
  const salt = randomBytes(16);
  const iv   = randomBytes(12);
  const key  = await deriveKey(pin, salt);

  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(refreshToken),
  );

  localStorage.setItem(PIN_SALT_KEY,   b64e(salt));
  localStorage.setItem(PIN_CIPHER_KEY, JSON.stringify({
    iv: b64e(iv),
    ct: b64e(new Uint8Array(ct) as Uint8Array<ArrayBuffer>),
  }));
  localStorage.removeItem(PIN_ATTEMPTS);
}

// ── PIN verify — returns refresh token or null ─────────────────────────────────

export async function verifyPin(pin: string): Promise<string | null> {
  const saltB64    = localStorage.getItem(PIN_SALT_KEY);
  const cipherJSON = localStorage.getItem(PIN_CIPHER_KEY);
  if (!saltB64 || !cipherJSON) return null;
  try {
    const { iv: ivB64, ct: ctB64 } = JSON.parse(cipherJSON) as { iv: string; ct: string };
    const key   = await deriveKey(pin, b64d(saltB64));
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64d(ivB64) },
      key,
      b64d(ctB64),
    );
    localStorage.removeItem(PIN_ATTEMPTS);
    return new TextDecoder().decode(plain);
  } catch {
    const attempts = getPinAttempts() + 1;
    localStorage.setItem(PIN_ATTEMPTS, String(attempts));
    if (attempts >= MAX_PIN_ATTEMPTS) clearPin();
    return null;
  }
}

export function clearPin(): void {
  localStorage.removeItem(PIN_SALT_KEY);
  localStorage.removeItem(PIN_CIPHER_KEY);
  localStorage.removeItem(PIN_ATTEMPTS);
}

// ── Passkey-linked refresh token ───────────────────────────────────────────────

export function storePasskeyRefresh(refreshToken: string): void {
  localStorage.setItem(PASSKEY_RT_KEY, refreshToken);
}

export function getPasskeyRefresh(): string | null {
  return localStorage.getItem(PASSKEY_RT_KEY);
}

export function clearPasskeyRefresh(): void {
  localStorage.removeItem(PASSKEY_RT_KEY);
}

export function clearAllQuickAuth(): void {
  clearPin();
  clearPasskeyRefresh();
}
