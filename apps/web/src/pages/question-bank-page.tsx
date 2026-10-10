import { OptionQueryFeedback } from "@/components/ui/option-query-feedback";
import { RetryFeedback } from "@/components/ui/retry-feedback";
import { SearchInput } from "@/components/ui/search-input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Archive, Copy, Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { AppPagination } from "@/components/ui/app-pagination";
import { parseApiError } from "@/lib/api-error";
import {
  questionBankLabel,
  questionBankQuery,
  questionPermissions,
  replaceQuestionBankParam,
} from "@/features/questions/components/manual-question";
import {
  useArchiveQuestion,
  useDuplicateQuestion,
  useQuestions,
  useRestoreQuestion,
} from "@/features/questions/hooks/use-questions";

function QuestionSearch({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (search: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <form
      className="flex min-w-0 flex-[1_1_20rem] gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <SearchInput
        aria-label="Tìm nội dung câu hỏi"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Tìm nội dung câu hỏi…"
      />
      <Button type="submit" variant="secondary" className="h-11">
        Tìm
      </Button>
    </form>
  );
}

export default function QuestionBankPage() {
  const [params, setParams] = useSearchParams();
  const bank = questionBankQuery(params);
  const page = bank.page;
  const query = useQuestions({
    search: bank.search,
    subjectId: bank.subjectId,
    status: bank.status,
    page: page - 1,
    size: 20,
  });
  const totalPages = query.data?.totalPages;
  useEffect(() => {
    if (totalPages && page > totalPages)
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set("page", String(totalPages));
          return next;
        },
        { replace: true },
      );
  }, [totalPages, page, setParams]);
  const location = useLocation();
  const currentUser = useCurrentUser();
  const metadata = useDocumentMetadata();
  const subjects = metadata.data?.subjects ?? [];
  const duplicate = useDuplicateQuestion();
  const archive = useArchiveQuestion();
  const restore = useRestoreQuestion();
  const pending = duplicate.isPending || archive.isPending || restore.isPending;
  const feedback = (success: string) => ({
    onSuccess: () => toast.success(success),
    onError: (error: unknown) =>
      toast.error(
        parseApiError(error).detail || "Thao tác thất bại. Hãy thử lại.",
      ),
  });
  const statusLabel = {
    DRAFT: "Bản nháp",
    PUBLISHED: "Đã xuất bản",
    ARCHIVED: "Lưu trữ",
  };
  return (
    <div className="page-shell">
      <PageHeader
        title="Ngân hàng câu hỏi"
        description="Tìm, sao chép hoặc lưu trữ câu hỏi đã được kiểm duyệt."
        actions={
          <Button asChild className="min-h-11">
            <Link to={`${location.pathname}/new`} state={{ from: location.pathname + location.search }}>
              Tạo câu hỏi
            </Link>
          </Button>
        }
      />
      <div className="page-toolbar filter-panel !items-end">
        <QuestionSearch
          key={bank.search ?? ""}
          value={bank.search ?? ""}
          onSearch={(value) => setParams((previous) => replaceQuestionBankParam(previous, "search", value))}
        />
        <div className="flex min-w-0 flex-[1_1_24rem] flex-wrap gap-3">
          <label className="flex min-w-0 flex-[1_1_12rem] flex-col gap-1 text-sm">
            Môn học
            <NativeSelect
              disabled={metadata.isPending || metadata.isError}
              value={params.get("subjectId") ?? ""}
              onChange={(event) => setParams((previous) => replaceQuestionBankParam(previous, "subjectId", event.target.value))}
            >
              <option value="">Tất cả</option>
              {params.get("subjectId") && !subjects.some(subject => subject.id === params.get("subjectId")) && <option value={params.get("subjectId")!}>Môn đã lọc (chưa tải tên)</option>}
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </NativeSelect>
          </label>
          <label className="flex min-w-0 flex-[1_1_12rem] flex-col gap-1 text-sm">
            Trạng thái
            <NativeSelect
              value={params.get("status") ?? ""}
              onChange={(event) => setParams((previous) => replaceQuestionBankParam(previous, "status", event.target.value))}
            >
              <option value="">Tất cả</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </NativeSelect>
          </label>
        </div>
      </div>
      <OptionQueryFeedback label="môn học" pending={metadata.isLoading} error={metadata.isError} retrying={metadata.isFetching} onRetry={() => void metadata.refetch()} />
      {query.isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-4 md:grid-cols-2">
          <span className="sr-only">Đang tải câu hỏi…</span>
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : query.isError ? (
        <RetryFeedback
          message="Không thể tải ngân hàng câu hỏi."
          actions={
            <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : (
        <>
          {query.data?.content.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Chưa có câu hỏi phù hợp. Hãy thử một từ khóa khác hoặc nhập đề
                PDF.
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {query.data?.content.map((question) => (
              <Card key={question.id}>
                <CardHeader className="space-y-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 break-words text-sm font-semibold">
                      {question.subjectName} · {question.topicName}
                    </span>
                    <Badge
                      variant={
                        question.status === "PUBLISHED"
                          ? "success"
                          : question.status === "ARCHIVED"
                            ? "secondary"
                            : "warning"
                      }
                    >
                      {statusLabel[question.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="line-clamp-4 break-words text-sm leading-6">
                    {questionBankLabel(question.content)}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                  >
                    <Link
                      to={`${location.pathname}/${question.id}`}
                      state={{ from: location.pathname + location.search }}
                    >
                      <Eye aria-hidden="true" className="size-4" />
                      Chi tiết
                    </Link>
                  </Button>
                  {questionPermissions(currentUser.data, question).duplicate ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() =>
                        duplicate.mutate(
                          question.id,
                          feedback("Đã sao chép câu hỏi"),
                        )
                      }
                    >
                      <Copy aria-hidden="true" className="size-4" />
                      Sao chép
                    </Button>
                  ) : null}
                  {questionPermissions(currentUser.data, question).archive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() =>
                        archive.mutate(
                          question.id,
                          feedback("Đã lưu trữ câu hỏi"),
                        )
                      }
                    >
                      <Archive aria-hidden="true" className="size-4" />
                      Lưu trữ
                    </Button>
                  ) : null}
                  {questionPermissions(currentUser.data, question).restore ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() =>
                        restore.mutate(
                          question.id,
                          feedback("Đã khôi phục câu hỏi"),
                        )
                      }
                    >
                      <RotateCcw aria-hidden="true" className="size-4" />
                      Khôi phục
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            ))}
          </div>
          {query.data && (
            <AppPagination
              currentPage={page}
              totalPages={query.data.totalPages}
              onPageChange={(value) =>
                setParams((previous) => replaceQuestionBankParam(previous, "page", String(value)))
              }
            />
          )}
        </>
      )}
    </div>
  );
}
