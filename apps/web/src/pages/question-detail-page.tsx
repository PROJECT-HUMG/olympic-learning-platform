import { getListReturnPath } from "@/lib/list-navigation";
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Send,
  Archive,
  RotateCcw,
  Copy,
  Pencil,
  Eye,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useQuestion,
  useUpdateQuestion,
  usePublishQuestion,
  useArchiveQuestion,
  useRestoreQuestion,
  useDuplicateQuestion,
  useTopics,
} from "@/features/questions/hooks/use-questions";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { parseApiError } from "@/lib/api-error";
import type { Question } from "@/features/questions/types/question.types";

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HARD", label: "Khó" },
  { value: "VERY_HARD", label: "Rất khó" },
] as const;

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  PUBLISHED: "success",
  ARCHIVED: "secondary",
  DRAFT: "warning",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};

const updateSchema = z.object({
  subjectId: z.string().min(1, "Vui lòng chọn môn học"),
  topicId: z.string().min(1, "Vui lòng chọn chủ đề"),
  type: z.string().min(1, "Vui lòng nhập loại câu hỏi"),
  contentText: z.string().min(1, "Nội dung câu hỏi không được trống"),
  answerText: z.string().min(1, "Đáp án không được trống"),
  explanationText: z.string().optional(),
  difficulty: z.string().optional(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

function extractText(json: Record<string, unknown>): string {
  const text = json.text ?? json.question ?? json.stem ?? json.html;
  return typeof text === "string" ? text : JSON.stringify(json, null, 2);
}

function wrapText(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { text };
  }
}

function QuestionDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-32" />
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionAssets({ question }: { question: Question }) {
  if (!question.assets.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="size-5 text-primary" />
          Hình ảnh đính kèm ({question.assets.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {question.assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-muted/20"
            >
              <img
                src={asset.url}
                alt={asset.altText || `Hình ${asset.role}`}
                className="aspect-square w-full object-contain p-2 transition-transform group-hover:scale-105"
              />
              <div className="border-t border-border bg-card px-2 py-1.5">
                <span className="text-xs text-muted-foreground">
                  {asset.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionViewMode({ question }: { question: Question }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Môn học
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {question.subjectName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Chủ đề
              </dt>
              <dd className="mt-1 text-sm font-medium">{question.topicName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Loại câu hỏi
              </dt>
              <dd className="mt-1 text-sm">{question.type}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Độ khó
              </dt>
              <dd className="mt-1 text-sm">
                {DIFFICULTY_OPTIONS.find((d) => d.value === question.difficulty)
                  ?.label ??
                  question.difficulty ??
                  "Chưa đặt"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nội dung câu hỏi</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 text-sm leading-7 font-mono">
            {extractText(question.content)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đáp án</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-lg bg-emerald-50/50 p-4 text-sm leading-7 font-mono dark:bg-emerald-950/20">
            {extractText(question.answer)}
          </pre>
        </CardContent>
      </Card>

      {question.explanation != null &&
        Object.keys(question.explanation as Record<string, unknown>).length >
          0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lời giải</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-blue-50/50 p-4 text-sm leading-7 font-mono dark:bg-blue-950/20">
                {extractText(question.explanation)}
              </pre>
            </CardContent>
          </Card>
        )}

      <QuestionAssets question={question} />
    </div>
  );
}

function QuestionEditForm({
  question,
  onCancel,
}: {
  question: Question;
  onCancel: () => void;
}) {
  const updateQuestion = useUpdateQuestion();
  const { data: metadata } = useDocumentMetadata();
  const subjects = metadata?.subjects ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      subjectId: question.subjectId,
      topicId: question.topicId,
      type: question.type,
      contentText: extractText(question.content),
      answerText: extractText(question.answer),
      explanationText: question.explanation
        ? extractText(question.explanation)
        : "",
      difficulty: question.difficulty ?? "",
    },
  });

  const selectedSubjectId = watch("subjectId");
  const { data: topics, isLoading: isTopicsLoading } =
    useTopics(selectedSubjectId);

  async function onSubmit(data: UpdateFormValues) {
    try {
      await updateQuestion.mutateAsync({
        id: question.id,
        data: {
          subjectId: data.subjectId,
          topicId: data.topicId,
          type: data.type,
          content: wrapText(data.contentText),
          answer: wrapText(data.answerText),
          explanation: data.explanationText
            ? wrapText(data.explanationText)
            : null,
          difficulty: data.difficulty || null,
        },
      });
      toast.success("Đã cập nhật câu hỏi thành công.");
      onCancel();
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Không thể cập nhật câu hỏi.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="edit-subject" className="text-sm font-medium">
                Môn học <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedSubjectId}
                onValueChange={(value) => {
                  setValue("subjectId", value, { shouldValidate: true });
                  setValue("topicId", "", { shouldValidate: false });
                }}
              >
                <SelectTrigger id="edit-subject">
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && (
                <p className="text-xs text-destructive">
                  {errors.subjectId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-topic" className="text-sm font-medium">
                Chủ đề <span className="text-destructive">*</span>
              </label>
              <Select
                value={watch("topicId")}
                onValueChange={(value) =>
                  setValue("topicId", value, { shouldValidate: true })
                }
                disabled={!selectedSubjectId || isTopicsLoading}
              >
                <SelectTrigger id="edit-topic">
                  <SelectValue
                    placeholder={
                      isTopicsLoading ? "Đang tải..." : "Chọn chủ đề"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {topics?.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.topicId && (
                <p className="text-xs text-destructive">
                  {errors.topicId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="edit-type"
              label="Loại câu hỏi"
              required
              placeholder="multiple_choice"
              error={errors.type?.message}
              {...register("type")}
            />

            <div className="space-y-2">
              <label htmlFor="edit-difficulty" className="text-sm font-medium">
                Độ khó
              </label>
              <Select
                value={watch("difficulty") ?? ""}
                onValueChange={(value) =>
                  setValue("difficulty", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="edit-difficulty">
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nội dung câu hỏi *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="edit-content"
            rows={8}
            className="font-mono text-sm leading-7"
            placeholder="Nhập nội dung câu hỏi..."
            {...register("contentText")}
          />
          {errors.contentText && (
            <p className="mt-1 text-xs text-destructive">
              {errors.contentText.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đáp án *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="edit-answer"
            rows={6}
            className="font-mono text-sm leading-7"
            placeholder="Nhập đáp án..."
            {...register("answerText")}
          />
          {errors.answerText && (
            <p className="mt-1 text-xs text-destructive">
              {errors.answerText.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lời giải (tuỳ chọn)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="edit-explanation"
            rows={6}
            className="font-mono text-sm leading-7"
            placeholder="Nhập lời giải chi tiết..."
            {...register("explanationText")}
          />
        </CardContent>
      </Card>

      <QuestionAssets question={question} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          <Save className="size-4" />
          Lưu thay đổi
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </form>
  );
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const listPath = location.pathname.startsWith("/admin/")
    ? "/admin/questions"
    : "/lecturer/questions";
  const backPath = getListReturnPath(location.state?.from, listPath);
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: question,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuestion(id);
  const publishQuestion = usePublishQuestion();
  const archiveQuestion = useArchiveQuestion();
  const restoreQuestion = useRestoreQuestion();
  const duplicateQuestion = useDuplicateQuestion();

  if (isLoading) return <QuestionDetailSkeleton />;

  if (isError || !question) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Không thể tải câu hỏi. Hãy thử lại hoặc quay về ngân hàng câu hỏi.
            <div className="mt-4">
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDraft = question.status === "DRAFT";

  async function handleAction(
    action: { mutateAsync: (id: string) => Promise<unknown> },
    successMessage: string,
  ) {
    try {
      await action.mutateAsync(question!.id);
      toast.success(successMessage);
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Thao tác thất bại.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate(backPath)}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Câu hỏi #{question.id.slice(0, 8)}
            </h1>
            <Badge variant={STATUS_VARIANT[question.status] ?? "secondary"}>
              {STATUS_LABEL[question.status] ?? question.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {question.subjectName} · {question.topicName}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isDraft && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-4" />
              Chỉnh sửa
            </Button>
          )}
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <Eye className="size-4" />
              Xem
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={duplicateQuestion.isPending}
            onClick={() =>
              void handleAction(duplicateQuestion, "Đã sao chép câu hỏi.")
            }
          >
            <Copy className="size-4" />
            Sao chép
          </Button>
          {isDraft && (
            <Button
              size="sm"
              loading={publishQuestion.isPending}
              onClick={() =>
                void handleAction(publishQuestion, "Đã xuất bản câu hỏi.")
              }
            >
              <Send className="size-4" />
              Xuất bản
            </Button>
          )}
          {question.status === "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              loading={archiveQuestion.isPending}
              onClick={() =>
                void handleAction(archiveQuestion, "Đã lưu trữ câu hỏi.")
              }
            >
              <Archive className="size-4" />
              Lưu trữ
            </Button>
          )}
          {question.status === "ARCHIVED" && (
            <Button
              variant="outline"
              size="sm"
              loading={restoreQuestion.isPending}
              onClick={() =>
                void handleAction(restoreQuestion, "Đã khôi phục câu hỏi.")
              }
            >
              <RotateCcw className="size-4" />
              Khôi phục
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing && isDraft ? (
        <QuestionEditForm
          question={question}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <QuestionViewMode question={question} />
      )}
    </div>
  );
}
