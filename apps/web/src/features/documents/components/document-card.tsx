import { Link, useLocation } from "react-router-dom";
import { Download, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserHoverCard } from "@/features/user/components/user-hover-card";
import { DocumentThumbnail } from "./document-thumbnail";
import type { DocumentResponse } from "../types/documents.types";

interface DocumentCardProps {
  document: DocumentResponse;
  onDownload?: (document: DocumentResponse) => void;
}

export function DocumentCard({ document, onDownload }: DocumentCardProps) {
  const location = useLocation();
  const to = `/documents/${encodeURIComponent(document.slug)}`;
  const from = { from: location.pathname + location.search };
  const formattedDate = formatDistanceToNow(new Date(document.createdAt), { addSuffix: true, locale: vi });
  return (
    <article className="document-card group flex min-w-0 flex-col overflow-hidden content-card">
      <Link to={to} state={from} className="document-card__primary flex-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <DocumentThumbnail src={document.thumbnailUrl} />
        <div className="document-card__body">
          <div className="document-card__context">
            <span className="document-card__subject">{document.subject?.name}</span>
            {document.category?.name && <Badge variant="secondary" className="max-w-full break-words">{document.category.name}</Badge>}
          </div>
          <h3 className="document-card__title line-clamp-3 group-hover:text-primary">{document.title}</h3>
          {document.description && <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{document.description}</p>}
          {!!document.tags?.length && <p className="document-card__context" aria-label="Thẻ tài liệu">
            {document.tags.slice(0, 2).map(tag => <span className="break-words" key={tag.id}>#{tag.name}</span>)}
            {document.tags.length > 2 && <span>+{document.tags.length - 2} thẻ</span>}
          </p>}
        </div>
      </Link>
      <div className="border-t border-border/50 px-4 pb-3 pt-1">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 text-xs text-muted-foreground">
          <UserHoverCard user={document.owner}>
            <button type="button" className="min-h-11 max-w-full truncate rounded-md text-left hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`Thông tin ${document.owner.fullName || document.owner.username}`}>
              {document.owner.fullName || document.owner.username}
            </button>
          </UserHoverCard>
          <span className="break-words">Đăng {formattedDate}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Button asChild variant="outline" className="min-h-11 min-w-0 flex-1">
            <Link to={to} state={from} aria-label={`Mở tài liệu: ${document.title}`}>Mở tài liệu <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
          {onDownload && <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0"
            aria-label={`Tải xuống ${document.title}`} onClick={() => onDownload(document)}>
            <Download aria-hidden="true" className="size-4" />
          </Button>}
        </div>
      </div>
    </article>
  );
}
