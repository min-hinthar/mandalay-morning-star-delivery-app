"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { formatPrice } from "@/lib/utils/format";
import { getFallbackEmoji } from "@/components/ui/cart/CartItem/helpers";
import type { MenuItem } from "@/types/menu";

export interface SuggestionRowProps {
  suggestions: MenuItem[];
  onReplace: (suggestion: MenuItem) => void;
  className?: string;
}

interface SuggestionCardProps {
  item: MenuItem;
  onSelect: () => void;
}

const SuggestionCard = memo(function SuggestionCard({ item, onSelect }: SuggestionCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [imgError, setImgError] = useState(false);

  return (
    <m.button
      type="button"
      onClick={onSelect}
      whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "flex-shrink-0 flex items-center gap-2.5 p-2 rounded-xl",
        "glass-menu-card border border-surface-border/40",
        "shadow-sm hover:shadow-md",
        "cursor-pointer transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "min-w-[160px] max-w-[200px]"
      )}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-surface-secondary/50">
        {item.imageUrl && !imgError ? (
          <Image
            src={item.imageUrl}
            alt={item.nameEn}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">
            <span role="img" aria-label="Food">
              {getFallbackEmoji(item.nameEn)}
            </span>
          </div>
        )}
      </div>

      {/* Name + Price */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-text-primary truncate">{item.nameEn}</p>
        <p className="text-xs text-text-secondary">{formatPrice(item.basePriceCents)}</p>
      </div>
    </m.button>
  );
});

export const SuggestionRow = memo(function SuggestionRow({
  suggestions,
  onReplace,
  className,
}: SuggestionRowProps) {
  const handleSelect = useCallback(
    (suggestion: MenuItem) => {
      onReplace(suggestion);
    },
    [onReplace]
  );

  if (suggestions.length === 0) return null;

  const displaySuggestions = suggestions.slice(0, 3);

  return (
    <div className={cn("mt-2", className)}>
      <p className="text-xs text-text-muted mb-1.5 pl-1">Try instead:</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {displaySuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            item={suggestion}
            onSelect={() => handleSelect(suggestion)}
          />
        ))}
      </div>
    </div>
  );
});

export default SuggestionRow;
