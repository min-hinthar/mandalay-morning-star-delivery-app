"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useNavigationGuard } from "@/lib/hooks/useNavigationGuard";
import { CartNavigationGuard } from "@/components/ui/cart/CartNavigationGuard";
import { CartPageContent } from "@/components/ui/cart/CartPage";

/**
 * Phase 110 CFIX-01 — Mobile cart white flash fix.
 *
 * Removed the previous effect-based mobile redirect (D-01) which caused a
 * blank-frame flash because Zustand+IDB hydration is async and the redirect
 * fired only after hydration completed. Replaced with CSS-only responsive
 * classes (D-02) — server and client render identical markup, zero JS
 * branching. Dropped the media-query viewport check from this page entirely
 * (D-03).
 *
 * Both wrappers render the same CartPageContent with different paddings so
 * that SSR output matches hydration output exactly. Tailwind controls
 * visibility at the md (768px) breakpoint.
 */
export default function CartPage() {
  const router = useRouter();
  const { isEmpty } = useCart();

  // Navigation guard: nudge toward checkout when leaving cart with items
  const { showModal, proceed, cancel } = useNavigationGuard({
    enabled: !isEmpty,
    allowedPaths: ["/cart", "/checkout"],
  });

  return (
    <main className="min-h-screen bg-background pb-40">
      {/* Mobile subview — visible below md breakpoint, identical SSR/CSR markup */}
      <div className="md:hidden">
        <div className="px-4 py-4">
          <CartPageContent />
        </div>
      </div>

      {/* Desktop layout — visible at md+ breakpoint */}
      <div className="hidden md:block">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <CartPageContent />
        </div>
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
