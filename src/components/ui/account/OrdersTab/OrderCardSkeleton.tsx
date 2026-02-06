import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrderCardSkeleton() {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Skeleton width={40} height={40} radius="full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton height={18} width="50%" radius="sm" />
              <Skeleton height={14} width="70%" radius="sm" />
              <Skeleton height={14} width="40%" radius="sm" />
            </div>
          </div>
          <div className="text-right space-y-2 flex-shrink-0">
            <Skeleton height={18} width={60} radius="sm" />
            <Skeleton height={24} width={80} radius="lg" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Skeleton height={36} width={100} radius="lg" />
          <Skeleton height={36} width={80} radius="lg" />
        </div>
      </CardContent>
    </Card>
  );
}
