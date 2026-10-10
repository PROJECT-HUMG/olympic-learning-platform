import { Skeleton } from "@/components/ui/skeleton";
import "./document-discovery.css";

export function DocumentCardSkeleton() {
  return <div className="content-card overflow-hidden" aria-hidden="true">
    <div className="document-card__primary">
      <Skeleton className="document-thumbnail" />
      <div className="document-card__body flex-1">
        <Skeleton className="h-4 w-3/4" /><Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" />
      </div>
    </div>
    <div className="space-y-2 border-t border-border/50 p-4">
      <Skeleton className="h-4 w-2/3" /><Skeleton className="h-11 w-full" />
    </div>
  </div>;
}
