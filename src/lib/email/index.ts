export { buildEmailElement } from "./build";
export { getResendClient } from "./client";
export {
  APP_URL,
  BRAND_COLORS,
  BUSINESS_ADDRESS,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
} from "./constants";
export { sendEmail } from "./send";
export { fetchSuggestedItemNames } from "./suggestions";
export {
  MANDATORY_EMAIL_TYPES,
  mapTypeToPrefKey,
  type EmailType,
  type SendEmailOptions,
  type SendEmailResult,
} from "./types";
