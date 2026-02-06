import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AddressCardSkeleton() {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton width={36} height={36} radius="full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton height={18} width={80} radius="sm" />
                <Skeleton height={20} width={60} radius="lg" />
              </div>
              <Skeleton height={14} width="80%" radius="sm" />
              <Skeleton height={14} width="60%" radius="sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton width={32} height={32} radius="md" />
            <Skeleton width={32} height={32} radius="md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
