import { Skeleton } from "@/components/ui/skeleton";

interface PostCardSkeletonProps {
  className?: string;
}

export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <article className={`grid gap-4 rounded-xl border border-border bg-card p-3 sm:grid-cols-[10.5rem_1fr] sm:p-4 ${className || ""}`}>
      <Skeleton className="aspect-[16/9] h-full w-full rounded-lg" />
      <div className="space-y-3 py-1">
        <div className="flex gap-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-20" /></div>
        <div className="space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-4/5" /></div>
        <div className="space-y-2"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-[85%]" /></div>
        <Skeleton className="h-3 w-24" />
      </div>
    </article>
  );
}
