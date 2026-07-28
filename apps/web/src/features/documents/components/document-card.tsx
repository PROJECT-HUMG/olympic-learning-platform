import { Link } from "react-router-dom";
import { Eye, Download, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 mt-4 cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-fit">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
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
                <span className="text-xs font-medium text-muted-foreground truncate flex-1 hover:text-foreground transition-colors">
                  {document.owner.fullName || document.owner.username}
                </span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-72" onClick={(e) => e.preventDefault()}>
              <div className="flex space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0 shadow-sm border border-border/50">
                  {document.owner.avatarUrl ? (
                    <img
                      src={document.owner.avatarUrl}
                      alt={document.owner.fullName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                      {(document.owner.fullName || "U")[0]}
                    </div>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-semibold leading-none">{document.owner.fullName || document.owner.username}</h4>
                  <p className="text-xs text-muted-foreground">
                    @{document.owner.username}
                  </p>
                  <div className="flex flex-col gap-1 pt-2">
                    <p className="text-xs font-medium text-foreground">
                      Vai trò: <span className="font-normal text-muted-foreground">{document.owner.role === "ADMIN" ? "Quản trị viên" : "Học viên"}</span>
                    </p>
                    {document.owner.lastLoginAt && (
                      <p className="text-xs text-muted-foreground">
                        Hoạt động: {formatDistanceToNow(new Date(document.owner.lastLoginAt), { addSuffix: true, locale: vi })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
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
