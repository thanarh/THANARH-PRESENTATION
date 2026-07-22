/**
 * Passkey (WebAuthn) utilities — Thanarah Portal
 *
 * Local-device passkey flow:
 *   1. After login  → register a platform credential (Touch ID / Face ID / fingerprint)
 *   2. On next visit → verify credential → unlock the stored refresh token flow
 *
 * The credential is scoped to this device only. Clearing browser data removes it.
 */

export const PASSKEY_CID_KEY  = 'thanarah_passkey_cid';
export const PASSKEY_NAME_KEY = 'thanarah_passkey_name';

// ── Feature detection ─────────────────────────────────────────────────────────

export function passkeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    'credentials' in navigator
  );
}

export function hasStoredPasskey(): boolean {
  return passkeySupported() && !!localStorage.getItem(PASSKEY_CID_KEY);
}

export function getPasskeyDisplayName(): string {
  return localStorage.getItem(PASSKEY_NAME_KEY) || '';
}

// ── Registration ──────────────────────────────────────────────────────────────

export async function registerPasskey(
  userId: string,
  email: string,
  displayName: string,
): Promise<boolean> {
  if (!passkeySupported()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Thanarah', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;

    if (credential) {
      localStorage.setItem(PASSKEY_CID_KEY, credential.id);
      localStorage.setItem(PASSKEY_NAME_KEY, displayName || email);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Verification ──────────────────────────────────────────────────────────────

export async function verifyPasskey(): Promise<boolean> {
  const credId = localStorage.getItem(PASSKEY_CID_KEY);
  if (!credId || !passkeySupported()) return false;

  try {
    // base64url → ArrayBuffer
    const b64 = credId.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60_000,
        userVerification: 'required',
        allowCredentials: [{ id: bytes.buffer, type: 'public-key' }],
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

export function clearPasskey(): void {
  localStorage.removeItem(PASSKEY_CID_KEY);
  localStorage.removeItem(PASSKEY_NAME_KEY);
}
