import { Skeleton } from "@/components/ui/skeleton";

export function GroupBuySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="團購載入中">
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`ql-${i}`} className="h-24 rounded-2xl md:h-[104px]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`card-${i}`} className="overflow-hidden rounded-2xl bg-white">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
