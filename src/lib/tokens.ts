import { randomBytes, createHash } from "crypto";

/**
 * Generate a cryptographically random token string.
 * Returns hex-encoded, 32 bytes (64 characters).
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a reset token with SHA-256 for database storage.
 * We never store the raw token — only its hash.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
