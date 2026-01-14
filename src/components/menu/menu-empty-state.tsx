import { Search, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuEmptyStateProps {
  type: "no-menu" | "no-results";
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function MenuEmptyState({
  type,
  searchQuery,
  onClearSearch,
}: MenuEmptyStateProps) {
  const queryLabel = searchQuery ?? "";

  if (type === "no-menu") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <UtensilsCrossed className="mb-4 h-16 w-16 text-muted/60" />
        <h2 className="mb-2 text-xl font-display text-foreground">
          Menu Coming Soon
        </h2>
        <p className="max-w-md text-muted">
          We&apos;re preparing something delicious for you. Check back soon to
          see our full menu of authentic Burmese dishes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <Search className="mb-4 h-16 w-16 text-muted/60" />
      <h2 className="mb-2 text-xl font-display text-foreground">
        No Results Found
      </h2>
      <p className="mb-6 max-w-md text-muted">
        We couldn&apos;t find any dishes matching &quot;{queryLabel}&quot;. Try
        a different search term or browse our categories.
      </p>
      {onClearSearch && (
        <Button onClick={onClearSearch} variant="outline">
          Clear Search
        </Button>
      )}
      <div className="mt-6 text-sm text-muted">
        <p className="mb-2 font-medium text-foreground/80">
          Popular searches:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Mohinga", "Curry", "Noodles", "Seafood"].map((term) => (
            <span
              key={term}
              className="rounded-full bg-muted/10 px-3 py-1 text-foreground"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
