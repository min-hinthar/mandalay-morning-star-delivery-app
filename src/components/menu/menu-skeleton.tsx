import { Skeleton } from "@/components/ui/skeleton";
import { MenuItemCardSkeleton } from "./menu-item-card";

export function MenuSkeleton() {
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
        <div className="flex gap-2 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      <div className="space-y-8 px-4 pb-8 pt-6">
        {[...Array(3)].map((_, sectionIdx) => (
          <div key={sectionIdx}>
            <Skeleton className="mb-4 h-7 w-48" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, cardIdx) => (
                <MenuItemCardSkeleton key={cardIdx} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
