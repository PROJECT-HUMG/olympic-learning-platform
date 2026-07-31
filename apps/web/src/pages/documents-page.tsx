import { DocumentFilters } from "@/features/documents/components/document-filters";
import { DocumentList } from "@/features/documents/components/document-list";
import { useSearchDocuments } from "@/features/documents/hooks/use-documents";
import { useSearchParams } from "react-router-dom";
import type { DocumentSearchRequest } from "@/features/documents/types/documents.types";
import { AppPagination } from "@/components/ui/app-pagination";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { useDocumentDownloadModal } from "@/features/documents/hooks/use-document-download-modal";
import { DocumentDownloadModal } from "@/features/documents/components/document-download-modal";

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { selectedDocument, openDownloadModal, closeDownloadModal } = useDocumentDownloadModal();
  
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const keyword = searchParams.get("keyword") || undefined;

  const apiPageOffset = Math.max(0, currentPage - 1);

  const filters: DocumentSearchRequest = {
    keyword,
    page: apiPageOffset,
    size: 12, // More items for public grid
  };

  const { data, isLoading, isError } = useSearchDocuments(filters);

  // Clamp current page if total pages shrink
  useEffect(() => {
    if (data && data.totalPages > 0) {
      if (currentPage > data.totalPages) {
        setSearchParams((prev) => {
          prev.set("page", data.totalPages.toString());
          return prev;
        }, { replace: true });
      }
    }
  }, [data?.totalPages, currentPage, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl font-medium text-foreground tracking-tight">Kho Tài Liệu</h1>
        <p className="text-muted-foreground text-sm">Khám phá tài liệu, giáo trình và đề thi các năm trước.</p>
      </div>
      
      <DocumentFilters />
      
      <hr className="mb-4 border-t border-border/40" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          {data ? `Được đề xuất • ${data.totalElements} tệp` : "Đang tìm kiếm..."}
        </h2>
        <div className="flex items-center gap-1">
          <Button 
            variant={viewMode === "list" ? "secondary" : "ghost"} 
            size="icon" 
            className={`h-9 w-9 rounded-full ${viewMode === "list" ? "bg-accent/80 text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
            onClick={() => setViewMode("list")}
            aria-label="Xem dạng danh sách"
          >
            <ListIcon className="w-5 h-5" />
          </Button>
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="icon" 
            className={`h-9 w-9 rounded-full ${viewMode === "grid" ? "bg-accent/80 text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
            onClick={() => setViewMode("grid")}
            aria-label="Xem dạng lưới"
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <DocumentList 
          documents={data?.content} 
          isLoading={isLoading} 
          isError={isError} 
          isEmpty={!data?.content || data.content.length === 0} 
          viewMode={viewMode}
          onDownload={openDownloadModal}
        />
        
        {data && data.totalPages > 1 && (
        <div className="mt-10 flex justify-center pb-8">
          <AppPagination
            currentPage={currentPage}
            totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
      <DocumentDownloadModal 
        document={selectedDocument} 
        onClose={closeDownloadModal} 
      />
    </div>
  );
}
