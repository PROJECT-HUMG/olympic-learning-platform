import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "../services/post.service";
import type { CreatePostRequest } from "../types/post.types";

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
