/**
 * Shared validation utilities.
 */

/**
 * Validate an email address using a simple, ReDoS-safe pattern.
 * Accepts the most common valid addresses without catastrophic backtracking.
 */
export function isValidEmail(email: string): boolean {
  // Simple non-backtracking check: local@domain.tld
  // Deliberately conservative – avoids complex nested quantifiers.
  const atIndex = email.indexOf("@");
  if (atIndex < 1) return false;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length === 0 || domain.length === 0) return false;
  // Domain must contain at least one dot after the first character
  const dotIndex = domain.indexOf(".");
  return dotIndex > 0 && dotIndex < domain.length - 1;
}
