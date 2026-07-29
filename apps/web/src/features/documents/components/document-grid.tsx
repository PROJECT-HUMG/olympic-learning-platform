import type { DocumentResponse } from "@/features/documents/types/documents.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, Download, Pencil, Trash2, MoreVertical, 
  FileText, Calendar 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentGridProps {
  data: DocumentResponse[];
  onDeleteClick: (document: DocumentResponse) => void;
  onEditClick: (document: DocumentResponse) => void;
}

export function DocumentGrid({ data, onDeleteClick, onEditClick }: DocumentGridProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border/60 rounded-2xl bg-card/30 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-5 ring-8 ring-primary/5">
          <FileText className="size-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">Chưa có tài liệu nào</h3>
        <p className="text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
          Không tìm thấy tài liệu nào phù hợp. Hãy thử thay đổi bộ lọc hoặc thêm tài liệu mới vào hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data.map((doc) => {
        const formattedDate = formatDistanceToNow(new Date(doc.createdAt), {
          addSuffix: true,
          locale: vi,
        });

        return (
          <Card key={doc.id} className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 bg-card border-border/40 hover:border-primary/20">
            {/* Image Section */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
              {doc.thumbnailUrl ? (
                <img
                  src={doc.thumbnailUrl}
                  alt={doc.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 bg-gradient-to-br from-muted/50 to-muted">
                  <FileText className="size-12 mb-3 opacity-50" />
                  <span className="text-xs font-medium uppercase tracking-wider opacity-60">No Thumbnail</span>
                </div>
              )}
              
              {/* Overlay Gradient for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Overlay Actions */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-full size-10 shadow-lg hover:scale-110 transition-transform bg-background/90 hover:bg-background text-foreground"
                  onClick={() => onEditClick(doc)}
                  title="Chỉnh sửa"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="rounded-full size-10 shadow-lg hover:scale-110 transition-transform"
                  onClick={() => onDeleteClick(doc)}
                  title="Xóa"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button 
                  size="icon" 
                  className="rounded-full size-10 shadow-lg hover:scale-110 transition-transform bg-primary text-primary-foreground"
                  asChild
                  title="Xem chi tiết"
                >
                  <Link to={`${ROUTES.DOCUMENTS}/${doc.slug}`} target="_blank">
                    <Eye className="size-4" />
                  </Link>
                </Button>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap max-w-[80%]">
                {doc.category && (
                  <Badge className="bg-background/95 text-foreground backdrop-blur-md shadow-sm border-none hover:bg-background font-medium">
                    {doc.category.name}
                  </Badge>
                )}
              </div>

              {/* Quick Menu (visible on mobile, hidden on desktop hover) */}
              <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-0 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background shadow-sm">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={`${ROUTES.DOCUMENTS}/${doc.slug}`} target="_blank" className="cursor-pointer">
                        <Eye className="size-4 mr-2" /> Xem chi tiết
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEditClick(doc)} className="cursor-pointer">
                      <Pencil className="size-4 mr-2" /> Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteClick(doc)} className="cursor-pointer text-destructive focus:text-destructive">
                      <Trash2 className="size-4 mr-2" /> Xóa tài liệu
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <CardHeader className="p-5 pb-3">
              <h3 className="font-semibold text-[15px] line-clamp-2 leading-snug group-hover:text-primary transition-colors" title={doc.title}>
                {doc.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-3">
                {doc.subject && (
                  <Badge variant="outline" className="font-normal text-[11px] px-2 py-0 h-5 text-muted-foreground border-border/60 bg-muted/30">
                    {doc.subject.name}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0 mt-auto flex-none">
              <div className="h-px w-full bg-border/50 mb-4" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5" title="Ngày tạo">
                  <Calendar className="size-3.5" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center gap-1.5" title="Lượt xem">
                    <Eye className="size-3.5" />
                    <span className="font-medium text-foreground/80">{doc.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Lượt tải">
                    <Download className="size-3.5" />
                    <span className="font-medium text-foreground/80">{doc.downloadCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
