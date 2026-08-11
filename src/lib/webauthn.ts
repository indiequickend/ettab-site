export const RP_NAME = "ETTAB Members";
export const WEBAUTHN_CHALLENGE_TTL_MS = 5 * 60 * 1000;

export function getRpId(): string {
  return new URL(process.env.NEXTAUTH_URL!).hostname;
}

export function getOrigin(): string {
  return process.env.NEXTAUTH_URL!;
}
