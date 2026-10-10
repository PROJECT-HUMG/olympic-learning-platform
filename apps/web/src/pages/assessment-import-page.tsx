import { PageHeader } from "@/components/ui/page-header";
import { CreationDialog } from "@/components/ui/creation-dialog";
import { useState } from "react";
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
  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importId, setImportId] = useState<string>();
  const [error, setError] = useState<string>();
  const createImport = useCreateAssessmentImport();
  const retryImport = useRetryAssessmentImport();
  const publishImport = usePublishAssessmentImport();
  const statusQuery = useAssessmentImportStatus(importId);
  const isReviewRequired = statusQuery.data?.status === "REVIEW_REQUIRED";
  const draftsQuery = useAssessmentImportDrafts(importId, isReviewRequired);

  const handleSubmit = async () => {
    if (!file) return;
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
    if (!importId) return;
    setError(undefined);
    try {
      await retryImport.mutateAsync(importId);
      void statusQuery.refetch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể thử lại.");
    }
  };

  const handlePublish = async () => {
    if (!importId) return;
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

      {!importId && <div className="page-guidance"><p>Chọn PDF để tạo một phiên nhập đề. Kiểm duyệt và xuất bản vẫn là các bước riêng.</p><Button className="mt-4" onClick={() => setCreating(true)}><UploadCloud aria-hidden="true" />Nhập đề từ PDF</Button></div>}
      <CreationDialog className="creation-dialog--compact" open={creating} onOpenChange={open => { setCreating(open); if (!open) { setFile(null); setError(undefined); } }} title="Nhập đề từ PDF" description="Chọn PDF tối đa 25 MB. Bản phân tích được giữ để kiểm duyệt trước khi xuất bản." dirty={!!file} busy={createImport.isPending}>{close => (
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
              disabled={!file}
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

      {statusQuery.data && (
        <>
          <AssessmentImportProgress status={statusQuery.data} />

          {statusQuery.data.status === "FAILED" && (
            <Button
              variant="outline"
              onClick={() => void handleRetry()}
              loading={retryImport.isPending}
              disabled={retryImport.isPending}
            >
              <RefreshCw className="size-4" />
              Thử lại file này
            </Button>
          )}

          {statusQuery.data.status === "REVIEW_REQUIRED" && (
            <>
              {isDraftsLoading && <AssessmentDraftsSkeleton />}

              {draftsQuery.isError && (
                <ImportQueryError
                  label={draftsQuery.data ? "Chưa cập nhật được danh sách câu hỏi mới nhất." : "Chưa tải được danh sách câu hỏi cần kiểm duyệt."}
                  error={draftsQuery.error}
                  onRetry={() => void draftsQuery.refetch()}
                  retrying={draftsQuery.isFetching}
                />
              )}

              {draftsQuery.data && (
                <>
                  <AssessmentDraftList
                    drafts={draftsQuery.data}
                    importId={statusQuery.data.id}
                  />

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

          {statusQuery.data.status === "PUBLISHED" && (
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
