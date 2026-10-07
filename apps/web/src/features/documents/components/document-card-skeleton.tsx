import { Skeleton } from "@/components/ui/skeleton";

export function DocumentCardSkeleton() {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card" aria-hidden="true">
      <div className="h-40 shrink-0 overflow-hidden border-b border-border/50 bg-muted/60">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="flex-1 space-y-2 p-4">
        <div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2 border-t border-border/40 px-3 py-1">
        <div className="min-w-0 flex-1">
          <div className="flex min-h-11 items-center px-1"><Skeleton className="h-3 w-2/3" /></div>
          <div className="px-1 pb-2"><Skeleton className="h-4 w-24 max-w-full" /></div>
        </div>
        <Skeleton className="size-11 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
