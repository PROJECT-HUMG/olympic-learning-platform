import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examService } from "../services/exam.service";
import type { ExamDraft, ExamDraftInput } from "../types";

export const examKeys = {
  drafts: () => ["exams", "drafts"] as const,
  draft: (id: string) => ["exams", "draft", id] as const,
  preview: (id: string, solutions: boolean) => ["exams", "preview", id, solutions] as const,
  papers: () => ["exams", "papers"] as const,
  paper: (id: string, audience: "staff" | "student", solutions: boolean) => ["exams", "paper", id, audience, solutions] as const,
};

export function useExamDrafts() { return useQuery({ queryKey: examKeys.drafts(), queryFn: () => examService.listDrafts() }); }
export function useExamDraft(examId: string | undefined) {
  return useQuery({ queryKey: examKeys.draft(examId ?? ""), queryFn: () => examService.getDraft(examId ?? ""), enabled: Boolean(examId) });
}
export function useExamPreview(examId: string | undefined, solutions: boolean) {
  return useQuery({ queryKey: examKeys.preview(examId ?? "", solutions), queryFn: () => examService.preview(examId ?? "", solutions), enabled: Boolean(examId) });
}
export function useExamPapers() { return useQuery({ queryKey: examKeys.papers(), queryFn: () => examService.listPapers() }); }
export function useExamPaper(paperId: string | undefined, audience: "staff" | "student" | null, solutions: boolean) {
  const staffSolutions = audience === "staff" && solutions;
  return useQuery({
    queryKey: examKeys.paper(paperId ?? "", audience ?? "student", staffSolutions),
    queryFn: () => audience === "staff" ? examService.getStaffPaper(paperId ?? "", staffSolutions) : examService.getStudentPaper(paperId ?? ""),
    enabled: Boolean(paperId) && audience !== null,
  });
}

function rememberDraft(client: ReturnType<typeof useQueryClient>, saved: ExamDraft) {
  client.setQueryData(examKeys.draft(saved.id), saved);
  void client.invalidateQueries({ queryKey: examKeys.drafts() });
  void client.invalidateQueries({ queryKey: ["exams", "preview", saved.id] });
}

export function useCreateExam() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: ExamDraftInput) => examService.create(body), onSuccess: (saved) => rememberDraft(client, saved) });
}
export function useUpdateExam(examId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: ExamDraftInput) => examService.update(examId, body), onSuccess: (saved) => rememberDraft(client, saved) });
}
export function usePublishExam(examId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (expectedVersion: number) => examService.publish(examId, expectedVersion),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: examKeys.draft(examId) });
      void client.invalidateQueries({ queryKey: examKeys.papers() });
    },
  });
}
