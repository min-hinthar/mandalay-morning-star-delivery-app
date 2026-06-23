/**
 * Bilingual (English + Burmese) copy for the rewards UI.
 *
 * Centralized so English and Burmese stay in sync and `lang="my"` can be applied
 * consistently. Functions return `{ en, my }`; components render English as the
 * primary string and Burmese in a `lang="my"` element beneath/beside it.
 *
 * Burmese is colloquial/warm to match the brand voice ("...နော်").
 */

export interface BilingualText {
  en: string;
  my: string;
}

/** Days-until-expiry label. */
export function expiryLabel(daysLeft: number): BilingualText {
  if (daysLeft <= 0) return { en: "Expires today", my: "ဒီနေ့ ကုန်ဆုံးမယ်" };
  if (daysLeft === 1) return { en: "Expires tomorrow", my: "မနက်ဖြန် ကုန်ဆုံးမယ်" };
  return { en: `Expires in ${daysLeft} days`, my: `နောက် ${daysLeft} ရက် ကုန်ဆုံးမယ်` };
}

/**
 * Bare English day-count for "…expires {label}" sentence templates (the expiring
 * reward's push title, email subject, and email body). Treats null / 0 / past-due
 * as "today" — mirrors `expiryLabel`'s `<= 0` case so the body, subject, and push
 * can never diverge (e.g. body "today" vs subject "in 0 days").
 */
export function expiringDayLabel(daysLeft: number | null | undefined): string {
  if (daysLeft == null || daysLeft <= 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  return `in ${daysLeft} days`;
}

/** Empty-wallet onboarding. */
export const WALLET_EMPTY: BilingualText = {
  en: "No coupons yet — earn a Star with every order, and a thank-you reward every 5 orders.",
  my: "ကူပွန် မရှိသေးပါ — အော်ဒါတိုင်း Star တစ်လုံး၊ ၅ ကြိမ်တိုင်း ကျေးဇူးဆု တစ်ခု ရပါမယ်နော်။",
};

/** Wallet usage hint. */
export const WALLET_USE_HINT: BilingualText = {
  en: "Use at checkout on orders $50+",
  my: "$50 အထက် အော်ဒါတွေမှာ ချက်ဘောက်မှာ သုံးနိုင်ပါတယ်",
};

/** Copy-to-clipboard success (for aria-live). */
export const COPIED: BilingualText = {
  en: "Code copied to clipboard",
  my: "ကုဒ်ကို ကူးယူပြီးပါပြီ",
};

/** Clipboard-unavailable fallback hint. */
export const COPY_FALLBACK: BilingualText = {
  en: "Press and hold to copy the code",
  my: "ကုဒ်ကို ကူးရန် ဖိထားပါ",
};

/** Generic rewards load error. */
export const LOAD_ERROR: BilingualText = {
  en: "We couldn't load your rewards. Please try again.",
  my: "သင့်ဆုလက်ဆောင်များ ဖွင့်၍မရပါ။ ထပ်ကြိုးစားပါ။",
};

/** Retry button label. */
export const RETRY: BilingualText = { en: "Try again", my: "ထပ်စမ်းကြည့်ပါ" };

/** Reward-unlocked celebration (for aria-live announcement). */
export function unlockedAnnounce(amount: string): BilingualText {
  return {
    en: `Congratulations! You unlocked a ${amount} reward.`,
    my: `ဂုဏ်ယူပါတယ်! ${amount} ဆုလက်ဆောင် ရရှိလိုက်ပါပြီ။`,
  };
}

/** Orders-to-next-reward progress line. */
export function ordersToReward(ordersToNext: number, amount: string): BilingualText {
  if (ordersToNext === 1) {
    return {
      en: `Just 1 more order to your next ${amount} reward`,
      my: `နောက်ထပ် ၁ ခါ မှာရင် ${amount} ဆု ရတော့မယ်နော်`,
    };
  }
  return {
    en: `${ordersToNext} more orders to your next ${amount} reward`,
    my: `နောက်ထပ် ${ordersToNext} ခါ မှာရင် ${amount} ဆု ရတော့မယ်နော်`,
  };
}

/** Climb-to-next-tier line, denominated in spend (e.g. "$120 more to reach Ruby"). */
export function spendToTier(amountToNextTier: string, tierName: string): BilingualText {
  return {
    en: `${amountToNextTier} more to reach ${tierName}`,
    my: `${tierName} ရဖို့ နောက်ထပ် ${amountToNextTier} သုံးရန်`,
  };
}
