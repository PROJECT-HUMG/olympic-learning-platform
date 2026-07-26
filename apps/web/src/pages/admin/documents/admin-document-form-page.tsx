import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentForm } from "@/features/documents/components/admin/document-form";
import {
  useDocumentBySlug,
  useCreateDocument,
  useUpdateDocument,
} from "@/features/documents/hooks/use-documents";
import type { CreateDocumentRequest, UpdateDocumentRequest } from "@/features/documents/types/documents.types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDocumentFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEditMode = !!slug;

  const { data: document, isLoading } = useDocumentBySlug(slug || "");
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  const handleSubmit = (data: CreateDocumentRequest | UpdateDocumentRequest) => {
    if (isEditMode && document) {
      updateDocument.mutate(
        { id: document.id, data: data as UpdateDocumentRequest },
        {
          onSuccess: () => {
            toast.success("Cập nhật tài liệu thành công");
            navigate("/admin/documents");
          },
          onError: () => {
            toast.error("Có lỗi xảy ra khi cập nhật tài liệu");
          },
        }
      );
    } else {
      createDocument.mutate(data as CreateDocumentRequest, {
        onSuccess: () => {
          toast.success("Tạo tài liệu mới thành công");
          navigate("/admin/documents");
        },
        onError: () => {
          toast.error("Có lỗi xảy ra khi tạo tài liệu");
        },
      });
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit text-muted-foreground -ml-3">
          <Link to="/admin/documents">
            <ChevronLeft className="size-4 mr-1" /> Quay lại danh sách
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Chỉnh sửa tài liệu" : "Tạo tài liệu mới"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditMode
              ? `Đang chỉnh sửa tài liệu: ${document?.title}`
              : "Điền thông tin bên dưới để thêm tài liệu mới vào hệ thống."}
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 sm:p-8">
        <DocumentForm
          initialData={document}
          onSubmit={handleSubmit}
          isLoading={createDocument.isPending || updateDocument.isPending}
        />
      </div>
    </div>
  );
}
