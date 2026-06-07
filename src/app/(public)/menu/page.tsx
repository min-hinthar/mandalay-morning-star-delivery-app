import { Suspense } from "react";
import { getBusinessRules } from "@/lib/settings";
import { MenuContent, MenuSkeleton, MenuPageAmbient } from "@/components/ui/menu";

export const metadata = {
  title: "Menu | Mandalay Morning Star",
  description: "Browse our authentic Burmese menu - 47 dishes across 8 categories",
};

export default async function MenuPage() {
  const rules = await getBusinessRules();

  return (
    <main className="menu-page-bg relative isolate min-h-screen pb-32">
      {/* Maximalist Anthropic atmosphere — drifting triad orbs, dot/line grids,
          grain + vignette over the magenta sunset sky. Mobile-GPU-budgeted. */}
      <MenuPageAmbient />
      <Suspense fallback={<MenuSkeleton />}>
        <MenuContent
          cutoffDay={rules.cutoffDay}
          cutoffHour={rules.cutoffHour}
          deliveryDays={rules.deliveryDays}
        />
      </Suspense>
    </main>
  );
}
