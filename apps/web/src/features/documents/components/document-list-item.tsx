import { Link } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { UserHoverCard } from "@/features/user/components/user-hover-card";
import type { DocumentResponse } from "@/features/documents/types/documents.types";

interface DocumentListItemProps {
  document: DocumentResponse;
  onDownload?: (document: DocumentResponse) => void;
}

export function DocumentListItem({ document, onDownload }: DocumentListItemProps) {
  const formattedDate = formatDistanceToNow(new Date(document.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const isPdf = true;

  return (
    <Link 
      to={`/documents/${document.slug}`}
      className="group flex items-center justify-between py-3 px-4 border-b border-border/40 hover:bg-accent/40 transition-colors bg-background"
    >
      {/* File Name & Icon */}
      <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
        <div className="shrink-0">
          <FileText className={`w-5 h-5 ${isPdf ? 'text-red-500' : 'text-primary/60'}`} />
        </div>
        <span className="text-[14px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {document.title}
        </span>
      </div>

      {/* Owner */}
      <div className="hidden sm:block w-[180px] shrink-0 text-[13px] text-muted-foreground truncate pr-4">
        <UserHoverCard user={document.owner}>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors" onClick={(e) => e.preventDefault()}>
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
            <span className="hover:underline truncate max-w-[130px]">
              {document.owner.fullName || document.owner.username}
            </span>
          </div>
        </UserHoverCard>
      </div>

      {/* Date */}
      <div className="hidden md:block w-[150px] shrink-0 text-[13px] text-muted-foreground truncate">
        {formattedDate}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center justify-end w-[40px]">
        <button 
          className="p-1.5 rounded-full text-muted-foreground hover:bg-accent/80 hover:text-primary opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
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
    </Link>
  );
}
