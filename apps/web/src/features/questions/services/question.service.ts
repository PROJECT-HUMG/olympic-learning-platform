import { apiClient } from "@/lib/axios";
import type { Question, QuestionPage, QuestionStatus } from "../types/question.types";

export const questionService = {
  search(params: { status?: QuestionStatus; subjectId?: string; topicId?: string; search?: string; page?: number; size?: number }) {
    return apiClient.get<QuestionPage>("/questions", { params }).then((response) => response.data);
  },
  duplicate(id: string) { return apiClient.post<Question>(`/questions/${id}/duplicate`).then((response) => response.data); },
  publish(id: string) { return apiClient.post<Question>(`/questions/${id}/publish`).then((response) => response.data); },
  archive(id: string) { return apiClient.post<Question>(`/questions/${id}/archive`).then((response) => response.data); },
  restore(id: string) { return apiClient.post<Question>(`/questions/${id}/restore`).then((response) => response.data); },
};
