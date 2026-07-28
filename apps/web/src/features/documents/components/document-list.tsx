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
}

export function DocumentList({ documents, isLoading, isError, isEmpty, viewMode = "grid" }: DocumentListProps) {
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
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 sm:gap-6 p-4 rounded-xl border border-border/50 bg-card/40">
              <Skeleton className="w-16 h-16 rounded-lg shrink-0 hidden sm:block" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col h-[320px] rounded-xl border bg-card overflow-hidden">
            <Skeleton className="h-[160px] w-full rounded-none" />
            <div className="p-4 flex-1 flex flex-col gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="mt-auto flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
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
      <div className="flex flex-col gap-3">
        {documents.map((doc) => (
          <DocumentListItem key={doc.id} document={doc} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
