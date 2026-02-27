"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} context="categories" />;
}
