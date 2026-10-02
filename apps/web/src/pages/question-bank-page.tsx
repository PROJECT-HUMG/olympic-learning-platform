import { PageHeader } from "@/components/ui/page-header";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Archive, Copy, Eye, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/ui/app-pagination";
import { parseApiError } from "@/lib/api-error";
import { getPageNumber } from "@/lib/list-navigation";
import {
  useArchiveQuestion,
  useDuplicateQuestion,
  useQuestions,
  useRestoreQuestion,
} from "@/features/questions/hooks/use-questions";
import type { Question } from "@/features/questions/types/question.types";

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
      className="flex max-w-xl gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Tìm nội dung câu hỏi"
          className="h-11 pl-9"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Tìm nội dung câu hỏi…"
        />
      </div>
      <Button type="submit" variant="secondary" className="h-11">
        Tìm
      </Button>
    </form>
  );
}

function questionText(question: Question) {
  const value =
    question.content.text ?? question.content.question ?? question.content.stem;
  return typeof value === "string"
    ? value
    : "Câu hỏi chưa có nội dung hiển thị";
}

export default function QuestionBankPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const page = getPageNumber(params.get("page"));
  const query = useQuestions({
    search: search || undefined,
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
      <PageHeader title="Ngân hàng câu hỏi" description="Tìm, sao chép hoặc lưu trữ câu hỏi đã được kiểm duyệt." />
      <QuestionSearch
        key={search}
        value={search}
        onSearch={(value) =>
          setParams((previous) => {
            const next = new URLSearchParams(previous);
            if (value) next.set("search", value);
            else next.delete("search");
            next.delete("page");
            return next;
          })
        }
      />
      {query.isLoading ? (
        <div role="status" className="grid gap-4 md:grid-cols-2">
          <span className="sr-only">Đang tải câu hỏi…</span>
          <div className="h-44 animate-pulse rounded-xl bg-muted" />
          <div className="h-44 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : query.isError ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-border p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Không thể tải ngân hàng câu hỏi.
          </p>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </Button>
        </div>
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
                <CardContent className="space-y-4 p-5">
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
                  <p className="line-clamp-4 break-words text-sm leading-6">
                    {questionText(question)}
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                    {question.status === "PUBLISHED" ? (
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
                    ) : question.status === "ARCHIVED" ? (
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {query.data && (
            <AppPagination
              currentPage={page}
              totalPages={query.data.totalPages}
              onPageChange={(value) =>
                setParams((previous) => {
                  const next = new URLSearchParams(previous);
                  next.set("page", String(value));
                  return next;
                })
              }
            />
          )}
        </>
      )}
    </div>
  );
}
