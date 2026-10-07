import { FigureNotices } from "./figure-notices";
import { NativeSelect } from "@/components/ui/native-select";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, Copy, Eye, Pencil, RotateCcw, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { parseApiError } from "@/lib/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import {
  useArchiveQuestion,
  useCreateQuestion,
  useDuplicateQuestion,
  usePublishQuestion,
  useRestoreQuestion,
  useTopics,
  useUpdateQuestion,
} from "../hooks/use-questions.ts";
import { questionService } from "../services/question.service.ts";
import type { Question, QuestionStatus } from "../types/question.types.ts";
import type { QuestionPart, ScientificAnswer, ScientificExplanation } from "../types/scientific-content.ts";
import {
  DIFFICULTIES,
  LEGACY_ASSET_ADVICE,
  MANUAL_TYPES,
  RESTORE_CHECK_NOTE,
  SAVE_BEFORE_FIGURE_UPLOAD,
  TYPE_LABEL,
  addOption,
  addPart,
  createManualDraft,
  draftIssues,
  isSchemaVersionOne,
  movePart,
  optionLabel,
  partLabel,
  pendingFigures,
  persistDraft,
  publishIssues,
  questionPermissions,
  removeOption,
  removePart,
  reopenManualDraft,
  retainPendingFigures,
  saveFailureNotice,
  setCorrectOption,
  withQuestionType,
  type ManualAuthorHandoff,
  type ManualDraft,
  type ManualIssue,
} from "./manual-question.ts";
import { ScientificBlockEditor } from "./scientific-block-editor.tsx";
import { ManualQuestionViewer } from "./manual-question-viewer.tsx";
import { collectFigureAssetIds, viewerFigureGroups } from "./figure-resolution.ts";
import { usePrivateFigureResolver } from "./figure-resolution.tsx";

const LOSSY_NOTE = "Nội dung đã lưu không đọc lại đủ để ghi đè. Hãy tạo bản nháp mới nếu cần sửa.";
const PENDING_NOTE = "Ảnh chưa tải lên chỉ được giữ trên trang này. Tải lại trang sẽ không còn những ảnh đó cho đến khi tải lên.";
const STATUS_LABEL: Record<QuestionStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};
const STATUS_VARIANT = {
  DRAFT: "warning",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
} as const;

/** Same-id schema 1 document with a higher version wins at the initial seed. Otherwise the handoff stays, including figures not stored yet. */
function startSession(question: Question | null, handoff: ManualAuthorHandoff | null) {
  const handoffQuestionId = handoff?.questionId ?? null;
  const handoffVersion = handoff?.version ?? null;
  if (question != null && newerServer(question, handoff)) {
    return { ...serverSession(question), fromHandoff: false, handoffQuestionId, handoffVersion };
  }
  if (handoff) {
    const draft = structuredClone(handoff.draft);
    return { draft, lossy: handoff.lossy, version: handoff.version, status: handoff.status, notice: handoff.notice, savedJson: JSON.stringify(draft), fromHandoff: true, handoffQuestionId, handoffVersion };
  }
  if (question && isSchemaVersionOne(question.content)) {
    return { ...serverSession(question), fromHandoff: false, handoffQuestionId, handoffVersion };
  }
  const draft = createManualDraft("single_choice");
  return { draft, lossy: false, version: null as number | null, status: null as QuestionStatus | null, notice: null as string | null, savedJson: JSON.stringify(draft), fromHandoff: false, handoffQuestionId, handoffVersion };
}

function newerServer(question: Question | null, handoff: ManualAuthorHandoff | null): boolean {
  return handoff != null
    && question != null
    && question.id === handoff.questionId
    && typeof handoff.version === "number"
    && question.version > handoff.version
    && isSchemaVersionOne(question.content);
}

function serverSession(question: Question) {
  const opened = reopenManualDraft({
    subjectId: question.subjectId,
    topicId: question.topicId,
    type: question.type,
    difficulty: question.difficulty,
    content: question.content,
    answer: question.answer,
    explanation: question.explanation,
  });
  return { draft: opened.draft, lossy: opened.lossy, version: question.version, status: question.status, notice: null as string | null, savedJson: JSON.stringify(opened.draft) };
}

