import { AppPagination } from "@/components/ui/app-pagination";
import { NativeSelect } from "@/components/ui/native-select";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { questionBankLabel } from "@/features/questions/components/manual-question";
import { useQuestion, useQuestions } from "@/features/questions/hooks/use-questions";
import { getListReturnPath } from "@/lib/list-navigation";
import type { Question } from "@/features/questions/types/question.types";
import { examErrorMessage, frozenPaperId, isExamConflict, readManualContent } from "../exam-contract";
import { bankSearchKey, bankSearchQuery, publishEligibility } from "../exam-editor-policy";
import { alignPlacement, editorFromDraft, emptyEditor, hydratePlacementItem, movePlacement, replacePlacementItem, shouldLoadServerDraft, toSaveRequest, type EditorDraft, type EditorPlacement } from "../exam-placement";
import { formatRelease, localInputToOffsetDateTime, zoneLabel } from "../exam-time";
import { useCreateExam, useExamDraft, usePublishExam, useUpdateExam } from "../hooks/use-exams";
import type { ExamDraft } from "../types";
import { ExamLoading, ExamProblem } from "./exam-feedback";

export function ExamEditor({ examId, listPath, papersPath }: { examId?: string; listPath: string; papersPath: string }) {
  const draft = useExamDraft(examId);
  const location = useLocation();
  const back = getListReturnPath((location.state as { from?: unknown } | null)?.from, listPath);
  if (examId && draft.isLoading) return <div className="page-shell"><ExamLoading label="Đang tải đề…" /></div>;
  if (examId && draft.isError) return <div className="page-shell"><ExamProblem message={examErrorMessage(draft.error)} onRetry={() => void draft.refetch()} /></div>;
  if (examId && !draft.data) return <div className="page-shell"><ExamProblem message="Không tìm thấy đề." onRetry={() => void draft.refetch()} /></div>;
  return <ExamForm key={examId ?? "new"} examId={examId} initial={draft.data ?? null} reload={() => draft.refetch()} listPath={listPath} papersPath={papersPath} back={back} />;
}

