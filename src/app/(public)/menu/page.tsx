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
    <main className="relative min-h-screen pb-32">
      {/* Full-page backdrop (photo + surface overlay + editorial texture). Main
          is transparent + non-isolating so this viewport-fixed layer sits behind
          ALL content — including the site footer that follows <main>. */}
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
