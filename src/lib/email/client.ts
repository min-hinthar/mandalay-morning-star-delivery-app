import { Resend } from "resend";

// ===========================================
// RESEND CLIENT (singleton)
// ===========================================

let instance: Resend | null = null;

/**
 * Returns a singleton Resend client.
 * Throws if RESEND_API_KEY is not set.
 */
export function getResendClient(): Resend {
  if (instance) return instance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is not configured. " +
        "Get your API key from https://resend.com/api-keys",
    );
  }

  instance = new Resend(apiKey);
  return instance;
}