function ExamForm({ examId, initial, reload, listPath, papersPath, back }: { examId?: string; initial: ExamDraft | null; reload: () => Promise<{ data?: ExamDraft }>; listPath: string; papersPath: string; back: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const metadata = useDocumentMetadata();
  const server = useExamDraft(examId).data;
  const create = useCreateExam();
  const update = useUpdateExam(examId ?? "");
  const publish = usePublishExam(examId ?? "");
  const [form, setForm] = useState<EditorDraft>(() => initial ? editorFromDraft(initial) : emptyEditor());
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const hydratePlacement = useCallback((index: number, questionId: string, content: NonNullable<ReturnType<typeof readManualContent>>) => {
    setForm((current) => hydratePlacementItem(current, index, questionId, content));
  }, []);
  function edit(update: (current: EditorDraft) => EditorDraft) { setForm(update); setDirty(true); }
  useEffect(() => {
    if (!server || !shouldLoadServerDraft({ dirty, conflict })) return;
    setForm(editorFromDraft(server));
  }, [server, dirty, conflict]);
  async function save() {
    const request = toSaveRequest(form, examId ? "update" : "create");
    if (!request.ok) { setNotice(request.message); return; }
    try {
      const saved = examId ? await update.mutateAsync(request.body) : await create.mutateAsync(request.body);
      setForm(editorFromDraft(saved));
      setDirty(false);
      setConflict(false);
      setNotice("Đã lưu đề.");
      if (!examId) navigate(`${listPath}/${saved.id}`, { replace: true, state: location.state });
    } catch (error) {
      if (isExamConflict(error)) setConflict(true);
      setNotice(examErrorMessage(error));
    }
  }
  async function publishDraft() {
    const decision = publishEligibility({ dirty, conflict, examId, draft: form });
    if (!decision.enabled) {
      if (decision.notice) setNotice(decision.notice);
      return;
    }
    const ready = toSaveRequest(form, "update");
    if (!ready.ok) { setNotice(ready.message); return; }
    const version = form.version;
    if (version === null) { setNotice("Hãy lưu đề trước khi xuất bản."); return; }
    try {
      const paperId = frozenPaperId(await publish.mutateAsync(version));
      if (!paperId) { setNotice("Đã xuất bản nhưng chưa đọc được mã phiên bản."); return; }
      navigate(`${papersPath}/${paperId}?solutions=1`);
    } catch (error) {
      if (isExamConflict(error)) setConflict(true);
      setNotice(examErrorMessage(error));
    }
  }
  async function loadServer() {
    const result = await reload();
    if (!result.data) return;
    setForm(editorFromDraft(result.data));
    setDirty(false);
    setConflict(false);
    setNotice("Đã tải bản trên máy chủ.");
  }
  const busy = create.isPending || update.isPending || publish.isPending;
  const eligibility = publishEligibility({ dirty, conflict, examId, draft: form });
  return <div className="page-shell">
    <PageHeader title={examId ? "Sửa đề" : "Tạo đề"} description="Câu hỏi lấy từ ngân hàng đã xuất bản. Điểm và hướng dẫn thuộc về đề, không ghi ngược vào câu hỏi." actions={<Button variant="outline" asChild><Link to={back}>Quay lại danh sách</Link></Button>} />
    {notice ? <p className="mb-4 text-sm" role="status">{notice}</p> : null}
    {conflict ? <div className="mb-4 space-y-3" role="alert"><p>Đề vừa được sửa ở nơi khác. Bản bạn đang nhập vẫn được giữ.</p><Button type="button" variant="outline" onClick={() => void loadServer()}>Tải bản trên máy chủ</Button></div> : null}
    <form className="space-y-8" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <PageSection title="Thông tin đề"><div className="space-y-4">
        <div className="space-y-2"><Label htmlFor="exam-title">Tiêu đề</Label><Input id="exam-title" value={form.title} maxLength={300} onChange={(event) => edit((current) => ({ ...current, title: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="exam-subject">Môn học</Label>
          <NativeSelect id="exam-subject" value={form.subjectId} onChange={(event) => {
            const subjectId = event.target.value;
            if (subjectId !== form.subjectId && form.items.length > 0) setNotice("Đã gỡ các câu khỏi đề vì môn học đã đổi.");
            edit((current) => ({ ...current, subjectId, items: subjectId === current.subjectId ? current.items : [] }));
          }}><option value="">Chọn môn học</option>{metadata.data?.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</NativeSelect>
        </div>
        <div className="space-y-2"><Label htmlFor="exam-instructions">Hướng dẫn</Label><Textarea id="exam-instructions" value={form.instructions} maxLength={4000} onChange={(event) => edit((current) => ({ ...current, instructions: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="exam-release">Giờ mở đề</Label><Input id="exam-release" type="datetime-local" value={form.releaseLocal} onChange={(event) => edit((current) => ({ ...current, releaseLocal: event.target.value }))} /><p className="text-sm">{zoneLabel()}</p><p className="text-sm">Giờ này được đổi sang múi giờ đang dùng trên trình duyệt. Đề không có giờ đóng.</p><p className="text-sm">{formatRelease(localInputToOffsetDateTime(form.releaseLocal))}</p></div>
        {examId ? <p className="text-sm">Bản nháp {form.version ?? "…"}. {initial?.latestPublishedVersion != null ? `Đã xuất bản đến phiên bản ${initial.latestPublishedVersion}.` : "Chưa xuất bản."}</p> : null}
      </div></PageSection>
      <PageSection title="Câu trong đề" description="Thứ tự trên màn hình là thứ tự lưu.">
        <ol className="space-y-6">{form.items.map((item, index) => <PlacementEditor key={`${item.questionId}-${index}`} index={index} item={item} onHydrate={(content) => hydratePlacement(index, item.questionId, content)} onChange={(update) => edit((current) => replacePlacementItem(current, index, update))} onMove={(direction) => edit((current) => ({ ...current, items: movePlacement(current.items, index, direction) }))} onRemove={() => edit((current) => ({ ...current, items: current.items.filter((_, rowIndex) => rowIndex !== index) }))} />)}</ol>
        {form.subjectId ? <PublishedBank subjectId={form.subjectId} onAdd={(question) => {
          const content = readManualContent(question.content);
          if (!content || question.status !== "PUBLISHED") { setNotice("Chỉ thêm câu schema 1 đã xuất bản."); return; }
          edit((current) => ({ ...current, items: [...current.items, alignPlacement({ questionId: question.id, points: "", instructions: "", structure: content.structure, partIds: content.parts.map((part) => part.id), partPoints: {} }, content)] }));
        }} /> : <p>Hãy chọn môn học trước khi thêm câu.</p>}
      </PageSection>
      {eligibility.notice ? <p className="text-sm" role="status">{eligibility.notice}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>Lưu đề</Button>
        <Button type="button" variant="outline" disabled={busy || !eligibility.enabled} onClick={() => void publishDraft()}>Xuất bản phiên bản</Button>
        {examId ? <Button variant="outline" asChild><Link to={`${listPath}/${examId}/preview`} state={{ from: `${listPath}/${examId}` }}>Xem đề</Link></Button> : null}
      </div>
    </form>
  </div>;
}

function PlacementEditor({ index, item, onChange, onHydrate, onMove, onRemove }: { index: number; item: EditorPlacement; onChange: (update: (item: EditorPlacement) => EditorPlacement) => void; onHydrate: (content: NonNullable<ReturnType<typeof readManualContent>>) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  const question = useQuestion(item.questionId);
  useEffect(() => {
    const content = readManualContent(question.data?.content);
    if (!content) return;
    onHydrate(content);
  }, [question.data, item, onHydrate]);
  return <li className="space-y-3 border-t pt-4">
    <h3 className="font-semibold">Câu {index + 1}. {question.data ? questionBankLabel(question.data.content) : item.questionId}</h3>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => onMove(-1)}>Đưa lên</Button><Button type="button" variant="outline" size="sm" onClick={() => onMove(1)}>Đưa xuống</Button><Button type="button" variant="outline" size="sm" onClick={onRemove}>Gỡ câu</Button></div>
    <div className="space-y-2"><Label htmlFor={`points-${index}`}>Điểm</Label><Input id={`points-${index}`} inputMode="decimal" value={item.points} onChange={(event) => onChange((row) => ({ ...row, points: event.target.value }))} /></div>
    <div className="space-y-2"><Label htmlFor={`guide-${index}`}>Hướng dẫn riêng</Label><Textarea id={`guide-${index}`} maxLength={4000} value={item.instructions} onChange={(event) => onChange((row) => ({ ...row, instructions: event.target.value }))} /></div>
    {item.structure === "MULTIPART" ? item.partIds.map((id, partIndex) => <div key={id} className="space-y-2"><Label htmlFor={`part-${index}-${id}`}>Điểm ý {partIndex + 1}</Label><p className="text-sm">Mã ý: {id}</p><Input id={`part-${index}-${id}`} inputMode="decimal" value={item.partPoints[id] ?? ""} onChange={(event) => onChange((row) => ({ ...row, partPoints: { ...row.partPoints, [id]: event.target.value } }))} /></div>) : null}
  </li>;
}

function PublishedBank({ subjectId, onAdd }: { subjectId: string; onAdd: (question: Question) => void }) {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const query = useQuestions({ status: "PUBLISHED", subjectId, search: search || undefined, page, size: 10 });
  function applySearch() {
    const next = bankSearchQuery(text);
    setPage(next.page);
    setSearch(next.search);
  }
  return <div className="space-y-3 border-t pt-4">
    <h3 className="font-semibold">Ngân hàng đã xuất bản</h3>
    <div className="flex flex-wrap gap-2">
      <Label className="sr-only" htmlFor="bank-search">Tìm câu đã xuất bản</Label>
      <Input id="bank-search" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (!bankSearchKey(event)) return; applySearch(); }} />
      <Button type="button" variant="outline" onClick={(event) => { event.preventDefault(); event.stopPropagation(); applySearch(); }}>Tìm</Button>
    </div>
    {query.isLoading ? <ExamLoading label="Đang tải câu hỏi…" /> : null}
    {query.isError ? <ExamProblem message={examErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
    {query.data && query.data.content.length === 0 ? <p>Không có câu đã xuất bản cho môn này.</p> : null}
    <ul className="space-y-3">{query.data?.content.map((question) => <li key={question.id} className="flex flex-wrap items-center justify-between gap-3"><span>{questionBankLabel(question.content)}</span><Button type="button" variant="outline" size="sm" onClick={() => onAdd(question)}>Thêm vào đề</Button></li>)}</ul>
    {query.data && <AppPagination variant="compact" currentPage={page + 1} totalPages={query.data.totalPages} onPageChange={next => setPage(next - 1)} />}
  </div>;
}
