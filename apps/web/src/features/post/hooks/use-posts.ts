import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { postService } from "../services/post.service";
import type { PostSearchRequest, PostSummaryResponse } from "../types/post.types";
import type { Page } from "@/types/api.types";

export function usePosts(
  params?: PostSearchRequest,
  options?: Omit<UseQueryOptions<Page<PostSummaryResponse>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => postService.getAll(params),
    ...options,
  });
}
