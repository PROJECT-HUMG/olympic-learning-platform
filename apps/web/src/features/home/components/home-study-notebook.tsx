import { ArrowUpRight, Bell, BookOpen, Calculator, FileText, PencilRuler, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchDocuments } from "@/features/documents/hooks/use-documents";
import { usePosts } from "@/features/post/hooks/use-posts";
import { ROUTES } from "@/router/route-constants";

function NotebookLoading({ label }: { label: string }) {
  return (
    <div className="study-notebook__loading" role="status">
      <span className="sr-only">{label}</span>
      <div className="study-notebook__items" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="study-notebook__skeleton">
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotebookFeedback({
  title,
  description,
  onRetry,
  retrying = false,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="study-notebook__feedback" role="status">
      <p className="study-notebook__feedback-title">{title}</p>
      <p>{description}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="study-notebook__retry"
          onClick={onRetry}
          disabled={retrying}
        >
          <RefreshCw aria-hidden="true" className="size-3.5" />
          {retrying ? "Đang thử lại…" : "Thử lại"}
        </Button>
      )}
    </div>
  );
}

function NotebookDocuments() {
  const documents = useSearchDocuments({ page: 0, size: 3 });

  return (
    <>
      <div className="study-notebook__heading">
        <h3 className="study-notebook__eyebrow">Trong thư viện</h3>
        <Link to={ROUTES.DOCUMENTS} className="study-notebook__browse">
          Mở kho tài liệu <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>

      {documents.isPending ? (
        <NotebookLoading label="Đang mở kho tài liệu…" />
      ) : (
        <>
          {documents.isError && (
            <NotebookFeedback
              title={documents.data ? "Chưa thể cập nhật tài liệu." : "Chưa tải được tài liệu."}
              description="Bạn có thể thử kết nối lại để tiếp tục xem thư viện."
              onRetry={() => void documents.refetch()}
              retrying={documents.isFetching}
            />
          )}
          {documents.data && (documents.data.content.length ? (
            <ul className="study-notebook__items">
              {documents.data.content.map((document) => (
                <li key={document.id}>
                  <Link
                    to={`${ROUTES.DOCUMENTS}/${encodeURIComponent(document.slug)}`}
                    className="study-notebook__item"
                  >
                    <span className="study-notebook__item-icon"><FileText aria-hidden="true" /></span>
                    <div className="study-notebook__item-body">
                      <p className="study-notebook__item-meta">
                        {[document.subject?.name, document.category?.name].filter(Boolean).join(" · ") || "Tài liệu học tập"}
                      </p>
                      <h3 className="study-notebook__item-title">{document.title}</h3>
                    </div>
                    <ArrowUpRight className="study-notebook__item-arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : !documents.isError && (
            <NotebookFeedback
              title="Chưa có tài liệu."
              description="Tài liệu được chia sẻ sẽ xuất hiện tại đây."
            />
          ))}
        </>
      )}
    </>
  );
}

function NotebookAnnouncements() {
  const posts = usePosts({
    page: 0,
    size: 3,
    type: "ANNOUNCEMENT",
    status: "PUBLISHED",
    sort: "publishedAt,desc",
  });

  return (
    <>
      <div className="study-notebook__heading">
        <h3 className="study-notebook__eyebrow">Bảng thông báo</h3>
        <Link to={`${ROUTES.NEWS}?type=ANNOUNCEMENT`} className="study-notebook__browse">
          Xem tất cả <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>

      {posts.isPending ? (
        <NotebookLoading label="Đang đọc bảng thông báo…" />
      ) : (
        <>
          {posts.isError && (
            <NotebookFeedback
              title={posts.data ? "Chưa thể cập nhật thông báo." : "Chưa tải được thông báo."}
              description="Thử kết nối lại để xem các thông báo từ nhà trường."
              onRetry={() => void posts.refetch()}
              retrying={posts.isFetching}
            />
          )}
          {posts.data && (posts.data.content.length ? (
            <ul className="study-notebook__items">
              {posts.data.content.map((post) => (
                <li key={post.id}>
                  <Link to={`${ROUTES.NEWS}/${encodeURIComponent(post.slug)}`} className="study-notebook__item">
                    <span className="study-notebook__item-icon"><Bell aria-hidden="true" /></span>
                    <div className="study-notebook__item-body">
                      <p className="study-notebook__item-meta">
                        {post.publishedAt ? (
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString("vi-VN")}
                          </time>
                        ) : "Thông báo"}
                        {post.pinned && <span> · Được ghim</span>}
                      </p>
                      <h3 className="study-notebook__item-title">{post.title}</h3>
                      {post.summary && <p className="study-notebook__item-description">{post.summary}</p>}
                    </div>
                    <ArrowUpRight className="study-notebook__item-arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : !posts.isError && (
            <NotebookFeedback
              title="Chưa có thông báo mới."
              description="Các thông báo đang được công bố sẽ xuất hiện ở bảng ghim này."
            />
          ))}
        </>
      )}
    </>
  );
}

export function HomeStudyNotebook() {
  return (
    <Tabs defaultValue="documents" className="study-notebook">
      <TabsList className="study-notebook__tabs" aria-label="Các góc học tập">
        <TabsTrigger value="documents" className="study-notebook__tab">
          <BookOpen aria-hidden="true" /> Tài liệu
        </TabsTrigger>
        <TabsTrigger value="announcements" className="study-notebook__tab">
          <Bell aria-hidden="true" /> Thông báo
        </TabsTrigger>
        <TabsTrigger value="toolkit" className="study-notebook__tab">
          <PencilRuler aria-hidden="true" /> Tiện ích
        </TabsTrigger>
      </TabsList>

      <TabsContent value="documents" className="study-notebook__page">
        <NotebookDocuments />
      </TabsContent>
      <TabsContent value="announcements" className="study-notebook__page">
        <NotebookAnnouncements />
      </TabsContent>
      <TabsContent value="toolkit" className="study-notebook__page">
        <div className="study-notebook__heading">
          <h3 className="study-notebook__eyebrow">Tiện ích học tập</h3>
          <Link to={ROUTES.TOOLKIT} className="study-notebook__browse">Mở tiện ích <ArrowUpRight aria-hidden="true" /></Link>
        </div>
        <ul className="study-notebook__items">
          <li>
            <Link to={`${ROUTES.TOOLKIT}?tool=rooms`} className="study-notebook__item">
              <span className="study-notebook__item-icon"><Users aria-hidden="true" /></span>
              <div className="study-notebook__item-body">
                <h3 className="study-notebook__item-title">Cùng học bài</h3>
                <p className="study-notebook__item-description">Vào phòng học cùng bạn bè, nghe lofi và nghỉ đúng nhịp.</p>
              </div>
              <ArrowUpRight className="study-notebook__item-arrow" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link to={`${ROUTES.TOOLKIT}?tool=gpa`} className="study-notebook__item">
              <span className="study-notebook__item-icon"><Calculator aria-hidden="true" /></span>
              <div className="study-notebook__item-body">
                <h3 className="study-notebook__item-title">Tính điểm GPA</h3>
                <p className="study-notebook__item-description">Tính điểm trung bình theo tín chỉ, trên hệ 4 hoặc hệ 10.</p>
              </div>
              <ArrowUpRight className="study-notebook__item-arrow" aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </TabsContent>
    </Tabs>
  );
}
