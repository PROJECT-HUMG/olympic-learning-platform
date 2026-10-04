import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/router/route-constants";
import { DailyAccountWarning } from "./daily-account-gate";
import { EvidencePanel } from "../evidence/evidence-panel";
import { useDailyEditorSession, useDailyDraftLeave } from "../hooks/use-daily-editor";
import { useDailyPlan, useSaveDailyPlan, useSubmitDailyPlan } from "../hooks/use-daily";
import { dailyFigures, type TaskPriority } from "../lib/completion-figures";
import { dailyErrorMessage, isDailyConflict, type DailyEditorStatus } from "../lib/daily-contract";
import { dailyDraftFailure, dailyLeaveBlocked, shouldApplyCompletedFetch } from "../lib/daily-lifecycle";
import {
  editorFromPlan,
  emptyPlanEditor,
  planSaveBody,
  shouldApplyServerDaily,
  submitAllowed,
  type EditorTask,
  type PlanEditor,
} from "../lib/plan-editor";
import { addPlatformDays, parsePlatformDate, platformDate, platformDateKey, weekDates, type SubmitTiming } from "../lib/platform-calendar";
import { formatMust, formatOverall, PRIORITY_LABEL, SUBMIT_TIMING_LABEL } from "../lib/review-display";
import { StudyAreaNav, StudyDisclosure, StudyEmpty, StudyProgress } from "../ui/study-notebook";

const selectClass = "h-11 w-full rounded-lg border bg-background px-3";
const DATE_GUARD = "Hãy lưu hoặc tải lại trước khi đổi ngày.";

