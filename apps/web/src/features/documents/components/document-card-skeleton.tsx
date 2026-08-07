import { Skeleton } from "@/components/ui/skeleton";

export function DocumentCardSkeleton() {
  return (
    <div className="flex flex-col h-[280px] rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
      <Skeleton className="h-[180px] w-full rounded-none" />
      <div className="p-3 flex gap-3 h-[100px]">
        <Skeleton className="w-5 h-5 rounded mt-0.5 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-auto">
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
