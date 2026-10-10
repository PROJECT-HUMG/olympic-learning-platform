import type { AssessmentImportStatusResponse, AssessmentQuestionDraft } from "@/features/assessment/types/assessment-import.types";
import { useSearchParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/stores/use-auth-store";
import { parseApiError } from "@/lib/api-error";
import { importJobId, importAccessDenied } from "@/features/assessment/import-session";
import { PageHeader } from "@/components/ui/page-header";
import { CreationDialog } from "@/components/ui/creation-dialog";
import { useEffect, useState } from "react";
import { FileUp, RefreshCw, Send, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssessmentDraftList } from "@/features/assessment/components/assessment-draft-list";
import { AssessmentImportProgress } from "@/features/assessment/components/assessment-import-progress";
import {
  AssessmentDraftsSkeleton,
  AssessmentImportSkeleton,
} from "@/features/assessment/components/assessment-import-skeleton";
import {
  useAssessmentImportDrafts,
  useAssessmentImportStatus,
  useCreateAssessmentImport,
  usePublishAssessmentImport,
  useRetryAssessmentImport,
} from "@/features/assessment/hooks/use-assessment-import";

export default function AssessmentImportPage() {
  const user = useCurrentUser();
  const revision = useAuthStore(state => state.revision);
  if (!user.data || user.isError || !["ADMIN", "LECTURER"].includes(user.data.role)) {
    return <div className="page-shell"><PageHeader title="Nhập đề từ PDF" />
      {user.isPending ? <AssessmentImportSkeleton /> : <ImportQueryError label="Chưa xác nhận được quyền nhập đề." error={user.error} retrying={user.isFetching} onRetry={() => void user.refetch()} />}
    </div>;
  }
  return <ImportSession key={user.data.id} scope={`${user.data.id}:${revision}`} identityReady={!user.isFetching} />;
}

function ImportSession({ scope, identityReady }: { scope: string; identityReady: boolean }) {
  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useSearchParams();
  const suppliedId = params.get("importId");
  const importId = importJobId(suppliedId);
  const invalidId = suppliedId !== null && !importId;
  const setImportId = (id: string) => setParams(previous => {
    const next = new URLSearchParams(previous); next.set("importId", id); return next;
  }, { replace: true });
  const [error, setError] = useState<string>();
  const createImport = useCreateAssessmentImport();
  const retryImport = useRetryAssessmentImport();
  const publishImport = usePublishAssessmentImport();
  const statusQuery = useAssessmentImportStatus(importId, scope, identityReady);
  const isReviewRequired = statusQuery.data?.status === "REVIEW_REQUIRED";
  const [lastReview, setLastReview] = useState<{ id: string; status: AssessmentImportStatusResponse; drafts: AssessmentQuestionDraft[] }>();
  const statusReady = identityReady && statusQuery.isSuccess && !statusQuery.isFetching && !statusQuery.isPlaceholderData;
  const draftsQuery = useAssessmentImportDrafts(importId, isReviewRequired && statusReady, scope);
  const denied = (statusQuery.isError && importAccessDenied(parseApiError(statusQuery.error).status)) ||
    (draftsQuery.isError && importAccessDenied(parseApiError(draftsQuery.error).status));
  // Preserve only the same account/job's local correction composition across transient
  // revalidation failures. Current queries alone authorize media and mutations.
  useEffect(() => {
    if (denied) { setLastReview(undefined); return; }
    if (importId && statusQuery.data?.status === "REVIEW_REQUIRED" && draftsQuery.isSuccess && !draftsQuery.isPlaceholderData && draftsQuery.data) {
      setLastReview({ id: importId, status: statusQuery.data, drafts: draftsQuery.data });
    }
  }, [denied, importId, statusQuery.data, draftsQuery.data, draftsQuery.isSuccess, draftsQuery.isPlaceholderData]);
  const retained = lastReview?.id === importId ? lastReview : undefined;
  const visibleStatus = statusQuery.data ?? retained?.status;
  const visibleDrafts = draftsQuery.data ?? retained?.drafts;
  const reviewing = useIsMutating({ mutationKey: ["assessment-imports", importId ?? "", "review"] }) > 0;
  const blocked = !statusReady || !draftsQuery.isSuccess || draftsQuery.isFetching || draftsQuery.isPlaceholderData || publishImport.isPending || retryImport.isPending || reviewing;

  const handleSubmit = async () => {
    if (!file || !identityReady || createImport.isPending) return;
    setError(undefined);
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 25 * 1024 * 1024) {
      setError("Vui lòng chọn PDF không quá 25 MB.");
      return;
    }
    try {
      const result = await createImport.mutateAsync(file);
      setImportId(result.id);
      setCreating(false);
      setFile(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải file lên.");
    }
  };

  const handleRetry = async () => {
    if (!importId || !statusReady || retryImport.isPending || publishImport.isPending || reviewing) return;
    setError(undefined);
    try {
      await retryImport.mutateAsync(importId);
      void statusQuery.refetch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể thử lại.");
    }
  };

  const handlePublish = async () => {
    if (!importId || !canPublish) return;
    setError(undefined);
    try {
      await publishImport.mutateAsync(importId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa thể xuất bản đề.");
    }
  };

  const isStatusLoading = statusQuery.isLoading && !statusQuery.data;
  const isDraftsLoading = draftsQuery.isLoading && !draftsQuery.data;

  const canPublish = Boolean(
    isReviewRequired &&
      identityReady && !reviewing && !statusQuery.isPlaceholderData && !draftsQuery.isPlaceholderData &&
      !publishImport.isPending &&
      !retryImport.isPending &&
      !statusQuery.isFetching &&
      !statusQuery.isError &&
      !draftsQuery.isError &&
      !draftsQuery.isFetching &&
      draftsQuery.data?.length &&
      draftsQuery.data.every((draft) => draft.status === "APPROVED"),
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Nhập đề từ PDF"
        description="Nhập đề Toán vào ngân hàng câu hỏi. Hệ thống đọc từng trang và giữ lại hình minh họa; bạn kiểm duyệt trước khi sử dụng."
      />

      {invalidId && <div role="alert" className="space-y-3"><p>Đường dẫn phiên nhập không hợp lệ. Không có phiên nào được tải.</p><Button variant="outline" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.delete("importId"); return next; }, { replace: true })}>Bỏ mã phiên không hợp lệ</Button></div>}
      {!importId && !invalidId && <div className="page-guidance"><p>Chọn PDF để tạo một phiên nhập đề. Kiểm duyệt và xuất bản vẫn là các bước riêng.</p><Button className="mt-4" onClick={() => setCreating(true)}><UploadCloud aria-hidden="true" />Nhập đề từ PDF</Button></div>}
      <CreationDialog className="creation-dialog--compact" open={creating} onOpenChange={open => { setCreating(open); if (!open) { setFile(null); setError(undefined); } }} title="Nhập đề từ PDF" description="Chọn PDF tối đa 25 MB. Bản phân tích được giữ để kiểm duyệt trước khi xuất bản." dirty={!!file} busy={createImport.isPending || !identityReady}>{close => (
        <div className="space-y-4">
            <label
              htmlFor="assessment-pdf"
              className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <FileUp className="mb-3 size-8 text-primary" />
              <span className="text-sm font-medium">Chọn file PDF</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Tối đa 25 MB · hỗ trợ đề có công thức và hình
              </span>
              <input
                id="assessment-pdf"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {file && (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {file.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              className="w-full sm:w-auto"
              onClick={() => void handleSubmit()}
              loading={createImport.isPending}
              disabled={!file || !identityReady}
            >
              Bắt đầu phân tích
            </Button>
            <Button variant="ghost" disabled={createImport.isPending} onClick={close}>Hủy</Button>
        </div>
      )}</CreationDialog>

      {importId && isStatusLoading && <AssessmentImportSkeleton />}

      {importId && statusQuery.isError && (
        <ImportQueryError
          label={statusQuery.data ? "Chưa cập nhật được trạng thái mới nhất." : "Chưa tải được trạng thái nhập đề."}
          error={statusQuery.error}
          onRetry={() => void statusQuery.refetch()}
          retrying={statusQuery.isFetching}
        />
      )}

      {importId && draftsQuery.isError && !statusQuery.isError && (
        <ImportQueryError
          label={draftsQuery.data ? "Chưa cập nhật được danh sách câu hỏi mới nhất." : "Chưa tải được danh sách câu hỏi cần kiểm duyệt."}
          error={draftsQuery.error}
          onRetry={() => void draftsQuery.refetch()}
          retrying={draftsQuery.isFetching}
        />
      )}
      {denied && <Button type="button" variant="outline" disabled={reviewing || publishImport.isPending || retryImport.isPending} onClick={() => setParams(previous => {
        const next = new URLSearchParams(previous); next.delete("importId"); return next;
      }, { replace: true })}>Về bước chọn PDF</Button>}

      {visibleStatus && !denied && (
        <>
          <div hidden={!identityReady}><AssessmentImportProgress status={visibleStatus} /></div>

          {visibleStatus.status === "FAILED" && (
            <Button
              variant="outline"
              onClick={() => void handleRetry()}
              loading={retryImport.isPending}
              disabled={!statusReady || retryImport.isPending || publishImport.isPending || reviewing}
            >
              <RefreshCw className="size-4" />
              Thử lại file này
            </Button>
          )}

          {visibleStatus.status === "REVIEW_REQUIRED" && (
            <>
              {isDraftsLoading && !visibleDrafts && <AssessmentDraftsSkeleton />}

              {visibleDrafts && !denied && (
                <>
                  <div hidden={!identityReady}>
                    <AssessmentDraftList
                    drafts={visibleDrafts}
                    importId={visibleStatus.id}
                    blocked={blocked}
                    mediaAllowed={statusReady && draftsQuery.isSuccess && !draftsQuery.isFetching && !draftsQuery.isPlaceholderData}
                    />
                  </div>

                  <Card>
                    <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                      <div>
                        <p className="font-medium">Đã kiểm tra xong?</p>
                        <p className="text-sm text-muted-foreground">
                          Tất cả câu phải được duyệt và có môn/chủ đề trước khi xuất bản.
                        </p>
                      </div>
                      <Button
                        onClick={() => void handlePublish()}
                        loading={publishImport.isPending}
                        disabled={!canPublish}
                      >
                        <Send className="size-4" />
                        Xuất bản ngân hàng câu hỏi
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}

          {visibleStatus.status === "PUBLISHED" && (
            <Card>
              <CardContent className="p-5 text-sm text-emerald-700 dark:text-emerald-300">
                Đợt nhập đã được xuất bản vào ngân hàng câu hỏi.
              </CardContent>
            </Card>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </>
      )}

      {importId && !statusQuery.data && error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ImportQueryError({ label, error, onRetry, retrying }: {
  label: string;
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center">
      <div className="space-y-1">
        <p className="text-sm font-medium text-destructive">{label}</p>
        {error instanceof Error && <p className="text-sm text-muted-foreground">{error.message}</p>}
      </div>
      <Button type="button" variant="outline" onClick={onRetry} loading={retrying}>
        <RefreshCw aria-hidden="true" className="size-4" />Thử tải lại
      </Button>
    </div>
  );
}
