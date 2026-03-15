import type { StopDetail, RouteStatus } from "@/types/driver";

/**
 * Toggle a stop ID in the selection set (immutable).
 */
export function toggleStopSelection(selectedIds: Set<string>, stopId: string): Set<string> {
  const next = new Set(selectedIds);
  if (next.has(stopId)) {
    next.delete(stopId);
  } else {
    next.add(stopId);
  }
  return next;
}

/**
 * Select all selectable stops based on route status.
 * For in_progress routes, only pending stops are selectable.
 */
export function selectAllStops(stops: StopDetail[], routeStatus: RouteStatus): Set<string> {
  return new Set(getSelectableStops(stops, routeStatus));
}

/**
 * Return an empty selection set.
 */
export function deselectAllStops(): Set<string> {
  return new Set();
}

/**
 * Validate that a split selection is valid:
 * - At least 1 stop selected
 * - At least 1 stop must remain in source route
 */
export function validateSplitSelection(
  selectedIds: Set<string>,
  totalStopCount: number
): { valid: boolean; error?: string } {
  if (selectedIds.size === 0) {
    return { valid: false, error: "Select at least one stop" };
  }
  if (selectedIds.size >= totalStopCount) {
    return { valid: false, error: "At least one stop must remain" };
  }
  return { valid: true };
}

/**
 * Get IDs of stops that can be selected for split.
 * For in_progress routes, only pending stops are selectable.
 * For all other statuses, all stops are selectable.
 */
export function getSelectableStops(stops: StopDetail[], routeStatus: RouteStatus): string[] {
  if (routeStatus === "in_progress") {
    return stops.filter((s) => s.status === "pending").map((s) => s.id);
  }
  return stops.map((s) => s.id);
}