export function DailyPlanEditor({ userId, date, onDate, accountWarning, onRetryAccount }: {
  userId: string;
  date: string;
  onDate: (date: string) => void;
  accountWarning: boolean;
  onRetryAccount: () => void;
}) {
  const plan = useDailyPlan(userId, date);
  const savePlan = useSaveDailyPlan(userId, date);
  const submitPlan = useSubmitDailyPlan(userId, date);
  const draft = useDailyEditorSession();
  const blocker = useDailyDraftLeave(draft.session, draft.snapshot);
  const [form, setForm] = useState<PlanEditor>(() => emptyPlanEditor(date));
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const parsed = parsePlatformDate(date);
  const weekStart = parsed ? platformDateKey(weekDates(parsed)[0]) : null;

  useEffect(() => {
    if (!plan.isSuccess || !shouldApplyServerDaily({
      dirty: draft.session.current.dirty,
      conflict: draft.session.current.conflict,
      busy: draft.session.current.gate.operation !== "idle",
    })) return;
    setForm(plan.data ? editorFromPlan(plan.data) : emptyPlanEditor(date));
    setReady(true);
  }, [plan.isSuccess, plan.data, date, draft.session]);

  function edit(update: (current: PlanEditor) => PlanEditor) {
    draft.edit(() => setForm(update));
  }

  function blocked() {
    const current = draft.session.current;
    return dailyLeaveBlocked({ dirty: current.dirty, conflict: current.conflict, busy: current.gate.operation !== "idle", accountLeave: false });
  }

  function guardNavigation(event: { preventDefault(): void }) {
    if (!blocked()) return;
    event.preventDefault();
    setNotice(DATE_GUARD);
  }

  function go(next: string) {
    if (!parsePlatformDate(next)) {
      setNotice("Ngày không hợp lệ. Dùng dạng YYYY-MM-DD.");
      return;
    }
    if (blocked()) {
      setNotice(DATE_GUARD);
      return;
    }
    onDate(next);
  }

  function shift(days: number) {
    if (!parsed) return;
    go(platformDateKey(addPlatformDays(parsed, days)));
  }

  async function fetchServer(replace: boolean) {
    const operation = replace ? "reload" : "retry";
    const revision = draft.begin(operation);
    if (revision === null) return;
    const result = await plan.refetch();
    if (!result.isSuccess) {
      draft.finish(operation, revision, "keep");
      setNotice(dailyErrorMessage(result.error));
      return;
    }
    const applied = draft.finish(operation, revision, shouldApplyCompletedFetch({
      replace,
      dirty: draft.session.current.dirty,
      conflict: draft.session.current.conflict,
    }) ? "apply" : "keep");
    if (!applied) {
      if (!draft.session.current.conflict) setNotice(null);
      return;
    }
    setForm(result.data ? editorFromPlan(result.data) : emptyPlanEditor(date));
    setReady(true);
    setNotice(null);
  }

  async function save() {
    const readyBody = planSaveBody(form);
    if (!readyBody.ok) {
      setNotice(readyBody.message);
      return;
    }
    const revision = draft.begin("save");
    if (revision === null) return;
    try {
      const saved = await savePlan.mutateAsync(readyBody.body);
      if (!draft.finish("save", revision, "apply")) return;
      setForm(editorFromPlan(saved));
      setReady(true);
      setNotice("Đã lưu kế hoạch.");
    } catch (error) {
      draft.finish("save", revision, "keep", isDailyConflict(error) ? true : undefined);
      setNotice(dailyErrorMessage(error));
    }
  }

  async function submit() {
    if (!submitAllowed({ dirty: draft.dirty, planId: form.id, busy: draft.busy }) || !form.id) return;
    const revision = draft.begin("submit");
    if (revision === null) return;
    try {
      const saved = await submitPlan.mutateAsync(form.id);
      if (!draft.finish("submit", revision, "apply")) return;
      setForm(editorFromPlan(saved));
      setReady(true);
      setNotice("Đã ghi nhận lần nộp.");
    } catch (error) {
      draft.finish("submit", revision, "keep", isDailyConflict(error) ? true : undefined);
      setNotice(dailyErrorMessage(error));
    }
  }

  const failure = dailyDraftFailure({ ready, error: plan.isError });
  if (failure === "initial") {
    return <div className="page-shell"><DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} /><p role="alert">{notice ?? dailyErrorMessage(plan.error)}</p><Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(false)}>Thử lại</Button></div>;
  }
  if (failure === "loading") return <div className="page-shell"><DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} /><p role="status">Đang tải kế hoạch ngày {date}.</p></div>;

  const figures = dailyFigures(form.tasks.map((task) => ({ priority: task.priority, status: task.status })));
  const timing: SubmitTiming = form.firstSubmittedAt === null ? "UNSUBMITTED" : form.onTime ? "ON_TIME" : "LATE";
  const canSubmit = submitAllowed({ dirty: draft.dirty, planId: form.id, busy: draft.busy });
  const showNotice = Boolean(notice || draft.dirty || draft.conflict || failure === "inline" || blocker.state === "blocked");

  return <div className="page-shell study-notebook">
    <StudyAreaNav area="daily" onNavigate={guardNavigation} />
    <DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} />
    <PageHeader title={`Ngày ${date}`} description="Một ngày, từng việc một. Kế hoạch cá nhân theo giờ Việt Nam; hạn nộp đầu là 07:30." actions={weekStart ? <Link className="inline-flex h-11 items-center text-primary underline underline-offset-4" to={`${ROUTES.DAILY_WEEK}?weekStart=${weekStart}`} onClick={guardNavigation}>Tuần của ngày này</Link> : null} />
    <StudyDisclosure title="Chọn ngày khác"><div className="study-toolbar">
      <Button type="button" variant="outline" disabled={draft.busy} onClick={() => shift(-1)}>Hôm trước</Button>
      <div className="space-y-2"><Label htmlFor="daily-date">Ngày</Label><Input id="daily-date" type="date" value={date} disabled={draft.busy} onChange={(event) => go(event.target.value)} /></div>
      <Button type="button" variant="outline" disabled={draft.busy} onClick={() => shift(1)}>Hôm sau</Button>
      <Button type="button" variant="ghost" disabled={draft.busy} onClick={() => { const today = platformDate(new Date()); if (today) go(platformDateKey(today)); }}>Hôm nay</Button>
    </div></StudyDisclosure>
    <StudyDisclosure title="Tiến độ trong bản đang nhập"><div className="study-progress-grid" aria-label="Tiến độ trong bản đang nhập">
      <StudyProgress label="Tất cả việc" completed={figures.overall.completed} total={figures.overall.total} rate={figures.overall.rate} caption="Tiến độ trong bản đang nhập; lưu để cập nhật kế hoạch." />
      <StudyProgress label="Việc bắt buộc" completed={figures.must.completed} total={figures.must.total} rate={figures.must.rate} caption="Theo dõi riêng, không cộng điểm hay xếp hạng." />
    </div></StudyDisclosure>
    <p className="study-note">{figures.overall.total === 0 ? "Bắt đầu bằng một việc bạn muốn tập trung hôm nay." : figures.overall.completed === figures.overall.total ? "Bạn đã đánh dấu xong mọi việc trong bản này. Hãy lưu và dành một chút thời gian nhìn lại." : `${figures.overall.completed}/${figures.overall.total} việc đã được đánh dấu xong. Từng bước nhỏ đều đáng ghi nhận.`}</p>
    {showNotice ? <div className="study-notice" role={draft.dirty || draft.conflict || failure === "inline" || blocker.state === "blocked" ? "alert" : "status"}>
      {blocker.state === "blocked" ? <p>{DATE_GUARD}</p> : null}
      {notice ? <p>{notice}</p> : null}
      {draft.dirty ? <p>Bản đang nhập chưa được lưu.</p> : null}
      {draft.conflict ? <p>Bản trên máy chủ đã đổi. Tải lại trước khi tiếp tục.</p> : null}
      {failure === "inline" && !notice ? <p>{dailyErrorMessage(plan.error)} Bản đang nhập vẫn được giữ.</p> : null}
      {blocker.state === "blocked" ? <Button type="button" variant="outline" onClick={() => blocker.reset()}>Ở lại trang</Button> : null}
      {failure === "inline" ? <Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(false)}>Thử lại</Button> : null}
      {(draft.dirty || draft.conflict) ? <Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(true)}>Tải bản trên máy chủ</Button> : null}
    </div> : null}
    <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <fieldset disabled={draft.busy} className="m-0 min-w-0 border-0 p-0">
        <PageSection title="Việc trong ngày" description={`Trong bản đang nhập: ${formatOverall(figures.overall)} tổng. Bắt buộc ${formatMust(figures.must)}.`} actions={<Button type="button" variant="outline" disabled={form.tasks.length >= 50} onClick={() => edit((current) => ({ ...current, tasks: [...current.tasks, blankTask()] }))}>Thêm việc</Button>}>
          {form.tasks.length === 0 ? <StudyEmpty title="Chưa có việc.">Thêm việc đầu tiên để bắt đầu. Một ngày đã lưu và không có việc vẫn là một ngày đã lập.</StudyEmpty> : null}
          <ol>
            {form.tasks.map((task, index) => <TaskRow key={task.key} task={task} index={index} last={index === form.tasks.length - 1} onChange={(update) => edit((current) => ({ ...current, tasks: current.tasks.map((item) => item.key === task.key ? update(item) : item) }))} onMove={(delta) => edit((current) => ({ ...current, tasks: moveTask(current.tasks, index, delta) }))} onRemove={() => edit((current) => ({ ...current, tasks: current.tasks.filter((item) => item.key !== task.key) }))}>
              <EvidencePanel userId={userId} planId={form.id} taskId={task.id} groupId={null} disabled={draft.busy} />
            </TaskRow>)}
          </ol>
        </PageSection>
        <StudyDisclosure title="Nhìn lại ngày" description={`${SUBMIT_TIMING_LABEL[timing]}. ${form.firstSubmittedAt === null ? "Chưa có mốc nộp đầu." : "Mốc nộp đầu được giữ."} Thu gọn không làm mất bản đang nhập.`}>
          <ReviewField id="daily-reasons" label="Vì sao chưa xong" value={form.reviewReasons} onChange={(value) => edit((current) => ({ ...current, reviewReasons: value }))} />
          <ReviewField id="daily-well" label="Việc đã ổn" value={form.reviewWentWell} onChange={(value) => edit((current) => ({ ...current, reviewWentWell: value }))} />
          <ReviewField id="daily-tomorrow" label="Ngày mai" value={form.reviewTomorrow} onChange={(value) => edit((current) => ({ ...current, reviewTomorrow: value }))} />
          {form.firstSubmittedAt ? <p className="text-sm">Lần nộp đầu: {form.firstSubmittedAt}</p> : null}
        </StudyDisclosure>
        <div className="study-actions">
          <Button type="submit">Lưu kế hoạch</Button>
          <Button type="button" variant="outline" disabled={!canSubmit} onClick={() => void submit()}>{form.firstSubmittedAt ? "Nộp lại" : "Nộp kế hoạch"}</Button>
        </div>
        <p className="mt-3 study-note">Lưu giữ các thay đổi; nộp ghi nhận mốc nộp đầu, không bật chia sẻ. Hãy lưu bản sạch trước khi nộp. Lần nộp đầu được giữ.</p>
      </fieldset>
    </form>
  </div>;
}

