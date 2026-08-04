import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "../services/post.service";
import type { UpdatePostRequest } from "../types/post.types";

interface UpdatePostArgs {
  id: string;
  data: UpdatePostRequest;
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdatePostArgs) => postService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the post list
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Invalidate the specific post
      queryClient.invalidateQueries({ queryKey: ["posts", variables.id] });
    },
  });
}
