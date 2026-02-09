"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useNavigationGuard } from "@/lib/hooks/useNavigationGuard";
import { CartNavigationGuard } from "@/components/ui/cart/CartNavigationGuard";
import { CartPageContent } from "@/components/ui/cart/CartPage";

export default function CartPage() {
  const router = useRouter();
  const { isEmpty } = useCart();

  // Navigation guard: nudge toward checkout when leaving cart with items
  const { showModal, proceed, cancel } = useNavigationGuard({
    enabled: !isEmpty,
    allowedPaths: ["/cart", "/checkout", "/menu", "/"],
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <CartPageContent />
      </div>

      <CartNavigationGuard
        isOpen={showModal}
        onStay={() => {
          cancel();
          // Cart variant: "Go to Checkout" nudges user toward checkout
          router.push("/checkout");
        }}
        onLeave={proceed}
        variant="cart"
      />
    </main>
  );
}
