import { useParams, Link } from "react-router-dom";
import { useDocumentBySlug, useIncrementViewCount, useDownloadDocument } from "@/features/documents/hooks/use-documents";
import { useEffect, useState } from "react";
import { FileText, Download, Eye, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function DocumentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: document, isLoading, isError } = useDocumentBySlug(slug || "");
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
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-destructive">
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="w-24 h-8 mb-6" />
        <Skeleton className="w-full h-[400px] rounded-2xl mb-8" />
        <Skeleton className="w-3/4 h-12 mb-4" />
        <Skeleton className="w-full h-24 mb-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
      <div>
        <Button asChild variant="link" className="px-0 text-muted-foreground mb-4">
          <Link to="/documents">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm">
        {/* Cover / Thumbnail */}
        <div className="w-full h-[200px] md:h-[300px] bg-muted relative flex items-center justify-center overflow-hidden">
          {document.thumbnailUrl ? (
            <img 
              src={document.thumbnailUrl} 
              alt={document.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText className="w-24 h-24 text-muted-foreground/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 -mt-10 relative z-10">
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge variant="secondary">{document.category.name}</Badge>
            <Badge variant="outline" className="bg-background">{document.subject.name}</Badge>
            {document.tags.map(tag => (
              <Badge key={tag.id} variant="outline" className="bg-background text-muted-foreground">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-4">{document.title}</h1>
          
          <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-y border-border/50 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                  {document.owner.avatarUrl ? (
                    <img src={document.owner.avatarUrl} alt={document.owner.fullName || "User"} />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                      {(document.owner.fullName || "U")[0]}
                    </div>
                  )}
                </div>
                <span className="font-medium text-foreground">{document.owner.fullName || document.owner.username}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(document.createdAt), "dd/MM/yyyy", { locale: vi })}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" title="Lượt xem">
                <Eye className="w-4 h-4" />
                <span>{document.viewCount} lượt xem</span>
              </div>
              <div className="flex items-center gap-1.5" title="Lượt tải">
                <Download className="w-4 h-4" />
                <span>{document.downloadCount} lượt tải</span>
              </div>
            </div>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none mb-10 text-muted-foreground whitespace-pre-wrap">
            {document.description}
          </div>

          <div className="flex flex-col items-center md:items-start gap-4">
            <Button 
              size="lg" 
              className="w-full md:w-auto min-w-[200px]"
              onClick={handleDownload}
              disabled={downloadDocument.isPending}
            >
              <Download className="w-5 h-5 mr-2" />
              {downloadDocument.isPending ? "Đang xử lý..." : "Tải xuống ngay"}
            </Button>

            {downloadDocument.isPending && (
              <div className="w-full max-w-[200px] flex items-center gap-3">
                <Progress value={downloadProgress} className="h-2" />
                <span className="text-xs font-medium min-w-[3ch]">{downloadProgress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
