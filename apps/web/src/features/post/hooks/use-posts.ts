import { useQuery } from "@tanstack/react-query";
import { postService } from "../services/post.service";
import type { PostSearchRequest } from "../types/post.types";

export function usePosts(params?: PostSearchRequest) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => postService.getAll(params),
  });
}
