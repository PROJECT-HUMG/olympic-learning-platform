import { EmptyState } from "@/components/ui/empty-state";
import type { DocumentResponse } from "@/features/documents/types/documents.types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText, Calendar, Eye, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { Badge } from "@/components/ui/badge";

interface DashboardDocumentListProps {
  data: DocumentResponse[];
  onDeleteClick: (document: DocumentResponse) => void;
  onEditClick: (document: DocumentResponse) => void;
}

export function DashboardDocumentList({ data, onDeleteClick, onEditClick }: DashboardDocumentListProps) {
  if (data.length === 0) {
    return <EmptyState title="Chưa có tài liệu nào" icon={<FileText />}>Không tìm thấy tài liệu nào phù hợp. Hãy thử thay đổi bộ lọc hoặc thêm tài liệu mới vào hệ thống.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((doc) => {
        const formattedDate = formatDistanceToNow(new Date(doc.createdAt), {
          addSuffix: true,
          locale: vi,
        });

        return (
          <div 
            key={doc.id} 
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-border/50 rounded-xl bg-card hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0 w-full sm:w-auto">
              <div className="shrink-0 pt-1 w-12 h-16 flex items-center justify-center bg-muted/30 rounded border border-border/50 overflow-hidden">
                {doc.thumbnailUrl ? (
                  <img src={doc.thumbnailUrl} alt={doc.title} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-8 h-8 text-red-500" />
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <Link 
                  to={`${ROUTES.DOCUMENTS}/${doc.slug}`} 
                  target="_blank"
                  className="font-medium text-[15px] text-foreground hover:text-primary transition-colors truncate"
                >
                  {doc.title}
                </Link>
                {doc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {doc.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex min-w-0 max-w-full flex-wrap gap-2">
                    {doc.category && (
                      <Badge variant="secondary" className="max-w-full px-1.5 py-0 text-[10px] font-normal min-h-4 break-words">
                        {doc.category.name}
                      </Badge>
                    )}
                    {doc.subject && (
                      <Badge variant="outline" className="max-w-full px-1.5 py-0 text-[10px] font-normal min-h-4 break-words">
                        {doc.subject.name}
                      </Badge>
                    )}
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1" title="Lượt xem">
                      <Eye className="w-3 h-3" />
                      {doc.viewCount}
                    </div>
                    <div className="flex items-center gap-1" title="Lượt tải">
                      <Download className="w-3 h-3" />
                      {doc.downloadCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEditClick(doc)}
                className="min-h-11 text-xs"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Sửa
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDeleteClick(doc)}
                className="min-h-11 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Xóa
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
