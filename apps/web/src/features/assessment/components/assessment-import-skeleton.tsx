import { Skeleton } from "@/components/ui/skeleton";

export function AssessmentImportSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
