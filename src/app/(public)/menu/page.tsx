import { MenuContentV8 } from "@/components/ui-v8/menu";

export const metadata = {
  title: "Menu | Mandalay Morning Star",
  description: "Browse our authentic Burmese menu - 47 dishes across 8 categories",
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background">
      <MenuContentV8 />
    </main>
  );
}
