import { Skeleton } from "@/components/ui/skeleton";

export function AccountSkeleton() {
  return (
    <div aria-hidden="true">
      <main className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary pt-8 pb-32 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Page title "My Account" placeholder */}
          <div className="mb-6 stagger-1">
            <Skeleton height={28} width="50%" radius="sm" />
          </div>
          {/* Tab bar -- 4 tabs */}
          <div className="flex gap-2 mb-6 stagger-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={36} width={80} radius="lg" />
            ))}
          </div>
          {/* Tab content area -- 3 placeholder cards */}
          <div className="space-y-4 stagger-3">
            <Skeleton height={200} width="100%" radius="lg" />
            <Skeleton height={120} width="100%" radius="lg" />
            <Skeleton height={120} width="100%" radius="lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
