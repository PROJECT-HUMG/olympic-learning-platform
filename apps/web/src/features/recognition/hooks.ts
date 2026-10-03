import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";

export function useRecognitionMutation<T, V>(mutationFn: (value: V) => Promise<T>, message: string, onSuccess?: (data: T) => void) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: async data => {
    await client.invalidateQueries({ queryKey: ["recognition"] });
    toast.success(message); onSuccess?.(data);
  }, onError: error => {
    const problem = parseApiError(error);
    if (problem.status === 409) void client.invalidateQueries({ queryKey: ["recognition"] });
    toast.error(problem.detail || "Chưa lưu được thay đổi. Hãy thử lại.");
  } });
}
