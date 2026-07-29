import { Link } from "react-router-dom";
import { Eye, Download, FileText, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { UserHoverCard } from "@/features/user/components/user-hover-card";
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
    <Card className="group flex flex-col h-full overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1.5 bg-card border-border/40 hover:border-primary/30">
      <Link to={`/documents/${document.slug}`} className="flex-1 flex flex-col relative">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt={document.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-muted to-muted/80">
              <FileText className="w-14 h-14 text-primary/20 mb-2 transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/40" />
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap max-w-[90%] z-10">
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md shadow-sm border-none hover:bg-primary font-medium text-xs px-2.5 py-0.5">
              {document.category.name}
            </Badge>
          </div>

          {/* Hover CTA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 backdrop-blur-[2px]">
            <span className="bg-background/90 text-foreground text-sm font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              Xem tài liệu <ArrowRight className="size-4" />
            </span>
          </div>

          {/* Bottom Info inside Image */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between">
            <div className="flex items-center gap-2 text-white/90">
              <div className="flex items-center gap-1 text-xs font-medium backdrop-blur-md bg-black/30 px-2 py-1 rounded-md">
                <Eye className="w-3.5 h-3.5" />
                <span>{document.viewCount}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium backdrop-blur-md bg-black/30 px-2 py-1 rounded-md">
                <Download className="w-3.5 h-3.5" />
                <span>{document.downloadCount}</span>
              </div>
            </div>
          </div>
        </div>

        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            {document.subject && (
              <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                {document.subject.name}
              </span>
            )}
          </div>
          <h3 className="font-bold text-[17px] line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {document.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
            {document.description || "Không có mô tả chi tiết cho tài liệu này."}
          </p>
        </CardHeader>

        <CardContent className="p-5 pt-0 mt-auto">
          {/* Content space if needed */}
        </CardContent>

        <CardFooter className="p-5 pt-4 flex items-center justify-between border-t border-border/40 bg-muted/10 mt-auto">
          <UserHoverCard user={document.owner}>
            <div className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/60 p-1.5 -ml-1.5 rounded-lg transition-colors w-fit relative z-20" onClick={(e) => e.preventDefault()}>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                {document.owner.avatarUrl ? (
                  <img
                    src={document.owner.avatarUrl}
                    alt={document.owner.fullName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-primary">
                    {(document.owner.fullName || "U")[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-foreground/90 truncate max-w-[120px] group-hover:text-primary transition-colors leading-none mb-1">
                  {document.owner.fullName || document.owner.username}
                </span>
                <span className="text-[11px] text-muted-foreground leading-none">
                  {document.owner.role === "ADMIN" ? "Quản trị viên" : document.owner.role === "LECTURER" ? "Giảng viên" : "Học viên"}
                </span>
              </div>
            </div>
          </UserHoverCard>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border border-border/50 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-primary/60" />
            <span>{formattedDate}</span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
