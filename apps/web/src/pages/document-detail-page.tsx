import { useParams, Link } from "react-router-dom";
import { useDocumentBySlug, useIncrementViewCount, useDocumentUrl } from "@/features/documents/hooks/use-documents";
import { useEffect, useState } from "react";
import { FileText, Download, Eye, Calendar, ArrowLeft, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { UserHoverCard } from "@/features/user/components/user-hover-card";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useDocumentDownloadModal } from "@/features/documents/hooks/use-document-download-modal";
import { DocumentDownloadModal } from "@/features/documents/components/document-download-modal";
import { DocumentForm } from "@/features/documents/components/document-form";
import { useUpdateDocument } from "@/features/documents/hooks/use-documents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
export default function DocumentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: document, isLoading, isError } = useDocumentBySlug(slug || "");
  const { data: documentUrl, isLoading: isUrlLoading } = useDocumentUrl(slug || "");
  const { data: currentUser } = useCurrentUser();
  
  const incrementViewCount = useIncrementViewCount();
  const { selectedDocument, openDownloadModal, closeDownloadModal } = useDocumentDownloadModal();

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
      }
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
        <h2 className="text-2xl font-semibold mb-2">Không tìm thấy tài liệu</h2>
        <p className="opacity-80 mb-6">Tài liệu này không tồn tại hoặc đã bị xóa.</p>
        <Button asChild variant="outline">
          <Link to="/documents">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !document) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div>
          <Skeleton className="w-32 h-6" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border/40 bg-card/60 p-6 md:p-8 backdrop-blur-md shadow-sm">
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
              
              <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
                <div className="flex gap-2 w-full lg:w-auto">
                  <Skeleton className="h-12 w-[120px] rounded-md" />
                  <Skeleton className="h-12 w-[200px] rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden shadow-sm flex flex-col ring-1 ring-black/5">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <Skeleton className="w-40 h-6" />
            </div>
            <div className="w-full bg-muted/10 relative" style={{ height: "75vh", minHeight: "600px" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-48 h-5" />
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-border/40 bg-card/60 p-6 md:p-8 backdrop-blur-md shadow-sm space-y-4">
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">
      <div>
        <Button asChild variant="link" className="px-0 text-muted-foreground hover:text-primary transition-colors">
          <Link to="/documents">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Header Metadata */}
        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 md:p-8 backdrop-blur-md shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 flex-wrap mb-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold">
                  {document.category.name}
                </Badge>
                <Badge variant="outline" className="border-border/60 text-muted-foreground bg-transparent">
                  {document.subject.name}
                </Badge>
                {document.tags.map(tag => (
                  <Badge key={tag.id} variant="secondary" className="bg-muted text-muted-foreground font-normal">
                    {tag.name}
                  </Badge>
                ))}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-6 text-foreground/90">{document.title}</h1>
              
              <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
                <UserHoverCard user={document.owner}>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/60 p-1.5 -ml-1.5 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 border border-border/50">
                      {document.owner.avatarUrl ? (
                        <img src={document.owner.avatarUrl} alt={document.owner.fullName || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs">
                          {(document.owner.fullName || "U")[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground/90 truncate max-w-[150px] leading-none mb-1">
                        {document.owner.fullName || document.owner.username}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-none">
                        {document.owner.role === "ADMIN" ? "Quản trị viên" : document.owner.role === "LECTURER" ? "Giảng viên" : "Sinh viên"}
                      </span>
                    </div>
                  </div>
                </UserHoverCard>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span>{format(new Date(document.createdAt), "dd/MM/yyyy", { locale: vi })}</span>
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
            
            <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
              <div className="flex gap-2 w-full lg:w-auto">
                {(currentUser?.id === document.owner.id || currentUser?.role === "ADMIN") && (
                  <Button 
                    variant="outline"
                    size="lg" 
                    className="flex-1 lg:flex-none shadow-sm transition-all"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
                <Button 
                  size="lg" 
                  className="flex-1 lg:flex-none min-w-[200px] shadow-md hover:shadow-lg transition-all"
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
        <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden shadow-sm flex flex-col ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 text-foreground/80">
              <FileText className="size-5 text-primary/60" /> 
              Nội dung tài liệu
            </h3>
          </div>
          <div className="w-full bg-muted/10 relative" style={{ height: "75vh", minHeight: "600px" }}>
            {isUrlLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary/60" />
                <p className="text-sm font-medium">Đang tải tài liệu...</p>
              </div>
            ) : documentUrl ? (
              <iframe 
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
                className="w-full h-full border-0"
                title={document.title}
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="size-12 mb-3 opacity-20" />
                <p>Không thể hiển thị bản xem trước cho tài liệu này.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Description */}
        {document.description && (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-6 md:p-8 backdrop-blur-md shadow-sm">
            <h3 className="font-semibold mb-4 text-foreground/80">Mô tả tài liệu</h3>
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
