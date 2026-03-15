"use client";

import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function RouteDetailSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <Skeleton width={300} height={24} radius="md" />
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={36} radius="lg" />
        <Skeleton width={200} height={40} radius="md" />
      </div>
      <Skeleton width="100%" height={80} radius="lg" />
      <Skeleton width="100%" height={256} radius="lg" />
      <div className="space-y-4">
        <Skeleton width="100%" height={160} radius="lg" />
        <Skeleton width="100%" height={160} radius="lg" />
        <Skeleton width="100%" height={160} radius="lg" />
      </div>
    </div>
  );
}

interface RouteErrorStateProps {
  error: string | null;
  onBack: () => void;
}

export function RouteErrorState({ error, onBack }: RouteErrorStateProps) {
  return (
    <div className="p-4 md:p-8">
      <div className="text-center py-16 bg-gradient-to-br from-surface-secondary to-surface-tertiary rounded-xl border border-border-v5">
        <div className="rounded-full bg-status-error-bg w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <Route className="h-10 w-10 text-status-error" />
        </div>
        <h2 className="text-xl font-display text-text-primary mb-2">
          {error || "Route not found"}
        </h2>
        <Button variant="outline" onClick={onBack}>
          Back to Routes
        </Button>
      </div>
    </div>
  );
}
