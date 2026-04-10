/**
 * Client-side SHA-256 hashing using the Web Crypto API.
 * The hash is computed in the browser so the original document bytes
 * never leave the client unprocessed.
 */

/**
 * Compute a SHA-256 hash of the given ArrayBuffer and return it as a
 * lowercase hexadecimal string.
 */
export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return bufferToHex(hashBuffer);
}

/**
 * Read a File object as an ArrayBuffer and return its SHA-256 hex digest.
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256Hex(buffer);
}

/**
 * Convert an ArrayBuffer to a lowercase hexadecimal string.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
