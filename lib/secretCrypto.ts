// lib/secretCrypto.ts

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function deriveKeyFromAnswers(answers: string[]): Promise<CryptoKey> {
  const concatenated = answers.join("");
  const rawBytes = textEncoder.encode(concatenated);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", rawBytes);

  return window.crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt", "encrypt"]
  );
}

export async function decryptSecretPayload(encryptedBase64: string, key: CryptoKey): Promise<string> {
  const rawBytes = base64ToBuffer(encryptedBase64);
  if (rawBytes.length < 32) {
    throw new Error("密文格式无效");
  }

  const iv = rawBytes.slice(0, 16);
  const ciphertext = rawBytes.slice(16);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    key,
    ciphertext as unknown as ArrayBuffer
  );

  return textDecoder.decode(decryptedBuffer);
}

export async function encryptSecretPayload(plainText: string, key: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const encodedData = textEncoder.encode(plainText);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    key,
    encodedData as unknown as ArrayBuffer
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return bufferToBase64(combined);
}
