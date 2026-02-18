"use client";

/**
 * ExpandableTableRow Component
 *
 * Reusable table row with smooth expand/collapse animation.
 * Click row to reveal quick preview panel. Interactive elements
 * work independently without triggering expand.
 */

import { useCallback, type ReactNode, type MouseEvent } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TableRow, TableCell } from "@/components/ui/table";
import { spring } from "@/lib/motion-tokens";

interface ExpandableTableRowProps {
  /** Unique ID for this row */
  id: string;
  /** Whether this row is currently expanded */
  isExpanded: boolean;
  /** Callback when expand state changes */
  onExpandChange: (id: string, expanded: boolean) => void;
  /** Number of columns in the table (for preview colspan) */
  colSpan: number;
  /** The main row cells content */
  children: ReactNode;
  /** The preview panel content */
  previewContent: ReactNode;
  /** Optional className for the row */
  className?: string;
}

export function ExpandableTableRow({
  id,
  isExpanded,
  onExpandChange,
  colSpan,
  children,
  previewContent,
  className,
}: ExpandableTableRowProps) {
  const handleRowClick = useCallback(
    (e: MouseEvent<HTMLTableRowElement>) => {
      // Don't expand if clicking on interactive elements
      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest("button") ||
        target.closest("a") ||
        target.closest('[role="menuitem"]') ||
        target.closest("[data-radix-collection-item]") ||
        target.closest("[data-state]") ||
        target.closest(".dropdown-trigger");

      if (isInteractive) return;

      onExpandChange(id, !isExpanded);
    },
    [id, isExpanded, onExpandChange]
  );

  return (
    <>
      <TableRow
        onClick={handleRowClick}
        className={cn(
          "cursor-pointer transition-colors duration-fast group",
          "hover:bg-surface-secondary/50",
          isExpanded && "bg-surface-secondary border-b-0",
          className
        )}
      >
        {children}
        <TableCell className="w-8 pr-4">
          <m.div
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={spring.default}
            className="text-text-muted group-hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </m.div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <tr>
          <td colSpan={colSpan + 1} className="p-0 border-b border-border">
            <AnimatePresence initial={false}>
              <m.div
                key="expanded-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.2, delay: 0.1 },
                }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent" />
                  <div className="pl-6 pr-4 py-4 bg-gradient-to-r from-surface-secondary to-surface-primary">
                    {previewContent}
                  </div>
                </div>
              </m.div>
            </AnimatePresence>
          </td>
        </tr>
      )}
    </>
  );
}
