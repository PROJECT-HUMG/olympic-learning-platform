import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/ui/app-pagination";
import { useSearchDocuments, useDeleteDocument } from "@/features/documents/hooks/use-documents";
import { DocumentDataTable } from "@/features/documents/components/admin/document-data-table";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DocumentResponse } from "@/features/documents/types/documents.types";

export default function AdminDocumentsPage() {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);
  const [currentPage, setCurrentPage] = useState(1);

  // Convert 1-based visible page to 0-based offset for the API in exactly one place
  const apiPageOffset = currentPage - 1;

  const { data: pageData } = useSearchDocuments({
    keyword: debouncedKeyword,
    page: apiPageOffset,
    size: 10,
  });

  // Clamp current page if it exceeds total pages when deleting/filtering
  useEffect(() => {
    if (pageData && pageData.totalPages > 0) {
      if (currentPage > pageData.totalPages) {
        setCurrentPage(pageData.totalPages);
      }
    }
  }, [pageData?.totalPages, currentPage]);

  const deleteDocument = useDeleteDocument();
  const [documentToDelete, setDocumentToDelete] = useState<DocumentResponse | null>(null);

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDocument.mutate(documentToDelete.id, {
        onSuccess: () => {
          setDocumentToDelete(null);
        },
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý tài liệu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý, thêm mới và cập nhật các tài liệu trên hệ thống.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link to="/admin/documents/new">
            <Plus className="size-4" />
            Thêm tài liệu mới
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            className="pl-9 h-10"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
          />
        </div>
      </div>

      {/* Table */}
      <DocumentDataTable
        data={pageData?.content || []}
        onDeleteClick={setDocumentToDelete}
      />

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Hiển thị <span className="font-medium">{(apiPageOffset * pageData.size) + 1}</span> đến{" "}
            <span className="font-medium">
              {Math.min((apiPageOffset + 1) * pageData.size, pageData.totalElements)}
            </span>{" "}
            trong tổng số <span className="font-medium">{pageData.totalElements}</span> tài liệu
          </p>
          <div className="overflow-x-auto max-w-full">
            <AppPagination
              currentPage={currentPage}
              totalPages={pageData.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài liệu{" "}
              <span className="font-medium text-foreground">"{documentToDelete?.title}"</span> không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocument.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleteDocument.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocument.isPending ? "Đang xóa..." : "Xóa tài liệu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
