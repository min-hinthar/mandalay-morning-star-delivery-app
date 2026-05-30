// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to read and share.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const REFERRAL_CODE_LENGTH = 7;

/** Referrer reward (cents) issued when a referred friend places their first order. */
export const REFERRAL_REWARD_CENTS = 1000;

/** Auto-applied discount (cents) on a NEW referred customer's first order. */
export const REFEREE_DISCOUNT_CENTS = 1000;

/** Auto-applied discount (cents) on a NEW non-referred customer's first order. */
export const WELCOME_DISCOUNT_CENTS = 500;

/** Minimum cart subtotal (cents) required for a first-order auto-discount. */
export const FIRST_ORDER_MIN_SUBTOTAL_CENTS = 5000;

/** A random, shareable referral code. Uniqueness is enforced by the DB. */
export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** Normalize user-entered/URL codes to the canonical form. */
export function normalizeReferralCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

/** Shareable link that pre-fills the referral code. */
export function referralShareUrl(appUrl: string, code: string): string {
  return `${appUrl.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;
}
