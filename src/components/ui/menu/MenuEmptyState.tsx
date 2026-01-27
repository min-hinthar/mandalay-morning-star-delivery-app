/**
 * V6 Menu Empty State - Pepper Aesthetic
 */

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Search, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion-tokens";

interface MenuEmptyStateProps {
  type: "no-menu" | "no-results";
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function MenuEmptyState({
  type,
  searchQuery,
  onClearSearch,
}: MenuEmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const queryLabel = searchQuery ?? "";

  const containerVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: spring.default },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { ...spring.default, delay: 0.1 } },
  };

  if (type === "no-menu") {
    return (
      <motion.div
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center px-4 py-20 text-center"
      >
        <motion.div
          variants={prefersReducedMotion ? undefined : iconVariants}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-tertiary"
        >
          <UtensilsCrossed className="h-10 w-10 text-text-muted" />
        </motion.div>
        <h2 className="mb-2 font-display text-xl font-bold text-text-primary">
          Menu Coming Soon
        </h2>
        <p className="max-w-md font-body text-text-secondary">
          We&apos;re preparing something delicious for you. Check back soon to
          see our full menu of authentic Burmese dishes.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center px-4 py-20 text-center"
    >
      <motion.div
        variants={prefersReducedMotion ? undefined : iconVariants}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-tertiary"
      >
        <Search className="h-10 w-10 text-text-muted" />
      </motion.div>
      <h2 className="mb-2 font-display text-xl font-bold text-text-primary">
        No Results Found
      </h2>
      <p className="mb-8 max-w-md font-body text-text-secondary">
        We couldn&apos;t find any dishes matching &quot;{queryLabel}&quot;. Try
        a different search term or browse our categories.
      </p>
      {onClearSearch && (
        <Button onClick={onClearSearch} variant="primary" size="lg" className="shadow-elevated">
          Clear Search
        </Button>
      )}
      <div className="mt-8 font-body text-sm text-text-muted">
        <p className="mb-3 font-medium text-text-secondary">
          Popular searches:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Mohinga", "Curry", "Noodles", "Seafood"].map((term) => (
            <span
              key={term}
              className="rounded-pill bg-surface-tertiary px-4 py-1.5 text-text-primary transition-colors hover:bg-primary-light"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
