import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useDailyAccount } from "../hooks/use-daily";
import { resolveDailyAccountMount } from "../lib/daily-lifecycle";

export function DailyAccountGate({ children }: { children: (userId: string, accountWarning: boolean, retryAccount: () => void) => ReactNode }) {
  const account = useDailyAccount();
  const mount = resolveDailyAccountMount({ pending: account.pending, error: account.error, activeUserId: account.userId });
  if (mount.phase === "editor") {
    return children(mount.userId, mount.accountWarning, () => void account.refetch());
  }
  if (mount.phase === "loading") return <div className="page-shell"><p role="status">Đang kiểm tra tài khoản.</p></div>;
  if (mount.phase === "error") {
    return <div className="page-shell"><p role="alert">Không tải được tài khoản. Hãy thử lại.</p><Button type="button" variant="outline" onClick={() => void account.refetch()}>Thử lại</Button></div>;
  }
  return <div className="page-shell"><p role="status">Tài khoản chưa được mở. Hãy hoàn tất kích hoạt trước khi dùng Daily.</p></div>;
}

export function DailyAccountWarning({ show, onRetry }: { show: boolean; onRetry: () => void }) {
  if (!show) return null;
  return <div className="mb-4 space-y-3" role="alert"><p>Không tải lại được tài khoản. Bản đang nhập vẫn được giữ.</p><Button type="button" variant="outline" onClick={onRetry}>Thử lại</Button></div>;
}
