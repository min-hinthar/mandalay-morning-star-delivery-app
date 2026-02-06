import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <Card className="shadow-card">
      <CardContent className="p-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton width={64} height={64} radius="full" />
          <div className="space-y-2 flex-1">
            <Skeleton height={24} width="60%" radius="sm" />
            <Skeleton height={16} width="40%" radius="sm" />
          </div>
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <Skeleton height={14} width={80} radius="sm" className="mb-2" />
            <Skeleton height={44} width="100%" radius="md" />
          </div>

          {/* Phone */}
          <div>
            <Skeleton height={14} width={120} radius="sm" className="mb-2" />
            <Skeleton height={44} width="100%" radius="md" />
          </div>

          {/* Email */}
          <div>
            <Skeleton height={14} width={100} radius="sm" className="mb-2" />
            <Skeleton height={44} width="100%" radius="md" />
            <Skeleton height={12} width="60%" radius="sm" className="mt-1" />
          </div>

          {/* Member Since */}
          <div>
            <Skeleton height={14} width={100} radius="sm" className="mb-2" />
            <Skeleton height={44} width="100%" radius="md" />
          </div>

          {/* Button */}
          <div className="pt-4">
            <Skeleton height={44} width={140} radius="lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
