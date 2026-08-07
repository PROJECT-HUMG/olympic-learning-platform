import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PostCardSkeletonProps {
  className?: string;
}

export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <Card
      className={`overflow-hidden flex flex-col rounded-2xl bg-card border-border/20 shadow-sm ${
        className || ""
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <CardHeader className="p-5 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-12" />
          <span className="text-muted-foreground/50">•</span>
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-2 mt-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-1 flex-1">
        <div className="space-y-2 mt-3">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-[95%]" />
          <Skeleton className="h-3.5 w-[85%]" />
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </div>

        <Skeleton className="h-6 w-12 rounded-md" />
      </CardFooter>
    </Card>
  );
}
