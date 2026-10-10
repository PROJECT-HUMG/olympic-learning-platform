import { DocumentThumbnail } from "./document-thumbnail";
import { EmptyState } from "@/components/ui/empty-state";
import type { DocumentResponse } from "@/features/documents/types/documents.types";
import { ManagementListRow, ManagementRowActions } from "@/components/ui/management-list-row";
import { FileText, Calendar, Eye, Download } from "lucide-react";
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
          <ManagementListRow key={doc.id} actions={<ManagementRowActions onEdit={() => onEditClick(doc)} onDelete={() => onDeleteClick(doc)} />}>
            <div className="flex items-start gap-4 flex-1 min-w-0 w-full sm:w-auto">
              <DocumentThumbnail src={doc.thumbnailUrl} compact />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <Link 
                  to={`${ROUTES.DOCUMENTS}/${doc.slug}`} 
                  target="_blank" rel="noreferrer"
                  className="font-medium text-[15px] text-foreground hover:text-primary transition-colors break-words min-h-11 flex items-center"
                >
                  <span className="min-w-0 break-words">{doc.title}</span>
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

          </ManagementListRow>
        );
      })}
    </div>
  );
}
