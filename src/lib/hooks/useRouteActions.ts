"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";
import {
  toggleStopSelection,
  selectAllStops,
  deselectAllStops,
  validateSplitSelection,
} from "@/components/ui/admin/routes/route-selection-utils";
import type { StopDetail, RouteStatus } from "@/types/driver";

interface UseRouteActionsOptions {
  routeId: string;
  onSplitSuccess: () => void;
  onMergeSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function useRouteActions({
  routeId,
  onSplitSuccess,
  onMergeSuccess,
  onDeleteSuccess,
}: UseRouteActionsOptions) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedStopIds, setSelectedStopIds] = useState<Set<string>>(new Set());
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selection handlers
  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedStopIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedStopIds(new Set());
  }, []);

  const toggleStopSelect = useCallback((stopId: string) => {
    setSelectedStopIds((prev) => toggleStopSelection(prev, stopId));
  }, []);

  const selectAll = useCallback((stops: StopDetail[], routeStatus: RouteStatus) => {
    setSelectedStopIds(selectAllStops(stops, routeStatus));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedStopIds(deselectAllStops());
  }, []);

  const updateSelection = useCallback((ids: Set<string>) => {
    setSelectedStopIds(ids);
  }, []);

  // Split flow
  const confirmSplit = useCallback(
    (totalStopCount: number) => {
      const validation = validateSplitSelection(selectedStopIds, totalStopCount);
      if (!validation.valid) {
        toast({ message: validation.error!, type: "error" });
        return;
      }
      setShowSplitModal(true);
    },
    [selectedStopIds]
  );

  const onSplitComplete = useCallback(() => {
    setShowSplitModal(false);
    exitSelectionMode();
    onSplitSuccess();
  }, [exitSelectionMode, onSplitSuccess]);

  // Merge flow
  const openMerge = useCallback(() => {
    setShowMergeModal(true);
  }, []);

  const onMergeComplete = useCallback(() => {
    setShowMergeModal(false);
    onMergeSuccess();
  }, [onMergeSuccess]);

  // Delete flow
  const openDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete route");
      }
      toast({ message: "Route deleted", type: "success" });
      setShowDeleteConfirm(false);
      onDeleteSuccess();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to delete route",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [routeId, onDeleteSuccess]);

  return {
    // Selection state
    selectionMode,
    selectedStopIds,
    // Selection handlers
    enterSelectionMode,
    exitSelectionMode,
    toggleStopSelect,
    selectAll,
    deselectAll,
    updateSelection,
    // Split
    showSplitModal,
    setShowSplitModal,
    confirmSplit,
    onSplitComplete,
    // Merge
    showMergeModal,
    setShowMergeModal,
    openMerge,
    onMergeComplete,
    // Delete
    showDeleteConfirm,
    isDeleting,
    openDelete,
    cancelDelete,
    confirmDelete,
  };
}
