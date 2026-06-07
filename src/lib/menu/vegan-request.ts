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
// DRAFT Burmese kitchen instruction — VERIFY wording with the owner before
// relying on it for staff. (EN always accompanies it on the ticket.)
export const VEGAN_NOTE_MY = "သက်သတ်လွတ် — ငါးပိ၊ ပုစွန်ခြောက်၊ ငါးငံပြာရည် မထည့်ပါနှင့်";

/** The composed line that gets prepended to the order's notes when toggled on. */
export const VEGAN_NOTE = `${VEGAN_NOTE_EN} (${VEGAN_NOTE_MY})`;

/** Whether a dish can be made vegan on request. */
export function isVeganizable(tags: string[] | undefined | null): boolean {
  return !!tags && tags.includes(VEGANIZABLE_TAG);
}

/** Build the order notes, prepending the kitchen instruction when toggled on. */
export function composeNotes(makeVegan: boolean, userNotes: string): string {
  const u = userNotes.trim();
  if (!makeVegan) return u;
  return u ? `${VEGAN_NOTE}\n${u}` : VEGAN_NOTE;
}

/** Recover the toggle + user notes from a stored notes string (edit mode). */
export function splitVeganNote(notes: string): { makeVegan: boolean; userNotes: string } {
  if (notes.startsWith(VEGAN_NOTE)) {
    return { makeVegan: true, userNotes: notes.slice(VEGAN_NOTE.length).replace(/^\n/, "") };
  }
  return { makeVegan: false, userNotes: notes };
}
