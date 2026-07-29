import { Link } from "react-router-dom";
import { Eye, Download, FileText, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserHoverCard } from "@/features/user/components/user-hover-card";
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
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group"
    >
      <div className="relative shrink-0 w-full sm:w-32 h-40 sm:h-24 rounded-xl bg-muted items-center justify-center border border-border/50 overflow-hidden">
        {document.thumbnailUrl ? (
          <img 
            src={document.thumbnailUrl} 
            alt={document.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-muted to-muted/80">
            <FileText className="w-8 h-8 text-primary/20 transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Overlay badges on mobile where image is larger */}
        <div className="absolute top-2 left-2 flex sm:hidden gap-1 flex-wrap">
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md shadow-sm border-none font-medium text-[10px] px-1.5 py-0">
            {document.category.name}
          </Badge>
        </div>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="hidden sm:flex items-center gap-2 flex-wrap mb-1">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold text-[10px] px-2 py-0.5">
            {document.category.name}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-medium border-border/60 text-muted-foreground bg-transparent">
            {document.subject.name}
          </Badge>
        </div>
        
        <h3 className="font-bold text-lg sm:text-xl line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {document.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
          {document.description || "Không có mô tả chi tiết cho tài liệu này."}
        </p>
        
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground flex-wrap mt-auto">
          <UserHoverCard user={document.owner}>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/60 p-1 -ml-1 rounded-md transition-colors" onClick={(e) => e.preventDefault()}>
              <div className="w-5 h-5 rounded-full overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                {document.owner.avatarUrl ? (
                  <img src={document.owner.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-primary">
                    {(document.owner.fullName || "U")[0]}
                  </div>
                )}
              </div>
              <span className="font-medium text-foreground/80 truncate max-w-[120px] group-hover:text-primary transition-colors">{document.owner.fullName || document.owner.username}</span>
            </div>
          </UserHoverCard>
          
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5 text-primary/60" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
      
      <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40 gap-3 sm:gap-4 text-sm font-medium">
        <div className="flex items-center gap-4 sm:gap-3 text-muted-foreground">
          <div className="flex items-center gap-1.5 hover:text-primary transition-colors" title="Lượt xem">
            <Eye className="w-4 h-4" />
            <span>{document.viewCount}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-primary transition-colors" title="Lượt tải">
            <Download className="w-4 h-4" />
            <span>{document.downloadCount}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center size-8 sm:size-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 transform group-hover:translate-x-1">
          <ArrowRight className="size-4 sm:size-5" />
        </div>
      </div>
    </Link>
  );
}
