import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostBadge } from "@/features/post/components/post-badge";
import type { PostSummaryResponse } from "@/features/post/types/post.types";
import { ROUTES } from "@/router/route-constants";
import { useHomeNews } from "../hooks/use-home-news";

function HomeNewsItem({ post }: { post: PostSummaryResponse }) {
  const [failedImage, setFailedImage] = useState(false);
  const illustrated = Boolean(post.thumbnailUrl) && !failedImage;
  return (
    <article className="home-news__item">
      <Link to={ROUTES.NEWS + "/" + encodeURIComponent(post.slug)}
        className="home-news__article" data-illustrated={illustrated}>
        <div className="home-news__body">
          <div className="home-news__meta">
            <PostBadge type={post.type} />
            {post.publishedAt && <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("vi-VN")}
            </time>}
          </div>
          <h3>{post.title}</h3>
          {post.summary && <p>{post.summary}</p>}
        </div>
        {illustrated && <img src={post.thumbnailUrl!} alt="" loading="lazy" onError={() => setFailedImage(true)} />}
        <ArrowUpRight aria-hidden="true" className="home-news__arrow" />
      </Link>
    </article>
  );
}

export function HomeLatestNewsSection() {
  const { posts, isPending, isError, isFetching, refetch } = useHomeNews();
  return (
    <section className="home-news" aria-labelledby="home-news-title" aria-busy={isFetching}>
      <header className="home-news__heading">
        <div>
          <h2 id="home-news-title">Bảng tin mới nhất</h2>
          <p>Chuyện trong trường và những bài viết dành cho việc học.</p>
        </div>
        <Link to={ROUTES.NEWS}>Xem bảng tin <ArrowUpRight aria-hidden="true" /></Link>
      </header>
      {isError && <div role="alert" className="home-news__feedback">
        <p>{posts.length ? "Một phần bảng tin chưa tải được." : "Chưa tải được bảng tin. Kiểm tra kết nối rồi thử lại."}</p>
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>Thử lại</Button>
      </div>}
      {isPending ? <div role="status" className="home-news__feedback">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />Đang tải bảng tin…
      </div> : posts.length ? (
        <div className="home-news__list">
          {posts.map((post) => <HomeNewsItem key={post.id} post={post} />)}
        </div>
      ) : !isError && <div role="status" className="home-news__feedback">
        <p>Chưa có tin tức hoặc bài viết mới. Bạn có thể xem thông báo ở bàn học phía trên.</p>
      </div>}
    </section>
  );
}
