import Image from "next/image";
import { MenuItem } from "@/lib/queries/menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
}

const allergenLabels: Record<string, string> = {
  peanuts: "Peanuts",
  tree_nuts: "Tree Nuts",
  egg: "Egg",
  shellfish: "Shellfish",
  fish: "Fish",
  soy: "Soy",
  gluten_wheat: "Gluten",
  sesame: "Sesame",
  dairy: "Dairy",
};

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const hasAllergens = item.allergens && item.allergens.length > 0;
  const isInteractive = Boolean(onSelect) && !item.is_sold_out;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        isInteractive && "cursor-pointer hover:shadow-md",
        item.is_sold_out && "opacity-60"
      )}
      onClick={() => {
        if (isInteractive) {
          onSelect?.(item);
        }
      }}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(item);
        }
      }}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
    >
      {item.image_url ? (
        <div className="relative h-40 bg-gray-100">
          <Image
            src={item.image_url}
            alt={item.name_en}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {item.is_sold_out && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Sold Out</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-gold/20 to-brand-red/10 flex items-center justify-center">
          {item.is_sold_out ? (
            <span className="text-muted font-medium">Sold Out</span>
          ) : (
            <span className="text-sm text-muted">Image coming soon</span>
          )}
        </div>
      )}

      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-medium text-foreground leading-tight">
            {item.name_en}
          </h3>
          {item.name_my && (
            <p className="text-sm text-muted font-burmese">{item.name_my}</p>
          )}
        </div>

        {item.description_en && (
          <p className="text-sm text-muted line-clamp-2 mb-3">
            {item.description_en}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-red">
            {formatPrice(item.base_price_cents)}
          </span>

          {item.is_sold_out && (
            <Badge variant="secondary" className="bg-gray-200">
              Sold Out
            </Badge>
          )}
        </div>

        {hasAllergens && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.allergens.map((allergen) => (
              <Badge
                key={allergen}
                variant="outline"
                className="text-xs bg-amber-50 text-amber-700 border-amber-200"
              >
                {allergenLabels[allergen] || allergen}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
