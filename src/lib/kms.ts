/**
 * AES-256-GCM Key Management System (KMS) helpers.
 *
 * Private key material from BYOC .p12 files is encrypted with an AES-256-GCM
 * key derived from the KMS master secret before being stored in the database.
 * Only encrypted blobs are persisted; the plaintext key never touches storage.
 */
import * as crypto from "crypto";

/** Size of the GCM authentication tag in bytes. */
const TAG_LENGTH_BYTES = 16;
/** Size of the GCM IV in bytes. */
const IV_LENGTH_BYTES = 12;

/**
 * Derive a 256-bit AES key from the KMS master secret using HKDF-SHA-256.
 *
 * @param keyId   Unique identifier for the stored key (used as HKDF info).
 * @returns 32-byte key material as a Buffer.
 */
function deriveAesKey(keyId: string): Buffer {
  const masterSecret = process.env.KMS_MASTER_SECRET;
  if (!masterSecret || masterSecret.length < 32) {
    throw new Error(
      "KMS_MASTER_SECRET env var must be set and at least 32 characters"
    );
  }
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(masterSecret, "utf8"),
      Buffer.alloc(0), // salt – empty; master secret already has high entropy
      Buffer.from(`lawgda-kms-${keyId}`, "utf8"),
      32
    )
  );
}

/**
 * Encrypt plaintext bytes with AES-256-GCM.
 *
 * @returns Base64-encoded string of `iv (12 B) || ciphertext || tag (16 B)`.
 */
export function encryptPrivateKey(plaintext: Buffer, keyId: string): string {
  const key = deriveAesKey(keyId);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt a blob produced by `encryptPrivateKey`.
 *
 * @returns Decrypted plaintext Buffer.
 */
export function decryptPrivateKey(encryptedBase64: string, keyId: string): Buffer {
  const key = deriveAesKey(keyId);
  const data = Buffer.from(encryptedBase64, "base64");

  const iv = data.subarray(0, IV_LENGTH_BYTES);
  const tag = data.subarray(data.length - TAG_LENGTH_BYTES);
  const ciphertext = data.subarray(IV_LENGTH_BYTES, data.length - TAG_LENGTH_BYTES);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
