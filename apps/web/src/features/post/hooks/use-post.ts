import { useQuery } from "@tanstack/react-query";
import { postService } from "../services/post.service";

export function usePost(idOrSlug: string, isSlug = false) {
  return useQuery({
    queryKey: ["posts", isSlug ? "public" : "management", isSlug ? "slug" : "id", idOrSlug],
    meta: { publicRead: isSlug },
    staleTime: 0,
    queryFn: ({ signal }) =>
      isSlug ? postService.getBySlug(idOrSlug, signal) : postService.getById(idOrSlug, signal),
    enabled: !!idOrSlug,
  });
}
