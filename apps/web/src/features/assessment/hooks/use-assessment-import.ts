import { parseApiError } from "@/lib/api-error";
import { importAccessDenied } from "../import-session";
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

export function useAssessmentImportStatus(id?: string, scope = "", enabled = true) {
  return useQuery({
    queryKey: [...assessmentImportKeys.status(id ?? ""), scope],
    queryFn: ({ signal }) => assessmentImportService.getStatus(id!, signal),
    // Keep same-account correction rows mounted during token revalidation; gates hide media.
    placeholderData: (previous, query) => query && query.queryKey[1] === id && String(query.queryKey[3]).split(":")[0] === scope.split(":")[0] ? previous : undefined,
    enabled: Boolean(id) && enabled,
    refetchOnMount: "always",
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "QUEUED" || status === "PROCESSING" ? 1500 : false;
    },
  });
}

export function useAssessmentImportDrafts(id?: string, enabled = false, scope = "") {
  return useQuery({
    queryKey: [...assessmentImportKeys.drafts(id ?? ""), scope],
    queryFn: ({ signal }) => assessmentImportService.getDrafts(id!, signal),
    placeholderData: (previous, query) => query && query.queryKey[1] === id && String(query.queryKey[3]).split(":")[0] === scope.split(":")[0] ? previous : undefined,
    enabled: Boolean(id) && enabled,
    refetchOnMount: "always",
    retry: false,
  });
}

export function useUpdateAssessmentDraft(importId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["assessment-imports", importId, "review"],
    mutationFn: ({ draftId, data }: { draftId: string; data: { content?: Record<string, unknown>; answer?: Record<string, unknown>; confidence?: number } }) =>
      assessmentImportService.updateDraft(importId, draftId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentImportKeys.drafts(importId) }),
    onError: error => { if (importAccessDenied(parseApiError(error).status)) {
      void queryClient.invalidateQueries({ queryKey: assessmentImportKeys.status(importId) });
      void queryClient.invalidateQueries({ queryKey: assessmentImportKeys.drafts(importId) });
    } },
  });
}

export function useDraftReviewAction(importId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: assessmentImportKeys.drafts(importId) });
  const revalidateDenied = (error: unknown) => { if (importAccessDenied(parseApiError(error).status)) {
    void queryClient.invalidateQueries({ queryKey: assessmentImportKeys.status(importId) });
    void invalidate();
  } };
  return {
    approve: useMutation({ mutationKey: ["assessment-imports", importId, "review"], mutationFn: (draftId: string) => assessmentImportService.approveDraft(importId, draftId), onSuccess: invalidate, onError: revalidateDenied }),
    reject: useMutation({ mutationKey: ["assessment-imports", importId, "review"], mutationFn: (draftId: string) => assessmentImportService.rejectDraft(importId, draftId), onSuccess: invalidate, onError: revalidateDenied }),
  };
}

export function usePublishAssessmentImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentImportService.publish(id),
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: assessmentImportKeys.status(status.id) });
      queryClient.invalidateQueries({ queryKey: assessmentImportKeys.drafts(status.id) });
    },
  });
}

export function useAssessmentTopics(subjectId?: string) {
  return useQuery({
    queryKey: ["assessment-topics", subjectId ?? ""],
    queryFn: () => assessmentImportService.getTopics(subjectId!),
    enabled: Boolean(subjectId),
    staleTime: 1000 * 60 * 30,
  });
}

export function useRetryAssessmentImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentImportService.retry(id),
    onSuccess: (status) => queryClient.invalidateQueries({ queryKey: assessmentImportKeys.status(status.id) }),
  });
}
