import { Suspense } from "react";
import { getMenuWithCategories } from "@/lib/queries/menu";
import { MenuContent } from "@/components/menu/menu-content";
import { MenuSkeleton } from "@/components/menu/menu-skeleton";

export const metadata = {
  title: "Menu | Mandalay Morning Star",
  description: "Browse our authentic Burmese menu - 47 dishes across 8 categories",
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<MenuSkeleton />}>
        <MenuLoader />
      </Suspense>
    </main>
  );
}

async function MenuLoader() {
  const categories = await getMenuWithCategories();
  return <MenuContent categories={categories} />;
}
