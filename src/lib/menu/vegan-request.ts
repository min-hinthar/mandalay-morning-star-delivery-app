/**
 * "Vegan on request" support.
 *
 * Many Burmese dishes (salads, veg soups, flatbreads) are vegan EXCEPT for a
 * finishing fish sauce / shrimp powder / ngapi (or ghee on the bread). Those
 * carry the `vegan-optional` tag: they surface under the Vegan filter with a
 * "Vegan on request" badge, and the dish sheet offers a one-tap "Make it vegan"
 * toggle that attaches a bilingual kitchen instruction to the order line.
 */

export const VEGANIZABLE_TAG = "vegan-optional";

export const VEGAN_NOTE_EN = "Make it vegan — no fish sauce, shrimp powder, or ngapi";
// Burmese kitchen instruction — owner-verified wording. (EN always accompanies
// it on the ticket.)
export const VEGAN_NOTE_MY = "သားသတ်လွတ် — ငါးပိ၊ ပုစွန်ခြောက်၊ ငါးငံပြာရည် မထည့်ပါနှင့်";

/** The composed line that gets prepended to the order's notes when toggled on. */
export const VEGAN_NOTE = `${VEGAN_NOTE_EN} (${VEGAN_NOTE_MY})`;

/** Must match the checkout schema (`checkoutItemSchema.notes.max(500)`). */
export const NOTES_MAX = 500;

/** Per-user text budget once the kitchen instruction is prepended. */
export function userNotesBudget(makeVegan: boolean): number {
  return makeVegan ? Math.max(0, NOTES_MAX - (VEGAN_NOTE.length + 1)) : NOTES_MAX;
}

/** Whether a dish can be made vegan on request. */
export function isVeganizable(tags: string[] | undefined | null): boolean {
  return !!tags && tags.includes(VEGANIZABLE_TAG);
}

/**
 * Build the order notes, prepending the kitchen instruction when toggled on.
 * Always ≤ NOTES_MAX so the composed value never trips the checkout cap.
 */
export function composeNotes(makeVegan: boolean, userNotes: string): string {
  const u = userNotes.trim();
  if (!makeVegan) return u.slice(0, NOTES_MAX);
  if (!u) return VEGAN_NOTE;
  return `${VEGAN_NOTE}\n${u}`.slice(0, NOTES_MAX);
}

/**
 * Recover the toggle + user notes from a stored notes string (edit mode).
 * Matches on the STABLE English prefix (the Burmese wording may change / an
 * IndexedDB-persisted cart predates an edit), so the toggle round-trips even
 * if VEGAN_NOTE_MY differs from the stored note.
 */
export function splitVeganNote(notes: string): { makeVegan: boolean; userNotes: string } {
  if (notes.startsWith(VEGAN_NOTE_EN)) {
    const nl = notes.indexOf("\n");
    return { makeVegan: true, userNotes: nl === -1 ? "" : notes.slice(nl + 1) };
  }
  return { makeVegan: false, userNotes: notes };
}
