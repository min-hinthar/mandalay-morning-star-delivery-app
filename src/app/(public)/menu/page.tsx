import { Suspense } from "react";
import { MenuContentV8, MenuSkeletonV8 } from "@/components/ui-v8/menu";

export const metadata = {
  title: "Menu | Mandalay Morning Star",
  description: "Browse our authentic Burmese menu - 47 dishes across 8 categories",
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background pb-32">
      <Suspense fallback={<MenuSkeletonV8 />}>
        <MenuContentV8 />
      </Suspense>
    </main>
  );
}
