/**
 * Email design tokens — the hero "warm paper" language translated for email.
 * Mirrors `src/styles/tokens.css` (hero-ink / clay / blue / sage / cream).
 *
 * Light + DARK MODE via flat-hex inline + paired classes (NOT CSS vars — the
 * Word-based Outlook renderer discards `var()` declarations wholesale, which
 * would blank the card/text). `C` holds flat LIGHT hex; each theme-flipping
 * token has a matching `cls.*` class. Add that class wherever the inline style
 * uses the token; EMAIL_HEAD_CSS flips the class under
 * `@media (prefers-color-scheme: dark)` + `[data-ogsc]` (Outlook.com). Clients
 * that honor embedded <style> (Apple Mail / iOS Mail — the dark-mode audience)
 * get a warm-espresso dark theme; everywhere else the flat-hex light inline
 * wins — no regression. (Static brand chroma — clay/blue/sage/gold/star — does
 * NOT flip; it reads on both grounds.)
 *
 * Rendering constraints: web fonts load in Apple Mail & some webmail (Georgia /
 * system fallback elsewhere); no gradients on meaningful surfaces (Outlook drops
 * them) — depth from hairlines, tinted panels, dot-grids, letterpress edges.
 */

import { appOrigin } from "./origin";

/** Theme-flipping tokens: [light, dark]. Drives both `C` and the head CSS. */
const TOKENS = {
  ink: ["#141413", "#f4f1ea"],
  inkMuted: ["#6b6a64", "#b9b4aa"],
  inkFaint: ["#91908a", "#8f8b81"],
  paper: ["#faf9f5", "#201e1b"],
  vellum: ["#f4f1e8", "#2a2723"],
  canvas: ["#f0eee6", "#141312"],
  line: ["#e6e2d6", "rgba(244,241,234,.13)"],
  lineStrong: ["#d6d1c0", "rgba(244,241,234,.2)"],
  goldLeaf: ["#e3cf9b", "rgba(232,200,121,.4)"],
  accent: ["#9a3412", "#e7a181"],
  accentStrong: ["#7c2d12", "#f0b496"],
  clayTint: ["#f9ece5", "rgba(217,119,87,.16)"],
  clayTintBorder: ["#ecccbc", "rgba(217,119,87,.34)"],
  blueDeep: ["#3e6a96", "#9ec1e3"],
  blueTint: ["#eef3fa", "rgba(106,155,204,.16)"],
  blueTintBorder: ["#c9d9ea", "rgba(106,155,204,.34)"],
  sageDeep: ["#4f6234", "#a6bd84"],
  sageTint: ["#eff2e9", "rgba(120,140,93,.18)"],
  sageTintBorder: ["#cfd8c2", "rgba(120,140,93,.34)"],
  goldDeep: ["#946708", "#e8c879"],
  goldTint: ["#f9f1dd", "rgba(234,169,47,.16)"],
  goldTintBorder: ["#ecd9a8", "rgba(234,169,47,.34)"],
} as const;

type TokenKey = keyof typeof TOKENS;

/**
 * Inline values are FLAT LIGHT HEX (the light value of each token). Dark mode is
 * driven entirely by the `.eml-*` classes + `@media (prefers-color-scheme: dark)`
 * / `[data-ogsc]` overrides in EMAIL_HEAD_CSS — NOT by CSS vars: the Word-based
 * Outlook desktop renderer discards `var()` declarations wholesale (it never
 * applies the in-`var()` fallback), which would blank the card/text. Flat hex
 * renders everywhere; the class overrides flip only in dark-capable clients.
 */
