import { getPageNumber } from "@/lib/list-navigation";
import { DocumentFilters } from "@/features/documents/components/document-filters";
import { DocumentList } from "@/features/documents/components/document-list";
import { useSearchDocuments } from "@/features/documents/hooks/use-documents";
import { useSearchParams } from "react-router-dom";
import type { DocumentSearchRequest } from "@/features/documents/types/documents.types";
import { AppPagination } from "@/components/ui/app-pagination";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { useDocumentDownloadModal } from "@/features/documents/hooks/use-document-download-modal";
import { DocumentDownloadModal } from "@/features/documents/components/document-download-modal";
import { PublicPageHeader } from "@/components/ui/public-page-header";

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const setViewMode = (view: "grid" | "list") =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (view === "list") next.set("view", view);
        else next.delete("view");
        return next;
      },
      { replace: true },
    );
  const { selectedDocument, openDownloadModal, closeDownloadModal } =
    useDocumentDownloadModal();

  const currentPage = getPageNumber(searchParams.get("page"));
  const keyword = searchParams.get("keyword") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const tagId = searchParams.get("tagId") || undefined;

  const apiPageOffset = Math.max(0, currentPage - 1);

  const filters: DocumentSearchRequest = {
    keyword,
    categoryId,
    subjectId,
    tagIds: tagId ? [tagId] : undefined,
    page: apiPageOffset,
    size: 12, // More items for public grid
  };

  const { data, isLoading, isError, refetch, isFetching } =
    useSearchDocuments(filters);

  const totalPages = data?.totalPages;

  // Clamp current page if total pages shrink
  useEffect(() => {
    if (totalPages && totalPages > 0) {
      if (currentPage > totalPages) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("page", totalPages.toString());
            return next;
          },
          { replace: true },
        );
      }
    }
  }, [totalPages, currentPage, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", newPage.toString());
      return next;
    });
  };

  return (
    <div className="page-shell page-shell--public document-library">
      <PublicPageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Kho tài liệu" }]}
        title="Kho tài liệu"
        description="Tìm theo tên, môn học và loại tài liệu."
      />

      <div className="document-browser">
        <aside className="document-browser__filters" aria-label="Tìm và lọc tài liệu"><h2>Tìm tài liệu</h2><DocumentFilters /></aside>
        <section className="document-browser__results" aria-labelledby="document-results-title">
      <p className="list-search-status" role="status">{isFetching ? "Đang cập nhật tài liệu…" : ""}</p>

      <div className="document-browser__heading">
        <h2 id="document-results-title" className="text-sm font-medium text-muted-foreground">
          {isError ? "Chưa tải được tài liệu" : data ? `${data.totalElements} tài liệu` : "Đang tìm kiếm…"}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className={`h-11 w-11 rounded-md ${viewMode === "list" ? "bg-accent/80 text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
            onClick={() => setViewMode("list")}
            aria-label="Xem dạng danh sách"
            aria-pressed={viewMode === "list"}
          >
            <ListIcon aria-hidden="true" className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className={`h-11 w-11 rounded-md ${viewMode === "grid" ? "bg-accent/80 text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
            onClick={() => setViewMode("grid")}
            aria-label="Xem dạng lưới"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid aria-hidden="true" className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <DocumentList
          documents={data?.content}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          retrying={isFetching}
          isEmpty={!data?.content || data.content.length === 0}
          viewMode={viewMode}
          onDownload={openDownloadModal}
        />

        {data && data.totalPages > 1 && (
          <div className="document-browser__pagination">
            <AppPagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
        </section>
      </div>
      <DocumentDownloadModal
        document={selectedDocument}
        onClose={closeDownloadModal}
      />
    </div>
  );
}
