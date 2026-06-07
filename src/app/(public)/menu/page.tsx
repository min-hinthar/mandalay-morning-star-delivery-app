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
    <main className="relative isolate min-h-screen bg-background pb-32">
      {/* Backdrop — shared homepage menu-section treatment: food photo + surface
          overlay + layered editorial texture. Fixed behind the content. */}
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