export const C = {
  // Theme-flipping tokens (flat light hex; pair the matching `cls.*` class for dark)
  ink: TOKENS.ink[0],
  inkMuted: TOKENS.inkMuted[0],
  inkFaint: TOKENS.inkFaint[0],
  paper: TOKENS.paper[0],
  vellum: TOKENS.vellum[0],
  canvas: TOKENS.canvas[0],
  line: TOKENS.line[0],
  lineStrong: TOKENS.lineStrong[0],
  goldLeaf: TOKENS.goldLeaf[0],
  accent: TOKENS.accent[0],
  accentStrong: TOKENS.accentStrong[0],
  clayTint: TOKENS.clayTint[0],
  clayTintBorder: TOKENS.clayTintBorder[0],
  blueDeep: TOKENS.blueDeep[0],
  blueTint: TOKENS.blueTint[0],
  blueTintBorder: TOKENS.blueTintBorder[0],
  sageDeep: TOKENS.sageDeep[0],
  sageTint: TOKENS.sageTint[0],
  sageTintBorder: TOKENS.sageTintBorder[0],
  goldDeep: TOKENS.goldDeep[0],
  goldTint: TOKENS.goldTint[0],
  goldTintBorder: TOKENS.goldTintBorder[0],

  // Static brand chroma — reads on both light & dark, never flips
  clay: "#d97757", // book cloth — CTAs/shapes
  clayDeep: "#b4552f", // letterpress edge under clay buttons
  blue: "#6a9bcc",
  sage: "#788c5d",
  gold: "#eaa92f", // stars
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

// ── Brand assets (hosted; loaded by clients that show images) ──
const ORIGIN = appOrigin();
/**
 * Logo for email — a TRUE PNG (transparent) at `/images/email-logo.png`. The
 * app's `/logo.png` is WebP-bytes-with-a-.png-name, which Outlook desktop/.com
 * can't decode (broken-image box); this raster renders everywhere. ~400×250 (8:5).
 */
export const LOGO_URL = `${ORIGIN}/images/email-logo.png`;
/** Homepage origin (logo + masthead click-through). */
export const HOME_URL = ORIGIN;
/**
 * Masthead banner — a pre-cropped 4:1 JPEG (NOT the .webp: WebP is unsupported
 * in Outlook desktop/.com & some webmail, which would show a broken-image box).
 * Already cropped to the display ratio so clients that ignore object-fit don't
 * squash it.
 */
export const MASTHEAD_URL = `${ORIGIN}/images/email-masthead.jpg`;

// ── Anthropic thematic textures (email-safe: degrade to flat color) ──
/** Faint dot-grid — a repeating radial-gradient (Apple Mail/iOS; ignored elsewhere). */
export function dotGrid(color = "rgba(20,20,19,.05)"): string {
  return `radial-gradient(${color} 1px, transparent 1.5px)`;
}
export const DOT_GRID_LIGHT = dotGrid("rgba(20,20,19,.05)");
export const DOT_GRID_SIZE = "16px 16px";

// ── Dark-mode classes (paired with the flat-hex inline token) ──
/**
 * Each theme-flipping token has a matching class. Add the class wherever the
 * inline style uses that token; the head CSS flips it under dark mode. Inline
 * flat-hex is the universal base (Outlook included); the class only bites in
 * dark-capable clients (Apple Mail / iOS; Outlook.com via [data-ogsc]).
 */
export const cls = {
  // text color
  ink: "eml-ink",
  muted: "eml-muted",
  faint: "eml-faint",
  accent: "eml-accent",
  accentStrong: "eml-accent-strong",
  blueDeep: "eml-blue-deep",
  sageDeep: "eml-sage-deep",
  goldDeep: "eml-gold-deep",
  // surface bg
  card: "eml-card", // paper
  vellum: "eml-vellum",
  body: "eml-body", // canvas
  clayTint: "eml-clay-tint",
  blueTint: "eml-blue-tint",
  sageTint: "eml-sage-tint",
  goldTint: "eml-gold-tint",
  // border color
  line: "eml-line",
  lineStrong: "eml-line-strong",
  goldLeaf: "eml-gold-leaf",
  clayBorder: "eml-clay-bd",
  blueBorder: "eml-blue-bd",
  sageBorder: "eml-sage-bd",
  goldBorder: "eml-gold-bd",
  // texture
  dot: "eml-dot",
} as const;

/** Which CSS property each token-class overrides in dark mode. */
const TEXT_CLASSES: [string, TokenKey][] = [
  [cls.ink, "ink"],
  [cls.muted, "inkMuted"],
  [cls.faint, "inkFaint"],
  [cls.accent, "accent"],
  [cls.accentStrong, "accentStrong"],
  [cls.blueDeep, "blueDeep"],
  [cls.sageDeep, "sageDeep"],
  [cls.goldDeep, "goldDeep"],
];
const BG_CLASSES: [string, TokenKey][] = [
  [cls.card, "paper"],
  [cls.vellum, "vellum"],
  [cls.body, "canvas"],
  [cls.clayTint, "clayTint"],
  [cls.blueTint, "blueTint"],
  [cls.sageTint, "sageTint"],
  [cls.goldTint, "goldTint"],
];
const BORDER_CLASSES: [string, TokenKey][] = [
  [cls.line, "line"],
  [cls.lineStrong, "lineStrong"],
  [cls.goldLeaf, "goldLeaf"],
  [cls.clayBorder, "clayTintBorder"],
  [cls.blueBorder, "blueTintBorder"],
  [cls.sageBorder, "sageTintBorder"],
  [cls.goldBorder, "goldTintBorder"],
];

function darkRules(prefix: string): string {
  const text = TEXT_CLASSES.map(
    ([c, k]) => `${prefix} .${c} { color: ${TOKENS[k][1]} !important; }`
  );
  const bg = BG_CLASSES.map(
    ([c, k]) => `${prefix} .${c} { background-color: ${TOKENS[k][1]} !important; }`
  );
  const bd = BORDER_CLASSES.map(
    ([c, k]) => `${prefix} .${c} { border-color: ${TOKENS[k][1]} !important; }`
  );
  return [...text, ...bg, ...bd].join("\n  ");
}

/**
 * Head payload: webfonts + base color-scheme + the dot-grid utility + the
 * class-based dark overrides (@media prefers-color-scheme + Outlook.com
 * [data-ogsc]). Injected once in EmailLayout's <Head>. Clients that strip
 * <style> (Outlook desktop, some webmail) keep the flat-hex light inline
 * styles — no regression.
 */
export const EMAIL_HEAD_CSS = `
${FONTS_IMPORT_CSS}
:root { color-scheme: light dark; supported-color-schemes: light dark; }
.eml-dot { background-image: ${DOT_GRID_LIGHT}; background-size: ${DOT_GRID_SIZE}; }
@media (prefers-color-scheme: dark) {
  .eml-dot { background-image: ${dotGrid("rgba(244,241,234,.06)")} !important; }
  ${darkRules("")}
}
${darkRules("[data-ogsc]")}
`;
