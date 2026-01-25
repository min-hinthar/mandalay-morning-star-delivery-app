"use client";

import { useEffect, useState } from "react";

/**
 * Enhanced scroll spy hook using IntersectionObserver.
 *
 * Tracks which section is currently in the viewport center.
 * Uses rootMargin: "-50% 0px -50% 0px" to trigger at viewport middle.
 *
 * @param sectionIds - Array of section element IDs to observe
 * @returns activeIndex - Index of the currently active section (-1 if none)
 *
 * @example
 * const sections = ["hero", "how-it-works", "menu", "testimonials"];
 * const activeIndex = useScrollSpy(sections);
 * // activeIndex = 0 when hero is in viewport center
 */
export function useScrollSpy(sectionIds: string[]): number {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (sectionIds.length === 0) {
      setActiveIndex(-1);
      return;
    }

    // Create IntersectionObserver with rootMargin to trigger at viewport middle
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionIds.indexOf(entry.target.id);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        // Trigger when element reaches viewport middle
        // -50% from top and -50% from bottom = center line
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );

    // Observe all sections
    const elements: Element[] = [];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        elements.push(el);
      }
    });

    // Set initial active section (first visible)
    if (elements.length > 0) {
      // Check which section is initially visible
      const viewportCenter = window.innerHeight / 2;
      for (let i = 0; i < elements.length; i++) {
        const rect = elements[i].getBoundingClientRect();
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          setActiveIndex(i);
          break;
        }
      }
      // If no section at center, default to first
      if (activeIndex === -1 && window.scrollY < 100) {
        setActiveIndex(0);
      }
    }

    // Cleanup: disconnect observer
    return () => {
      observer.disconnect();
    };
  }, [sectionIds, activeIndex]);

  return activeIndex;
}
