// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "storybook-static/**",
      "src/stories/**",
      ".claude/hooks/**",
    ],
  },
  {
    // Allow underscore-prefixed variables to be unused
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Design Token Enforcement Rules
    files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // Catch z-[number] arbitrary values: z-[10], z-[999], etc.
          selector: "Literal[value=/z-\\[\\d+\\]/]",
          message: "Use z-index token (z-modal, z-dropdown, z-sticky, etc.) instead of z-[number]. See docs/STACKING-CONTEXT.md",
        },
        {
          // Catch ALL Tailwind z-* numeric classes: z-0, z-10, z-20, z-30, z-40, z-50, z-auto
          selector: "Literal[value=/\\bz-(?:0|10|20|30|40|50|60|70|80|90|100|auto)\\b/]",
          message: "Use z-index token (z-modal, z-dropdown, z-sticky, etc.) instead of z-* classes. See docs/STACKING-CONTEXT.md",
        },
        {
          // Catch inline zIndex in style objects: style={{ zIndex: 50 }}
          selector: "Property[key.name='zIndex'][value.type='Literal'][value.raw=/^\\d+$/]",
          message: "Use zIndex token from @/design-system/tokens/z-index (e.g., zIndex.modal) instead of hardcoded number.",
        },
        {
          // Catch hardcoded hex colors in bg-[]
          selector: "Literal[value=/bg-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "Use design token colors (e.g., bg-[var(--color-*)]) instead of hardcoded hex values.",
        },
        {
          // Catch hardcoded hex colors in text-[]
          selector: "Literal[value=/text-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "Use design token colors (e.g., text-[var(--color-*)]) instead of hardcoded hex values.",
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"]
];

export default config;
