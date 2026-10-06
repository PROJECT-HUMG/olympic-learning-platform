import { Check, CloudUpload, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DailySyncIssue } from "../hooks/use-daily-auto-sync";

export function DailySyncStatus({ dirty, busy, syncing, saved, issue, conflict, onRetry }: {
  dirty: boolean; busy: boolean; syncing: boolean; saved: boolean;
  issue: DailySyncIssue | null; conflict: boolean; onRetry: () => void;
}) {
  const failed = Boolean(issue || conflict);
  return <div className="daily-sync-status" data-error={failed}>
    <p role="status" aria-live="polite" aria-atomic="true">
      {failed ? <CircleAlert size={16} aria-hidden="true" /> : dirty || busy ? <CloudUpload size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
      <span>{conflict ? "Chưa đồng bộ · Bản máy chủ đã đổi" : issue ? "Chưa đồng bộ" : syncing ? "Đang đồng bộ…" : busy ? "Đang xử lý…" : dirty ? "Chờ đồng bộ…" : saved ? "Đã đồng bộ" : "Tự động lưu khi chỉnh sửa"}</span>
    </p>
    {issue ? <p className="study-note">{issue.message} Nội dung trên máy vẫn được giữ.{conflict ? " Tải bản máy chủ cần xác nhận bỏ bản đang nhập." : issue.kind === "validation" ? " Chỉnh nội dung để tiếp tục tự đồng bộ." : " Thử lại khi kết nối ổn định."}</p> : null}
    {issue?.kind === "error" && !conflict ? <Button type="button" variant="outline" disabled={busy} onClick={onRetry}>Thử đồng bộ lại</Button> : null}
  </div>;
}
