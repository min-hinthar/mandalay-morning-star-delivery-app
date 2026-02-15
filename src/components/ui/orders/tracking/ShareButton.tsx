/**
 * ShareButton - Share tracking link via Web Share API or clipboard
 *
 * Uses native share sheet on mobile, falls back to clipboard copy on desktop.
 */

"use client";

import { Share2 } from "lucide-react";
import { toast } from "@/lib/hooks/useToastV8";
import type { OrderStatus } from "@/types/database";

interface ShareButtonProps {
  orderId: string;
  orderStatus: OrderStatus;
}

export function ShareButton({ orderId, orderStatus }: ShareButtonProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/orders/${orderId}/tracking?shared=true`;
    const title = "Track your delivery";
    const text = `Track your Morning Star delivery: ${orderStatus.replace(/_/g, " ")}`;

    // Try native Web Share API (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled or share failed -- fall through to clipboard
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast({ message: "Link copied!", type: "success" });
    } catch {
      toast({ message: "Unable to copy link", type: "error" });
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-1 hover:bg-charcoal-100 rounded-full transition-colors"
      aria-label="Share tracking link"
    >
      <Share2 className="h-3.5 w-3.5" />
    </button>
  );
}
