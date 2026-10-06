import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DailyDialogHeader } from "../ui/daily-dialog-header";
import { ROUTES } from "@/router/route-constants";
import { DailyAccountWarning } from "./daily-account-gate";
import { EvidencePanel } from "../evidence/evidence-panel";
import { useDailyEditorSession, useDailyDraftLeave } from "../hooks/use-daily-editor";
import { useAddDailyTask, useDailyPlan, useSaveDailyPlan, useSubmitDailyPlan } from "../hooks/use-daily";
import { dailyFigures, type TaskPriority } from "../lib/completion-figures";
import { dailyErrorMessage, isDailyConflict, type DailyEditorStatus } from "../lib/daily-contract";
import { dailyDraftFailure, dailyLeaveBlocked, shouldApplyCompletedFetch } from "../lib/daily-lifecycle";
import {
  editorFromPlan,
  emptyPlanEditor,
  planSaveBody,
  rebaseAddedTask,
  shouldApplyServerDaily,
  submitAllowed,
  type EditorTask,
  type PlanEditor,
} from "../lib/plan-editor";
import { parsePlatformDate, platformDateKey, weekDates, type SubmitTiming } from "../lib/platform-calendar";
import { PRIORITY_LABEL, SUBMIT_TIMING_LABEL } from "../lib/review-display";
import { StudyAreaNav, StudyEmpty, StudyProgress } from "../ui/study-notebook";
import { useDailyConfirm } from "../ui/use-daily-confirm";
import { StudyDatePicker } from "../ui/study-date-picker";

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
  const addTask = useAddDailyTask(userId, date);
  const submitPlan = useSubmitDailyPlan(userId, date);
  const draft = useDailyEditorSession();
  const blocker = useDailyDraftLeave(draft.session, draft.snapshot);
  const [form, setForm] = useState<PlanEditor>(() => emptyPlanEditor(date));
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [addFailure, setAddFailure] = useState<string | null>(null);
  const { confirm, confirmation } = useDailyConfirm();
  const [activeModalTask, setActiveModalTask] = useState<EditorTask | null>(null);
  const parsed = parsePlatformDate(date);
  const weekStart = parsed ? platformDateKey(weekDates(parsed)[0]) : null;

  function openAddTaskModal() {
    setActiveModalTask(blankTask());
    setAddFailure(null);
    setAddOpen(true);
  }

  async function persistTask() {
    if (!activeModalTask || draft.conflict || form.tasks.length >= 50) return;
    const revision = draft.begin("save");
    if (revision === null) return;
    setAddFailure(null);
    try {
      const saved = await addTask.mutateAsync({ taskId: activeModalTask.key, expectedVersion: form.version, title: activeModalTask.title.trim(), priority: activeModalTask.priority, status: activeModalTask.status });
      const next = rebaseAddedTask(form, saved, activeModalTask.key);
      // Finishing with keep preserves the dirty flag for every unrelated local edit.
      draft.finish("save", revision, "keep");
      setForm(next);
      setReady(true);
      setAddOpen(false);
      setActiveModalTask(null);
      setNotice("Đã lưu việc lên máy chủ. Các thay đổi khác vẫn cần Lưu kế hoạch; thao tác này không nộp kế hoạch.");
    } catch (error) {
      draft.finish("save", revision, "keep", isDailyConflict(error) ? true : undefined);
      const message = `${dailyErrorMessage(error)} Chưa xác nhận lưu việc. Nội dung được giữ để thử lại; kiểm tra bản trên máy chủ nếu đã mất kết nối.`;
      setAddFailure(message);
      setNotice(message);
    }
  }

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
    if (draft.edit(() => setForm(update))) setNotice(null);
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
      return false;
    }
    if (next === date) return true;
    if (blocked()) {
      setNotice(DATE_GUARD);
      return false;
    }
    onDate(next);
    return true;
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
      return true;
    } catch (error) {
      draft.finish("save", revision, "keep", isDailyConflict(error) ? true : undefined);
      setNotice(dailyErrorMessage(error));
      return false;
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
  const canSubmit = !draft.conflict && submitAllowed({ dirty: draft.dirty, planId: form.id, busy: draft.busy });
  const showNotice = Boolean(notice || draft.conflict || failure === "inline" || blocker.state === "blocked");

  return <div className="page-shell study-notebook study-day-editor">
    <StudyAreaNav area="daily" onNavigate={guardNavigation} />
    <DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} />
    <PageHeader
      title="Daily của tôi"
      description={<span className="study-submit-status" role="status">
        <strong>{SUBMIT_TIMING_LABEL[timing]}</strong>
        <span>{form.firstSubmittedAt ? `Lần nộp đầu: ${new Date(form.firstSubmittedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : "Hạn nộp đầu 07:30, giờ Việt Nam"}</span>
      </span>}
      actions={
        <div className="study-toolbar">
          <StudyDatePicker date={date} onSelect={go} disabled={draft.busy}>
            <Link to={`${ROUTES.DAILY_WEEK}?weekStart=${weekStart}`} onClick={guardNavigation}>Nhìn lại tuần</Link>
            <Link to={`${ROUTES.DAILY}?view=history`} onClick={guardNavigation}>Các tuần đã lưu</Link>
          </StudyDatePicker>
          <Dialog open={reflectionOpen} onOpenChange={setReflectionOpen}>
            <DialogTrigger asChild><Button type="button" variant="outline" className="study-reflection-jump">Nhìn lại ngày</Button></DialogTrigger>
            <DialogContent className="daily-dialog daily-reflection-dialog" showCloseButton={false}>
              <DailyDialogHeader><DialogTitle>Nhìn lại ngày</DialogTitle><DialogDescription>{date} · Ghi nhận điều đã học và chuẩn bị cho ngày mai.</DialogDescription></DailyDialogHeader>
              <div className="daily-reflection-layout">
                <aside className="daily-reflection-context">
                  <h3>Công việc trong ngày</h3>
                  <p className="study-note">Theo bản đang nhập{draft.dirty ? " · Có thay đổi chưa lưu" : ""}.</p>
                  {form.tasks.length ? <ul tabIndex={0} aria-label="Công việc trong bản đang nhập">{form.tasks.map(task => <li key={task.key}><span className="daily-reflection-context__status" data-complete={task.status === "COMPLETED"}>{task.status === "COMPLETED" ? "Đã xong" : "Chưa làm"}</span><span>{task.title || "Việc chưa đặt tên"}</span></li>)}</ul> : <p className="study-note">Ngày này chưa có việc. Bạn vẫn có thể ghi lại điều đã học.</p>}
                </aside>
                <fieldset disabled={draft.busy} className="daily-reflection-fields">
                  <ReviewField id="daily-reasons" label="Vì sao chưa xong" value={form.reviewReasons} onChange={(value) => edit((current) => ({ ...current, reviewReasons: value }))} />
                  <ReviewField id="daily-well" label="Việc đã ổn" value={form.reviewWentWell} onChange={(value) => edit((current) => ({ ...current, reviewWentWell: value }))} />
                  <ReviewField id="daily-tomorrow" label="Ngày mai" value={form.reviewTomorrow} onChange={(value) => edit((current) => ({ ...current, reviewTomorrow: value }))} />
                </fieldset>
              </div>
              {notice || draft.conflict ? <p className="study-notice" role="status">{notice ?? "Bản trên máy chủ đã đổi. Đóng hộp thoại và tải lại trước khi lưu."}</p> : null}
              <div className="daily-dialog-actions"><p className="study-note">Lưu cả công việc và nhìn lại đang nhập, không nộp hay bật chia sẻ. Đóng giữ bản nháp.</p><Button disabled={draft.busy || draft.conflict} onClick={() => void save().then(saved => { if (saved) setReflectionOpen(false); })}><Save size={16} />Lưu kế hoạch và nhìn lại</Button></div>
            </DialogContent>
          </Dialog>
        </div>
      }
    />

    {/* Add/Edit Task Modal Dialog */}
    <Dialog open={addOpen} onOpenChange={open => { if (!draft.busy) setAddOpen(open); }}>
    <DialogContent className="daily-dialog daily-add-dialog" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); document.getElementById("daily-add-task")?.focus(); }} onEscapeKeyDown={event => { if (draft.busy) event.preventDefault(); }} onInteractOutside={event => { if (draft.busy) event.preventDefault(); }}>
      {activeModalTask ? (
        <div className="space-y-4">
          <DailyDialogHeader busy={draft.busy}><DialogTitle>Thêm việc</DialogTitle><DialogDescription>Xác nhận để lưu ngay lên máy chủ. Không nộp kế hoạch, không bật chia sẻ và không lưu các chỉnh sửa khác.</DialogDescription></DailyDialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`daily-task-modal-input`} className="text-xs font-medium">
                Tên công việc / mục tiêu
              </Label>
              <Input
                id={`daily-task-modal-input`}
                value={activeModalTask.title}
                maxLength={200}
                onChange={(e) => setActiveModalTask({ ...activeModalTask, title: e.target.value })}
                placeholder="Nhập tên việc cần làm..."
                autoFocus
                disabled={draft.busy}
              />
            </div>

            <div className="study-task__fields">
              <div className="space-y-1.5">
                <Label htmlFor={`daily-priority-modal-select`} className="text-xs font-medium">
                  Mức ưu tiên
                </Label>
                <select
                  id={`daily-priority-modal-select`}
                  className="study-select"
                  value={activeModalTask.priority}
                  disabled={draft.busy}
                  onChange={(e) => setActiveModalTask({ ...activeModalTask, priority: e.target.value as TaskPriority })}
                >
                  {(["MUST", "SHOULD", "COULD"] as const).map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABEL[priority]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`daily-status-modal-select`} className="text-xs font-medium">
                  Trạng thái
                </Label>
                <select
                  id={`daily-status-modal-select`}
                  className="study-select"
                  value={activeModalTask.status}
                  disabled={draft.busy}
                  onChange={(e) => setActiveModalTask({ ...activeModalTask, status: e.target.value as DailyEditorStatus })}
                >
                  <option value="TODO">Chưa làm</option>
                  <option value="COMPLETED">Đã xong</option>
                </select>
              </div>
            </div>
          </div>

          {addFailure ? <p role="alert" className="study-notice">{addFailure}</p> : null}
          <div className="daily-dialog-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={draft.busy}
              onClick={() => setAddOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!activeModalTask.title.trim() || draft.busy || draft.conflict || form.tasks.length >= 50}
              onClick={() => void persistTask()}
            >
              {draft.busy ? "Đang lưu việc…" : addFailure ? "Thử lưu lại" : "Thêm và lưu việc"}
            </Button>
          </div>
        </div>
      ) : null}
    </DialogContent>
    </Dialog>
    {confirmation}

    {showNotice ? <div className="study-notice" role={draft.dirty || draft.conflict || failure === "inline" || blocker.state === "blocked" ? "alert" : "status"}>
      {blocker.state === "blocked" ? <p>{DATE_GUARD}</p> : null}
      {notice ? <p>{notice}</p> : null}
      {draft.conflict ? <p>Bản trên máy chủ đã đổi. Tải lại trước khi tiếp tục.</p> : null}
      {failure === "inline" && !notice ? <p>{dailyErrorMessage(plan.error)} Bản đang nhập vẫn được giữ.</p> : null}
      {blocker.state === "blocked" ? <Button type="button" variant="outline" onClick={() => blocker.reset()}>Ở lại trang</Button> : null}
      {failure === "inline" ? <Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(false)}>Thử lại</Button> : null}
      {(draft.dirty || draft.conflict) ? <Button type="button" variant="outline" disabled={draft.busy} onClick={async () => { if (!draft.dirty || await confirm("Thay bản đang nhập bằng kế hoạch trên máy chủ? Các thay đổi chưa lưu sẽ bị bỏ.")) void fetchServer(true); }}>Tải bản trên máy chủ</Button> : null}
    </div> : null}
    <form id="daily-plan-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <fieldset disabled={draft.busy} className="study-day-workspace m-0 min-w-0 border-0 p-0">
        <PageSection className="study-work-surface" title="Công việc" actions={<Button id="daily-add-task" type="button" disabled={draft.busy || form.tasks.length >= 50} onClick={openAddTaskModal}><Plus size={16} aria-hidden="true" />Thêm việc</Button>}>
          {form.tasks.length === 0 ? <StudyEmpty title="Chưa có việc.">Thêm việc để bắt đầu, hoặc lưu ngày không có việc.</StudyEmpty> : null}
          {form.tasks.length > 0 ? <div className="study-progress-grid study-progress-grid--plain" aria-label="Tiến độ trong bản đang nhập">
            <StudyProgress label="Tất cả việc" completed={figures.overall.completed} total={figures.overall.total} rate={figures.overall.rate} />
            <StudyProgress label="Bắt buộc" completed={figures.must.completed} total={figures.must.total} rate={figures.must.rate} />
          </div> : null}
          <ol className="study-task-list">
            {form.tasks.map((task, index) => <TaskRow key={task.key} task={task} index={index} last={index === form.tasks.length - 1} onChange={(update) => edit((current) => ({ ...current, tasks: current.tasks.map((item) => item.key === task.key ? update(item) : item) }))} onMove={(delta) => edit((current) => ({ ...current, tasks: moveTask(current.tasks, index, delta) }))} onRemove={() => edit((current) => ({ ...current, tasks: current.tasks.filter((item) => item.key !== task.key) }))}>
              {header => <EvidencePanel userId={userId} planId={form.id} taskId={task.id} taskTitle={task.title} taskHeader={header} groupId={null} disabled={draft.busy} />}
            </TaskRow>)}
          </ol>
        </PageSection>
      </fieldset>
    </form>
    {draft.dirty && !showNotice ? <Button type="button" variant="ghost" className="daily-reload" disabled={draft.busy} onClick={async () => { if (await confirm("Thay bản đang nhập bằng kế hoạch trên máy chủ? Các thay đổi chưa lưu sẽ bị bỏ.")) void fetchServer(true); }}>Tải bản trên máy chủ</Button> : null}
    <p className="study-note daily-reflection-status">{plan.data && [plan.data.reviewReasons, plan.data.reviewWentWell, plan.data.reviewTomorrow].some(value => value?.trim()) ? "Đã có nhìn lại được lưu. Mở Nhìn lại ngày để xem hoặc chỉnh sửa." : "Chưa có nhìn lại được lưu. Bạn có thể mở Nhìn lại ngày bất cứ lúc nào."}</p>
        <div className="study-savebar" aria-label="Lưu và nộp kế hoạch">
          <div><p className="text-sm font-medium" role="status">{draft.busy ? "Đang xử lý…" : draft.dirty ? "Bản nháp chưa lưu" : form.id ? "Kế hoạch đã lưu" : "Chưa có kế hoạch đã lưu"}</p><p className="study-note">Lưu trước khi nộp. Nộp không bật chia sẻ.</p></div>
          <div className="study-savebar__buttons">
          <Button type="submit" form="daily-plan-form" disabled={draft.busy}>
            <Save className="h-4 w-4" /> Lưu kế hoạch
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canSubmit}
            onClick={() => void submit()}
            aria-describedby="daily-submit-help"
          >
            <Send className="h-4 w-4" /> {form.firstSubmittedAt ? "Nộp lại" : "Nộp kế hoạch"}
          </Button>
          </div>
          <p id="daily-submit-help" className="sr-only">{draft.dirty ? "Lưu kế hoạch trước khi nộp." : !form.id ? "Lưu kế hoạch để tạo bản trên máy chủ trước khi nộp." : "Nộp ghi nhận mốc nộp đầu, không bật chia sẻ."} Nộp lại giữ nguyên mốc nộp đầu.</p>
        </div>
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

function TaskRow({ task, index, last, onChange, onMove, onRemove, children }: { task: EditorTask; index: number; last: boolean; onChange: (update: (task: EditorTask) => EditorTask) => void; onMove: (delta: number) => void; onRemove: () => void; children: (header: ReactNode) => ReactNode }) {
  const isComplete = task.status === "COMPLETED";
  const row = useRef<HTMLLIElement>(null);
  const removeFocus = useRef<HTMLElement | null>(null);

  function remove() {
    removeFocus.current = row.current?.nextElementSibling?.querySelector<HTMLInputElement>('input[type="checkbox"]')
      ?? row.current?.previousElementSibling?.querySelector<HTMLInputElement>('input[type="checkbox"]')
      ?? document.getElementById("daily-add-task");
    onRemove();
  }

  const header = <div className="daily-task-card">
    <div className="study-task__main">
      <Label className="study-task__complete" htmlFor={`daily-complete-${task.key}`}>
        <input id={`daily-complete-${task.key}`} type="checkbox" aria-label={`Đánh dấu xong việc ${index + 1}`} checked={isComplete} onChange={(event) => { const status = event.target.checked ? "COMPLETED" : "TODO"; onChange((current) => ({ ...current, status })); }} />
        <span className="sr-only">{isComplete ? "Đã xong" : "Chưa làm"}</span>
      </Label>
    <Label htmlFor={`daily-task-${task.key}`} className="sr-only">Tên việc {index + 1}</Label>
    <Input id={`daily-task-${task.key}`} value={task.title} maxLength={200} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} placeholder="Nhập tên việc cần làm..." className={isComplete ? "line-through text-muted-foreground" : "font-medium"} />
    </div>
    <div className="study-task__controls">
        <Label htmlFor={`daily-priority-${task.key}`} className="sr-only">Mức ưu tiên việc {index + 1}</Label>
        <select id={`daily-priority-${task.key}`} className="study-select" data-priority={task.priority} value={task.priority} onChange={(event) => onChange((current) => ({ ...current, priority: event.target.value as TaskPriority }))}>
          {(["MUST", "SHOULD", "COULD"] as const).map(priority => <option key={priority} value={priority}>{PRIORITY_LABEL[priority]}</option>)}
        </select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="study-task__menu" aria-label={`Thao tác việc ${index + 1}`}><MoreHorizontal size={18} aria-hidden="true" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="study-task-menu" onCloseAutoFocus={event => {
          if (!removeFocus.current) return;
          event.preventDefault();
          const target = removeFocus.current;
          removeFocus.current = null;
          requestAnimationFrame(() => target.focus());
        }}>
          <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(-1)} aria-label={`Đưa việc ${index + 1} lên trước`}><ArrowUp size={16} />Đưa lên trước</DropdownMenuItem>
          <DropdownMenuItem disabled={last} onSelect={() => onMove(1)} aria-label={`Đưa việc ${index + 1} xuống sau`}><ArrowDown size={16} />Đưa xuống sau</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={remove} aria-label={`Gỡ việc ${index + 1}`}><Trash2 size={16} />Gỡ khỏi bản nháp</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    </div>;
  return <li ref={row} className="study-task study-task--editable" data-complete={isComplete}>{children(header)}</li>;
}

function ReviewField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="study-review-field space-y-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} maxLength={4000} onChange={(event) => onChange(event.target.value)} /></div>;
}
