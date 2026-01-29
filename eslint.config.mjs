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
            },
            // Phase 34: src/ consolidation guards
            // Note: @/app/contexts/* is the CORRECT location, only block old @/contexts/* imports
            {
              group: ["@/contexts/*", "@/contexts"],
              message: "contexts/ moved to app/contexts/. Import from @/app/contexts."
            },
            {
              group: ["@/design-system/*", "@/design-system"],
              message: "design-system/ consolidated into lib/design-system/. Import from @/lib/design-system."
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
          message: "Use zIndex token from @/lib/design-system/tokens/z-index (e.g., zIndex.modal) instead of hardcoded number.",
        },
        {
          // Catch hardcoded hex colors in bg-[]
          selector: "Literal[value=/bg-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "Use design token colors (e.g., bg-primary, bg-surface-primary) instead of hardcoded hex values.",
        },
        {
          // Catch hardcoded hex colors in text-[]
          selector: "Literal[value=/text-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "Use design token colors (e.g., text-primary, text-text-inverse) instead of hardcoded hex values.",
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
        // Typography: Catch arbitrary font sizes in Tailwind classes
        {
          selector: "Literal[value=/text-\\[\\d+px\\]/]",
          message: "Use Tailwind typography scale (text-2xs, text-xs, text-sm, etc.) instead of text-[Npx]. For 10px use text-2xs.",
        },
        // Spacing: Catch arbitrary margin values
        {
          selector: "Literal[value=/\\bm-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (m-1, m-2, m-4, etc.) or CSS variable instead of m-[Npx].",
        },
        {
          selector: "Literal[value=/\\bm[xy]-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (mx-1, my-2, etc.) or CSS variable instead of mx/my-[Npx].",
        },
        {
          selector: "Literal[value=/\\bm[trbl]-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (mt-1, mr-2, etc.) or CSS variable instead of mt/mr/mb/ml-[Npx].",
        },
        // Spacing: Catch arbitrary padding values
        {
          selector: "Literal[value=/\\bp-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (p-1, p-2, p-4, etc.) or CSS variable instead of p-[Npx].",
        },
        {
          selector: "Literal[value=/\\bp[xy]-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (px-1, py-2, etc.) or CSS variable instead of px/py-[Npx].",
        },
        {
          selector: "Literal[value=/\\bp[trbl]-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (pt-1, pr-2, etc.) or CSS variable instead of pt/pr/pb/pl-[Npx].",
        },
        // Spacing: Catch arbitrary gap values
        {
          selector: "Literal[value=/\\bgap-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (gap-1, gap-2, gap-4, etc.) or CSS variable instead of gap-[Npx].",
        },
        {
          selector: "Literal[value=/\\bgap-[xy]-\\[\\d+px\\]/]",
          message: "Use Tailwind spacing scale (gap-x-1, gap-y-2, etc.) or CSS variable instead of gap-x/y-[Npx].",
        },
        // Typography: Catch inline fontSize pixel values in style objects
        {
          selector: "Property[key.name='fontSize'][value.value=/^\\d+px$/]",
          message: "Use Tailwind typography class or CSS variable instead of inline fontSize pixel value.",
        },
        // Typography: Catch inline fontWeight numeric values in style objects
        {
          selector: "Property[key.name='fontWeight'][value.type='Literal'][value.raw=/^\\d+$/]",
          message: "Use Tailwind font-weight class (font-normal=400, font-medium=500, font-semibold=600, font-bold=700) instead of inline fontWeight number.",
        },
        // Shadow enforcement: catch inline boxShadow with hardcoded values
        {
          selector: "Property[key.name='boxShadow'][value.type='Literal'][value.value=/^0\\s|^inset\\s|^none$/]",
          message: "Use CSS variable (var(--shadow-*)) or Tailwind shadow-* utility instead of hardcoded boxShadow. Exception: Framer Motion animated shadows need numeric values for interpolation.",
        },
        // Blur enforcement: catch inline backdropFilter with hardcoded blur
        {
          selector: "Property[key.name='backdropFilter'][value.type='Literal'][value.value=/blur\\(\\d+px\\)/]",
          message: "Use CSS variable (var(--blur-*)) or Tailwind backdrop-blur-* utility instead of hardcoded blur value.",
        },
        // Also catch filter with hardcoded blur
        {
          selector: "Property[key.name='filter'][value.type='Literal'][value.value=/blur\\(\\d+px\\)/]",
          message: "Use CSS variable (var(--blur-*)) instead of hardcoded blur value.",
        },
        // Motion timing enforcement: catch inline transitionDuration with hardcoded values
        {
          selector: "Property[key.name='transitionDuration'][value.type='Literal'][value.value=/^\\d+m?s$/]",
          message: "Use CSS variable (var(--duration-*)) or Tailwind duration-* utility instead of hardcoded transitionDuration. Options: duration-instant(0ms), duration-fast(150ms), duration-normal(220ms), duration-slow(350ms), duration-slower(500ms).",
        },
        // Catch inline transition with hardcoded duration
        {
          selector: "Property[key.name='transition'][value.type='Literal'][value.value=/\\d+m?s/]",
          message: "Use CSS variable (var(--duration-*)) for transition durations. Framer Motion spring transitions may use numeric values for physics calculations.",
        },
        // Catch Tailwind arbitrary duration in class strings
        {
          selector: "Literal[value=/duration-\\[\\d+m?s\\]/]",
          message: "Use Tailwind duration token (duration-fast, duration-normal, duration-slow, duration-slower) instead of duration-[Nms].",
        },
        // Catch Tailwind arbitrary delay in class strings
        {
          selector: "Literal[value=/delay-\\[\\d+m?s\\]/]",
          message: "Use Tailwind delay scale or CSS variable instead of delay-[Nms].",
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"]
];

export default config;
