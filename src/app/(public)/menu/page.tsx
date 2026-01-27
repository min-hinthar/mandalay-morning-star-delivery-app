import { Suspense } from "react";
import { MenuContent, MenuSkeleton } from "@/components/ui/menu";

export const metadata = {
  title: "Menu | Mandalay Morning Star",
  description: "Browse our authentic Burmese menu - 47 dishes across 8 categories",
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background pb-32">
      <Suspense fallback={<MenuSkeleton />}>
        <MenuContent />
      </Suspense>
    </main>
  );
}
