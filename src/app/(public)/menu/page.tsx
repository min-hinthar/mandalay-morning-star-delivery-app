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
    <main className="menu-page-bg relative min-h-screen pb-32">
      {/* Decorative editorial dot-grid for hero-like depth — fixed behind the
          content, gated md:+ to keep the mobile composite minimal. */}
      <span
        aria-hidden="true"
        className="hero-dotgrid pointer-events-none fixed inset-0 -z-10 hidden opacity-60 [--dot-color:var(--menu-texture-dot)] [--dot-gap:22px] md:block"
      />
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
