import { Button } from "@/components/ui/button";

export function SessionError({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <div role="alert" className="max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold">
          Chưa kiểm tra được phiên đăng nhập
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Hãy kiểm tra kết nối và thử lại để mở trang bạn đang cần.
        </p>
        <Button variant="outline" disabled={retrying} onClick={onRetry}>
          {retrying ? "Đang kiểm tra…" : "Kiểm tra lại"}
        </Button>
      </div>
    </main>
  );
}
