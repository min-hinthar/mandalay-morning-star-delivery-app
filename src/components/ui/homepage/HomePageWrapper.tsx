"use client";

import { type ReactNode } from "react";
import { SectionNavDots } from "@/components/ui/scroll";

// ============================================
// SECTION NAVIGATION CONFIG
// ============================================

const sections = [
  { id: "hero", label: "Home" },
  { id: "how-it-works", label: "How It Works" },
  { id: "menu", label: "Menu" },
  { id: "testimonials", label: "Reviews" },
  { id: "cta", label: "Order" },
];

// ============================================
// TYPES
// ============================================

interface HomePageWrapperProps {
  children: ReactNode;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Minimal client wrapper for homepage.
 *
 * Only provides SectionNavDots (scroll spy) - section composition
 * is done at the server page.tsx level for maximum SSR benefit.
 */
export function HomePageWrapper({ children }: HomePageWrapperProps) {
  return (
    <>
      {/* Section Navigation Dots - Desktop only */}
      <SectionNavDots sections={sections} />

      {/* Main Content - rendered by server page.tsx */}
      <main className="relative">{children}</main>
    </>
  );
}