/** Remove the handoff from this history entry without a router update, so this mount keeps its draft. */
function consumeManualHandoff() {
  const state: unknown = window.history.state;
  if (typeof state !== "object" || state === null || !("usr" in state)) return;
  const record = state as Record<string, unknown>;
  const usr = record.usr;
  if (typeof usr !== "object" || usr === null || Array.isArray(usr) || !("manualHandoff" in usr)) return;
  const nextUsr = { ...(usr as Record<string, unknown>) };
  delete nextUsr.manualHandoff;
  window.history.replaceState({ ...record, usr: nextUsr }, "");
}

function failureStatus(error: unknown): number {
  if (typeof error === "object" && error !== null && "response" in error) {
    const status = (error as { response?: { status?: unknown } }).response?.status;
    if (typeof status === "number") return status;
  }
  return parseApiError(error).status;
}

function manualView(draft: ManualDraft): { parts: QuestionPart[]; answer: ScientificAnswer; explanation: ScientificExplanation } {
  const responseType = draft.type === "single_choice" ? "SINGLE_CHOICE" : draft.type === "multiple_choice" ? "MULTIPLE_CHOICE" : "WRITTEN";
  return {
    parts: draft.parts.map((part) => ({
      id: part.id,
      responseType,
      prompt: part.prompt,
      options: part.options.map((option) => ({ id: option.id, content: option.content })),
    })),
    answer: { parts: draft.parts.map((part) => ({ partId: part.id, correctOptionIds: part.correctOptionIds })) },
    explanation: { parts: draft.parts.map((part) => ({ partId: part.id, solution: part.solution, rubric: part.rubric })) },
  };
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function IssueList({ issues }: { issues: ManualIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      <ul className="list-disc space-y-1 pl-5">
        {issues.map((issue, index) => <li key={`${issue.path}:${index}`}>{issue.message}</li>)}
      </ul>
    </div>
  );
}

export function ManualQuestionWorkspace({
  routeId,
  question,
  handoff,
  listPath,
  returnTo,
  onReload,
}: {
  routeId: string | null;
  question: Question | null;
  handoff: ManualAuthorHandoff | null;
  listPath: string;
  returnTo: string;
  onReload: () => Promise<{ isError: boolean; data?: Question | null }>;
}) {
  const navigate = useNavigate();
  const current = useCurrentUser();
  const metadata = useDocumentMetadata();
  const [seed] = useState(() => startSession(question, handoff));
  const [handoffArrivalSettled, setHandoffArrivalSettled] = useState(false);
  const [draft, setDraft] = useState(seed.draft);
  const [lossy, setLossy] = useState(seed.lossy);
  const [version, setVersion] = useState<number | null>(seed.version);
  const [status, setStatus] = useState<QuestionStatus | null>(seed.status);
  const [savedJson, setSavedJson] = useState(seed.savedJson);
  const [notice, setNotice] = useState<string | null>(seed.notice);
  const [conflict, setConflict] = useState(false);
  const [editing, setEditing] = useState(routeId == null);
  const [issues, setIssues] = useState<ManualIssue[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(question?.id ?? handoff?.questionId ?? null);
  const [reloading, setReloading] = useState(false);
  const topics = useTopics(draft.subjectId || undefined);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const publishQuestion = usePublishQuestion();
  const archiveQuestion = useArchiveQuestion();
  const restoreQuestion = useRestoreQuestion();
  const duplicateQuestion = useDuplicateQuestion();
  const user = current.data;
  const staff = user?.role === "ADMIN" || user?.role === "LECTURER";
  const permissions = questionPermissions(user, question);
  const activeId = routeId ?? createdId;
  const effectiveStatus = status ?? question?.status ?? null;
  const lockedStatus = effectiveStatus === "PUBLISHED" || effectiveStatus === "ARCHIVED";
  const canEdit = !current.isLoading
    && !lossy
    && !lockedStatus
    && (question?.assets.length ?? 0) === 0
    && (question ? permissions.edit : staff && (routeId == null || handoff?.questionId === routeId));
  const canPublish = canEdit && (question == null || permissions.publish);
  const showEditor = editing && canEdit;
  const view = manualView(draft);
  const assetIds = collectFigureAssetIds(viewerFigureGroups({
    showAnswer: staff,
    stem: draft.stem,
    parts: view.parts,
    explanation: view.explanation,
  }));
  const figures = usePrivateFigureResolver(activeId, assetIds);
  const subjects = metadata.data?.subjects ?? [];
  const subjectName = subjects.find((subject) => subject.id === draft.subjectId)?.name ?? question?.subjectName ?? (draft.subjectId || "Chưa chọn môn");
  const topicName = topics.data?.find((topic) => topic.id === draft.topicId)?.name ?? question?.topicName ?? (draft.topicId || "Chưa chọn chủ đề");
  const badgeStatus = effectiveStatus ?? "DRAFT";
  const busy = createQuestion.isPending || updateQuestion.isPending || publishQuestion.isPending || archiveQuestion.isPending || restoreQuestion.isPending || duplicateQuestion.isPending || reloading;
  const choice = draft.type === "single_choice" || draft.type === "multiple_choice";

  function redirectTo(saved: { id: string; version: number; status: QuestionStatus }, next: ManualDraft, nextNotice: string | null, nextLossy: boolean) {
    navigate(`${listPath}/${saved.id}`, {
      replace: true,
      state: {
        from: returnTo,
        manualHandoff: {
          questionId: saved.id,
          draft: next,
          version: saved.version,
          status: saved.status,
          notice: nextNotice,
          lossy: nextLossy,
        } satisfies ManualAuthorHandoff,
      },
    });
  }

  function applyServer(next: Question) {
    const opened = reopenManualDraft({
      subjectId: next.subjectId,
      topicId: next.topicId,
      type: next.type,
      difficulty: next.difficulty,
      content: next.content,
      answer: next.answer,
      explanation: next.explanation,
    });
    setDraft(opened.draft);
    setLossy(opened.lossy);
    setVersion(next.version);
    setStatus(next.status);
    setSavedJson(JSON.stringify(opened.draft));
    setIssues([]);
    setConflict(false);
    setNotice(null);
    setCreatedId(next.id);
  }

  useEffect(() => {
    consumeManualHandoff();
  }, []);

  useEffect(() => {
    if (!seed.fromHandoff || handoffArrivalSettled || question == null) return;
    setHandoffArrivalSettled(true);
    if (question.id !== seed.handoffQuestionId || typeof seed.handoffVersion !== "number" || question.version <= seed.handoffVersion) return;
    if (!isSchemaVersionOne(question.content)) return;
    if (JSON.stringify(draft) !== seed.savedJson) {
      const failure = saveFailureNotice(409, "Question was updated by someone else");
      setConflict(failure.conflict);
      setNotice(failure.notice);
      return;
    }
    applyServer(question);
  }, [draft, question, handoffArrivalSettled, seed.fromHandoff, seed.handoffQuestionId, seed.handoffVersion, seed.savedJson]);

  async function discardServer() {
    setReloading(true);
    const result = await onReload();
    setReloading(false);
    if (result.isError || !result.data || !isSchemaVersionOne(result.data.content)) {
      setNotice("Không tải được bản đã lưu. Nội dung đang soạn vẫn còn trên trang.");
      return;
    }
    applyServer(result.data);
  }

  async function uploadFigure(file: File): Promise<string> {
    if (activeId == null) {
      setNotice(SAVE_BEFORE_FIGURE_UPLOAD);
      throw new Error(SAVE_BEFORE_FIGURE_UPLOAD);
    }
    try {
      return (await questionService.uploadFigure(activeId, file)).id;
    } catch (error) {
      const text = parseApiError(error).detail || "Tải ảnh thất bại. Bản nháp vẫn được giữ.";
      setNotice(`${text} Nội dung đang soạn vẫn còn trên trang.`);
      throw new Error(text);
    }
  }

  async function persist(creating: boolean): Promise<{ id: string; version: number; status: QuestionStatus; draft: ManualDraft } | null> {
    if (!canEdit) return null;
    const found = draftIssues(draft);
    if (found.length > 0) {
      setIssues(found);
      return null;
    }
    if ((question?.assets.length ?? 0) > 0) {
      setNotice(LEGACY_ASSET_ADVICE);
      return null;
    }
    if (!creating && typeof version !== "number") {
      setNotice("Thiếu phiên bản câu hỏi. Hãy tải lại trước khi lưu. Nội dung đang soạn vẫn còn trên trang.");
      return null;
    }
    const save = persistDraft(draft, creating ? null : version);
    try {
      const result = creating
        ? await createQuestion.mutateAsync(save.request)
        : await updateQuestion.mutateAsync({ id: activeId!, data: save.request });
      const opened = reopenManualDraft({
        subjectId: result.subjectId,
        topicId: result.topicId,
        type: result.type,
        difficulty: result.difficulty,
        content: result.content,
        answer: result.answer,
        explanation: result.explanation,
      });
      const next = opened.lossy ? draft : retainPendingFigures(draft, opened.draft);
      const text = opened.lossy ? "Không đối chiếu được bản vừa lưu. Nội dung đang soạn vẫn còn trên trang." : null;
      setDraft(next);
      setLossy(opened.lossy);
      setVersion(result.version);
      setStatus(result.status);
      setCreatedId(result.id);
      setSavedJson(JSON.stringify(next));
      setConflict(false);
      setIssues([]);
      setNotice(text);
      if (creating) redirectTo(result, next, text, opened.lossy);
      if (opened.lossy) return null;
      toast.success("Đã lưu bản nháp.");
      return { id: result.id, version: result.version, status: result.status, draft: next };
    } catch (error) {
      const failure = saveFailureNotice(failureStatus(error), parseApiError(error).detail);
      setConflict(failure.conflict);
      setNotice(failure.notice);
      return null;
    }
  }

  async function saveDraft() {
    await persist(activeId == null);
  }

  async function publish() {
    const found = publishIssues(draft);
    if (found.length > 0) {
      setIssues(found);
      return;
    }
    setIssues([]);
    const dirty = JSON.stringify(draft) !== savedJson || activeId == null;
    let targetId = activeId;
    let nextDraft = draft;
    let created = false;
    let targetVersion = version;
    let targetStatus = status ?? "DRAFT";
    if (dirty) {
      const saved = await persist(activeId == null);
      if (!saved) return;
      targetId = saved.id;
      nextDraft = saved.draft;
      created = activeId == null;
      targetVersion = saved.version;
      targetStatus = saved.status;
    }
    if (targetId == null || typeof targetVersion !== "number") return;
    try {
      const published = await publishQuestion.mutateAsync(targetId);
      setStatus(published.status);
      setVersion(published.version);
      toast.success("Đã xuất bản câu hỏi.");
      if (created || routeId == null) redirectTo(published, nextDraft, null, lossy);
    } catch (error) {
      const text = `${parseApiError(error).detail || "Không xuất bản được."} Nội dung đang soạn vẫn còn trên trang.`;
      setNotice(text);
      if (created || routeId == null) redirectTo({ id: targetId, version: targetVersion, status: targetStatus }, nextDraft, text, lossy);
    }
  }

  /** The returned copy is a different question. Its status and version stay off this draft. */
  async function duplicate() {
    if (activeId == null) return;
    try {
      const copy = await duplicateQuestion.mutateAsync(activeId);
      toast.success("Đã sao chép câu hỏi.");
      navigate(`${listPath}/${copy.id}`, { state: { from: returnTo } });
    } catch (error) {
      setNotice(`${parseApiError(error).detail || "Thao tác thất bại."} Nội dung đang soạn vẫn còn trên trang.`);
    }
  }

  async function runStatus(action: (id: string) => Promise<Question>, success: string) {
    if (activeId == null) return;
    try {
      const updated = await action(activeId);
      setStatus(updated.status);
      setVersion(updated.version);
      toast.success(success);
    } catch (error) {
      setNotice(`${parseApiError(error).detail || "Thao tác thất bại."} Nội dung đang soạn vẫn còn trên trang.`);
    }
  }

  const newDraft = (
    <Link className="mt-2 inline-flex min-h-11 items-center underline" to={`${listPath}/new`} state={{ from: returnTo }}>
      Tạo bản nháp mới
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={routeId == null && createdId == null ? "Câu hỏi mới" : (draft.title.trim() || "Câu hỏi chưa có tiêu đề")}
        description={<><span>{subjectName} · {topicName}</span>{" "}<Badge variant={STATUS_VARIANT[badgeStatus]}>{STATUS_LABEL[badgeStatus]}</Badge></>}
        actions={<div className="flex flex-wrap items-center gap-2">
          {canEdit && !showEditor ? <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setEditing(true)}><Pencil className="size-4" />Chỉnh sửa</Button> : null}
          {showEditor ? <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setEditing(false)}><Eye className="size-4" />Xem</Button> : null}
          {showEditor ? <Button type="submit" form="manual-question-form" size="sm" className="min-h-11" loading={createQuestion.isPending || updateQuestion.isPending} disabled={busy}><Save className="size-4" />Lưu bản nháp</Button> : null}
          {canPublish ? <Button type="button" size="sm" className="min-h-11" loading={publishQuestion.isPending} disabled={busy} onClick={() => void publish()}><Send className="size-4" />Xuất bản</Button> : null}
          {permissions.duplicate && activeId != null ? <Button type="button" variant="outline" size="sm" className="min-h-11" loading={duplicateQuestion.isPending} disabled={busy} onClick={() => void duplicate()}><Copy className="size-4" />Sao chép</Button> : null}
          {permissions.archive && activeId != null ? <Button type="button" variant="outline" size="sm" className="min-h-11" loading={archiveQuestion.isPending} disabled={busy} onClick={() => void runStatus(archiveQuestion.mutateAsync, "Đã lưu trữ câu hỏi.")}><Archive className="size-4" />Lưu trữ</Button> : null}
          {permissions.restore && activeId != null ? <Button type="button" variant="outline" size="sm" className="min-h-11" loading={restoreQuestion.isPending} disabled={busy} onClick={() => void runStatus(restoreQuestion.mutateAsync, "Đã khôi phục câu hỏi.")}><RotateCcw className="size-4" />Khôi phục</Button> : null}
        </div>}
      />
      {notice ? <p role={conflict ? "alert" : "status"} className="rounded-lg border border-border p-3 text-sm">{notice}</p> : null}
      {conflict && activeId != null ? (
        <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => void discardServer()}>
          Tải lại bản đã lưu và bỏ nội dung đang soạn
        </Button>
      ) : null}
      {pendingFigures(draft).length > 0 ? <p role="status" className="text-sm text-muted-foreground">{PENDING_NOTE}</p> : null}
      {lossy ? <div role="note" className="rounded-lg border border-border p-4 text-sm"><p>{LOSSY_NOTE}</p>{newDraft}</div> : null}
      {(question?.assets.length ?? 0) > 0 ? <div role="note" className="rounded-lg border border-border p-4 text-sm"><p>{LEGACY_ASSET_ADVICE}</p>{newDraft}</div> : null}
      {effectiveStatus === "ARCHIVED" ? <p className="text-sm text-muted-foreground">{RESTORE_CHECK_NOTE}</p> : null}
      <IssueList issues={issues} />
      {current.isLoading ? <p role="status" className="text-sm text-muted-foreground">Đang kiểm tra quyền…</p> : null}
      {!current.isLoading && showEditor ? (
        <form id="manual-question-form" className="space-y-6" onSubmit={(event) => { event.preventDefault(); if (!canEdit || busy) return; void saveDraft(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="manual-subject" label="Môn học">
              <NativeSelect id="manual-subject" value={draft.subjectId} disabled={busy} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, subjectId: event.target.value, topicId: "" }))}>
                <option value="">Chọn môn học</option>
                {draft.subjectId && !subjects.some((subject) => subject.id === draft.subjectId) ? <option value={draft.subjectId}>{subjectName}</option> : null}
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </NativeSelect>
            </Field>
            <Field id="manual-topic" label="Chủ đề">
              <NativeSelect id="manual-topic" value={draft.topicId} disabled={busy || !draft.subjectId || topics.isLoading} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, topicId: event.target.value }))}>
                <option value="">{topics.isLoading ? "Đang tải..." : "Chọn chủ đề"}</option>
                {draft.topicId && !topics.data?.some((topic) => topic.id === draft.topicId) ? <option value={draft.topicId}>{topicName}</option> : null}
                {topics.data?.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </NativeSelect>
            </Field>
          </div>
          {activeId == null ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Dạng câu hỏi</legend>
              {MANUAL_TYPES.map((type) => (
                <label key={type} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="manual-question-type" checked={draft.type === type} disabled={busy} onChange={() => setDraft((currentDraft) => withQuestionType(currentDraft, type))} />
                  {TYPE_LABEL[type]}
                </label>
              ))}
            </fieldset>
          ) : <p className="text-sm">Dạng câu hỏi: {TYPE_LABEL[draft.type]}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="manual-title" label="Tiêu đề">
              <Input id="manual-title" value={draft.title} disabled={busy} placeholder="Tiêu đề câu hỏi" onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))} />
            </Field>
            <Field id="manual-difficulty" label="Độ khó">
              <NativeSelect id="manual-difficulty" value={draft.difficulty} disabled={busy} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, difficulty: event.target.value }))}>
                <option value="">Chưa đặt</option>
                {DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </NativeSelect>
            </Field>
          </div>
          <FigureNotices figures={figures.figures} onRetry={figures.retry} />
          <ScientificBlockEditor label="Đề bài" value={draft.stem} disabled={busy} uploadFigure={uploadFigure} resolveFigure={figures.resolveFigure} onChange={(stem) => setDraft((currentDraft) => ({ ...currentDraft, stem }))} />
          {draft.parts.map((part, index) => (
            <section key={part.id} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-medium">Ý {partLabel(index)}</h2>
                {draft.type === "written_multipart" ? (
                  <>
                    <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={busy || index === 0} onClick={() => setDraft((currentDraft) => movePart(currentDraft, index, -1))}>Lên</Button>
                    <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={busy || index === draft.parts.length - 1} onClick={() => setDraft((currentDraft) => movePart(currentDraft, index, 1))}>Xuống</Button>
                    <Button type="button" variant="ghost" size="sm" className="min-h-11" disabled={busy || draft.parts.length <= 2} onClick={() => setDraft((currentDraft) => removePart(currentDraft, index))}>Xóa ý</Button>
                  </>
                ) : null}
              </div>
              <ScientificBlockEditor label={`Nội dung ý ${partLabel(index)}`} value={part.prompt} disabled={busy} uploadFigure={uploadFigure} resolveFigure={figures.resolveFigure} onChange={(prompt) => setDraft((currentDraft) => ({ ...currentDraft, parts: currentDraft.parts.map((item, itemIndex) => itemIndex === index ? { ...item, prompt } : item) }))} />
              {choice ? part.options.map((option, optionIndex) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type={draft.type === "single_choice" ? "radio" : "checkbox"}
                        name={`correct-${part.id}`}
                        checked={part.correctOptionIds.includes(option.id)}
                        disabled={busy}
                        onChange={(event) => setDraft((currentDraft) => setCorrectOption(currentDraft, index, option.id, event.target.checked))}
                      />
                      Đáp án đúng {optionLabel(optionIndex)}
                    </label>
                    <Button type="button" variant="ghost" size="sm" className="min-h-11" disabled={busy} onClick={() => setDraft((currentDraft) => removeOption(currentDraft, index, optionIndex))}>Xóa phương án</Button>
                  </div>
                  <ScientificBlockEditor label={`Phương án ${optionLabel(optionIndex)}`} value={option.content} disabled={busy} uploadFigure={uploadFigure} resolveFigure={figures.resolveFigure} onChange={(content) => setDraft((currentDraft) => ({ ...currentDraft, parts: currentDraft.parts.map((item, itemIndex) => itemIndex === index ? { ...item, options: item.options.map((optionItem, optionItemIndex) => optionItemIndex === optionIndex ? { ...optionItem, content } : optionItem) } : item) }))} />
                </div>
              )) : null}
              {choice ? <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={busy || part.options.length >= 12} onClick={() => setDraft((currentDraft) => addOption(currentDraft, index))}>Thêm phương án</Button> : null}
              <ScientificBlockEditor label={`Lời giải ý ${partLabel(index)}`} value={part.solution} disabled={busy} uploadFigure={uploadFigure} resolveFigure={figures.resolveFigure} onChange={(solution) => setDraft((currentDraft) => ({ ...currentDraft, parts: currentDraft.parts.map((item, itemIndex) => itemIndex === index ? { ...item, solution } : item) }))} />
              <Field id={`manual-rubric-${part.id}`} label="Rubric">
                <Textarea id={`manual-rubric-${part.id}`} rows={4} value={part.rubric} disabled={busy} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, parts: currentDraft.parts.map((item, itemIndex) => itemIndex === index ? { ...item, rubric: event.target.value } : item) }))} />
              </Field>
            </section>
          ))}
          {draft.type === "written_multipart" ? <Button type="button" variant="outline" className="min-h-11" disabled={busy || draft.parts.length >= 20} onClick={() => setDraft((currentDraft) => addPart(currentDraft))}>Thêm ý</Button> : null}
        </form>
      ) : null}
      {!current.isLoading && !showEditor ? (
        <div className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div><dt className="text-muted-foreground">Môn học</dt><dd>{subjectName}</dd></div>
            <div><dt className="text-muted-foreground">Chủ đề</dt><dd>{topicName}</dd></div>
            <div><dt className="text-muted-foreground">Dạng câu hỏi</dt><dd>{TYPE_LABEL[draft.type]}</dd></div>
            <div><dt className="text-muted-foreground">Độ khó</dt><dd>{DIFFICULTIES.find((item) => item.value === draft.difficulty)?.label ?? (draft.difficulty || "Chưa đặt")}</dd></div>
          </dl>
          <ManualQuestionViewer title={draft.title.trim() || undefined} stem={draft.stem} parts={view.parts} answer={view.answer} explanation={view.explanation} showAnswer={staff} resolveFigure={figures.resolveFigure} figures={figures.figures} onRetry={figures.retry} />
        </div>
      ) : null}
    </div>
  );
}
