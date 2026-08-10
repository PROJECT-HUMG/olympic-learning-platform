import { apiClient } from "@/lib/axios";
import type {
  AssessmentImportStatusResponse,
  AssessmentQuestionDraft,
  Topic,
} from "../types/assessment-import.types";

export const assessmentImportService = {
  create(file: File) {
    const data = new FormData();
    data.append("file", file);
    return apiClient
      .post<AssessmentImportStatusResponse>("/assessment-imports", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60_000,
      })
      .then((response) => response.data);
  },

  getStatus(id: string) {
    return apiClient
      .get<AssessmentImportStatusResponse>(`/assessment-imports/${id}`)
      .then((response) => response.data);
  },

  getDrafts(id: string) {
    return apiClient
      .get<AssessmentQuestionDraft[]>(`/assessment-imports/${id}/drafts`)
      .then((response) => response.data);
  },

  updateDraft(
    importId: string,
    draftId: string,
    data: { content?: Record<string, unknown>; answer?: Record<string, unknown>; confidence?: number },
  ) {
    return apiClient
      .patch<AssessmentQuestionDraft>(`/assessment-imports/${importId}/drafts/${draftId}`, data)
      .then((response) => response.data);
  },

  approveDraft(importId: string, draftId: string) {
    return apiClient.post<AssessmentQuestionDraft>(`/assessment-imports/${importId}/drafts/${draftId}/approve`).then((response) => response.data);
  },

  rejectDraft(importId: string, draftId: string) {
    return apiClient.post<AssessmentQuestionDraft>(`/assessment-imports/${importId}/drafts/${draftId}/reject`).then((response) => response.data);
  },

  publish(id: string) {
    return apiClient.post<AssessmentImportStatusResponse>(`/assessment-imports/${id}/publish`).then((response) => response.data);
  },

  getTopics(subjectId: string) {
    return apiClient.get<Topic[]>("/topics", { params: { subjectId } }).then((response) => response.data);
  },

  retry(id: string) {
    return apiClient
      .post<AssessmentImportStatusResponse>(`/assessment-imports/${id}/retry`)
      .then((response) => response.data);
  },
};
