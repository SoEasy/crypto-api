////////////////// HELPERS //////////////////////

export function stringToBase64(value: string): string {
  return window.btoa(value);
  // return window.btoa(unescape(encodeURIComponent(value)));
}

export function base64ToString(value: string): string {
  return window.atob(value);
  // return decodeURIComponent(escape(window.atob(value)));
}

export function stringToBytes(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export function bytesToString(data: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(data) as unknown as Array<number>);
}

////////////////// CRYPTO FUNCTIONS //////////////////////

export function generateECHDKey(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-521'
    },
    true,
    ['deriveKey']
  );
}

/**
 * Эта функция у нас не используется, но позволяет не хранить на сервере публичный ключ клиента вовсе.
 * Ну так, на всякий случай.
 * Потому что публичный ключ можно восстановить из приватного ключа
 */
export async function getPublicECDHKeyFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
  const exported = await crypto.subtle.exportKey(
    'jwk',
    privateKey
  );

  delete exported.d;

  const imported = await window.crypto.subtle.importKey(
    'jwk',
    exported,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  return imported;
}

/**
 * Функция поулчения согласованного AES ключа из ECDH-ключей
 */
export function deriveAESKeyFromECDH({
  ownPrivateKey,
  anotherPublicKey
}: {ownPrivateKey: CryptoKey, anotherPublicKey: CryptoKey}) {
  return window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: anotherPublicKey
    },
    ownPrivateKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Из байтов чистого пароля получть CryptoKey
 */
export async function makeAESKeyFromPassword(password: string): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    stringToBytes(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: stringToBytes('salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportAESKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

export async function importAESKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

export async function exportECHDPrivateKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('pkcs8', key);
}

export async function importECDHPrivateKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDH', namedCurve: 'P-521' },
    true,
    ['deriveKey']
  );
}

export async function exportECDHPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('spki', key);
}

export async function importECHDPublicKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'spki',
    keyBytes,
    { name: 'ECDH', namedCurve: 'P-521' },
    false,
    []
  );
}

export function encryptByAES({ data, aes }: {data: ArrayBuffer, aes: CryptoKey}): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: stringToBytes('secretVector') },
    aes,
    data
  );
}

export function decryptByAES({ data, aes }: {data: ArrayBuffer, aes: CryptoKey}): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: stringToBytes('secretVector') },
    aes,
    data
  );
}
