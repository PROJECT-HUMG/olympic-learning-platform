import { InlineRetryFeedback } from "@/components/ui/inline-retry-feedback";
import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderTree, Book, Tags, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from "@/features/system-categories/hooks/use-system-categories";
import { SystemCategoryDataTable } from "@/features/system-categories/components/system-category-data-table";
import { SystemCategoryFormModal } from "@/features/system-categories/components/system-category-form-modal";
import { toast } from "sonner";
import type {
  CategorySummaryResponse,
  SubjectSummaryResponse,
  TagSummaryResponse,
} from "@/features/system-categories/types/system-categories.types";

export default function AdminCategoriesPage() {
  const {
    data: metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
    refetch: refetchMetadata,
    isFetching: isMetadataFetching,
  } = useDocumentMetadata();

  const [activeTab, setActiveTab] = useState<"categories" | "subjects" | "tags">("categories");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  // Categories
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Subjects
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  // Tags
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (values: any) => {
    if (activeTab === "categories") {
      if (editingItem) {
        updateCategory.mutate(
          { id: editingItem.id, data: values },
          {
            onSuccess: () => {
              toast.success("Đã cập nhật phân loại thành công");
              handleCloseModal();
            },
            onError: (err: any) => toast.error(err.message || "Lỗi cập nhật"),
          }
        );
      } else {
        createCategory.mutate(values, {
          onSuccess: () => {
            toast.success("Đã thêm phân loại thành công");
            handleCloseModal();
          },
          onError: (err: any) => toast.error(err.message || "Lỗi thêm mới"),
        });
      }
    } else if (activeTab === "subjects") {
      if (editingItem) {
        updateSubject.mutate(
          { id: editingItem.id, data: values },
          {
            onSuccess: () => {
              toast.success("Đã cập nhật môn học thành công");
              handleCloseModal();
            },
            onError: (err: any) => toast.error(err.message || "Lỗi cập nhật"),
          }
        );
      } else {
        createSubject.mutate(values, {
          onSuccess: () => {
            toast.success("Đã thêm môn học thành công");
            handleCloseModal();
          },
          onError: (err: any) => toast.error(err.message || "Lỗi thêm mới"),
        });
      }
    } else if (activeTab === "tags") {
      if (editingItem) {
        updateTag.mutate(
          { id: editingItem.id, data: values },
          {
            onSuccess: () => {
              toast.success("Đã cập nhật thẻ thành công");
              handleCloseModal();
            },
            onError: (err: any) => toast.error(err.message || "Lỗi cập nhật"),
          }
        );
      } else {
        createTag.mutate(values, {
          onSuccess: () => {
            toast.success("Đã thêm thẻ thành công");
            handleCloseModal();
          },
          onError: (err: any) => toast.error(err.message || "Lỗi thêm mới"),
        });
      }
    }
  };

  const [deleteError, setDeleteError] = useState("");
  const handleDelete = (id: string, name: string) => {
    setDeleteError("");
    setItemToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (!itemToDelete || isDeletePending) return;
    
    if (activeTab === "categories") {
      deleteCategory.mutate(itemToDelete.id, {
        onSuccess: () => { toast.success("Đã xóa phân loại"); setItemToDelete(null); },
        onError: (err: any) => { setDeleteError(err.message || "Không thể xóa. Hãy thử lại hoặc hủy."); toast.error(err.message || "Lỗi xóa"); },
      });
    } else if (activeTab === "subjects") {
      deleteSubject.mutate(itemToDelete.id, {
        onSuccess: () => { toast.success("Đã xóa môn học"); setItemToDelete(null); },
        onError: (err: any) => { setDeleteError(err.message || "Không thể xóa. Hãy thử lại hoặc hủy."); toast.error(err.message || "Lỗi xóa"); },
      });
    } else if (activeTab === "tags") {
      deleteTag.mutate(itemToDelete.id, {
        onSuccess: () => { toast.success("Đã xóa thẻ"); setItemToDelete(null); },
        onError: (err: any) => { setDeleteError(err.message || "Không thể xóa. Hãy thử lại hoặc hủy."); toast.error(err.message || "Lỗi xóa"); },
      });
    }
  };

  const columns = [
    { key: "code", header: "Mã", cell: (item: any) => item.code },
    { key: "name", header: "Tên", cell: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: "description", header: "Mô tả", cell: (item: any) => item.description || <span className="text-muted-foreground italic">Không có</span> },
  ];

  const tagColumns = [
    { key: "code", header: "Mã", cell: (item: any) => item.code },
    { key: "name", header: "Tên thẻ", cell: (item: any) => <span className="font-medium">{item.name}</span> },
  ];

  const getModalTitle = () => {
    const action = editingItem ? "Sửa" : "Thêm";
    if (activeTab === "categories") return `${action} Phân loại tài liệu`;
    if (activeTab === "subjects") return `${action} Môn học`;
    return `${action} Thẻ (Tag)`;
  };

  const isPending =
    createCategory.isPending || updateCategory.isPending ||
    createSubject.isPending || updateSubject.isPending ||
    createTag.isPending || updateTag.isPending;

  const isDeletePending = deleteCategory.isPending || deleteSubject.isPending || deleteTag.isPending;

  return (
    <div className="page-shell">
      <PageHeader title="Danh mục hệ thống" description="Quản lý phân loại tài liệu, môn học và thẻ." />

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as any)} 
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="scrollbar-hide overflow-x-auto overflow-y-hidden pb-2 sm:pb-0 w-full sm:w-auto">
            <TabsList className="inline-flex h-auto min-h-13 items-stretch justify-start rounded-xl bg-muted p-1 text-muted-foreground border">
              <TabsTrigger 
                value="categories" 
                className="min-h-11 gap-2 border-none px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-colors font-medium"
              >
                <FolderTree className="h-4 w-4" />
                Phân loại tài liệu
              </TabsTrigger>
              <TabsTrigger 
                value="subjects" 
                className="min-h-11 gap-2 border-none px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-colors font-medium"
              >
                <Book className="h-4 w-4" />
                Môn học
              </TabsTrigger>
              <TabsTrigger 
                value="tags" 
                className="min-h-11 gap-2 border-none px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-colors font-medium"
              >
                <Tags className="h-4 w-4" />
                Thẻ phân loại
              </TabsTrigger>
            </TabsList>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === "categories" ? "Thêm phân loại" : activeTab === "subjects" ? "Thêm môn học" : "Thêm thẻ"}
          </Button>
        </div>

        {isMetadataError && !metadata ? (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-border p-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Không thể tải danh mục hệ thống.
            </p>
            <Button
              type="button"
              variant="outline"
              loading={isMetadataFetching}
              onClick={() => void refetchMetadata()}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            {isMetadataError && (
              <InlineRetryFeedback message="Không thể làm mới danh mục hệ thống." actions={<Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isMetadataFetching}
                  onClick={() => void refetchMetadata()}
                >
                  Thử lại
                </Button>} />
            )}

            <TabsContent value="categories" className="m-0">
              <SystemCategoryDataTable
                data={metadata?.categories}
                isLoading={isMetadataLoading}
                columns={columns}
                onEdit={handleOpenModal}
                onDelete={(item: CategorySummaryResponse) => handleDelete(item.id, item.name)}
                deletePending={deleteCategory.isPending}
              />
            </TabsContent>

            <TabsContent value="subjects" className="m-0">
              <SystemCategoryDataTable
                data={metadata?.subjects}
                isLoading={isMetadataLoading}
                columns={columns}
                onEdit={handleOpenModal}
                onDelete={(item: SubjectSummaryResponse) => handleDelete(item.id, item.name)}
                deletePending={deleteSubject.isPending}
              />
            </TabsContent>

            <TabsContent value="tags" className="m-0">
              <SystemCategoryDataTable
                data={metadata?.tags}
                isLoading={isMetadataLoading}
                columns={tagColumns}
                onEdit={handleOpenModal}
                onDelete={(item: TagSummaryResponse) => handleDelete(item.id, item.name)}
                deletePending={deleteTag.isPending}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      <SystemCategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={getModalTitle()}
        initialData={editingItem}
        onSubmit={handleSubmit}
        isPending={isPending}
        hideDescription={activeTab === "tags"}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => { if (!open && !isDeletePending) setItemToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{itemToDelete?.name}&quot; không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Hủy</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              loading={isDeletePending}
            >
              Xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
