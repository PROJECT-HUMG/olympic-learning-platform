import { Link } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { UserHoverCard } from "@/features/user/components/user-hover-card";
import type { DocumentResponse } from "@/features/documents/types/documents.types";

interface DocumentCardProps {
  document: DocumentResponse;
  onDownload?: (document: DocumentResponse) => void;
}

export function DocumentCard({ document, onDownload }: DocumentCardProps) {
  const formattedDate = formatDistanceToNow(new Date(document.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  // Since only PDF is supported currently, we default to red icon for PDF
  const isPdf = true; // In the future, this can be derived from document.extension or category

  return (
    <div className="group flex flex-col h-[280px] overflow-hidden transition-colors duration-200 hover:bg-accent/40 bg-card border border-border/50 rounded-xl">
      <Link to={`/documents/${document.slug}`} className="flex-1 flex flex-col h-full">
        {/* Preview Section - Gray Background */}
        <div className="relative h-[180px] w-full overflow-hidden bg-muted/60 border-b border-border/50 flex items-center justify-center p-4">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt={document.title}
              className="max-w-full max-h-full object-contain shadow-sm border border-border/20 bg-white"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText 
                className={`w-20 h-20 ${isPdf ? 'text-red-500' : 'text-primary/40'}`} 
                strokeWidth={1.5}
              />
            </div>
          )}
        </div>

        {/* Info Section - White Background */}
        <div className="p-3 flex gap-3 h-[100px] bg-card">
          <div className="shrink-0 mt-0.5">
             <FileText className={`w-5 h-5 ${isPdf ? 'text-red-500' : 'text-primary/60'}`} />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="text-[14px] font-medium text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {document.title}
            </h3>
            
            <div className="mt-auto">
              <div className="flex items-center text-[12px] text-muted-foreground gap-1.5 truncate">
                <UserHoverCard user={document.owner}>
                  <div className="flex items-center gap-1.5 hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors cursor-pointer" onClick={(e) => e.preventDefault()}>
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                      {document.owner.avatarUrl ? (
                        <img
                          src={document.owner.avatarUrl}
                          alt={document.owner.fullName || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-primary">
                          {(document.owner.fullName || "U")[0]}
                        </div>
                      )}
                    </div>
                    <span className="hover:underline truncate max-w-[100px] inline-block">
                      {document.owner.fullName || document.owner.username}
                    </span>
                  </div>
                </UserHoverCard>
                <span>•</span>
                <span className="truncate">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-start">
            <button 
              className="p-1.5 -mr-1 rounded-full text-muted-foreground hover:bg-accent/80 hover:text-primary opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                if (onDownload) {
                  onDownload(document);
                }
              }}
              title="Tải xuống"
              aria-label="Tải xuống"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
