"use client";

/**
 * Route Detail Page
 *
 * Admin page for viewing and managing individual delivery route details.
 * Displays route stats, driver info, stops list, and provides management actions.
 *
 * Features:
 * - Route status management (planned, in_progress, completed)
 * - Driver assignment/reassignment
 * - Stop status changes and removal
 * - Route optimization
 * - Map placeholder (map added in next plan)
 *
 * @route /admin/routes/[id]
 */

import { RouteDetailClient } from "@/components/ui/admin/routes/RouteDetailClient";

export default function RouteDetailPage() {
  return <RouteDetailClient />;
}
