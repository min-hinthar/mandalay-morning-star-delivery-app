import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Skeleton height={32} width={120} radius="md" />
        <div className="flex gap-3 w-full sm:w-auto">
          <Skeleton height={44} width={150} radius="lg" />
          <Skeleton height={44} width={140} radius="lg" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton height={40} width={100} radius="lg" />
        <Skeleton height={40} width={110} radius="lg" />
        <Skeleton height={40} width={120} radius="lg" />
      </div>

      {/* Form skeleton */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-border-subtle">
          <Skeleton height={24} width={180} radius="sm" />
          <Skeleton height={16} width={280} radius="sm" className="mt-2" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton height={16} width={120} radius="sm" />
              <Skeleton height={44} width={200} radius="md" />
              <Skeleton height={12} width={180} radius="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
