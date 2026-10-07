import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AssessmentImportSkeleton() {
  return (
    <Card role="status" aria-busy="true">
      <span className="sr-only">Đang tải trạng thái phân tích đề…</span>
      <CardHeader className="gap-3 border-b border-border/70 bg-muted/20">
        <div className="flex items-start gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-48 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-8" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-6 sm:grid-cols-5">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2 sm:block">
            <Skeleton className="size-7 rounded-full sm:mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AssessmentDraftsSkeleton() {
  return (
    <section role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Đang tải danh sách câu hỏi cần kiểm duyệt…</span>
      <div>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-1 h-4 w-80 max-w-full" />
      </div>
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border/70 p-4 sm:p-5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-md" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
