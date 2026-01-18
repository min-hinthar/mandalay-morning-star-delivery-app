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
           V5 SEMANTIC COLORS (Primary System)
           =========================================== */

        // V5 Surface Colors
        surface: {
          primary: "var(--color-surface-primary)",
          secondary: "var(--color-surface-secondary)",
          tertiary: "var(--color-surface-tertiary)",
        },

        // V5 Text Colors
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          inverse: "var(--color-text-inverse)",
        },

        // V5 Interactive Colors (Saffron Gold)
        interactive: {
          DEFAULT: "var(--color-interactive-primary)",
          hover: "var(--color-interactive-hover)",
          active: "var(--color-interactive-active)",
          disabled: "var(--color-interactive-disabled)",
        },

        // V5 Accent Colors
        accent: {
          secondary: "var(--color-accent-secondary)",
          "secondary-hover": "var(--color-accent-secondary-hover)",
          "secondary-active": "var(--color-accent-secondary-active)",
          tertiary: "var(--color-accent-tertiary)",
          "tertiary-hover": "var(--color-accent-tertiary-hover)",
          "tertiary-active": "var(--color-accent-tertiary-active)",
        },

        // V5 Status Colors
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

        // V5 Border Colors
        "border-v5": {
          DEFAULT: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
          subtle: "var(--color-border-subtle)",
        },

        /* ===========================================
           V4 COMPATIBILITY COLORS (Preserved)
           =========================================== */

        // Primary brand colors - Burmese aesthetic
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8D48A",
          dark: "#B8960C",
        },
        saffron: {
          DEFAULT: "#D4A017",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D4A017",
          600: "#B8860B",
          700: "#A67C00",
          light: "#E8C547",
          dark: "#A67C00",
        },
        curry: {
          DEFAULT: "#8B4513",
          light: "#A0522D",
          dark: "#5D2E0C",
        },
        jade: {
          DEFAULT: "#2E8B57",
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#2E8B57",
          600: "#16A34A",
          700: "#15803D",
          light: "#3CB371",
          dark: "#1E5F3C",
        },
        lotus: {
          DEFAULT: "#FFE4E1",
          light: "#FFF0EE",
          dark: "#FFD0CB",
        },
        cream: {
          DEFAULT: "#FFFEF7",
          light: "#FFFFFF",
          dark: "#F5F3E8",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#1A1A1A",
        },
        brand: {
          red: "#8B1A1A",
          "red-light": "#A83232",
          "red-dark": "#5C1111",
          green: "#34A853",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        burmese: ["Padauk", "sans-serif"],
      },
      fontSize: {
        // V5 Typography Scale with recommended line heights
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
        // V5 Spacing Scale (4px base grid)
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
        // V5 Elevation System
        "elevation-0": "var(--elevation-0)",
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
        "elevation-4": "var(--elevation-4)",
        "elevation-5": "var(--elevation-5)",
        // V4 Aliases
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        // Glow shadows
        "glow-gold": "var(--shadow-glow-gold)",
        "glow-gold-lg": "var(--shadow-glow-gold-lg)",
        "glow-jade": "var(--shadow-glow-jade)",
        "glow-chili": "var(--shadow-glow-chili)",
        // Premium
        premium: "var(--shadow-premium)",
        "card-hover": "var(--shadow-card-hover)",
        inner: "var(--shadow-inner)",
        "inner-glow": "var(--shadow-inner-glow)",
      },
      zIndex: {
        // V5 Z-Index Layer System
        base: "var(--z-base)",
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        toast: "var(--z-toast)",
        max: "var(--z-max)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Custom animations for Burmese aesthetic
      animation: {
        "gradient-x": "gradient-x 15s ease infinite",
        "gradient-y": "gradient-y 15s ease infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        "route-draw": "route-draw 2s ease-out forwards",
        "bounce-slow": "bounce 2s infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "gradient-y": {
          "0%, 100%": { backgroundPosition: "50% 0%" },
          "50%": { backgroundPosition: "50% 100%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "route-draw": {
          "0%": { strokeDashoffset: "100%" },
          "100%": { strokeDashoffset: "0%" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" },
          "100%": { boxShadow: "0 0 30px rgba(212, 175, 55, 0.6)" },
        },
      },
      // Background images for patterns
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "burmese-gradient":
          "linear-gradient(-45deg, #8B1A1A, #D4AF37, #8B4513, #2E8B57)",
        "gold-gradient":
          "linear-gradient(135deg, #D4AF37 0%, #B8960C 50%, #D4AF37 100%)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
