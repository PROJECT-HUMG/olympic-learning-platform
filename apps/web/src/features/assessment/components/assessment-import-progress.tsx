import { Check, CircleAlert, FileUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AssessmentImportStatusResponse } from "../types/assessment-import.types";

const phases = [
  ["QUEUED", "Đã nhận file"],
  ["RENDERING_PAGES", "Đọc từng trang"],
  ["EXTRACTING_TEXT", "Trích xuất văn bản"],
  ["PARSING_QUESTIONS", "Nhận diện câu hỏi"],
  ["CROPPING_ASSETS", "Lưu hình minh họa"],
  ["REVIEW_REQUIRED", "Sẵn sàng kiểm duyệt"],
] as const;

export function AssessmentImportProgress({ status }: { status: AssessmentImportStatusResponse }) {
  const failed = status.status === "FAILED";
  const activeIndex = phases.findIndex(([phase]) => phase === status.phase);

  return (
    <Card aria-busy={status.status === "QUEUED" || status.status === "PROCESSING"}>
      <CardHeader className="gap-3 border-b border-border/70 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-xl p-2", failed ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
            {failed ? <CircleAlert className="size-5" /> : <FileUp className="size-5" />}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{failed ? "Không thể xử lý đề" : "Đang xử lý đề Toán"}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {failed ? status.lastError ?? "Đã xảy ra lỗi khi đọc file." : `${status.processedPages}/${status.totalPages || "?"} trang · ${status.draftCount} câu đã nhận diện`}
            </p>
          </div>
          {!failed && status.status === "PROCESSING" && <Loader2 className="ml-auto size-4 animate-spin text-primary" />}
        </div>
        <Progress value={status.progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{status.phase === "REVIEW_REQUIRED" ? "Đã hoàn tất phân tích" : "Bạn có thể rời màn hình, job vẫn tiếp tục"}</span>
          <span>{status.progress}%</span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-6 sm:grid-cols-5">
        {phases.map(([phase, label], index) => {
          const done = activeIndex >= 0 && index < activeIndex;
          const active = phase === status.phase;
          return (
            <div key={phase} className="flex items-center gap-2 text-xs sm:block">
              <div className={cn("mb-2 flex size-7 items-center justify-center rounded-full border", done || active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                {done ? <Check className="size-3.5" /> : index + 1}
              </div>
              <span className={cn(active ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
