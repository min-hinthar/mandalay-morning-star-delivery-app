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
      // Premium shadows for elevated UI
      boxShadow: {
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.4)",
        "glow-gold-lg": "0 0 40px rgba(212, 175, 55, 0.5)",
        "glow-jade": "0 0 20px rgba(46, 139, 87, 0.4)",
        "glow-red": "0 0 20px rgba(139, 26, 26, 0.3)",
        premium:
          "0 25px 50px -12px rgba(139, 69, 19, 0.25), 0 0 15px rgba(212, 175, 55, 0.1)",
        "premium-lg":
          "0 35px 60px -15px rgba(139, 69, 19, 0.3), 0 0 25px rgba(212, 175, 55, 0.15)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
        "inner-glow": "inset 0 0 20px rgba(212, 175, 55, 0.2)",
        // Warm shadows (curry-tinted instead of black)
        "warm-sm": "0 1px 2px rgba(139, 69, 19, 0.05)",
        "warm-md": "0 4px 6px -1px rgba(139, 69, 19, 0.1), 0 2px 4px -1px rgba(139, 69, 19, 0.06)",
        "warm-lg": "0 10px 15px -3px rgba(139, 69, 19, 0.1), 0 4px 6px -2px rgba(139, 69, 19, 0.05)",
        "warm-xl": "0 20px 25px -5px rgba(139, 69, 19, 0.1), 0 10px 10px -5px rgba(139, 69, 19, 0.04)",
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
