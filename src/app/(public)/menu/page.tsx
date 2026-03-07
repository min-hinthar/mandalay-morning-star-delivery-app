import { Suspense } from "react";
import { getBusinessRules } from "@/lib/settings";
import { MenuContent, MenuSkeleton } from "@/components/ui/menu";

export const metadata = {
  title: "Menu | Mandalay Morning Star",
  description: "Browse our authentic Burmese menu - 47 dishes across 8 categories",
};

export default async function MenuPage() {
  const rules = await getBusinessRules();

  return (
    <main className="min-h-screen bg-background pb-32">
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
