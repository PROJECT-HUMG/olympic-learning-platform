import { AvatarImage } from "@/features/user/components/avatar-image";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Newspaper, Calendar, Eye, Pin, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { PostBadge } from "./post-badge";
import { PostStatusBadge } from "./post-status-badge";
import type { PostSummaryResponse } from "../types/post.types";

interface DashboardPostListProps {
  data: PostSummaryResponse[];
  onDeleteClick: (post: PostSummaryResponse) => void;
  onEditClick: (post: PostSummaryResponse) => void;
}

export function DashboardPostList({ data, onDeleteClick, onEditClick }: DashboardPostListProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 border border-dashed border-border/60 rounded-2xl bg-card/30 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-5 ring-8 ring-primary/5">
          <Newspaper className="size-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">Chưa có bài viết nào</h3>
        <p className="text-sm text-muted-foreground max-w-md mt-2">
          Không tìm thấy bài viết nào phù hợp. Hãy thử thay đổi bộ lọc hoặc tạo bài viết mới.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((post) => {
        const formattedDate = post.publishedAt
          ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi })
          : "Chưa xuất bản";
        const displayStatus = post.expiredAt && new Date(post.expiredAt) <= new Date() ? "EXPIRED" : post.status;

        return (
          <div 
            key={post.id} 
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-border/50 rounded-xl bg-card hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="shrink-0 w-24 h-16 flex items-center justify-center bg-muted/30 rounded border border-border/50 overflow-hidden">
                {post.thumbnailUrl ? (
                  <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <Newspaper className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                {post.status === "PUBLISHED" && displayStatus !== "EXPIRED" ? (
                  <Link to={`${ROUTES.NEWS}/${post.slug}`} target="_blank" rel="noreferrer" className="font-medium text-[15px] text-foreground hover:text-primary line-clamp-2" title={post.title}>
                    {post.title}
                  </Link>
                ) : <span className="font-medium text-[15px] text-foreground line-clamp-2">{post.title}</span>}
                {post.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {post.summary}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <PostBadge type={post.type} />
                    <PostStatusBadge status={displayStatus} />
                    {post.pinned && <span className="inline-flex items-center text-primary" title="Bài viết được ghim" aria-label="Bài viết được ghim"><Pin className="size-3.5 fill-current" /></span>}
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1" title="Lượt xem">
                      <Eye className="w-3 h-3" />
                      {post.viewCount}
                    </div>
                  </div>
                  {post.author && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center gap-1.5 max-w-[120px] truncate" title={post.author.fullName}>
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-semibold text-primary border shrink-0 overflow-hidden">
                          {post.author.avatarUrl ? (
                            <AvatarImage crop={post.author.avatarCrop} src={post.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (post.author.fullName)[0].toUpperCase()
                          )}
                        </div>
                        <span className="truncate">{post.author.fullName}</span>
                      </div>
                    </>
                  )}
                  {post.expiredAt && <><span className="hidden sm:inline">•</span><div className="flex items-center gap-1"><Clock3 className="w-3 h-3" />Hạn {format(new Date(post.expiredAt), "dd/MM/yyyy", { locale: vi })}</div></>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEditClick(post)}
                className="min-h-11 text-xs"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Sửa
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDeleteClick(post)}
                className="min-h-11 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Xóa
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
