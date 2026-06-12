/**
 * Email design tokens — the hero "warm paper" language translated for email
 * clients. Mirrors `src/styles/tokens.css` (hero-ink / clay / blue / sage /
 * cream) but as solid hex values: email clients want flat colors, no CSS vars.
 *
 * Rendering constraints baked in:
 * - Web fonts (Fraunces / Hanken Grotesk / Padauk) load in Apple Mail & some
 *   webmail; everywhere else the stacks fall back to Georgia / system sans.
 * - No gradients on meaningful surfaces (Outlook drops them) — depth comes
 *   from hairlines, tinted panels, and letterpress button edges instead.
 * - Text colors are AA on `paper` unless marked small-print.
 */

export const C = {
  // Ink — hero-ink and steps down
  ink: "#141413",
  inkMuted: "#6b6a64",
  inkFaint: "#91908a", // small print only (≥12px, non-essential)

  // Paper surfaces
  paper: "#faf9f5", // card background (hero-card-bg)
  vellum: "#f4f1e8", // secondary warm surface
  canvas: "#f0eee6", // body background behind the card

  // Hairlines
  line: "#e6e2d6",
  lineStrong: "#d6d1c0",
  goldLeaf: "#e3cf9b", // gold-leaf hairline for special panels

  // Clay — book-cloth accent (CTAs, links, accent text)
  clay: "#d97757",
  clayDeep: "#b4552f", // letterpress edge under clay buttons
  accent: "#9a3412", // accent TEXT — AA on paper
  accentStrong: "#7c2d12",
  clayTint: "#f9ece5",
  clayTintBorder: "#ecccbc",

  // Blue — triad accent
  blue: "#6a9bcc",
  blueDeep: "#3e6a96", // readable blue text on paper
  blueTint: "#eef3fa",
  blueTintBorder: "#c9d9ea",

  // Sage — triad accent (also replaces the old #3D8B22 success green)
  sage: "#788c5d",
  sageDeep: "#4f6234", // readable green text on paper
  sageTint: "#eff2e9",
  sageTintBorder: "#cfd8c2",

  // Gold — stars, rewards, gentle warnings
  gold: "#eaa92f",
  goldDeep: "#946708", // readable gold text on paper
  goldTint: "#f9f1dd",
  goldTintBorder: "#ecd9a8",

  // Brand
  star: "#a41034", // Mandalay deep red — the star mark only
  white: "#ffffff",
} as const;

/** Fraunces (Apple Mail et al.) → Georgia everywhere else. */
export const DISPLAY_FONT = "'Fraunces', Georgia, 'Times New Roman', serif";

/** Hanken Grotesk → system sans. */
export const BODY_FONT =
  "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Padauk for Burmese script where the webfont loads; system fonts cover the rest. */
export const BURMESE_FONT = `'Padauk', 'Myanmar Text', ${BODY_FONT}`;

/**
 * Webfont @import for clients that honor <style> (Apple Mail ≈ half of opens).
 * Gmail strips it and falls back — by design.
 */
export const FONTS_IMPORT_CSS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&family=Padauk:wght@400;700&display=swap');`;

// ── Shared style fragments ─────────────────────────────────

/** Editorial section heading (Fraunces, ink). */
export function headingStyle(size = 22): React.CSSProperties {
  return {
    fontSize: `${size}px`,
    fontFamily: DISPLAY_FONT,
    fontWeight: 600,
    color: C.ink,
    lineHeight: 1.25,
    margin: "0 0 8px 0",
  };
}

/** Default body copy. */
export function bodyStyle(size = 15): React.CSSProperties {
  return {
    fontSize: `${size}px`,
    fontFamily: BODY_FONT,
    color: C.inkMuted,
    lineHeight: 1.6,
    margin: "0",
  };
}

/** Letter-spaced uppercase kicker, deep clay — the editorial eyebrow. */
export function kickerStyle(size = 11): React.CSSProperties {
  return {
    fontSize: `${size}px`,
    fontFamily: BODY_FONT,
    fontWeight: 700,
    color: C.accent,
    textTransform: "uppercase",
    letterSpacing: "2px",
    margin: "0",
  };
}

/** Tiny label over a value (data rows, order meta). */
export function labelStyle(): React.CSSProperties {
  return {
    fontSize: "11px",
    fontFamily: BODY_FONT,
    fontWeight: 700,
    color: C.inkFaint,
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    margin: "0 0 3px 0",
  };
}

/** Burmese subline under an English line. */
export function burmeseStyle(size = 13): React.CSSProperties {
  return {
    fontSize: `${size}px`,
    fontFamily: BURMESE_FONT,
    color: C.inkMuted,
    lineHeight: 1.7,
    margin: "0",
  };
}

/** Hairline rule. */
export const hairline: React.CSSProperties = {
  borderColor: C.line,
  borderWidth: "1px 0 0 0",
  borderStyle: "solid",
  margin: "0",
};
