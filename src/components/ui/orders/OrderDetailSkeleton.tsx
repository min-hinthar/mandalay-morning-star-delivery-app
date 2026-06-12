import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function OrderDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <main className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary pt-8 pb-32 px-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Section 1: Back/Share buttons */}
          <div className="flex justify-between items-center stagger-1">
            <Skeleton width={140} height={36} radius="sm" />
            <Skeleton width={40} height={40} radius="full" />
          </div>

          {/* Section 2: Order header */}
          <div className="flex items-center justify-between stagger-1">
            <div className="space-y-2">
              <Skeleton height={24} width="60%" radius="sm" />
              <Skeleton height={14} width="40%" radius="sm" />
            </div>
            <Skeleton height={24} width={80} radius="lg" />
          </div>

          {/* Section 3: Timeline card */}
          <Card className="shadow-card stagger-2">
            <CardContent className="p-4 space-y-4">
              {/* Status-crest placeholder — same `view-transition-name` as the real
                  crest so the wax-seal morph has a stable target during a vt-nav
                  navigation while the detail page is still loading. */}
              <div className="flex items-center justify-between">
                <Skeleton height={18} width={120} radius="sm" />
                <span
                  className="h-7 w-7 rounded-full bg-surface-tertiary"
                  style={{ viewTransitionName: "wax-seal" }}
                />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton width={40} height={40} radius="full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton height={14} width="50%" radius="sm" />
                    <Skeleton height={12} width="30%" radius="sm" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 4: Delivery info 2-col */}
          <div className="grid gap-4 md:grid-cols-2 stagger-3">
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <Skeleton width={36} height={36} radius="full" />
                <div className="space-y-2 flex-1">
                  <Skeleton height={14} width="80%" radius="sm" />
                  <Skeleton height={14} width="60%" radius="sm" />
                  <Skeleton height={14} width="50%" radius="sm" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <Skeleton width={36} height={36} radius="full" />
                <div className="space-y-2 flex-1">
                  <Skeleton height={14} width="80%" radius="sm" />
                  <Skeleton height={14} width="60%" radius="sm" />
                  <Skeleton height={14} width="50%" radius="sm" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 5: Items list */}
          <Card className="shadow-card stagger-4">
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton width={24} height={24} radius="sm" />
                    <Skeleton height={16} width={120} radius="sm" />
                  </div>
                  <Skeleton height={16} width={60} radius="sm" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 6: Totals */}
          <div className="space-y-2 stagger-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton height={14} width="30%" radius="sm" />
                <Skeleton height={14} width={60} radius="sm" />
              </div>
            ))}
          </div>

          {/* Section 7: Action buttons — 44px touch targets per A11Y-01 */}
          <div className="space-y-3 stagger-6">
            <Skeleton height={44} width="100%" radius="lg" />
            <Skeleton height={44} width="100%" radius="lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
