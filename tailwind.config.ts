import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ===========================================
           PEPPER AESTHETIC (Primary Design System)
           =========================================== */

        // Primary Colors (Deep Rich Red + Golden Yellow)
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)",
          light: "var(--color-primary-light)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
          active: "var(--color-secondary-active)",
          light: "var(--color-secondary-light)",
        },

        // Vibrant Accent Colors
        green: {
          DEFAULT: "var(--color-accent-green)",
          hover: "var(--color-accent-green-hover)",
          light: "var(--color-accent-green-light)",
        },
        orange: {
          DEFAULT: "var(--color-accent-orange)",
          hover: "var(--color-accent-orange-hover)",
          light: "var(--color-accent-orange-light)",
        },
        teal: {
          DEFAULT: "var(--color-accent-teal)",
          hover: "var(--color-accent-teal-hover)",
          light: "var(--color-accent-teal-light)",
        },
        magenta: {
          DEFAULT: "var(--color-accent-magenta)",
          hover: "var(--color-accent-magenta-hover)",
          light: "var(--color-accent-magenta-light)",
        },

        // Surface Colors
        surface: {
          primary: "var(--color-surface-primary)",
          secondary: "var(--color-surface-secondary)",
          tertiary: "var(--color-surface-tertiary)",
          elevated: "var(--color-surface-elevated)",
        },

        // Text Colors
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
        },

        // Border Colors
        "border-color": {
          DEFAULT: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
          subtle: "var(--color-border-subtle)",
        },

        // Status Colors
        status: {
          success: "var(--color-status-success)",
          "success-bg": "var(--color-status-success-bg)",
          warning: "var(--color-status-warning)",
          "warning-bg": "var(--color-status-warning-bg)",
          error: "var(--color-status-error)",
          "error-bg": "var(--color-status-error-bg)",
          info: "var(--color-status-info)",
          "info-bg": "var(--color-status-info-bg)",
        },

        // Footer Colors (theme-aware)
        footer: {
          bg: "var(--color-footer-bg)",
          text: "var(--color-footer-text)",
          "text-muted": "var(--color-footer-text-muted)",
          border: "var(--color-footer-border)",
        },

        // Hero Section (dark gradient, theme-aware)
        hero: {
          "gradient-start": "var(--hero-gradient-start)",
          "gradient-mid": "var(--hero-gradient-mid)",
          "gradient-end": "var(--hero-gradient-end)",
          text: "var(--hero-text)",
          "text-muted": "var(--hero-text-muted)",
          overlay: "var(--hero-overlay)",
          "stat-bg": "var(--hero-stat-bg)",
        },

        // Interactive Colors (semantic aliases)
        interactive: {
          primary: "var(--color-interactive-primary)",
          hover: "var(--color-interactive-hover)",
        },

        // Accent Aliases
        "accent-secondary": "var(--color-accent-secondary)",
        "accent-tertiary": "var(--color-accent-tertiary)",

        // Overlay Colors
        overlay: {
          DEFAULT: "var(--color-overlay)",
          heavy: "var(--color-overlay-heavy)",
          light: "var(--color-overlay-light)",
        },

        // Skeleton/Loading State
        skeleton: {
          DEFAULT: "var(--color-skeleton)",
          shimmer: "var(--color-skeleton-shimmer)",
        },

        // Disabled States
        disabled: {
          bg: "var(--color-disabled-bg)",
          text: "var(--color-disabled-text)",
        },

        // Selection/Highlight
        selection: "var(--color-selection)",

        /* ===========================================
           SHADCN/RADIX COMPATIBILITY
           =========================================== */

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",

        /* ===========================================
           LEGACY COLOR ALIASES (Deprecated)
           These will be removed in next cleanup pass
           =========================================== */

        // V6 aliases - map to new clean names
        "v6-primary": {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)",
          light: "var(--color-primary-light)",
        },
        "v6-secondary": {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
          active: "var(--color-secondary-active)",
          light: "var(--color-secondary-light)",
        },
        "v6-green": {
          DEFAULT: "var(--color-accent-green)",
          hover: "var(--color-accent-green-hover)",
          light: "var(--color-accent-green-light)",
        },
        "v6-orange": {
          DEFAULT: "var(--color-accent-orange)",
          hover: "var(--color-accent-orange-hover)",
          light: "var(--color-accent-orange-light)",
        },
        "v6-teal": {
          DEFAULT: "var(--color-accent-teal)",
          hover: "var(--color-accent-teal-hover)",
          light: "var(--color-accent-teal-light)",
        },
        "v6-magenta": {
          DEFAULT: "var(--color-accent-magenta)",
          hover: "var(--color-accent-magenta-hover)",
          light: "var(--color-accent-magenta-light)",
        },
        "v6-surface": {
          primary: "var(--color-surface-primary)",
          secondary: "var(--color-surface-secondary)",
          tertiary: "var(--color-surface-tertiary)",
        },
        "v6-text": {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
        },
        "v6-border": {
          DEFAULT: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
          subtle: "var(--color-border-subtle)",
        },
        "v6-status": {
          success: "var(--color-status-success)",
          "success-bg": "var(--color-status-success-bg)",
          warning: "var(--color-status-warning)",
          "warning-bg": "var(--color-status-warning-bg)",
          error: "var(--color-status-error)",
          "error-bg": "var(--color-status-error-bg)",
          info: "var(--color-status-info)",
          "info-bg": "var(--color-status-info-bg)",
        },
      },
      fontFamily: {
        // Primary Typography (Nunito)
        display: ["var(--font-display)", "Nunito", "ui-rounded", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Nunito", "system-ui", "sans-serif"],
        burmese: ["var(--font-burmese)", "Padauk", "sans-serif"],
        // Legacy aliases
        "v6-display": ["var(--font-display)", "Nunito", "ui-rounded", "system-ui", "sans-serif"],
        "v6-body": ["var(--font-body)", "Nunito", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": [
          "var(--text-2xs)",
          {
            lineHeight: "var(--text-2xs--line-height)",
            letterSpacing: "var(--text-2xs--letter-spacing)",
          },
        ],
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-relaxed)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-snug)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-tight)" }],
        "5xl": ["var(--text-5xl)", { lineHeight: "var(--leading-tight)" }],
        "6xl": ["var(--text-6xl)", { lineHeight: "var(--leading-none)" }],
        "7xl": ["var(--text-7xl)", { lineHeight: "var(--leading-none)" }],
      },
      lineHeight: {
        none: "var(--leading-none)",
        tight: "var(--leading-tight)",
        snug: "var(--leading-snug)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
        loose: "var(--leading-loose)",
      },
      letterSpacing: {
        tighter: "var(--tracking-tighter)",
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
        wider: "var(--tracking-wider)",
        widest: "var(--tracking-widest)",
      },
      spacing: {
        "0": "var(--space-0)",
        "px": "var(--space-px)",
        "0.5": "var(--space-0-5)",
        "1": "var(--space-1)",
        "1.5": "var(--space-1-5)",
        "2": "var(--space-2)",
        "2.5": "var(--space-2-5)",
        "3": "var(--space-3)",
        "3.5": "var(--space-3-5)",
        "4": "var(--space-4)",
        "5": "var(--space-5)",
        "6": "var(--space-6)",
        "7": "var(--space-7)",
        "8": "var(--space-8)",
        "9": "var(--space-9)",
        "10": "var(--space-10)",
        "11": "var(--space-11)",
        "12": "var(--space-12)",
        "14": "var(--space-14)",
        "16": "var(--space-16)",
        "20": "var(--space-20)",
        "24": "var(--space-24)",
        "28": "var(--space-28)",
        "32": "var(--space-32)",
      },
      boxShadow: {
        // Primary shadows
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        elevated: "var(--shadow-elevated)",
        nav: "var(--shadow-nav)",
        "button-hover": "var(--shadow-button-hover)",
        inner: "var(--shadow-inner)",
        "inner-glow": "var(--shadow-inner-glow)",
        // Glow shadows
        "glow-primary": "var(--shadow-glow-primary)",
        "glow-success": "var(--shadow-glow-success)",
        "glow-warning": "var(--shadow-glow-warning)",
        "glow-amber": "var(--shadow-glow-amber)",
        // Additional shadow scale
        xs: "var(--shadow-xs)",
        none: "none",
        "inner-sm": "var(--shadow-inner-sm)",
        "inner-md": "var(--shadow-inner-md)",
        primary: "var(--shadow-primary)",
        success: "var(--shadow-success)",
        warning: "var(--shadow-warning)",
        error: "var(--shadow-error)",
        "nav-top": "var(--shadow-nav-top)",
        focus: "var(--shadow-focus)",
        "focus-success": "var(--shadow-focus-success)",
        "focus-error": "var(--shadow-focus-error)",
        "hint-sm": "var(--shadow-hint-sm)",
        "hint-md": "var(--shadow-hint-md)",
        // Legacy V6 aliases
        "v6-sm": "var(--shadow-sm)",
        "v6-md": "var(--shadow-md)",
        "v6-card": "var(--shadow-card)",
        "v6-card-hover": "var(--shadow-card-hover)",
        "v6-elevated": "var(--shadow-elevated)",
        "v6-nav": "var(--shadow-nav)",
        "v6-button-hover": "var(--shadow-button-hover)",
      },
      backdropBlur: {
        none: "var(--blur-none)",
        sm: "var(--blur-sm)",
        md: "var(--blur-md)",
        lg: "var(--blur-lg)",
        xl: "var(--blur-xl)",
        "2xl": "var(--blur-2xl)",
        "3xl": "var(--blur-3xl)",
      },
      zIndex: {
        base: "0",
        dropdown: "10",
        sticky: "20",
        fixed: "30",
        "modal-backdrop": "40",
        modal: "50",
        popover: "60",
        tooltip: "70",
        toast: "80",
        max: "100",
      },
      borderRadius: {
        // Primary radius values
        pill: "var(--radius-pill)",
        card: "var(--radius-card)",
        "card-sm": "var(--radius-card-sm)",
        input: "var(--radius-input)",
        button: "var(--radius-button)",
        badge: "var(--radius-badge)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
        // Legacy V6 aliases
        "v6-pill": "var(--radius-pill)",
        "v6-card": "var(--radius-card)",
        "v6-card-sm": "var(--radius-card-sm)",
        "v6-input": "var(--radius-input)",
        "v6-button": "var(--radius-button)",
        "v6-badge": "var(--radius-badge)",
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
        // Legacy V6 aliases
        "v6-instant": "var(--duration-instant)",
        "v6-fast": "var(--duration-fast)",
        "v6-normal": "var(--duration-normal)",
        "v6-slow": "var(--duration-slow)",
        "v6-slower": "var(--duration-slower)",
      },
      transitionTimingFunction: {
        default: "var(--ease-default)",
        spring: "var(--ease-spring)",
        out: "var(--ease-out)",
        in: "var(--ease-in)",
        "in-out": "var(--ease-in-out)",
        // Legacy V6 aliases
        "v6-default": "var(--ease-default)",
        "v6-spring": "var(--ease-spring)",
        "v6-out": "var(--ease-out)",
        "v6-in": "var(--ease-in)",
      },
      animation: {
        // Primary animations
        "fade-in-up": "fade-in-up 0.55s var(--ease-default) forwards",
        float: "float 8s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        "scale-in": "scale-in 0.3s var(--ease-spring) forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "gradient-x": "gradient-x 15s ease infinite",
        "gradient-y": "gradient-y 15s ease infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "route-draw": "route-draw 2s ease-out forwards",
        "bounce-slow": "bounce 2s infinite",
        "fade-in": "fade-in 0.5s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        // Legacy V6 aliases
        "v6-fade-in-up": "fade-in-up 0.55s var(--ease-default) forwards",
        "v6-float": "float 8s ease-in-out infinite",
        "v6-float-slow": "float 12s ease-in-out infinite",
        "v6-scale-in": "scale-in 0.3s var(--ease-spring) forwards",
        "v6-shimmer": "shimmer 2s linear infinite",
        "v6-pulse-ring": "pulse-ring 2s ease-out infinite",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(3deg)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "gradient-y": {
          "0%, 100%": { backgroundPosition: "50% 0%" },
          "50%": { backgroundPosition: "50% 100%" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "route-draw": {
          "0%": { strokeDashoffset: "100%" },
          "100%": { strokeDashoffset: "0%" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(164, 16, 52, 0.4)" },
          "100%": { boxShadow: "0 0 30px rgba(164, 16, 52, 0.6)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "pepper-gradient": "linear-gradient(-45deg, #A41034, #EBCD00, #52A52E, #00979D)",
        "shimmer-gradient": "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
