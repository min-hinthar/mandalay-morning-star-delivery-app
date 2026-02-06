"use client";

/**
 * Cart overlay components scoped to customer/public route groups.
 * Excluded from admin/driver/auth bundles.
 */

import { CartBar } from "./CartBar";
import { CartDrawer } from "./CartDrawer";
import { FlyToCart } from "./FlyToCart";

export function CartOverlays() {
  return (
    <>
      <CartBar />
      <CartDrawer />
      <FlyToCart />
    </>
  );
}
