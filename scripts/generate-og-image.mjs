#!/usr/bin/env node
/**
 * Generate OG image (1200x630) for social media previews.
 * Uses Sharp to composite gradient background + logo + brand text.
 *
 * Usage: node scripts/generate-og-image.mjs
 * Output: public/og-image.png
 */

import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_HEIGHT = 180;

// Brand gradient from tokens.css
const gradientSvg = `<svg width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FB923C"/>
      <stop offset="50%" stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
</svg>`;

// Text overlay with brand name + tagline
const textSvg = `<svg width="${WIDTH}" height="${HEIGHT}">
  <style>
    .brand { fill: white; font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-size: 60px; }
    .tagline { fill: white; font-family: Arial, Helvetica, sans-serif; font-weight: normal; font-size: 28px; }
    .shadow { fill: rgba(0,0,0,0.3); }
  </style>
  <!-- Shadow -->
  <text x="602" y="432" text-anchor="middle" class="brand shadow">Mandalay Morning Star</text>
  <text x="602" y="492" text-anchor="middle" class="tagline shadow">Authentic Burmese Cuisine Delivered Fresh</text>
  <!-- Text -->
  <text x="600" y="430" text-anchor="middle" class="brand">Mandalay Morning Star</text>
  <text x="600" y="490" text-anchor="middle" class="tagline">Authentic Burmese Cuisine Delivered Fresh</text>
</svg>`;

async function generate() {
  // 1. Create gradient background
  const background = sharp(Buffer.from(gradientSvg)).png();

  // 2. Resize logo to fit
  const logoPath = resolve(ROOT, "public/logo.png");
  const logoMeta = await sharp(logoPath).metadata();
  const logoScale = LOGO_HEIGHT / logoMeta.height;
  const logoWidth = Math.round(logoMeta.width * logoScale);
  const logoResized = await sharp(logoPath)
    .resize({ height: LOGO_HEIGHT, width: logoWidth, fit: "inside" })
    .png()
    .toBuffer();

  // Center logo horizontally, place in upper portion of safe zone
  const logoLeft = Math.round((WIDTH - logoWidth) / 2);
  const logoTop = 90; // Within 65px top safe zone margin, centered in upper area

  // 3. Composite all layers
  const result = await background
    .composite([
      { input: logoResized, top: logoTop, left: logoLeft },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(resolve(ROOT, "public/og-image.png"));

  console.log(
    `Generated public/og-image.png: ${result.width}x${result.height}, ${Math.round(result.size / 1024)}KB`
  );
}

generate().catch((err) => {
  console.error("Failed to generate OG image:", err);
  process.exit(1);
});
