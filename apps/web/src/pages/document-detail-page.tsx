import { useParams, Link } from "react-router-dom";
import { useDocumentBySlug, useIncrementViewCount, useDownloadDocument, useDocumentUrl } from "@/features/documents/hooks/use-documents";
import { useEffect, useState } from "react";
import { FileText, Download, Eye, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { UserHoverCard } from "@/features/user/components/user-hover-card";

export default function DocumentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: document, isLoading, isError } = useDocumentBySlug(slug || "");
  const { data: documentUrl, isLoading: isUrlLoading } = useDocumentUrl(slug || "");
  
  const incrementViewCount = useIncrementViewCount();
  const downloadDocument = useDownloadDocument();

  const [downloadProgress, setDownloadProgress] = useState(0);

  // Increment view count on mount
  useEffect(() => {
    if (slug) {
      incrementViewCount.mutate(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleDownload = () => {
    if (slug) {
      setDownloadProgress(0);
      downloadDocument.mutate({
        slug,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
          }
        }
      });
    }
  };

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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="w-24 h-8 mb-6" />
        <Skeleton className="w-full h-40 rounded-2xl mb-8" />
        <Skeleton className="w-full h-[600px] rounded-2xl mb-6" />
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
                        {document.owner.role === "ADMIN" ? "Quản trị viên" : document.owner.role === "LECTURER" ? "Giảng viên" : "Học viên"}
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
              <Button 
                size="lg" 
                className="w-full lg:w-auto min-w-[200px] shadow-md hover:shadow-lg transition-all"
                onClick={handleDownload}
                disabled={downloadDocument.isPending}
              >
                <Download className="w-5 h-5 mr-2" />
                {downloadDocument.isPending ? "Đang xử lý..." : "Tải xuống ngay"}
              </Button>

              {downloadDocument.isPending && (
                <div className="w-full flex items-center gap-3">
                  <Progress value={downloadProgress} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground w-8 text-right">{downloadProgress}%</span>
                </div>
              )}
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
    </div>
  );
}
