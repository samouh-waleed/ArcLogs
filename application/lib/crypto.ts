// lib/crypto.ts
// AES-256-GCM symmetric encryption for secrets stored in the database
// (Slack bot tokens, Jira API tokens).
//
// Format on disk: base64(iv):base64(authTag):base64(ciphertext)
// The 12-byte IV is random per encryption call so identical values produce
// different ciphertext, and GCM provides authenticated encryption.
//
// Plaintext fallback: if a value doesn't match the encrypted format it is
// returned as-is.  This allows the app to keep working while existing
// unencrypted rows are migrated via `npm run db:encrypt-tokens`.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

// Pattern that matches our stored format: three colon-separated base64 blobs
const ENC_PATTERN = /^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Add a 64-character hex string to your .env file."
    );
  }
  if (hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit nonce — recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decrypt(text: string): string {
  // Return as-is if empty or doesn't look like our encrypted format
  // (graceful plaintext fallback for values not yet migrated)
  if (!text || !ENC_PATTERN.test(text)) return text;

  try {
    const [ivB64, authTagB64, ciphertextB64] = text.split(":");
    const key = getKey();
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // If decryption fails (wrong key, corrupted value) fall back to raw text
    // so the app doesn't hard-crash. The downstream Slack/Jira call will fail
    // with a clear auth error instead of an opaque crash.
    console.error("[crypto] decrypt() failed — returning raw value");
    return text;
  }
}

/** True when the value looks like it was produced by encrypt(). */
export function isEncrypted(text: string): boolean {
  return Boolean(text && ENC_PATTERN.test(text));
}
