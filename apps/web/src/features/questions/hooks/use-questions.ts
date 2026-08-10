import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionService } from "../services/question.service";
import type { QuestionStatus } from "../types/question.types";

const keys = { all: ["questions"] as const, list: (params: unknown) => ["questions", "list", params] as const };
export function useQuestions(params: { status?: QuestionStatus; search?: string; page?: number; size?: number }) {
  return useQuery({ queryKey: keys.list(params), queryFn: () => questionService.search(params) });
}
function useQuestionAction(action: (id: string) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({ mutationFn: action, onSuccess: () => client.invalidateQueries({ queryKey: keys.all }) });
}
export function useDuplicateQuestion() { return useQuestionAction(questionService.duplicate); }
export function usePublishQuestion() { return useQuestionAction(questionService.publish); }
export function useArchiveQuestion() { return useQuestionAction(questionService.archive); }
export function useRestoreQuestion() { return useQuestionAction(questionService.restore); }
