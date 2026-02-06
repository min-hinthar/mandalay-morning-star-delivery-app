"use client";

/**
 * useExpandedRows Hook
 *
 * Manages expand/collapse state for table rows (single row at a time).
 */

import { useState, useCallback } from "react";

export function useExpandedRows() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleExpandChange = useCallback((id: string, expanded: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (expanded) {
        // Only allow one row expanded at a time
        next.clear();
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (id: string) => expandedIds.has(id),
    [expandedIds]
  );

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return {
    expandedIds,
    handleExpandChange,
    isExpanded,
    collapseAll,
  };
}
