import crypto from "crypto";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateVerificationToken(ttlMs: number = TOKEN_TTL_MS): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);
  return { token, tokenHash, expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
