"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";

interface UseActiveCategoryOptions {
  /**
   * Root margin for the Intersection Observer
   * Default accounts for collapsed header (56px) and focuses on top 20% of viewport
   */
  rootMargin?: string;
  /**
   * Threshold(s) for intersection detection
   */
  threshold?: number | number[];
  /**
   * Whether to update URL hash on category change
   */
  updateHash?: boolean;
  /**
   * Header height in pixels for scroll offset calculation
   */
  headerHeight?: number;
}

interface UseActiveCategoryReturn {
  /**
   * Currently active category slug (without 'category-' prefix)
   */
  activeCategory: string | null;
  /**
   * Currently active section ID (with 'category-' prefix)
   */
  activeSectionId: string | null;
  /**
   * Scroll to a specific category
   */
  scrollToCategory: (slug: string | null) => void;
  /**
   * Whether Intersection Observer is supported
   */
  isSupported: boolean;
}

/**
 * Hook to track active category section using Intersection Observer
 * Replaces hardcoded headerOffset calculation with proper viewport detection
 */
export function useActiveCategory(
  sectionIds: string[],
  options: UseActiveCategoryOptions = {}
): UseActiveCategoryReturn {
  const {
    rootMargin = "-56px 0px -80% 0px",
    threshold = [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    updateHash = false,
    headerHeight = 56,
  } = options;

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibilityMap = useRef<Map<string, number>>(new Map());

  // Check if Intersection Observer is supported
  const isSupported = useMemo(
    () => typeof window !== "undefined" && "IntersectionObserver" in window,
    []
  );

  // Calculate which section is most visible
  const updateActiveSection = useCallback(() => {
    let maxRatio = 0;
    let mostVisibleId = "";

    visibilityMap.current.forEach((ratio, id) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostVisibleId = id;
      }
    });

    // Only update if there's a visible section
    if (mostVisibleId && maxRatio > 0) {
      setActiveSectionId(mostVisibleId);

      // Update URL hash without scroll
      if (updateHash && typeof window !== "undefined") {
        const slug = mostVisibleId.replace("category-", "");
        const newUrl = `${window.location.pathname}#${slug}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [updateHash]);

  // Set up Intersection Observer
  useEffect(() => {
    if (!isSupported || sectionIds.length === 0) {
      return;
    }

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap.current.set(entry.target.id, entry.intersectionRatio);
        });
        updateActiveSection();
      },
      {
        rootMargin,
        threshold,
      }
    );

    // Capture ref values for cleanup
    const observer = observerRef.current;
    const visMap = visibilityMap.current;

    // Observe all section elements
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer?.observe(element);
        // Initialize with 0 visibility
        visMap.set(id, 0);
      }
    });

    // Set initial active based on scroll position
    updateActiveSection();

    return () => {
      observer?.disconnect();
      visMap.clear();
    };
  }, [sectionIds, rootMargin, threshold, isSupported, updateActiveSection]);

  // Scroll to category with smooth behavior
  const scrollToCategory = useCallback(
    (slug: string | null) => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (slug === null) {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        return;
      }

      const element = document.getElementById(`category-${slug}`);
      if (element) {
        // Use scrollIntoView with block: "start" and account for header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerHeight - 8;

        window.scrollTo({
          top: offsetPosition,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });

        // Update hash without scroll
        if (updateHash) {
          const newUrl = `${window.location.pathname}#${slug}`;
          window.history.replaceState(null, "", newUrl);
        }
      }
    },
    [headerHeight, updateHash]
  );

  // Extract active category from section ID
  const activeCategory = activeSectionId
    ? activeSectionId.replace("category-", "")
    : null;

  return {
    activeCategory,
    activeSectionId,
    scrollToCategory,
    isSupported,
  };
}

export default useActiveCategory;
