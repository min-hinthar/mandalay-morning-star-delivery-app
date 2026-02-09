"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCart } from "@/lib/hooks/useCart";
import { useNavigationGuard } from "@/lib/hooks/useNavigationGuard";
import { CartNavigationGuard } from "@/components/ui/cart/CartNavigationGuard";
import { CartPageContent } from "@/components/ui/cart/CartPage";

export default function CartPage() {
  const router = useRouter();
  const { isEmpty } = useCart();
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Mobile: redirect to menu and open cart drawer instead
  useEffect(() => {
    if (isMobile) {
      useCartDrawer.getState().open();
      router.replace("/menu");
    }
  }, [isMobile, router]);

  // Navigation guard: nudge toward checkout when leaving cart with items
  const { showModal, proceed, cancel } = useNavigationGuard({
    enabled: !isEmpty,
    allowedPaths: ["/cart", "/checkout", "/menu", "/"],
  });

  // While mobile redirect is in flight, render nothing
  if (isMobile) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <CartPageContent />
      </div>

      <CartNavigationGuard
        isOpen={showModal}
        onStay={() => {
          cancel();
          router.push("/checkout");
        }}
        onLeave={proceed}
        variant="cart"
      />
    </main>
  );
}
