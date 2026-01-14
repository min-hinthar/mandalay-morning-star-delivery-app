import { Skeleton } from "@/components/ui/skeleton";

export function MenuSkeleton() {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-background border-b border-gray-200 px-4 py-2">
        <div className="flex gap-2 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 pt-6">
        {[...Array(3)].map((_, sectionIdx) => (
          <div key={sectionIdx} className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, cardIdx) => (
                <div key={cardIdx} className="rounded-lg border p-4">
                  <Skeleton className="h-32 w-full mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
