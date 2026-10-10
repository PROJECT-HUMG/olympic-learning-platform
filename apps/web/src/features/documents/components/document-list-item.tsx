import { Link, useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { UserIdentity } from "@/features/user/components/user-hover-card";
import { DocumentThumbnail } from "./document-thumbnail";
import type { DocumentResponse } from "../types/documents.types";

interface DocumentListItemProps {
  document: DocumentResponse;
  onDownload?: (document: DocumentResponse) => void;
}

export function DocumentListItem({
  document,
  onDownload,
}: DocumentListItemProps) {
  const location = useLocation();
  return (
    <article className="flex min-w-0 items-center gap-2 border-b border-border/40 px-2 py-2 hover:bg-accent/40 sm:px-4">
      <Link
        to={`/documents/${encodeURIComponent(document.slug)}`}
        state={{ from: location.pathname + location.search }}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md pr-2 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <DocumentThumbnail src={document.thumbnailUrl} compact />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-3 break-words text-sm font-semibold leading-5">{document.title}</h3>
          <p className="document-list-context mt-1">
            <span className="font-medium text-primary">{document.subject?.name}</span>
            <span>{document.category?.name}</span>
            {document.tags?.slice(0, 2).map(tag => <span key={tag.id}>#{tag.name}</span>)}
          </p>
          <span className="mt-1 inline-flex min-h-11 items-center text-xs font-medium text-primary">Mở tài liệu →</span>
        </div>
      </Link>
      <div className="hidden w-[180px] shrink-0 truncate pr-4 text-xs text-muted-foreground sm:block">
        <UserIdentity user={document.owner} />
      </div>
      <p className="hidden w-[150px] shrink-0 truncate text-xs text-muted-foreground md:block">
        {formatDistanceToNow(new Date(document.createdAt), {
          addSuffix: true,
          locale: vi,
        })}
      </p>
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
    </article>
  );
}
