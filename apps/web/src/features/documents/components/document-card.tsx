import { Link } from "react-router-dom";
import { Eye, Download, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { DocumentResponse } from "@/features/documents/types/documents.types";

interface DocumentCardProps {
  document: DocumentResponse;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const formattedDate = formatDistanceToNow(new Date(document.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card/60 backdrop-blur-sm border-border/50 group">
      <Link to={`/documents/${document.slug}`} className="flex-1 flex flex-col">
        <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt={document.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <FileText className="w-16 h-16 text-muted-foreground/30" />
          )}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur text-xs">
              {document.category.name}
            </Badge>
            <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs">
              {document.subject.name}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 pb-2">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {document.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {document.description}
          </p>
        </CardHeader>

        <CardContent className="p-4 pt-0 mt-auto">
          <div className="flex items-center gap-2 mt-4">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
              {document.owner.avatarUrl ? (
                <img
                  src={document.owner.avatarUrl}
                  alt={document.owner.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                  {(document.owner.fullName || "U")[0]}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate flex-1">
              {document.owner.fullName || document.owner.username}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Lượt xem">
              <Eye className="w-3.5 h-3.5" />
              <span>{document.viewCount}</span>
            </div>
            <div className="flex items-center gap-1" title="Lượt tải">
              <Download className="w-3.5 h-3.5" />
              <span>{document.downloadCount}</span>
            </div>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
