import { usePosts } from "@/features/post/hooks/use-posts";

export function useHomeNews() {
  const common = { size: 3, status: "PUBLISHED", sort: "publishedAt,desc" };
  const news = usePosts({ ...common, type: "NEWS" });
  const blogs = usePosts({ ...common, type: "BLOG" });
  const posts = [...(news.data?.content ?? []), ...(blogs.data?.content ?? [])]
    .sort((a, b) => Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt))
    .slice(0, 3);

  return {
    posts,
    isPending: !posts.length && (news.isPending || blogs.isPending),
    isError: news.isError || blogs.isError,
    isFetching: news.isFetching || blogs.isFetching,
    refetch: () => Promise.all([news.refetch(), blogs.refetch()]),
  };
}
