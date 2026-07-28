import { PublicPageHeader } from "@/components/ui/public-page-header";
import { DocumentFilters } from "@/features/documents/components/document-filters";
import { DocumentList } from "@/features/documents/components/document-list";
import { useSearchDocuments } from "@/features/documents/hooks/use-documents";
import { useSearchParams } from "react-router-dom";
import type { DocumentSearchRequest } from "@/features/documents/types/documents.types";
import { AppPagination } from "@/components/ui/app-pagination";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-10 backdrop-blur-md shadow-sm min-h-[60vh] flex flex-col gap-6">
        <PublicPageHeader title="Kho Tài Liệu" description="Tài liệu, giáo trình và đề thi các năm trước." />
        
        <DocumentFilters />
        
        <div className="flex justify-between items-center mt-4 mb-2">
          <p className="text-sm text-muted-foreground">
            {data ? `Tìm thấy ${data.totalElements} tài liệu` : "Đang tìm kiếm..."}
          </p>
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              className={`h-8 px-3 ${viewMode === "grid" ? "shadow-sm" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Dạng Thẻ
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="sm" 
              className={`h-8 px-3 ${viewMode === "list" ? "shadow-sm" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-2" /> Danh sách
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
          />
          
          {data && data.totalPages > 1 && (
          <div className="mt-8 flex justify-center pb-8">
            <AppPagination
              currentPage={currentPage}
              totalPages={data.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
