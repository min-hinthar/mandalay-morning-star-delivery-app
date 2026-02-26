"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function MenuItemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} context="menu item" />;
}
