import { useState, useEffect } from "react";
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
import { useDownloadDocument } from "../hooks/use-documents";
import type { DocumentResponse } from "../types/documents.types";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";

function formatBytes(bytes?: number, decimals = 2) {
  if (!bytes) return "Không xác định";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

interface DocumentDownloadModalProps {
  document: DocumentResponse | null;
  onClose: () => void;
}

export function DocumentDownloadModal({ document, onClose }: DocumentDownloadModalProps) {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "downloading" | "success" | "error">("idle");
  const { mutate: downloadDoc } = useDownloadDocument();

  // Reset state when a new document is selected or modal is closed
  useEffect(() => {
    if (!document) {
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 300); // Wait for modal exit animation
    } else {
      setStatus("idle");
      setProgress(0);
    }
  }, [document]);

  const handleDownload = () => {
    if (!document) return;
    
    setStatus("downloading");
    setProgress(0);

    downloadDoc(
      {
        slug: document.slug,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      },
      {
        onSuccess: () => {
          setProgress(100);
          setStatus("success");
          // Optionally auto-close after success
          setTimeout(() => {
            onClose();
          }, 2000);
        },
        onError: () => {
          setStatus("error");
        },
      }
    );
  };

  const isDownloading = status === "downloading";

  return (
    <Dialog 
      open={!!document} 
      onOpenChange={(open) => {
        // Prevent closing while downloading
        if (!open && !isDownloading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tải xuống tài liệu</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn tải xuống tài liệu này không?
          </DialogDescription>
        </DialogHeader>

        {document && (
          <div className="flex items-center gap-4 py-4 px-1">
            <div className="w-12 h-12 rounded-lg bg-red-100/50 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate" title={document.title}>
                {document.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-1">
                Kích thước: {formatBytes(document.fileSize)}
              </p>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <div className="space-y-2 pb-2">
            <div className="flex items-center justify-between text-xs font-medium">
              {status === "downloading" && (
                <span className="text-primary">Đang tải xuống...</span>
              )}
              {status === "success" && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã tải xong
                </span>
              )}
              {status === "error" && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Lỗi khi tải file
                </span>
              )}
              {status === "downloading" && <span>{progress}%</span>}
            </div>
            <Progress value={progress} className={`h-2 ${status === "success" ? "[&>div]:bg-green-600" : status === "error" ? "[&>div]:bg-destructive" : ""}`} />
          </div>
        )}

        <DialogFooter className="sm:justify-end gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDownloading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || status === "success"}
          >
            {isDownloading ? "Đang xử lý..." : status === "success" ? "Hoàn tất" : "Xác nhận tải"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
