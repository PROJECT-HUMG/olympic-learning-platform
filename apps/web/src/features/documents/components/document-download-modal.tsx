import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api-error";
import { useDownloadDocument } from "../hooks/use-documents";
import type { DocumentResponse } from "../types/documents.types";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";

function formatBytes(bytes?: number) {
  if (bytes == null || bytes < 0) return "Không xác định";
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${Number((bytes / 1024 ** index).toFixed(2))} ${sizes[index]}`;
}

interface DocumentDownloadModalProps {
  document: DocumentResponse | null;
  onClose: () => void;
}

export function DocumentDownloadModal({ document, onClose }: DocumentDownloadModalProps) {
  return document ? <DownloadDialog key={document.id} document={document} onClose={onClose} /> : null;
}

function DownloadDialog({ document, onClose }: { document: DocumentResponse; onClose: () => void }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opener = useRef(window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null);
  const { mutateAsync: downloadDoc } = useDownloadDocument();

  useEffect(() => () => {
    request.current?.abort();
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }, []);

  const close = () => {
    request.current?.abort();
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    onClose();
  };

  const handleDownload = async () => {
    if (request.current || status === "success") return;
    const controller = new AbortController();
    request.current = controller;
    setStatus("downloading");
    setProgress(null);
    setError("");
    try {
      await downloadDoc({
        slug: document.slug,
        signal: controller.signal,
        onDownloadProgress: ({ loaded, total }) => {
          if (!controller.signal.aborted && total && total > 0) {
            setProgress(Math.min(100, Math.round(loaded * 100 / total)));
          }
        },
      });
      if (controller.signal.aborted) return;
      setProgress(100);
      setStatus("success");
      closeTimer.current = setTimeout(close, 2000);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const timedOut = axios.isAxiosError(failure) && ["ECONNABORTED", "ETIMEDOUT"].includes(failure.code ?? "");
      setError(timedOut ? "Tải xuống quá lâu. Kiểm tra kết nối rồi thử tải lại."
        : failure instanceof ApiError ? failure.detail : "Chưa tải được tài liệu. Kiểm tra kết nối rồi thử tải lại.");
      setStatus("error");
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  const isDownloading = status === "downloading";

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (opener.current?.isConnected) opener.current.focus();
      }}>
        <DialogHeader>
          <DialogTitle>Tải xuống tài liệu</DialogTitle>
          <DialogDescription>
            Bạn có thể hủy trong lúc tải. File tải quá lâu sẽ dừng để bạn thử lại.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 px-1 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100/50">
            <FileText className="h-6 w-6 text-red-500" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium" title={document.title}>{document.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground">Kích thước: {formatBytes(document.fileSize)}</p>
          </div>
        </div>

        {status !== "idle" && (
          <div className="space-y-2 pb-2" role={status === "error" ? "alert" : "status"}>
            <div className="flex items-center justify-between gap-2 text-xs font-medium">
              {isDownloading && <span className="text-primary">Đang tải xuống…</span>}
              {status === "success" && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Đã tải xong</span>}
              {status === "error" && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />Lỗi khi tải file</span>}
              {isDownloading && progress !== null && <span>{progress}%</span>}
            </div>
            <Progress value={progress ?? undefined} aria-label="Tiến độ tải tài liệu" className={`h-2 ${status === "success" ? "[&>div]:bg-green-600" : status === "error" ? "[&>div]:bg-destructive" : ""}`} />
            {status === "error" && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter className="mt-2 gap-2 sm:justify-end sm:gap-0">
          <Button type="button" variant="outline" onClick={close}>{isDownloading ? "Hủy tải" : status === "success" ? "Đóng" : "Hủy bỏ"}</Button>
          <Button type="button" onClick={() => void handleDownload()} disabled={isDownloading || status === "success"}>
            {isDownloading ? "Đang xử lý…" : status === "success" ? "Hoàn tất" : status === "error" ? "Thử tải lại" : "Xác nhận tải"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
