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
    // V4 Design Token Enforcement Rules
    files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
    rules: {
      // Warn on hardcoded z-index values in className strings
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/z-\\[\\d+\\]/]",
          message: "Use design token z-index (e.g., z-[var(--z-sticky)]) instead of hardcoded values.",
        },
        {
          selector: "Literal[value=/bg-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "Use design token colors (e.g., bg-[var(--color-*)]) instead of hardcoded hex values.",
        },
        {
          selector: "Literal[value=/text-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "Use design token colors (e.g., text-[var(--color-*)]) instead of hardcoded hex values.",
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"]
];

export default config;
