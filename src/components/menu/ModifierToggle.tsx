"use client";

import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { PriceTicker } from "@/components/ui/PriceTicker";
import type { ModifierGroup, ModifierOption } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface ModifierToggleProps {
  /** Modifier group data */
  group: ModifierGroup;
  /** Currently selected option IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (selectedIds: string[]) => void;
  /** Additional className */
  className?: string;
  /** Show visual preview indicators */
  showPreview?: boolean;
}

export interface ModifierOptionProps {
  /** Option data */
  option: ModifierOption;
  /** Whether this option is selected */
  isSelected: boolean;
  /** Callback when toggled */
  onToggle: () => void;
  /** Index for stagger animation */
  index: number;
}

// ============================================
// SINGLE OPTION COMPONENT
// ============================================

function ModifierOptionItem({
  option,
  isSelected,
  onToggle,
  index,
}: ModifierOptionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Haptic feedback
  const handleToggle = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onToggle();
  }, [onToggle]);

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      disabled={!option.isActive}
      className={cn(
        "relative w-full flex items-center gap-3 p-4 rounded-xl",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "bg-primary/10 border-2 border-primary"
          : "bg-surface-secondary border-2 border-transparent hover:border-border",
        !option.isActive && "opacity-50 cursor-not-allowed"
      )}
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={
        shouldAnimate
          ? { ...getSpring(spring.snappy), delay: index * 0.05 }
          : undefined
      }
      whileHover={shouldAnimate && option.isActive ? { scale: 1.02 } : undefined}
      whileTap={shouldAnimate && option.isActive ? { scale: 0.98 } : undefined}
      aria-pressed={isSelected}
      aria-disabled={!option.isActive}
    >
      {/* Selection indicator */}
      <motion.div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
          isSelected
            ? "bg-primary text-white"
            : "bg-surface-primary border-2 border-border"
        )}
        animate={
          isSelected && shouldAnimate
            ? { scale: [1, 1.2, 1] }
            : { scale: 1 }
        }
        transition={getSpring(spring.rubbery)}
      >
        <AnimatePresence mode="wait">
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={getSpring(spring.snappy)}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Option details */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-body font-medium",
              isSelected ? "text-primary" : "text-text-primary"
            )}
          >
            {option.name}
          </span>
          {!option.isActive && (
            <span className="text-xs text-text-muted">(Unavailable)</span>
          )}
        </div>
      </div>

      {/* Price delta */}
      {option.priceDeltaCents !== 0 && (
        <div className="flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSelected ? "selected" : "unselected"}
              initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              exit={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
              transition={getSpring(spring.snappy)}
              className={cn(
                "font-body font-semibold",
                option.priceDeltaCents > 0
                  ? isSelected
                    ? "text-primary"
                    : "text-text-secondary"
                  : "text-green"
              )}
            >
              {option.priceDeltaCents > 0 ? "+" : ""}
              <PriceTicker
                value={option.priceDeltaCents}
                className="inline"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Selection glow */}
      {isSelected && shouldAnimate && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: "0 0 20px rgba(164, 16, 52, 0.2)",
          }}
        />
      )}
    </motion.button>
  );
}

// ============================================
// VISUAL PREVIEW INDICATOR
// ============================================

interface PreviewIndicatorProps {
  selectedOptions: ModifierOption[];
}

function PreviewIndicator({ selectedOptions }: PreviewIndicatorProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  if (selectedOptions.length === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border"
      initial={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1, height: "auto" } : undefined}
      exit={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
      transition={getSpring(spring.snappy)}
    >
      <span className="text-xs text-text-muted font-body">Selected:</span>
      {selectedOptions.map((option, index) => (
        <motion.span
          key={option.id}
          className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={
            shouldAnimate
              ? { ...getSpring(spring.rubbery), delay: index * 0.05 }
              : undefined
          }
        >
          {option.name}
        </motion.span>
      ))}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ModifierToggle({
  group,
  selectedIds,
  onSelectionChange,
  className,
  showPreview = true,
}: ModifierToggleProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Handle option toggle
  const handleToggle = useCallback(
    (optionId: string) => {
      if (group.selectionType === "single") {
        // Single select: replace selection
        onSelectionChange([optionId]);
      } else {
        // Multiple select: toggle
        if (selectedIds.includes(optionId)) {
          // Check min selection
          if (selectedIds.length > (group.minSelect ?? 0)) {
            onSelectionChange(selectedIds.filter((id) => id !== optionId));
          }
        } else {
          // Check max selection
          if (!group.maxSelect || selectedIds.length < group.maxSelect) {
            onSelectionChange([...selectedIds, optionId]);
          }
        }
      }
    },
    [group, selectedIds, onSelectionChange]
  );

  // Get selected options for preview
  const selectedOptions = useMemo(
    () => group.options.filter((opt) => selectedIds.includes(opt.id)),
    [group.options, selectedIds]
  );

  // Calculate total price delta
  const totalPriceDelta = useMemo(
    () =>
      selectedOptions.reduce((sum, opt) => sum + (opt.priceDeltaCents || 0), 0),
    [selectedOptions]
  );

  return (
    <motion.div
      className={cn("rounded-2xl bg-surface-primary p-4", className)}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? getSpring(spring.default) : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-display font-semibold text-text-primary">
            {group.name}
          </h4>
          <p className="text-sm text-text-muted font-body">
            {group.selectionType === "single" ? (
              "Choose one"
            ) : (
              <>
                Choose{" "}
                {group.minSelect > 0 && group.maxSelect > 0
                  ? `${group.minSelect}-${group.maxSelect}`
                  : group.minSelect > 0
                  ? `at least ${group.minSelect}`
                  : group.maxSelect > 0
                  ? `up to ${group.maxSelect}`
                  : "any"}
              </>
            )}
            {group.minSelect > 0 && (
              <span className="text-primary ml-1">(Required)</span>
            )}
          </p>
        </div>

        {/* Total price delta */}
        <AnimatePresence mode="wait">
          {totalPriceDelta !== 0 && (
            <motion.div
              key={totalPriceDelta}
              initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
              animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
              exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
              transition={getSpring(spring.snappy)}
              className={cn(
                "px-3 py-1 rounded-full font-body font-semibold text-sm",
                totalPriceDelta > 0
                  ? "bg-primary/10 text-primary"
                  : "bg-green/10 text-green"
              )}
            >
              {totalPriceDelta > 0 ? "+" : ""}
              <PriceTicker value={totalPriceDelta} className="inline" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {group.options.map((option, index) => (
          <ModifierOptionItem
            key={option.id}
            option={option}
            isSelected={selectedIds.includes(option.id)}
            onToggle={() => handleToggle(option.id)}
            index={index}
          />
        ))}
      </div>

      {/* Preview indicator */}
      <AnimatePresence>
        {showPreview && selectedOptions.length > 0 && (
          <PreviewIndicator selectedOptions={selectedOptions} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ModifierToggle;
