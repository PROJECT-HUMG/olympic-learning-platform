import { getListReturnPath } from "@/lib/list-navigation";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  useDocumentBySlug,
  useIncrementViewCount,
} from "@/features/documents/hooks/use-documents";
import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { UserIdentity } from "@/features/user/components/user-hover-card";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useDocumentDownloadModal } from "@/features/documents/hooks/use-document-download-modal";
import { DocumentDownloadModal } from "@/features/documents/components/document-download-modal";
import { DocumentForm } from "@/features/documents/components/document-form";
import { useUpdateDocument } from "@/features/documents/hooks/use-documents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import "@/features/documents/components/document-reader.css";
export default function DocumentDetailPage() {
  const location = useLocation();
  const backPath = getListReturnPath(location.state?.from, "/documents");
  const { slug } = useParams<{ slug: string }>();
  const {
    data: document,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDocumentBySlug(slug || "");
  const documentUrl = document?.downloadUrl;
  const { data: currentUser } = useCurrentUser();

  const incrementViewCount = useIncrementViewCount();
  const { selectedDocument, openDownloadModal, closeDownloadModal } =
    useDocumentDownloadModal();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const updateDocument = useUpdateDocument();

  const handleUpdate = (data: any) => {
    updateDocument.mutate(
      { id: document?.id as string, data },
      {
        onSuccess: () => {
          toast.success("Cập nhật tài liệu thành công");
          setIsEditModalOpen(false);
        },
        onError: () => toast.error("Có lỗi xảy ra khi cập nhật tài liệu"),
      },
    );
  };

  // Increment view count on mount
  useEffect(() => {
    if (slug) {
      incrementViewCount.mutate(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  if (isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-destructive">
        <h2 className="text-2xl font-semibold mb-2">
          {(error as { status?: number })?.status === 404
            ? "Không tìm thấy tài liệu"
            : "Không thể tải tài liệu"}
        </h2>
        <p className="opacity-80 mb-6">
          {(error as { status?: number })?.status === 404
            ? "Tài liệu này không tồn tại hoặc đã bị xóa."
            : "Hãy kiểm tra kết nối và thử lại."}
        </p>
        <Button
          variant="outline"
          className="mr-2"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link to={backPath}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !document) {
    return (
      <div className="page-shell page-shell--public" role="status" aria-label="Đang tải tài liệu" aria-busy="true">
        <div>
          <Skeleton className="w-32 h-6" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="content-card p-4 sm:p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex gap-2 flex-wrap mb-4">
                  <Skeleton className="w-20 h-6 rounded-full" />
                  <Skeleton className="w-24 h-6 rounded-full" />
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>

                <div className="space-y-3 mb-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>

                <div className="flex items-center flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="w-24 h-3" />
                      <Skeleton className="w-16 h-2" />
                    </div>
                  </div>
                  <Skeleton className="w-1 h-1 rounded-full" />
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-1 h-1 rounded-full" />
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-1 h-1 rounded-full" />
                  <Skeleton className="w-24 h-4" />
                </div>
              </div>

              <div className="flex flex-col items-stretch lg:items-end gap-3 shrink-0">
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
                  <Skeleton className="h-12 w-[120px] rounded-md" />
                  <Skeleton className="h-12 w-[200px] rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="content-card overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/20">
              <Skeleton className="w-40 h-6" />
            </div>
            <div
              className="document-reader__viewport bg-muted/10 relative"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-48 h-5" />
              </div>
            </div>
          </div>

          <div className="content-card p-4 sm:p-6 md:p-8 space-y-4">
            <Skeleton className="w-32 h-6 mb-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-shell--public">
      <div>
        <Button
          asChild
          variant="link"
          className="px-0 text-muted-foreground hover:text-primary transition-colors"
        >
          <Link to={backPath}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Header Metadata */}
        <div className="content-card p-4 sm:p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 flex-wrap mb-3 sm:mb-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold">
                  {document.category.name}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-border/60 text-muted-foreground bg-transparent"
                >
                  {document.subject.name}
                </Badge>
                {document.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="bg-muted text-muted-foreground font-normal"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>

              <h1 className="page-heading__title mb-6">
                {document.title}
              </h1>

              <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
                <UserIdentity user={document.owner} />
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span>
                    {format(new Date(document.createdAt), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5" title="Lượt xem">
                  <Eye className="w-4 h-4 text-primary/60" />
                  <span>{document.viewCount} lượt xem</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5" title="Lượt tải">
                  <Download className="w-4 h-4 text-primary/60" />
                  <span>{document.downloadCount} lượt tải</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-stretch lg:items-end gap-3 shrink-0">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
                {(currentUser?.id === document.owner.id ||
                  currentUser?.role === "ADMIN") && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full min-h-11 sm:w-auto sm:flex-1 lg:flex-none shadow-sm transition-colors"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
                <Button
                  size="lg"
                  className="w-full min-h-11 sm:w-auto sm:flex-1 lg:flex-none min-w-0 shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => openDownloadModal(document)}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Tải xuống ngay
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Viewer */}
        <div className="content-card overflow-hidden flex flex-col">
          <div className="px-4 sm:px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 text-foreground/80">
              <FileText className="size-5 text-primary/60" />
              Nội dung tài liệu
            </h3>
          </div>
          <div
            className="document-reader__viewport bg-muted/10 relative"
          >
            {documentUrl ? (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
                className="w-full h-full border-0"
                title={document.title}
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                <FileText className="size-12 mb-3 opacity-20" />
                <p>Không thể hiển thị bản xem trước cho tài liệu này.</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {document.description && (
          <div className="content-card p-4 sm:p-6 md:p-8">
            <h3 className="font-semibold mb-4 text-foreground/80">
              Mô tả tài liệu
            </h3>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {document.description}
            </div>
          </div>
        )}
      </div>

      <DocumentDownloadModal
        document={selectedDocument}
        onClose={closeDownloadModal}
      />

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[95vw] max-w-5xl sm:max-w-5xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài liệu</DialogTitle>
            <DialogDescription>
              Đang chỉnh sửa tài liệu: {document?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {document && (
              <DocumentForm
                initialData={document}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditModalOpen(false)}
                isLoading={updateDocument.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
