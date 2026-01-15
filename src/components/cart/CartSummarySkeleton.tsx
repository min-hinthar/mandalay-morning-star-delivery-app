import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

interface CartSummarySkeletonProps {
  className?: string;
}

export function CartSummarySkeleton({ className }: CartSummarySkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-lg bg-muted p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-2 w-full" />
        <Skeleton className="mt-1 h-3 w-1/2" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="flex justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
