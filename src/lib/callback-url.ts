/** Only allow same-origin relative paths to prevent open-redirect via a crafted callbackUrl. */
export function safeCallbackUrl(callbackUrl: string | undefined | null, fallback: string): string {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return fallback;
  return callbackUrl;
}
