"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useNavigationGuard } from "@/lib/hooks/useNavigationGuard";
import { CartNavigationGuard } from "@/components/ui/cart/CartNavigationGuard";

export default function CartPage() {
  const router = useRouter();
  const { isEmpty } = useCart();

  // Navigation guard: nudge toward checkout when leaving cart with items
  const { showModal, proceed, cancel } = useNavigationGuard({
    enabled: !isEmpty,
    allowedPaths: ["/cart", "/checkout", "/menu", "/"],
  });

  return (
    <main className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-display text-brand-red">Cart</h1>
      <p className="mt-2 text-muted">Cart details will appear here.</p>

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
