/**
 * Vault encryption.
 *
 * The passphrase never leaves the device. It is stretched with PBKDF2 into
 * an AES-GCM key that encrypts the whole vault before it touches storage,
 * so the data at rest is unreadable without it — including to anyone who
 * opens the site, since the app ships as static files.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

const PBKDF2_ROUNDS = 250_000;

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(b64: string): Uint8Array {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ROUNDS,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export interface Sealed {
  salt: string;
  iv: string;
  data: string;
}

export async function seal(key: CryptoKey, salt: Uint8Array, value: unknown): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    enc.encode(JSON.stringify(value))
  );
  return { salt: bufToB64(salt.buffer as ArrayBuffer), iv: bufToB64(iv.buffer as ArrayBuffer), data: bufToB64(data) };
}

/** Returns null when the passphrase is wrong — AES-GCM fails to authenticate. */
export async function unseal<T>(key: CryptoKey, sealed: Sealed): Promise<T | null> {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuf(sealed.iv) as unknown as BufferSource },
      key,
      b64ToBuf(sealed.data) as unknown as BufferSource
    );
    return JSON.parse(dec.decode(plain)) as T;
  } catch {
    return null;
  }
}

export function saltFromSealed(sealed: Sealed): Uint8Array {
  return b64ToBuf(sealed.salt);
}

/** Used for the second gate on Business Documents. */
export async function hashSecret(secret: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(`${salt}:${secret}`)
  );
  return bufToB64(digest);
}
