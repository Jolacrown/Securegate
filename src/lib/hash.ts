import bcrypt from "bcryptjs";

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

/**
 * Hash a plaintext password using bcrypt.
 * Rounds are configured via the BCRYPT_ROUNDS env var (default 10).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * Returns true if they match.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
