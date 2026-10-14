import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { postService } from "../services/post.service";
import type { PostSearchRequest, PostSummaryResponse } from "../types/post.types";
import type { Page } from "@/types/api.types";

export function usePosts(
  params?: PostSearchRequest,
  options?: Omit<UseQueryOptions<Page<PostSummaryResponse>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["posts", "public", params],
    meta: { publicRead: true },
    queryFn: ({ signal }) => postService.getAll(params, signal),
    ...options,
  });
}

export function useManagementPosts(
  params?: PostSearchRequest,
  options?: Omit<UseQueryOptions<Page<PostSummaryResponse>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["posts", "management", params],
    queryFn: ({ signal }) => postService.getManagement(params, signal),
    ...options,
  });
}

export function useManagementPostStatusCounts() {
  return useQuery({
    queryKey: ["posts", "management", "status-counts"],
    queryFn: () => postService.getManagementStatusCounts(),
  });
}
