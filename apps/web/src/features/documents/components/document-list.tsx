import { DocumentCard } from "./document-card";
import { DocumentListItem } from "./document-list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { FileQuestion } from "lucide-react";
import type { DocumentResponse } from "@/features/documents/types/documents.types";

interface DocumentListProps {
  documents?: DocumentResponse[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  viewMode?: "grid" | "list";
  onDownload?: (document: DocumentResponse) => void;
}

export function DocumentList({ documents, isLoading, isError, isEmpty, viewMode = "grid", onDownload }: DocumentListProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-destructive">
        <FileQuestion className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Đã xảy ra lỗi khi tải dữ liệu.</p>
        <p className="text-sm opacity-80 mt-1">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (isLoading) {
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-4 border-b border-border/40">
              <div className="flex items-center gap-4 flex-1 pr-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-[200px]" />
              </div>
              <div className="hidden sm:block w-[180px] pr-4">
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <div className="hidden md:block w-[150px]">
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <div className="w-[40px] flex justify-end">
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col h-[280px] rounded-xl border border-border/50 bg-card overflow-hidden">
            <Skeleton className="h-[180px] w-full rounded-none" />
            <div className="p-3 flex gap-3 h-[100px]">
              <Skeleton className="w-5 h-5 rounded mt-0.5" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-auto">
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty || !documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground border border-dashed rounded-xl bg-muted/20">
        <FileQuestion className="w-16 h-16 mb-4 opacity-20" />
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
