import { OptionQueryFeedback } from "@/components/ui/option-query-feedback";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { useSearchParams } from "react-router-dom";
import { getPageNumber, replaceListParam } from "@/lib/list-navigation";
import { NativeSelect } from "@/components/ui/native-select";
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
import { CreationDialog, type CreationState } from "@/components/ui/creation-dialog";
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
  const [params, setParams] = useSearchParams();
  const keyword = params.get("keyword") ?? "";
  const debouncedKeyword = useDebounce(keyword, 500);
  const currentPage = getPageNumber(params.get("page"));
  const setCurrentPage = (page: number) => setParams(previous => replaceListParam(previous, "page", String(page)), { replace: true });
  const { data: user } = useCurrentUser();
  const metadata = useDocumentMetadata();

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
    subjectId: params.get("subjectId") || undefined,
    categoryId: params.get("categoryId") || undefined,
    page: apiPageOffset,
    size: 10,
    ownerId: user?.role === "LECTURER" ? user.id : undefined,
  });

  const totalPages = pageData?.totalPages;

  // Clamp current page if it exceeds total pages when deleting/filtering
  useEffect(() => {
    if (totalPages && totalPages > 0) {
      if (currentPage > totalPages) {
        setParams(previous => replaceListParam(previous, "page", String(totalPages)), { replace: true });
      }
    }
  }, [totalPages, currentPage, setParams]);

  const deleteDocument = useDeleteDocument();
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentResponse | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocumentResponse | null>(
    null,
  );
  const [formState, setFormState] = useState<CreationState>({
    dirty: false,
    busy: false,
  });

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
            setFormState({ dirty: false, busy: false });
          },
          onError: () => toast.error("Có lỗi xảy ra khi cập nhật tài liệu"),
        },
      );
    } else {
      createDocument.mutate(data, {
        onSuccess: () => {
          toast.success("Tạo tài liệu mới thành công");
          setIsCreateModalOpen(false);
          setFormState({ dirty: false, busy: false });
        },
        onError: () => toast.error("Có lỗi xảy ra khi tạo tài liệu"),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete && !deleteDocument.isPending) {
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
        actions={<Button onClick={() => { setFormState({ dirty: false, busy: false }); setIsCreateModalOpen(true); }}><Plus aria-hidden="true" className="size-4" />Thêm tài liệu mới</Button>} />

      {/* Toolbar */}
      <div className="page-toolbar filter-panel !items-end">
        <div className="relative max-w-sm w-full">
          <SearchInput aria-label="Tìm kiếm tài liệu"
            placeholder="Tìm kiếm tài liệu..."
            className="pl-9 h-11"
            value={keyword}
            onChange={(e) => {
              setParams(previous => replaceListParam(previous, "keyword", e.target.value), { replace: true }); // Reset page on search
            }}
          />
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex-[1_1_20rem]">
          <label className="flex min-w-0 flex-col gap-1 text-sm">Môn học
            <NativeSelect disabled={metadata.isPending || metadata.isError} value={params.get("subjectId") ?? ""} onChange={event => setParams(previous => replaceListParam(previous, "subjectId", event.target.value))}>
              <option value="">Tất cả</option>{params.get("subjectId") && !metadata.data?.subjects.some(item => item.id === params.get("subjectId")) && <option value={params.get("subjectId")!}>Môn đã lọc (chưa tải tên)</option>}{metadata.data?.subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </NativeSelect>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm">Loại tài liệu
            <NativeSelect disabled={metadata.isPending || metadata.isError} value={params.get("categoryId") ?? ""} onChange={event => setParams(previous => replaceListParam(previous, "categoryId", event.target.value))}>
              <option value="">Tất cả</option>{params.get("categoryId") && !metadata.data?.categories.some(item => item.id === params.get("categoryId")) && <option value={params.get("categoryId")!}>Loại đã lọc (chưa tải tên)</option>}{metadata.data?.categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </NativeSelect>
          </label>
        </div>
        {(keyword || params.get("subjectId") || params.get("categoryId")) && <Button type="button" variant="ghost" onClick={() => setParams(previous => {
          const next = new URLSearchParams(previous); for (const key of ["keyword", "subjectId", "categoryId", "page"]) next.delete(key); return next;
        })}>Xóa bộ lọc</Button>}

      </div>

      <OptionQueryFeedback label="môn học và loại tài liệu" pending={metadata.isPending} error={metadata.isError} retrying={metadata.isFetching} onRetry={() => void metadata.refetch()} />

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
          onDeleteClick={item => { deleteDocument.reset(); setDocumentToDelete(item); }}
          onEditClick={(doc) => {
            setFormState({ dirty: false, busy: false });
            setDocumentToEdit(doc);
          }}
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
        onOpenChange={(open) => { if (!open && !deleteDocument.isPending) setDocumentToDelete(null); }}
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
          {deleteDocument.isError && <p role="alert" className="text-sm text-destructive">Không thể xóa. Bản ghi được giữ lại; hãy thử lại hoặc hủy.</p>}
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
      <CreationDialog
        open={isCreateModalOpen || !!documentToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setDocumentToEdit(null);
            setFormState({ dirty: false, busy: false });
          }
        }}
        title={documentToEdit ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
        description={
          documentToEdit
            ? `Đang chỉnh sửa tài liệu: ${documentToEdit.title}`
            : "Điền thông tin bên dưới để thêm tài liệu mới vào hệ thống."
        }
        dirty={formState.dirty}
        busy={formState.busy || createDocument.isPending || updateDocument.isPending}
      >
        {(close) => (
          <DocumentForm
            key={documentToEdit?.id || "new"}
            initialData={documentToEdit || undefined}
            onSubmit={handleFormSubmit}
            onCancel={close}
            onStateChange={setFormState}
            isLoading={createDocument.isPending || updateDocument.isPending}
          />
        )}
      </CreationDialog>
    </div>
  );
}
