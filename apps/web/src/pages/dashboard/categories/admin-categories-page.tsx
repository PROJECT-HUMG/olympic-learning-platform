import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderTree, Book, Tags, Plus, Loader2 } from "lucide-react";
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
  const { data: metadata, isLoading: isMetadataLoading } = useDocumentMetadata();

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

  const handleDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    if (activeTab === "categories") {
      deleteCategory.mutate(itemToDelete.id, {
        onSuccess: () => { toast.success("Đã xóa phân loại"); setItemToDelete(null); },
        onError: (err: any) => toast.error(err.message || "Lỗi xóa"),
      });
    } else if (activeTab === "subjects") {
      deleteSubject.mutate(itemToDelete.id, {
        onSuccess: () => { toast.success("Đã xóa môn học"); setItemToDelete(null); },
        onError: (err: any) => toast.error(err.message || "Lỗi xóa"),
      });
    } else if (activeTab === "tags") {
      deleteTag.mutate(itemToDelete.id, {
        onSuccess: () => { toast.success("Đã xóa thẻ"); setItemToDelete(null); },
        onError: (err: any) => toast.error(err.message || "Lỗi xóa"),
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Danh mục hệ thống</h2>
          <p className="text-muted-foreground text-sm">
            Quản lý phân loại tài liệu, môn học, và thẻ (tags) của hệ thống.
          </p>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as any)} 
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="scrollbar-hide overflow-x-auto overflow-y-hidden pb-2 sm:pb-0 w-full sm:w-auto">
            <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted p-1 text-muted-foreground border">
              <TabsTrigger 
                value="categories" 
                className="gap-2 h-10 px-4 rounded-lg [&[data-state=active]]:bg-primary [&[data-state=active]]:text-primary-foreground [&[data-state=active]]:shadow-md transition-all font-medium"
              >
                <FolderTree className="h-4 w-4" />
                Phân loại tài liệu
              </TabsTrigger>
              <TabsTrigger 
                value="subjects" 
                className="gap-2 h-10 px-4 rounded-lg [&[data-state=active]]:bg-primary [&[data-state=active]]:text-primary-foreground [&[data-state=active]]:shadow-md transition-all font-medium"
              >
                <Book className="h-4 w-4" />
                Môn học
              </TabsTrigger>
              <TabsTrigger 
                value="tags" 
                className="gap-2 h-10 px-4 rounded-lg [&[data-state=active]]:bg-primary [&[data-state=active]]:text-primary-foreground [&[data-state=active]]:shadow-md transition-all font-medium"
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

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{itemToDelete?.name}&quot; không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Hủy</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeletePending}
            >
              {isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
