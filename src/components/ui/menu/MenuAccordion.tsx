"use client";

import { useState, useCallback, useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { MenuCategory, MenuItem } from "@/types/menu";

/**
 * V5 Sprint 3.2 - Menu Accordion Component
 *
 * Collapsible menu categories per UX-spec:
 * - Chevron rotates 180° on expand
 * - Item count badge always visible
 * - First category auto-expanded on load
 * - Smooth height animation (300ms ease-out)
 *
 * @example
 * <MenuAccordion
 *   categories={categories}
 *   onItemClick={(item) => openDetailModal(item)}
 *   renderItem={(item) => <MenuItemCard item={item} />}
 * />
 */

interface MenuAccordionProps {
  /** Categories with their items */
  categories: MenuCategory[];
  /** Callback when item is clicked */
  onItemClick?: (item: MenuItem) => void;
  /** Custom item renderer */
  renderItem?: (item: MenuItem, index: number) => React.ReactNode;
  /** Initially expanded category slugs (default: first category) */
  defaultExpanded?: string[];
  /** Allow multiple categories open at once */
  allowMultiple?: boolean;
  /** Additional class name */
  className?: string;
}

export function MenuAccordion({
  categories,
  onItemClick,
  renderItem,
  defaultExpanded,
  allowMultiple = true,
  className,
}: MenuAccordionProps) {
  const shouldReduceMotion = useReducedMotion();

  // Default to first category expanded
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(() => {
    if (defaultExpanded) {
      return new Set(defaultExpanded);
    }
    // Auto-expand first category
    return categories.length > 0 ? new Set([categories[0].slug]) : new Set();
  });

  const toggleCategory = useCallback(
    (slug: string) => {
      setExpandedSlugs((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) {
          next.delete(slug);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(slug);
        }
        return next;
      });
    },
    [allowMultiple]
  );

  const isExpanded = useCallback(
    (slug: string) => expandedSlugs.has(slug),
    [expandedSlugs]
  );

  // Filter out empty categories
  const nonEmptyCategories = categories.filter((cat) => cat.items.length > 0);

  if (nonEmptyCategories.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-[var(--color-text-secondary)]">No menu items available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} role="region" aria-label="Menu categories">
      {nonEmptyCategories.map((category) => (
        <AccordionCategory
          key={category.slug}
          category={category}
          isExpanded={isExpanded(category.slug)}
          onToggle={() => toggleCategory(category.slug)}
          onItemClick={onItemClick}
          renderItem={renderItem}
          shouldReduceMotion={shouldReduceMotion ?? false}
        />
      ))}
    </div>
  );
}

interface AccordionCategoryProps {
  category: MenuCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onItemClick?: (item: MenuItem) => void;
  renderItem?: (item: MenuItem, index: number) => React.ReactNode;
  shouldReduceMotion: boolean;
}

function AccordionCategory({
  category,
  isExpanded,
  onToggle,
  onItemClick,
  renderItem,
  shouldReduceMotion,
}: AccordionCategoryProps) {
  const contentId = useId();
  const headerId = useId();

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-[var(--duration-normal)]",
        isExpanded
          ? "border-[var(--color-interactive-primary)]/30 shadow-sm"
          : "border-[var(--color-border)] hover:border-[var(--color-interactive-primary)]/20"
      )}
    >
      {/* Accordion Header */}
      <button
        type="button"
        id={headerId}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between gap-4 p-4",
          "bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-interactive-primary)]",
          "transition-colors duration-[var(--duration-fast)]",
          isExpanded && "bg-[var(--color-surface-secondary)]"
        )}
      >
        {/* Category Name */}
        <span className="text-lg font-semibold text-[var(--color-text-primary)]">
          {category.name}
        </span>

        {/* Right side: Item count + Chevron */}
        <div className="flex items-center gap-3">
          {/* Item Count Badge */}
          <span
            className={cn(
              "inline-flex items-center justify-center min-w-[28px] h-7 px-2",
              "rounded-full text-sm font-medium",
              isExpanded
                ? "bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]"
                : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
            )}
          >
            {category.items.length}
          </span>

          {/* Chevron - rotates 180° on expand */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.3, ease: [0, 0, 0.2, 1] }
            }
          >
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-colors duration-[var(--duration-fast)]",
                isExpanded
                  ? "text-[var(--color-interactive-primary)]"
                  : "text-[var(--color-text-secondary)]"
              )}
            />
          </motion.div>
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    height: { duration: 0.3, ease: [0, 0, 0.2, 1] },
                    opacity: { duration: 0.2, delay: 0.1 },
                  }
            }
          >
            <div className="px-4 pb-4 pt-2 space-y-3 bg-[var(--color-surface-secondary)]">
              {category.items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className={onItemClick ? "cursor-pointer" : undefined}
                  role={onItemClick ? "button" : undefined}
                  tabIndex={onItemClick ? 0 : undefined}
                  onKeyDown={
                    onItemClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onItemClick(item);
                          }
                        }
                      : undefined
                  }
                >
                  {renderItem ? (
                    renderItem(item, index)
                  ) : (
                    <DefaultItemCard item={item} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Default item card (fallback when no renderItem provided)
 */
function DefaultItemCard({ item }: { item: MenuItem }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg",
        "bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80",
        "border border-[var(--color-border)]",
        "transition-colors duration-[var(--duration-fast)]"
      )}
    >
      {/* Image placeholder */}
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.nameEn}
          className="w-16 h-16 rounded-lg object-cover bg-[var(--color-surface-tertiary)]"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center">
          <span className="text-xs text-[var(--color-text-secondary)]">No image</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[var(--color-text-primary)] truncate">
          {item.nameEn}
        </h4>
        {item.descriptionEn && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
            {item.descriptionEn}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="font-bold text-[var(--color-interactive-primary)]">
          ${(item.basePriceCents / 100).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export type { MenuAccordionProps };
