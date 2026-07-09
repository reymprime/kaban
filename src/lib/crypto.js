// Kaban vault encryption — WebCrypto AES-256-GCM with PBKDF2 key derivation.
// The password is NEVER stored. Only a salt and a verifier live in IndexedDB.
// If the password is forgotten, protected content is unrecoverable BY DESIGN.

const te = new TextEncoder();
const td = new TextDecoder();

function b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function unb64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export function makeSalt() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return b64(b);
}

export async function deriveKey(password, saltB64) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    te.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: unb64(saltB64),
      iterations: 310000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(key, text) {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(text));
  return `kbn1:${b64(iv)}:${b64(ct)}`;
}

export function isCipher(s = '') {
  return typeof s === 'string' && s.startsWith('kbn1:');
}

export async function decryptText(key, payload) {
  const [, ivB, ctB] = payload.split(':');
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(ivB) },
    key,
    unb64(ctB)
  );
  return td.decode(pt);
}
