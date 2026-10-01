import { Link, useLocation } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { UserHoverCard } from "@/features/user/components/user-hover-card";
import type { DocumentResponse } from "../types/documents.types";

interface DocumentCardProps {
  document: DocumentResponse;
  onDownload?: (document: DocumentResponse) => void;
}

export function DocumentCard({ document, onDownload }: DocumentCardProps) {
  const location = useLocation();
  const formattedDate = formatDistanceToNow(new Date(document.createdAt), {
    addSuffix: true,
    locale: vi,
  });
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      <Link
        to={`/documents/${encodeURIComponent(document.slug)}`}
        state={{ from: location.pathname + location.search }}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <div className="flex h-40 items-center justify-center overflow-hidden border-b border-border/50 bg-muted/60 p-4">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt=""
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <FileText
              aria-hidden="true"
              className="size-16 text-primary/50"
              strokeWidth={1.5}
            />
          )}
        </div>
        <div className="flex-1 space-y-2 p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">
            {document.title}
          </h3>
          {document.description && (
            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
              {document.description}
            </p>
          )}
        </div>
      </Link>
      <div className="flex min-w-0 items-center justify-between gap-2 border-t border-border/40 px-3 py-1">
        <div className="min-w-0 text-xs text-muted-foreground">
          <UserHoverCard user={document.owner}>
            <button
              type="button"
              className="block min-h-11 max-w-full truncate rounded-md px-1 text-left hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`Thông tin ${document.owner.fullName || document.owner.username}`}
            >
              {document.owner.fullName || document.owner.username}
            </button>
          </UserHoverCard>
          <p className="truncate px-1 pb-2">{formattedDate}</p>
        </div>
        {onDownload && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            aria-label={`Tải xuống ${document.title}`}
            onClick={() => onDownload(document)}
          >
            <Download aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </article>
  );
}
