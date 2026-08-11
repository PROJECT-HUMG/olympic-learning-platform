import { apiClient } from "@/lib/axios";
import type {
  Question,
  QuestionPage,
  QuestionStatus,
  TopicSummary,
  UpdateQuestionRequest,
} from "../types/question.types";

export const questionService = {
  search(params: {
    status?: QuestionStatus;
    subjectId?: string;
    topicId?: string;
    search?: string;
    page?: number;
    size?: number;
  }) {
    return apiClient
      .get<QuestionPage>("/questions", { params })
      .then((response) => response.data);
  },

  get(id: string) {
    return apiClient
      .get<Question>(`/questions/${id}`)
      .then((response) => response.data);
  },

  update(id: string, data: UpdateQuestionRequest) {
    return apiClient
      .patch<Question>(`/questions/${id}`, data)
      .then((response) => response.data);
  },

  duplicate(id: string) {
    return apiClient
      .post<Question>(`/questions/${id}/duplicate`)
      .then((response) => response.data);
  },

  publish(id: string) {
    return apiClient
      .post<Question>(`/questions/${id}/publish`)
      .then((response) => response.data);
  },

  archive(id: string) {
    return apiClient
      .post<Question>(`/questions/${id}/archive`)
      .then((response) => response.data);
  },

  restore(id: string) {
    return apiClient
      .post<Question>(`/questions/${id}/restore`)
      .then((response) => response.data);
  },

  getTopics(subjectId: string) {
    return apiClient
      .get<TopicSummary[]>("/topics", { params: { subjectId } })
      .then((response) => response.data);
  },
};
