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
      // Prevent imports from consolidated directories
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Phase 26: ui-v8 consolidation guard
            {
              group: ["@/components/ui-v8/*", "@/components/ui-v8", "**/ui-v8/*", "**/ui-v8"],
              message: "ui-v8 has been consolidated into ui/. Import from @/components/ui instead."
            },
            // Phase 33: Full Components Consolidation guards
            {
              group: ["@/components/menu/*", "@/components/menu", "**/components/menu/*"],
              message: "menu/ consolidated into ui/menu/. Import from @/components/ui/menu."
            },
            {
              group: ["@/components/scroll/*", "@/components/scroll", "**/components/scroll/*"],
              message: "scroll/ consolidated into ui/scroll/. Import from @/components/ui/scroll."
            },
            {
              group: ["@/components/layout/*", "@/components/layout", "**/components/layout/*"],
              message: "layout/ consolidated into ui/layout/. Import from @/components/ui/layout."
            },
            {
              group: ["@/components/layouts/*", "@/components/layouts", "**/components/layouts/*"],
              message: "layouts/ consolidated into ui/layout/. Import from @/components/ui/layout or @/components/ui for primitives."
            },
            {
              group: ["@/components/tracking/*", "@/components/tracking", "**/components/tracking/*"],
              message: "tracking/ consolidated into ui/orders/tracking/. Import from @/components/ui/orders."
            },
            {
              group: ["@/components/onboarding/*", "@/components/onboarding", "**/components/onboarding/*"],
              message: "onboarding/ consolidated into ui/auth/. Import from @/components/ui/auth."
            },
            {
              group: ["@/components/mascot/*", "@/components/mascot", "**/components/mascot/*"],
              message: "mascot/ consolidated into ui/brand/. Import from @/components/ui/brand."
            },
            {
              group: ["@/components/admin/*", "@/components/admin", "**/components/admin/*"],
              message: "admin/ consolidated into ui/admin/. Import from @/components/ui/admin."
            },
            {
              group: ["@/components/checkout/*", "@/components/checkout", "**/components/checkout/*"],
              message: "checkout/ consolidated into ui/checkout/. Import from @/components/ui/checkout."
            },
            {
              group: ["@/components/driver/*", "@/components/driver", "**/components/driver/*"],
              message: "driver/ consolidated into ui/driver/. Import from @/components/ui/driver."
            },
            {
              group: ["@/components/homepage/*", "@/components/homepage", "**/components/homepage/*"],
              message: "homepage/ consolidated into ui/homepage/. Import from @/components/ui/homepage."
            },
            {
              group: ["@/components/orders/*", "@/components/orders", "**/components/orders/*"],
              message: "orders/ consolidated into ui/orders/. Import from @/components/ui/orders."
            },
            {
              group: ["@/components/auth/*", "@/components/auth", "**/components/auth/*"],
              message: "auth/ consolidated into ui/auth/. Import from @/components/ui/auth."
            },
            {
              group: ["@/components/theme/*", "@/components/theme", "**/components/theme/*"],
              message: "theme/ consolidated into ui/theme/. Import from @/components/ui/theme."
            }
          ]
        }
      ],
    },
  },
  {
    // Design Token Enforcement Rules
    files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // NOTE: z-index token rules disabled because Tailwind CSS 4 doesn't generate
        // custom z-index utility classes (z-modal, z-sticky, etc.) from tailwind.config.ts.
        // Use standard Tailwind numeric classes instead:
        // - z-0 (base), z-10 (dropdown), z-20 (sticky), z-30 (fixed)
        // - z-40 (modal-backdrop), z-50 (modal)
        // - z-[60] (popover), z-[70] (tooltip), z-[80] (toast), z-[100] (max)
        {
          // Catch inline zIndex in style objects: style={{ zIndex: 50 }}
          // Exception: allow zIndex from design-system/tokens/z-index
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
        // Hardcoded color classes - use semantic tokens instead
        // NOTE: These are warnings during migration; audit script handles enforcement
        {
          selector: "Literal[value=/\\btext-white\\b/]",
          message: "Use semantic token: text-text-inverse or text-hero-text instead of text-white",
        },
        {
          selector: "Literal[value=/\\btext-black\\b/]",
          message: "Use semantic token: text-text-primary instead of text-black",
        },
        {
          selector: "Literal[value=/\\bbg-white\\b/]",
          message: "Use semantic token: bg-surface-primary instead of bg-white",
        },
        {
          selector: "Literal[value=/\\bbg-black\\b/]",
          message: "Use semantic token: bg-surface-inverse instead of bg-black",
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"]
];

export default config;
