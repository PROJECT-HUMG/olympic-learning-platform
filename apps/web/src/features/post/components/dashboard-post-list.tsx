import { useState } from "react";
import { postDisplayStatus } from "../post-status";
import { EmptyState } from "@/components/ui/empty-state";
import { AvatarImage } from "@/features/user/components/avatar-image";
import { ManagementListRow, ManagementRowActions } from "@/components/ui/management-list-row";
import { Newspaper, Calendar, Eye, Pin, Clock3 } from "lucide-react";
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
    return <EmptyState title="Chưa có bài viết nào" icon={<Newspaper />}>Không tìm thấy bài viết nào phù hợp. Hãy thử thay đổi bộ lọc hoặc tạo bài viết mới.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((post) => {
        const formattedDate = post.publishedAt
          ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi })
          : "Chưa xuất bản";
        const displayStatus = postDisplayStatus(post);

        return (
          <ManagementListRow key={post.id} actions={<ManagementRowActions onEdit={() => onEditClick(post)} onDelete={() => onDeleteClick(post)} />}>
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <PostThumbnail key={post.thumbnailUrl} src={post.thumbnailUrl} />
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

          </ManagementListRow>
        );
      })}
    </div>
  );
}

function PostThumbnail({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return <div className="shrink-0 w-16 h-12 sm:w-24 sm:h-16 flex items-center justify-center bg-muted/30 rounded border border-border/50 overflow-hidden">
    {src && !failed ? <img src={src} alt="" width={96} height={64} loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} /> : <><Newspaper aria-hidden="true" className="size-6 text-muted-foreground" /><span className="sr-only">{failed ? "Không tải được ảnh minh họa" : "Không có ảnh minh họa"}</span></>}
  </div>;
}
