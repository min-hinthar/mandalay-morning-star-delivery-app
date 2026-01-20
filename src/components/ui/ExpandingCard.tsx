"use client";

import React, { useState, forwardRef, type ReactNode, useCallback, useId } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export interface ExpandingCardProps {
  /** Collapsed/header content */
  header: ReactNode;
  /** Expanded/body content */
  children: ReactNode;
  /** Controlled expanded state */
  isExpanded?: boolean;
  /** Callback when expanded state changes */
  onExpandChange?: (isExpanded: boolean) => void;
  /** Additional class names */
  className?: string;
  /** Header class names */
  headerClassName?: string;
  /** Content class names */
  contentClassName?: string;
  /** Disable expand interaction */
  disabled?: boolean;
  /** Icon to show (rotates on expand) */
  expandIcon?: ReactNode;
  /** Play haptic feedback */
  haptic?: boolean;
  /** Unique ID for layout animations */
  layoutId?: string;
}

// ============================================
// DEFAULT EXPAND ICON
// ============================================

const DefaultExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={shouldAnimate ? { rotate: isExpanded ? 180 : 0 } : undefined}
      transition={getSpring(v7Spring.snappy)}
      className="text-v6-text-muted flex-shrink-0"
    >
      <path d="M6 9l6 6 6-6" />
    </motion.svg>
  );
};

// ============================================
// COMPONENT
// ============================================

export const ExpandingCard = forwardRef<HTMLDivElement, ExpandingCardProps>(
  (
    {
      header,
      children,
      isExpanded: controlledExpanded,
      onExpandChange,
      className,
      headerClassName,
      contentClassName,
      disabled = false,
      expandIcon,
      haptic = true,
      layoutId: externalLayoutId,
    },
    ref
  ) => {
    const [internalExpanded, setInternalExpanded] = useState(false);
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreferenceV7();
    const autoLayoutId = useId();
    const layoutId = externalLayoutId ?? autoLayoutId;

    // Controlled or uncontrolled
    const isExpanded = controlledExpanded ?? internalExpanded;

    const handleToggle = useCallback(() => {
      if (disabled) return;

      // Haptic feedback
      if (haptic && isFullMotion && "vibrate" in navigator) {
        navigator.vibrate(8);
      }

      const newExpanded = !isExpanded;

      if (controlledExpanded === undefined) {
        setInternalExpanded(newExpanded);
      }

      onExpandChange?.(newExpanded);
    }, [disabled, haptic, isFullMotion, isExpanded, controlledExpanded, onExpandChange]);

    const springConfig = getSpring(v7Spring.gentle);

    return (
      <LayoutGroup id={layoutId}>
        <motion.div
          ref={ref}
          layout={shouldAnimate}
          className={cn(
            "relative rounded-2xl overflow-hidden",
            "bg-white border border-v6-border-default/70",
            "shadow-md shadow-v6-text-primary/5",
            "transition-shadow duration-200",
            isExpanded && "shadow-lg shadow-v6-text-primary/10",
            disabled && "opacity-60 cursor-not-allowed",
            className
          )}
          transition={springConfig}
        >
          {/* Header - Always visible */}
          <motion.button
            layout={shouldAnimate ? "position" : false}
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-between gap-4 p-5",
              "text-left cursor-pointer",
              "hover:bg-v6-surface-secondary/50 transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A41034]/30 focus-visible:ring-inset",
              disabled && "cursor-not-allowed hover:bg-transparent",
              headerClassName
            )}
            whileHover={shouldAnimate && !disabled ? { scale: 1.005 } : undefined}
            whileTap={shouldAnimate && !disabled ? { scale: 0.995 } : undefined}
            transition={getSpring(v7Spring.snappy)}
          >
            <motion.div layout={shouldAnimate ? "position" : false} className="flex-1">
              {header}
            </motion.div>

            {expandIcon ?? <DefaultExpandIcon isExpanded={isExpanded} />}
          </motion.button>

          {/* Expandable Content */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="content"
                initial={shouldAnimate ? { height: 0, opacity: 0 } : false}
                animate={shouldAnimate ? { height: "auto", opacity: 1 } : undefined}
                exit={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
                transition={{
                  height: springConfig,
                  opacity: { duration: 0.15, delay: isExpanded ? 0.05 : 0 },
                }}
                className="overflow-hidden"
              >
                {/* Golden accent bar */}
                <div
                  className="h-px mx-5"
                  style={{
                    background: "linear-gradient(90deg, transparent, #EBCD00, transparent)",
                  }}
                />

                <motion.div
                  initial={shouldAnimate ? { y: -10, opacity: 0 } : false}
                  animate={shouldAnimate ? { y: 0, opacity: 1 } : undefined}
                  exit={shouldAnimate ? { y: -10, opacity: 0 } : undefined}
                  transition={{ ...springConfig, delay: 0.08 }}
                  className={cn("p-5 pt-4", contentClassName)}
                >
                  {children}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative corner gradient when expanded */}
          <AnimatePresence>
            {isExpanded && shouldAnimate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at bottom right, rgba(235, 205, 0, 0.08), transparent 70%)",
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    );
  }
);

ExpandingCard.displayName = "ExpandingCard";

// ============================================
// EXPANDING CARD GROUP
// For managing multiple cards where only one can be expanded
// ============================================

export interface ExpandingCardGroupProps {
  children: ReactNode;
  /** Only allow one card expanded at a time */
  accordion?: boolean;
  className?: string;
}

export function ExpandingCardGroup({
  children,
  accordion = true,
  className,
}: ExpandingCardGroupProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const childrenArray = React.Children.toArray(children);

  if (!accordion) {
    return <div className={cn("space-y-3", className)}>{children}</div>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {childrenArray.map((child, index) => {
        if (!React.isValidElement<ExpandingCardProps>(child)) return child;

        return React.cloneElement(child, {
          key: index,
          isExpanded: expandedIndex === index,
          onExpandChange: (isExpanded: boolean) => {
            setExpandedIndex(isExpanded ? index : null);
            child.props.onExpandChange?.(isExpanded);
          },
        });
      })}
    </div>
  );
}

// ============================================
// MENU EXPANDING CARD VARIANT
// Pre-styled for menu category usage
// ============================================

export interface MenuExpandingCardProps {
  title: string;
  description?: string;
  itemCount?: number;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MenuExpandingCard({
  title,
  description,
  itemCount,
  icon,
  children,
  className,
}: MenuExpandingCardProps) {
  return (
    <ExpandingCard
      className={className}
      header={
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-v6-primary/10 to-v6-primary/5 flex items-center justify-center text-v6-primary">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-v6-text-primary truncate">
                {title}
              </h3>
              {itemCount !== undefined && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-v6-secondary/20 text-v6-secondary-active">
                  {itemCount}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-v6-text-muted truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      }
    >
      {children}
    </ExpandingCard>
  );
}

export default ExpandingCard;
