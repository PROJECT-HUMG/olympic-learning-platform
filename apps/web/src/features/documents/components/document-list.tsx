import { Button } from "@/components/ui/button";
import { DocumentCard } from "./document-card";
import { DocumentListItem } from "./document-list-item";
import { DocumentCardSkeleton } from "./document-card-skeleton";
import { DocumentListItemSkeleton } from "./document-list-item-skeleton";
import { FileQuestion } from "lucide-react";
import type { DocumentResponse } from "@/features/documents/types/documents.types";

interface DocumentListProps {
  onRetry?: () => void;
  retrying?: boolean;
  documents?: DocumentResponse[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  viewMode?: "grid" | "list";
  onDownload?: (document: DocumentResponse) => void;
}

export function DocumentList({ documents, isLoading, isError, isEmpty, viewMode = "grid", onDownload, onRetry, retrying }: DocumentListProps) {
  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center p-12 text-center text-destructive">
        <FileQuestion aria-hidden="true" className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Đã xảy ra lỗi khi tải dữ liệu.</p>
        <p className="text-sm opacity-80 mt-1">Hãy kiểm tra kết nối và thử lại.</p>
        {onRetry && <Button type="button" variant="outline" className="mt-4" loading={retrying} onClick={onRetry}>Thử lại</Button>}
      </div>
    );
  }

  if (isLoading) {
    if (viewMode === "list") {
      return (
        <div role="status" className="flex flex-col">
          <span className="sr-only">Đang tải tài liệu…</span>
          {/* Header */}
          <div className="flex items-center justify-between py-3 px-4 border-b border-border/60 text-sm font-medium text-muted-foreground">
            <div className="flex-1 pr-4">Tên</div>
            <div className="hidden sm:block w-[180px] pr-4">Chủ sở hữu</div>
            <div className="hidden md:block w-[150px]">Lần sửa đổi gần nhất</div>
            <div className="w-[40px]"></div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <DocumentListItemSkeleton key={i} />
          ))}
        </div>
      );
    }

    return (
      <div role="status" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        <span className="sr-only">Đang tải tài liệu…</span>
        {Array.from({ length: 10 }).map((_, i) => (
          <DocumentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty || !documents || documents.length === 0) {
    return (
      <div role="status" className="flex flex-col items-center justify-center px-4 py-12 text-center text-muted-foreground border border-dashed rounded-xl bg-muted/20">
        <FileQuestion aria-hidden="true" className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-medium text-foreground mb-2">Không tìm thấy tài liệu nào</h3>
        <p>Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại nhé.</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-4 border-b border-border/60 text-sm font-medium text-muted-foreground">
          <div className="flex-1 pr-4">Tên</div>
          <div className="hidden sm:block w-[180px] pr-4">Chủ sở hữu</div>
          <div className="hidden md:block w-[150px]">Lần sửa đổi gần nhất</div>
          <div className="w-[40px]"></div>
        </div>
        {documents.map((doc) => (
          <DocumentListItem key={doc.id} document={doc} onDownload={onDownload} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onDownload={onDownload} />
      ))}
    </div>
  );
}
