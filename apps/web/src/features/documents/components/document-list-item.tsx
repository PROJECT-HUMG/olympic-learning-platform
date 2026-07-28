import { Link } from "react-router-dom";
import { Eye, Download, FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { DocumentResponse } from "@/features/documents/types/documents.types";

interface DocumentListItemProps {
  document: DocumentResponse;
}

export function DocumentListItem({ document }: DocumentListItemProps) {
  const formattedDate = formatDistanceToNow(new Date(document.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <Link 
      to={`/documents/${document.slug}`}
      className="flex items-center gap-4 sm:gap-6 p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm hover:bg-muted/50 hover:shadow-sm hover:border-border transition-all duration-300 group"
    >
      <div className="flex shrink-0 w-16 h-16 sm:w-24 sm:h-16 rounded-lg bg-muted items-center justify-center border border-border/50 overflow-hidden">
        {document.thumbnailUrl ? (
          <img 
            src={document.thumbnailUrl} 
            alt={document.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <FileText className="w-8 h-8 text-muted-foreground/40" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal">
            {document.category.name}
          </Badge>
          <Badge variant="outline" className="text-[10px] sm:text-xs font-normal bg-background/50">
            {document.subject.name}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-base sm:text-lg truncate group-hover:text-primary transition-colors">
          {document.title}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full overflow-hidden bg-muted shrink-0">
              {document.owner.avatarUrl ? (
                <img src={document.owner.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-[8px] font-medium text-primary">
                  {(document.owner.fullName || "U")[0]}
                </div>
              )}
            </div>
            <span className="truncate max-w-[120px]">{document.owner.fullName || document.owner.username}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
      
      <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Lượt xem">
            <Eye className="w-4 h-4" />
            <span className="w-6">{document.viewCount}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Lượt tải">
            <Download className="w-4 h-4" />
            <span className="w-6">{document.downloadCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
