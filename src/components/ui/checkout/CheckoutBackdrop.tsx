import { PhotoBandBackdrop } from "@/components/ui/PhotoBandBackdrop";

/**
 * Checkout backdrop — the shared zoomed-out photo band (menu photo melded into
 * the "After Dark" sunset canvas via soft-light, under a gentle cream wash +
 * editorial texture) spanning the `.checkout-canvas`. See `PhotoBandBackdrop`.
 */
export function CheckoutBackdrop() {
  return <PhotoBandBackdrop className="absolute inset-0" />;
}

export default CheckoutBackdrop;
