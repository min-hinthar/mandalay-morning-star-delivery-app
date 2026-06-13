/**
 * Email design tokens — the hero "warm paper" language translated for email.
 * Mirrors `src/styles/tokens.css` (hero-ink / clay / blue / sage / cream).
 *
 * Light + DARK MODE via CSS custom properties: each theme-flipping token is a
 * `var(--eml-x, <light-hex>)`. The vars are defined in EMAIL_HEAD_CSS — `:root`
 * (light) and flipped under `@media (prefers-color-scheme: dark)`. Clients that
 * honor embedded <style> + CSS vars (Apple Mail / iOS Mail — the dark-mode
 * audience) get a true warm-espresso dark theme for FREE on every inline style;
 * Gmail / Outlook strip <style> and fall back to the light hex. One mechanism,
 * no per-element classes. (Static brand chroma — clay/blue/sage/gold/star — does
 * NOT flip; it reads on both grounds.)
 *
 * Rendering constraints: web fonts load in Apple Mail & some webmail (Georgia /
 * system fallback elsewhere); no gradients on meaningful surfaces (Outlook drops
 * them) — depth from hairlines, tinted panels, dot-grids, letterpress edges.
 */

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

/** A theme-flipping token → `var(--eml-key, lightFallback)`. */
function v(key: TokenKey): string {
  return `var(--eml-${key}, ${TOKENS[key][0]})`;
}

export const C = {
  // Theme-flipping (light fallback baked into the var)
  ink: v("ink"),
  inkMuted: v("inkMuted"),
  inkFaint: v("inkFaint"),
  paper: v("paper"),
  vellum: v("vellum"),
  canvas: v("canvas"),
  line: v("line"),
  lineStrong: v("lineStrong"),
  goldLeaf: v("goldLeaf"),
  accent: v("accent"),
  accentStrong: v("accentStrong"),
  clayTint: v("clayTint"),
  clayTintBorder: v("clayTintBorder"),
  blueDeep: v("blueDeep"),
  blueTint: v("blueTint"),
  blueTintBorder: v("blueTintBorder"),
  sageDeep: v("sageDeep"),
  sageTint: v("sageTint"),
  sageTintBorder: v("sageTintBorder"),
  goldDeep: v("goldDeep"),
  goldTint: v("goldTint"),
  goldTintBorder: v("goldTintBorder"),

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
const ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com").replace(
  /^http:\/\/https:\/\//,
  "https://"
);
/** Full logo (3:2 oval badge). Rendered at natural ratio — never cropped. */
export const LOGO_URL = `${ORIGIN}/logo.png`;
/** The warm menu photo used across the app's hero/menu/checkout surfaces. */
export const PHOTO_URL = `${ORIGIN}/images/menu-section-bg.webp`;

// ── Anthropic thematic textures (email-safe: degrade to flat color) ──
/** Faint dot-grid — a repeating radial-gradient (Apple Mail/iOS; ignored elsewhere). */
export function dotGrid(color = "rgba(20,20,19,.05)"): string {
  return `radial-gradient(${color} 1px, transparent 1.5px)`;
}
export const DOT_GRID_LIGHT = dotGrid("rgba(20,20,19,.05)");
export const DOT_GRID_SIZE = "16px 16px";
/** Warm vellum wash + dot grid, layered for the canvas behind the card. */
export const CANVAS_TEXTURE = `${DOT_GRID_LIGHT}`;

// ── Dark-mode class hooks (texture + Outlook.com belt-and-suspenders) ──
/** Classes used by the head CSS — `dot` adds the dot-grid; others aid Outlook.com. */
export const cls = {
  body: "eml-body",
  card: "eml-card",
  vellum: "eml-vellum",
  ink: "eml-ink",
  muted: "eml-muted",
  faint: "eml-faint",
  hairline: "eml-hairline",
  accent: "eml-accent",
  dot: "eml-dot",
} as const;

/** `:root` light var block + `@media dark` flip, generated from TOKENS. */
function rootVars(theme: 0 | 1): string {
  return (Object.keys(TOKENS) as TokenKey[])
    .map((k) => `--eml-${k}: ${TOKENS[k][theme]};`)
    .join(" ");
}

/**
 * Head payload: webfonts + the light/dark CSS-var system + dot-grid utility.
 * Injected once in EmailLayout's <Head>. Apple Mail / iOS Mail honor the var
 * flip (true dark theme); Gmail / Outlook strip <style> and use the inline
 * light-hex fallbacks baked into every `var(--eml-x, #light)`.
 */
export const EMAIL_HEAD_CSS = `
${FONTS_IMPORT_CSS}
:root { color-scheme: light dark; supported-color-schemes: light dark; ${rootVars(0)} }
.eml-dot { background-image: ${DOT_GRID_LIGHT}; background-size: ${DOT_GRID_SIZE}; }
@media (prefers-color-scheme: dark) {
  :root { ${rootVars(1)} }
  .eml-body { background-color: ${TOKENS.canvas[1]} !important; }
  .eml-card { background-color: ${TOKENS.paper[1]} !important; border-color: ${TOKENS.line[1]} !important; }
  .eml-vellum { background-color: ${TOKENS.vellum[1]} !important; }
  .eml-ink { color: ${TOKENS.ink[1]} !important; }
  .eml-muted { color: ${TOKENS.inkMuted[1]} !important; }
  .eml-faint { color: ${TOKENS.inkFaint[1]} !important; }
  .eml-accent { color: ${TOKENS.accent[1]} !important; }
  .eml-dot { background-image: ${dotGrid("rgba(244,241,234,.06)")} !important; }
}
[data-ogsc] .eml-body { background-color: ${TOKENS.canvas[1]} !important; }
[data-ogsc] .eml-card { background-color: ${TOKENS.paper[1]} !important; }
[data-ogsc] .eml-ink { color: ${TOKENS.ink[1]} !important; }
[data-ogsc] .eml-muted { color: ${TOKENS.inkMuted[1]} !important; }
`;
