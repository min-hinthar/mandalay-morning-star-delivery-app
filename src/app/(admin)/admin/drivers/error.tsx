"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function DriversError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} context="drivers" />;
}
