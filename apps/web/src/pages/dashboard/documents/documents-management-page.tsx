import { PaginationFooter } from "@/components/ui/pagination-footer";
import { RetryFeedback } from "@/components/ui/retry-feedback";
import { SearchInput } from "@/components/ui/search-input";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppPagination } from "@/components/ui/app-pagination";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import {
  useSearchDocuments,
  useDeleteDocument,
  useCreateDocument,
  useUpdateDocument,
} from "@/features/documents/hooks/use-documents";
import { DashboardDocumentList } from "@/features/documents/components/dashboard-document-list";
import { DocumentForm } from "@/features/documents/components/document-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

export default function DocumentsManagementPage() {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: user } = useCurrentUser();

  // Convert 1-based visible page to 0-based offset for the API in exactly one place
  const apiPageOffset = currentPage - 1;

  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useSearchDocuments({
    keyword: debouncedKeyword,
    page: apiPageOffset,
    size: 10,
    ownerId: user?.role === "LECTURER" ? user.id : undefined,
  });

  const totalPages = pageData?.totalPages;

  // Clamp current page if it exceeds total pages when deleting/filtering
  useEffect(() => {
    if (totalPages && totalPages > 0) {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }
  }, [totalPages, currentPage]);

  const deleteDocument = useDeleteDocument();
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentResponse | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocumentResponse | null>(
    null,
  );

  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  const handleFormSubmit = (data: any) => {
    if (documentToEdit) {
      updateDocument.mutate(
        { id: documentToEdit.id, data },
        {
          onSuccess: () => {
            toast.success("Cập nhật tài liệu thành công");
            setDocumentToEdit(null);
          },
          onError: () => toast.error("Có lỗi xảy ra khi cập nhật tài liệu"),
        },
      );
    } else {
      createDocument.mutate(data, {
        onSuccess: () => {
          toast.success("Tạo tài liệu mới thành công");
          setIsCreateModalOpen(false);
        },
        onError: () => toast.error("Có lỗi xảy ra khi tạo tài liệu"),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDocument.mutate(documentToDelete.id, {
        onSuccess: () => {
          setDocumentToDelete(null);
          toast.success("Đã xóa tài liệu");
        },
        onError: () => toast.error("Không thể xóa tài liệu. Hãy thử lại."),
      });
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Quản lý tài liệu" description="Thêm và cập nhật tài liệu trong kho học tập."
        actions={<Button onClick={() => setIsCreateModalOpen(true)}><Plus aria-hidden="true" className="size-4" />Thêm tài liệu mới</Button>} />

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="relative max-w-sm w-full">
          <SearchInput aria-label="Tìm kiếm tài liệu"
            placeholder="Tìm kiếm tài liệu..."
            className="pl-9 h-11"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
        >
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          Đang tải tài liệu…
        </div>
      ) : isError ? (
        <RetryFeedback
          message="Không thể tải danh sách tài liệu."
          actions={
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => void refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : (
        <DashboardDocumentList
          data={pageData?.content || []}
          onDeleteClick={setDocumentToDelete}
          onEditClick={setDocumentToEdit}
        />
      )}

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <PaginationFooter pageOffset={apiPageOffset} size={pageData.size} total={pageData.totalElements} itemLabel="tài liệu">
            <AppPagination
              currentPage={currentPage}
              totalPages={pageData.totalPages}
              onPageChange={setCurrentPage}
            />
        </PaginationFooter>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài liệu{" "}
              <span className="font-medium text-foreground">
                "{documentToDelete?.title}"
              </span>{" "}
              không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocument.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleteDocument.isPending}
              variant="destructive-solid"
            >
              {deleteDocument.isPending ? "Đang xóa..." : "Xóa tài liệu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateModalOpen || !!documentToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setDocumentToEdit(null);
          }
        }}
      >
        <DialogContent className="grid-cols-1 w-[95vw] max-w-5xl sm:max-w-5xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {documentToEdit ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
            </DialogTitle>
            <DialogDescription>
              {documentToEdit
                ? `Đang chỉnh sửa tài liệu: ${documentToEdit.title}`
                : "Điền thông tin bên dưới để thêm tài liệu mới vào hệ thống."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DocumentForm
              key={documentToEdit?.id || "new"}
              initialData={documentToEdit || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsCreateModalOpen(false);
                setDocumentToEdit(null);
              }}
              isLoading={createDocument.isPending || updateDocument.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
