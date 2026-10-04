import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionService } from "../services/question.service";
import type { Question, QuestionStatus, UpdateQuestionRequest } from "../types/question.types";

export const questionKeys = {
  all: ["questions"] as const,
  list: (params: unknown) => ["questions", "list", params] as const,
  detail: (id: string) => ["questions", "detail", id] as const,
  figure: (questionId: string, assetId: string) =>
    ["questions", "figure", questionId, assetId] as const,
  topics: (subjectId: string) => ["topics", subjectId] as const,
};

export function useQuestions(params: {
  status?: QuestionStatus;
  subjectId?: string;
  topicId?: string;
  search?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: questionKeys.list(params),
    queryFn: () => questionService.search(params),
  });
}

export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: questionKeys.detail(id!),
    queryFn: () => questionService.get(id!),
    enabled: !!id,
  });
}

export function useCreateQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateQuestionRequest) => questionService.create(data),
    onSuccess: (created) => {
      client.setQueryData(questionKeys.detail(created.id), created);
      client.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
}

export function useUpdateQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionRequest }) =>
      questionService.update(id, data),
    onSuccess: (updatedQuestion, { id }) => {
      client.setQueryData(questionKeys.detail(id), updatedQuestion);
      client.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
}

function useQuestionAction(action: (id: string) => Promise<Question>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (updated) => {
      client.setQueryData(questionKeys.detail(updated.id), updated);
      client.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
}

export function useDuplicateQuestion() {
  return useQuestionAction(questionService.duplicate);
}

export function usePublishQuestion() {
  return useQuestionAction(questionService.publish);
}

export function useArchiveQuestion() {
  return useQuestionAction(questionService.archive);
}

export function useRestoreQuestion() {
  return useQuestionAction(questionService.restore);
}

export function useTopics(subjectId: string | undefined) {
  return useQuery({
    queryKey: questionKeys.topics(subjectId!),
    queryFn: () => questionService.getTopics(subjectId!),
    enabled: !!subjectId,
  });
}
