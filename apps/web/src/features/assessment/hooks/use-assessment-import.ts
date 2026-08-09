import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assessmentImportService } from "../services/assessment-import.service";

const assessmentImportKeys = {
  all: ["assessment-imports"] as const,
  status: (id: string) => ["assessment-imports", id, "status"] as const,
  drafts: (id: string) => ["assessment-imports", id, "drafts"] as const,
};

export function useCreateAssessmentImport() {
  return useMutation({ mutationFn: (file: File) => assessmentImportService.create(file) });
}

export function useAssessmentImportStatus(id?: string) {
  return useQuery({
    queryKey: assessmentImportKeys.status(id ?? ""),
    queryFn: () => assessmentImportService.getStatus(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "QUEUED" || status === "PROCESSING" ? 1500 : false;
    },
  });
}

export function useAssessmentImportDrafts(id?: string, enabled = false) {
  return useQuery({
    queryKey: assessmentImportKeys.drafts(id ?? ""),
    queryFn: () => assessmentImportService.getDrafts(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useUpdateAssessmentDraft(importId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ draftId, data }: { draftId: string; data: { content?: Record<string, unknown>; answer?: Record<string, unknown>; confidence?: number } }) =>
      assessmentImportService.updateDraft(importId, draftId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentImportKeys.drafts(importId) }),
  });
}

export function useRetryAssessmentImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentImportService.retry(id),
    onSuccess: (status) => queryClient.invalidateQueries({ queryKey: assessmentImportKeys.status(status.id) }),
  });
}
