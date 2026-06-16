/**
 * WCAG AA Contrast Audit — text-muted on all surface combinations
 *
 * Verifies all text-muted x surface token combinations meet WCAG AA 4.5:1 contrast ratio.
 * Token hex values hardcoded from src/styles/tokens.css — update if tokens change.
 *
 * Portal components (Dialog, AlertDialog, Tooltip, Popover) render via Radix Portal.
 * They inherit dark mode via CSS custom properties in tokens.css (.dark {}), not via
 * className inheritance. This is verified by the token completeness check in tokens.css
 * where every :root token has a .dark counterpart.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// WCAG 2.1 contrast helpers (inline — no external dependency)
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * Alpha-blend an RGBA color onto a solid background, returning effective hex.
 * Used to resolve status-*-bg tokens (rgba on surface).
 */
function alphaBlend(fgR: number, fgG: number, fgB: number, alpha: number, bgHex: string): string {
  const [bgR, bgG, bgB] = hexToRgb(bgHex);
  const r = Math.round(fgR * alpha + bgR * (1 - alpha));
  const g = Math.round(fgG * alpha + bgG * (1 - alpha));
  const b = Math.round(fgB * alpha + bgB * (1 - alpha));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Token hex values from src/styles/tokens.css
// ---------------------------------------------------------------------------

// Light mode: text-muted
const LIGHT_TEXT_MUTED = "#5c5c5c";
// Dark mode: text-muted
const DARK_TEXT_MUTED = "#a8a5a1";

// Light mode surfaces (solid hex)
const LIGHT_SURFACE_PRIMARY = "#ffffff";
const LIGHT_SURFACE_SECONDARY = "#fafafa";
const LIGHT_SURFACE_TERTIARY = "#ebebeb";
const LIGHT_SURFACE_ELEVATED = "#ffffff"; // same as primary in light

// Dark mode surfaces (solid hex)
const DARK_SURFACE_PRIMARY = "#1e1713";
const DARK_SURFACE_SECONDARY = "#251c18";
const DARK_SURFACE_TERTIARY = "#2e231e";
const DARK_SURFACE_ELEVATED = "#2a201b";

// Light mode status/accent backgrounds — rgba composited on surface-primary (#ffffff)
const LIGHT_STATUS_ERROR_BG = alphaBlend(196, 92, 74, 0.1, LIGHT_SURFACE_PRIMARY);
const LIGHT_STATUS_WARNING_BG = alphaBlend(232, 125, 30, 0.1, LIGHT_SURFACE_PRIMARY);
const LIGHT_STATUS_SUCCESS_BG = alphaBlend(82, 165, 46, 0.1, LIGHT_SURFACE_PRIMARY);
const LIGHT_STATUS_INFO_BG = alphaBlend(0, 151, 157, 0.1, LIGHT_SURFACE_PRIMARY);
const LIGHT_PRIMARY_LIGHT = alphaBlend(164, 16, 52, 0.08, LIGHT_SURFACE_PRIMARY);
const LIGHT_SECONDARY_LIGHT = alphaBlend(235, 205, 0, 0.12, LIGHT_SURFACE_PRIMARY);

// Dark mode status/accent backgrounds — rgba composited on surface-primary (#1e1713)
const DARK_STATUS_ERROR_BG = alphaBlend(255, 107, 107, 0.18, DARK_SURFACE_PRIMARY);
const DARK_STATUS_WARNING_BG = alphaBlend(255, 159, 74, 0.18, DARK_SURFACE_PRIMARY);
const DARK_STATUS_SUCCESS_BG = alphaBlend(107, 216, 75, 0.18, DARK_SURFACE_PRIMARY);
const DARK_STATUS_INFO_BG = alphaBlend(45, 212, 219, 0.18, DARK_SURFACE_PRIMARY);
const DARK_PRIMARY_LIGHT = alphaBlend(255, 77, 109, 0.15, DARK_SURFACE_PRIMARY);
const DARK_SECONDARY_LIGHT = alphaBlend(255, 224, 102, 0.15, DARK_SURFACE_PRIMARY);

// Surface arrays for it.each
const lightSurfaces: [string, string][] = [
  ["surface-primary", LIGHT_SURFACE_PRIMARY],
  ["surface-secondary", LIGHT_SURFACE_SECONDARY],
  ["surface-tertiary", LIGHT_SURFACE_TERTIARY],
  ["surface-elevated", LIGHT_SURFACE_ELEVATED],
  ["status-error-bg", LIGHT_STATUS_ERROR_BG],
  ["status-warning-bg", LIGHT_STATUS_WARNING_BG],
  ["status-success-bg", LIGHT_STATUS_SUCCESS_BG],
  ["status-info-bg", LIGHT_STATUS_INFO_BG],
  ["primary-light", LIGHT_PRIMARY_LIGHT],
  ["secondary-light", LIGHT_SECONDARY_LIGHT],
];

const darkSurfaces: [string, string][] = [
  ["surface-primary", DARK_SURFACE_PRIMARY],
  ["surface-secondary", DARK_SURFACE_SECONDARY],
  ["surface-tertiary", DARK_SURFACE_TERTIARY],
  ["surface-elevated", DARK_SURFACE_ELEVATED],
  ["status-error-bg", DARK_STATUS_ERROR_BG],
  ["status-warning-bg", DARK_STATUS_WARNING_BG],
  ["status-success-bg", DARK_STATUS_SUCCESS_BG],
  ["status-info-bg", DARK_STATUS_INFO_BG],
  ["primary-light", DARK_PRIMARY_LIGHT],
  ["secondary-light", DARK_SECONDARY_LIGHT],
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WCAG AA Contrast Audit - text-muted on surfaces", () => {
  // Utility function tests
  describe("Utility: relativeLuminance", () => {
    it("white (#ffffff) has luminance ~1.0", () => {
      expect(relativeLuminance("#ffffff")).toBeCloseTo(1.0, 2);
    });

    it("black (#000000) has luminance 0.0", () => {
      expect(relativeLuminance("#000000")).toBeCloseTo(0.0, 2);
    });
  });

  describe("Utility: contrastRatio", () => {
    it("black on white = 21:1", () => {
      expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    });

    it("white on white = 1:1", () => {
      expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 0);
    });
  });

  // Smoke tests for known high-contrast pairs
  describe("Known ratios (smoke test)", () => {
    it("light text-muted on surface-primary >= 4.5", () => {
      const ratio = contrastRatio(LIGHT_TEXT_MUTED, LIGHT_SURFACE_PRIMARY);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("dark text-muted on surface-primary >= 4.5", () => {
      const ratio = contrastRatio(DARK_TEXT_MUTED, DARK_SURFACE_PRIMARY);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // Light mode: all 10 surfaces
  describe("Light mode: text-muted (#5c5c5c)", () => {
    it.each(lightSurfaces)("passes 4.5:1 on %s (%s)", (_name: string, hex: string) => {
      const ratio = contrastRatio(LIGHT_TEXT_MUTED, hex);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // Dark mode: all 10 surfaces
  describe("Dark mode: text-muted (#9a9794)", () => {
    it.each(darkSurfaces)("passes 4.5:1 on %s (%s)", (_name: string, hex: string) => {
      const ratio = contrastRatio(DARK_TEXT_MUTED, hex);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // Footer schedule per-direction accent TEXT on the (theme-flipping) footer bg.
  // The footer is a LIGHT surface in light mode, so the accent text is mode-aware
  // (deep variants on light, vivid hero triad on dark). Both must clear AA 4.5:1.
  const FOOTER_BG_LIGHT = "#ebebeb"; // surface-tertiary
  const FOOTER_BG_DARK = "#1b1410";
  const lightFooterAccents: [string, string][] = [
    ["footer-accent-clay", "#9a3412"],
    ["footer-accent-blue", "#2c5a87"],
    ["footer-accent-sage", "#4a6329"],
    ["footer-accent-gold", "#8a5a12"],
  ];
  const darkFooterAccents: [string, string][] = [
    ["footer-accent-clay", "#d97757"],
    ["footer-accent-blue", "#6a9bcc"],
    ["footer-accent-sage", "#788c5d"],
    ["footer-accent-gold", "#eaa92f"],
  ];

  describe("Footer accents: light footer (#ebebeb)", () => {
    it.each(lightFooterAccents)("%s (%s) passes 4.5:1", (_name: string, hex: string) => {
      expect(contrastRatio(hex, FOOTER_BG_LIGHT)).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Footer accents: dark footer (#1b1410)", () => {
    it.each(darkFooterAccents)("%s (%s) passes 4.5:1", (_name: string, hex: string) => {
      expect(contrastRatio(hex, FOOTER_BG_DARK)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
