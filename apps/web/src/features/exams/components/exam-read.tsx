import type { ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { getListReturnPath } from "@/lib/list-navigation";
import { examErrorMessage } from "../exam-contract";
import { formatPoints, placementAssetIds } from "../exam-placement";
import { formatRelease, zoneLabel } from "../exam-time";
import { useExamDrafts, useExamPaper, useExamPapers, useExamPreview } from "../hooks/use-exams";
import type { StaffExamItem, StaffExamView, StudentExamPaper } from "../types";
import { ExamLoading, ExamProblem } from "./exam-feedback";
import { FrozenExamItem, QuestionScopedItem } from "./exam-item-view";
import { usePaperFigureResolver } from "./paper-figure-resolver";

function Shell({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="page-shell"><PageHeader title={title} description={description} actions={actions} />{children}</div>;
}

function ExamListItem({
  title,
  href,
  from,
  version,
  points,
  releaseAt,
}: {
  title: string;
  href: string;
  from: string;
  version: string;
  points: number;
  releaseAt: string | null;
}) {
  return (
    <li className="content-card space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 break-words min-w-0 max-w-full"
          to={href}
          state={{ from }}
        >
          <span className="min-w-0 break-words">{title}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{version}</Badge>
          <Badge variant="outline">{formatPoints(points)} điểm</Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground">
        <span>{formatRelease(releaseAt)}</span>
        <span aria-hidden="true" className="text-muted-foreground/40">·</span>
        <span>{zoneLabel()}</span>
      </div>
    </li>
  );
}

export function ExamDraftList({ listPath, papersPath }: { listPath: string; papersPath: string }) {
  const query = useExamDrafts();
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  if (query.isLoading) return <Shell title="Đề nháp"><ExamLoading label="Đang tải danh sách đề…" /></Shell>;
  if (query.isError) return <Shell title="Đề nháp"><ExamProblem message={examErrorMessage(query.error)} retrying={query.isFetching} onRetry={() => void query.refetch()} /></Shell>;
  return (
    <Shell
      title="Đề nháp"
      description="Danh sách đề bạn được sửa."
      actions={
        <>
          <Button asChild>
            <Link to={`${listPath}/new`} state={{ from }}>Tạo đề</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={papersPath}>Đề đã xuất bản</Link>
          </Button>
        </>
      }
    >
      {query.data?.length ? (
        <ul className="space-y-4">
          {query.data.map((draft) => (
            <ExamListItem
              key={draft.id}
              title={draft.title.trim() || "Đề chưa có tiêu đề"}
              href={`${listPath}/${draft.id}`}
              from={from}
              version={`Bản nháp ${draft.version}`}
              points={draft.totalPoints}
              releaseAt={draft.releaseAt}
            />
          ))}
        </ul>
      ) : (
        <p>Chưa có đề nháp.</p>
      )}
    </Shell>
  );
}

export function ExamPreview({ examId, listPath }: { examId: string; listPath: string }) {
  const [params, setParams] = useSearchParams();
  const solutions = params.get("solutions") === "1";
  const query = useExamPreview(examId, solutions);
  const location = useLocation();
  const back = getListReturnPath((location.state as { from?: unknown } | null)?.from, `${listPath}/${examId}`);
  return <Shell title="Xem trước đề" actions={<Button variant="outline" asChild><Link to={back}>Quay lại đề</Link></Button>}>
    <div className="mb-4 flex flex-wrap gap-2"><Button type="button" variant={solutions ? "outline" : "default"} onClick={() => setParams({})}>Xem đề</Button><Button type="button" variant={solutions ? "default" : "outline"} onClick={() => setParams({ solutions: "1" })}>Xem lời giải</Button></div>
    {query.isLoading ? <ExamLoading label="Đang tải bản xem trước…" /> : null}
    {query.isError ? <ExamProblem message={examErrorMessage(query.error)} retrying={query.isFetching} onRetry={() => void query.refetch()} /> : null}
    {query.data ? <StaffBody view={query.data} source="question" showSolutions={solutions} /> : null}
  </Shell>;
}

export function ExamPaperList({ papersPath }: { papersPath: string }) {
  const query = useExamPapers();
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  if (query.isLoading) return <Shell title="Đề đã xuất bản"><ExamLoading label="Đang tải danh sách đề…" /></Shell>;
  if (query.isError) return <Shell title="Đề đã xuất bản"><ExamProblem message={examErrorMessage(query.error)} retrying={query.isFetching} onRetry={() => void query.refetch()} /></Shell>;
  return (
    <Shell title="Đề đã xuất bản" description="Mỗi dòng là một phiên bản đã xuất bản.">
      {query.data?.length ? (
        <ul className="space-y-4">
          {query.data.map((paper) => (
            <ExamListItem
              key={paper.id}
              title={paper.title}
              href={`${papersPath}/${paper.id}`}
              from={from}
              version={`Phiên bản ${paper.versionNumber}`}
              points={paper.totalPoints}
              releaseAt={paper.releaseAt}
            />
          ))}
        </ul>
      ) : (
        <p>Chưa có đề đã xuất bản.</p>
      )}
    </Shell>
  );
}

export function ExamPaperRead({ paperId, papersPath }: { paperId: string; papersPath: string }) {
  const user = useCurrentUser();
  const staff = user.data?.role === "ADMIN" || user.data?.role === "LECTURER";
  const [params, setParams] = useSearchParams();
  const solutions = staff && params.get("solutions") === "1";
  const audience = user.data ? (staff ? "staff" : "student") : null;
  const query = useExamPaper(paperId, audience, solutions);
  const back = getListReturnPath((useLocation().state as { from?: unknown } | null)?.from, papersPath);
  return <Shell title="Đề" actions={<Button variant="outline" asChild><Link to={back}>Quay lại danh sách</Link></Button>}>
    {staff ? <div className="mb-4 flex flex-wrap gap-2"><Button type="button" variant={solutions ? "outline" : "default"} onClick={() => setParams({})}>Xem đề</Button><Button type="button" variant={solutions ? "default" : "outline"} onClick={() => setParams({ solutions: "1" })}>Xem lời giải</Button></div> : null}
    {user.isLoading || query.isLoading ? <ExamLoading label="Đang tải đề…" /> : null}
    {query.isError ? <ExamProblem message={examErrorMessage(query.error)} retrying={query.isFetching} onRetry={() => void query.refetch()} /> : null}
    {query.data && audience === "staff" ? <StaffBody view={query.data as StaffExamView} source="paper" paperId={paperId} showSolutions={solutions} /> : null}
    {query.data && audience === "student" ? <StudentBody paper={query.data as StudentExamPaper} /> : null}
  </Shell>;
}

function StaffBody({ view, source, paperId, showSolutions }: { view: StaffExamView; source: "question" | "paper"; paperId?: string; showSolutions: boolean }) {
  return <article className="space-y-6">
    <header className="space-y-2"><h2 className="text-xl font-semibold">{view.title}</h2><p className="text-sm">{formatPoints(view.totalPoints)} điểm · {view.id ? `Phiên bản ${view.versionNumber}` : "Bản xem trước, chưa xuất bản"} · {formatRelease(view.releaseAt)} · {zoneLabel()}</p>{view.instructions.trim() !== "" ? <p className="whitespace-pre-wrap">{view.instructions}</p> : null}</header>
    {source === "paper" && paperId ? <FrozenItems paperId={paperId} items={view.items} showSolutions={showSolutions} /> : <div className="space-y-8">{view.items.map((item, index) => <QuestionScopedItem key={`${item.questionId}-${index}`} index={index} item={item} showSolutions={showSolutions} />)}</div>}
  </article>;
}

function FrozenItems({ paperId, items, showSolutions }: { paperId: string; items: StaffExamItem[]; showSolutions: boolean }) {
  const figures = usePaperFigureResolver(paperId, items.flatMap((item) => placementAssetIds(item.content, showSolutions ? item.explanation ?? null : null, showSolutions)));
  return <div className="space-y-8">{items.map((item, index) => <FrozenExamItem key={`${item.questionId}-${index}`} index={index} item={item} showSolutions={showSolutions} resolveFigure={figures.resolveFigure} figures={figures.figures} onRetry={figures.retry} />)}</div>;
}

function StudentBody({ paper }: { paper: StudentExamPaper }) {
  const figures = usePaperFigureResolver(paper.id, paper.items.flatMap((item) => placementAssetIds(item.content, null, false)));
  return <article className="space-y-6">
    <header className="space-y-2"><h2 className="text-xl font-semibold">{paper.title}</h2><p className="text-sm">Phiên bản {paper.versionNumber} · {formatPoints(paper.totalPoints)} điểm · {formatRelease(paper.releaseAt)} · {zoneLabel()}</p>{paper.instructions.trim() !== "" ? <p className="whitespace-pre-wrap">{paper.instructions}</p> : null}</header>
    <div className="space-y-8">{paper.items.map((item, index) => <FrozenExamItem key={`${item.questionId}-${index}`} index={index} item={item} showSolutions={false} resolveFigure={figures.resolveFigure} figures={figures.figures} onRetry={figures.retry} />)}</div>
  </article>;
}
