"use client";

import { useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "@/lib/hooks/useToastV8";

interface OrderShareButtonProps {
  orderId: string;
}

export function OrderShareButton({ orderId }: OrderShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    try {
      // Get share token from API
      const res = await fetch(`/api/orders/${orderId}/share-token`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate share link");

      const { shareUrl } = await res.json();
      const title = "Check out my order from Morning Star!";

      // Try native Web Share API (mobile)
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, url: shareUrl });
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast({ message: "Link copied to clipboard", type: "success" });
    } catch {
      toast({ message: "Unable to share order", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className="p-2 hover:bg-charcoal/5 rounded-full transition-colors"
      aria-label="Share order"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Share2 className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}
