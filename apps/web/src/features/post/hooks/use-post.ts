import { useQuery } from "@tanstack/react-query";
import { postService } from "../services/post.service";

export function usePost(idOrSlug: string, isSlug = false) {
  return useQuery({
    queryKey: ["posts", idOrSlug],
    queryFn: () =>
      isSlug ? postService.getBySlug(idOrSlug) : postService.getById(idOrSlug),
    enabled: !!idOrSlug,
  });
}
