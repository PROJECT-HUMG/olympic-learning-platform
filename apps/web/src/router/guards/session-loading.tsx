import { Skeleton } from "@/components/ui/skeleton";

export function SessionLoading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <div role="status" aria-busy="true" className="w-full max-w-sm space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Đang kiểm tra phiên đăng nhập…</p>
        <Skeleton className="h-4 w-full" />
      </div>
    </main>
  );
}
