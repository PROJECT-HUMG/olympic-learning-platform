import { apiClient } from "@/lib/axios";
import { EXAM_CONTRACT, readExamDraft, readExamDraftList, readStaffExamView, readStudentExamPaper, readSummaryList } from "../exam-contract";
import type { ExamDraftInput } from "../types";

function required<T>(value: T | null): T {
  if (value === null) throw new Error(EXAM_CONTRACT);
  return value;
}

export const examService = {
  listDrafts() { return apiClient.get("/exams").then((response) => required(readExamDraftList(response.data))); },
  getDraft(examId: string) { return apiClient.get(`/exams/${examId}`).then((response) => required(readExamDraft(response.data))); },
  create(body: ExamDraftInput) { return apiClient.post("/exams", body).then((response) => required(readExamDraft(response.data))); },
  update(examId: string, body: ExamDraftInput) { return apiClient.patch(`/exams/${examId}`, body).then((response) => required(readExamDraft(response.data))); },
  publish(examId: string, expectedVersion: number) { return apiClient.post(`/exams/${examId}/publish`, { expectedVersion }).then((response) => required(readStaffExamView(response.data))); },
  preview(examId: string, solutions: boolean) { return apiClient.get(`/exams/${examId}/preview`, { params: { solutions } }).then((response) => required(readStaffExamView(response.data))); },
  listPapers() { return apiClient.get("/exams/papers").then((response) => required(readSummaryList(response.data))); },
  getStaffPaper(paperId: string, solutions: boolean) { return apiClient.get(`/exams/papers/${paperId}`, { params: { solutions } }).then((response) => required(readStaffExamView(response.data))); },
  getStudentPaper(paperId: string) { return apiClient.get(`/exams/papers/${paperId}`, { params: { solutions: false } }).then((response) => required(readStudentExamPaper(response.data))); },
  downloadPaperFigure(paperId: string, assetId: string, signal?: AbortSignal) {
    return apiClient.get<Blob>(`/exams/papers/${paperId}/figures/${assetId}`, { responseType: "blob", timeout: 120_000, signal }).then((response) => response.data);
  },
};
