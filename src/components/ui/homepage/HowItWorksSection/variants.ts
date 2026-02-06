import type { Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";

// Step card entrance - playful + bold
export const stepCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.9,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      mass: 1,
      delay: i * 0.12,
    },
  }),
};

// Dropdown item animation variants
export const dropdownItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  }),
};

export interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  iconBg: string;
  iconBorder: string;
  glowColor: string;
}
