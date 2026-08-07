import { Skeleton } from "@/components/ui/skeleton";

export function DocumentListItemSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border/40 hover:bg-muted/10">
      <div className="flex items-center gap-4 flex-1 pr-4">
        <Skeleton className="w-5 h-5 rounded shrink-0" />
        <Skeleton className="h-5 w-[150px] sm:w-[250px]" />
      </div>
      <div className="hidden sm:flex items-center gap-2 w-[180px] pr-4">
        <Skeleton className="w-6 h-6 rounded-full shrink-0" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      <div className="hidden md:block w-[150px]">
        <Skeleton className="h-4 w-[100px]" />
      </div>
      <div className="w-[40px] flex justify-end">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}
