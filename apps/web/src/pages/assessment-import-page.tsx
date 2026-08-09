import { useState } from "react";
import { FileUp, RefreshCw, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AssessmentDraftList } from "@/features/assessment/components/assessment-draft-list";
import { AssessmentImportProgress } from "@/features/assessment/components/assessment-import-progress";
import { AssessmentImportSkeleton } from "@/features/assessment/components/assessment-import-skeleton";
import { useAssessmentImportDrafts, useAssessmentImportStatus, useCreateAssessmentImport, useRetryAssessmentImport } from "@/features/assessment/hooks/use-assessment-import";

export default function AssessmentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importId, setImportId] = useState<string>();
  const [error, setError] = useState<string>();
  const createImport = useCreateAssessmentImport();
  const retryImport = useRetryAssessmentImport();
  const statusQuery = useAssessmentImportStatus(importId);
  const draftsQuery = useAssessmentImportDrafts(importId, statusQuery.data?.status === "REVIEW_REQUIRED");

  if (statusQuery.isLoading && importId) return <AssessmentImportSkeleton />;

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Ngân hàng câu hỏi · Toán</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nhập đề từ PDF</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Hệ thống sẽ đọc từng trang, nhận diện câu hỏi và giữ lại hình minh họa. Bạn luôn kiểm duyệt trước khi sử dụng.</p>
      </header>

      {!importId && <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UploadCloud className="size-5 text-primary" />Chọn đề cần phân tích</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label htmlFor="assessment-pdf" className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
            <FileUp className="mb-3 size-8 text-primary" />
            <span className="text-sm font-medium">Chọn file PDF</span>
            <span className="mt-1 text-xs text-muted-foreground">Tối đa 25 MB · hỗ trợ đề có công thức và hình</span>
            <Input id="assessment-pdf" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          {file && <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">{file.name}<span className="ml-2 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span></div>}
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button className="w-full sm:w-auto" onClick={() => void handleSubmit()} loading={createImport.isPending} disabled={!file}>Bắt đầu phân tích</Button>
        </CardContent>
      </Card>}

      {statusQuery.data && <>
        <AssessmentImportProgress status={statusQuery.data} />
        {statusQuery.data.status === "FAILED" && <Button variant="outline" onClick={() => void handleRetry()} loading={retryImport.isPending}><RefreshCw className="size-4" />Thử lại file này</Button>}
        {statusQuery.data.status === "REVIEW_REQUIRED" && draftsQuery.isLoading && <AssessmentImportSkeleton />}
        {statusQuery.data.status === "REVIEW_REQUIRED" && draftsQuery.data && <AssessmentDraftList drafts={draftsQuery.data} importId={statusQuery.data.id} />}
      </>}
    </div>
  );
}