function blankTask(): EditorTask {
  // Blank rows start as SHOULD and TODO. That is only the empty-row seed, not a platform setting.
  return { key: crypto.randomUUID(), id: null, title: "", priority: "SHOULD", status: "TODO" };
}

function moveTask(tasks: EditorTask[], index: number, delta: number): EditorTask[] {
  const next = index + delta;
  if (next < 0 || next >= tasks.length) return tasks;
  const copy = tasks.slice();
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
}

function TaskRow({ task, index, last, onChange, onMove, onRemove, children }: { task: EditorTask; index: number; last: boolean; onChange: (update: (task: EditorTask) => EditorTask) => void; onMove: (delta: number) => void; onRemove: () => void; children?: ReactNode }) {
  return <li className="study-task space-y-3" data-complete={task.status === "COMPLETED"}>
    <div className="study-task__heading">
      <Label className="study-task__complete" htmlFor={`daily-complete-${task.key}`}>
        <input id={`daily-complete-${task.key}`} type="checkbox" aria-label={`Đánh dấu xong việc ${index + 1}`} checked={task.status === "COMPLETED"} onChange={(event) => { const status = event.target.checked ? "COMPLETED" : "TODO"; onChange((current) => ({ ...current, status })); }} />
        {task.status === "COMPLETED" ? "Đã xong" : "Đánh dấu xong"}
      </Label>
    </div>
    <div className="space-y-2"><Label htmlFor={`daily-task-${task.key}`}>Việc {index + 1}</Label><Input id={`daily-task-${task.key}`} value={task.title} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} /></div>
    <StudyDisclosure title={`Chi tiết việc · ${PRIORITY_LABEL[task.priority]}`}>
    <div className="study-task__fields">
      <div className="space-y-2"><Label htmlFor={`daily-priority-${task.key}`}>Mức</Label>
        <select id={`daily-priority-${task.key}`} className={selectClass} value={task.priority} onChange={(event) => onChange((current) => ({ ...current, priority: event.target.value as TaskPriority }))}>
          {(["MUST", "SHOULD", "COULD"] as const).map((priority) => <option key={priority} value={priority}>{PRIORITY_LABEL[priority]}</option>)}
        </select>
      </div>
      <div className="space-y-2"><Label htmlFor={`daily-status-${task.key}`}>Trạng thái</Label>
        <select id={`daily-status-${task.key}`} className={selectClass} value={task.status} onChange={(event) => onChange((current) => ({ ...current, status: event.target.value as DailyEditorStatus }))}>
          <option value="TODO">Chưa làm</option>
          <option value="COMPLETED">Đã xong</option>
        </select>
      </div>
    </div>
    <div className="study-task__tools">
      <Button type="button" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)}>Đưa lên</Button>
      <Button type="button" variant="ghost" disabled={last} onClick={() => onMove(1)}>Đưa xuống</Button>
      <Button type="button" variant="ghost" onClick={onRemove} aria-label={`Gỡ việc ${index + 1}`}>Gỡ việc</Button>
    </div>
    </StudyDisclosure>
    {children}
  </li>;
}

function ReviewField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="study-review-field space-y-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} maxLength={4000} onChange={(event) => onChange(event.target.value)} /></div>;
}
