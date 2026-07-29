import { useState, useEffect } from "react";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/ui/app-pagination";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useSearchDocuments, useDeleteDocument, useCreateDocument, useUpdateDocument } from "@/features/documents/hooks/use-documents";
import { DocumentDataTable } from "@/features/documents/components/document-data-table";
import { DocumentGrid } from "@/features/documents/components/document-grid";
import { DocumentForm } from "@/features/documents/components/document-form";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { data: user } = useCurrentUser();

  // Convert 1-based visible page to 0-based offset for the API in exactly one place
  const apiPageOffset = currentPage - 1;

  const { data: pageData } = useSearchDocuments({
    keyword: debouncedKeyword,
    page: apiPageOffset,
    size: 10,
    ownerId: user?.role === "LECTURER" ? user.id : undefined,
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
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocumentResponse | null>(null);

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
        }
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
        <Button className="shrink-0 gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="size-4" />
          Thêm tài liệu mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "table")} className="w-full sm:w-auto">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Dạng lưới</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="size-4" />
              <span className="hidden sm:inline">Dạng bảng</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <DocumentGrid
          data={pageData?.content || []}
          onDeleteClick={setDocumentToDelete}
          onEditClick={setDocumentToEdit}
        />
      ) : (
        <DocumentDataTable
          data={pageData?.content || []}
          onDeleteClick={setDocumentToDelete}
          onEditClick={setDocumentToEdit}
        />
      )}

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
        <DialogContent className="w-[95vw] max-w-5xl sm:max-w-5xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
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
              key={documentToEdit?.id || 'new'}
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
