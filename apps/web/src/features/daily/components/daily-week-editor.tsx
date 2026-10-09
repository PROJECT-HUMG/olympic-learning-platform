import { DailyReflectionField } from "../ui/daily-reflection-field";
import { useDailyConfirm } from "../ui/use-daily-confirm";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/router/route-constants";
import { DailyAccountWarning } from "./daily-account-gate";
import { useDailyEditorSession, useDailyDraftLeave } from "../hooks/use-daily-editor";
import { useDailyAutoSync } from "../hooks/use-daily-auto-sync";
import { DailySyncStatus } from "../ui/daily-sync-status";
import { useDailyWeek, useSaveDailyWeek } from "../hooks/use-daily";
import { dailyErrorMessage } from "../lib/daily-contract";
import { dailyDraftFailure, dailyLeaveBlocked, shouldApplyCompletedFetch } from "../lib/daily-lifecycle";
import { editorFromWeek, emptyWeekEditor, rebaseSyncedWeek, shouldApplyServerDaily, weekSaveBody, type WeekEditor } from "../lib/plan-editor";
import { parsePlatformDate, platformDateKey, weekDates } from "../lib/platform-calendar";
import { StudyAreaNav, StudyDisclosure, StudyWeekStats } from "../ui/study-notebook";
import { StudyDatePicker } from "../ui/study-date-picker";

const DATE_GUARD = "Thay đổi chưa đồng bộ. Chờ đồng bộ xong hoặc xử lý lỗi trước khi đổi tuần.";

export function DailyWeekEditor({ userId, weekStart, onWeek, accountWarning, onRetryAccount }: {
  userId: string;
  weekStart: string;
  onWeek: (weekStart: string) => void;
  accountWarning: boolean;
  onRetryAccount: () => void;
}) {
  const week = useDailyWeek(userId, weekStart);
  const saveWeek = useSaveDailyWeek(userId, weekStart);
  const { confirm, confirmation } = useDailyConfirm();
  const draft = useDailyEditorSession();
  const blocker = useDailyDraftLeave(draft.session, draft.snapshot);
  const [form, setForm] = useState<WeekEditor>(() => emptyWeekEditor(weekStart));
  const formRef = useRef(form);
  function replaceForm(next: WeekEditor) { formRef.current = next; setForm(next); }
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const sync = useDailyAutoSync({
    draft, ready, read: () => formRef.current, write: replaceForm,
    validate: weekSaveBody, persist: body => saveWeek.mutateAsync(body),
    replace: editorFromWeek, rebase: rebaseSyncedWeek,
  });
  const editingLocked = draft.busy && !sync.syncing;

  useEffect(() => {
    if (!week.isSuccess || !week.data || !shouldApplyServerDaily({
      dirty: draft.session.current.dirty,
      conflict: draft.session.current.conflict,
      busy: draft.session.current.gate.operation !== "idle",
    })) return;
    const next = editorFromWeek(week.data);
    formRef.current = next;
    setForm(next);
    setReady(true);
  }, [week.isSuccess, week.data, draft.session]);

  function edit(update: (current: WeekEditor) => WeekEditor) {
    if (draft.edit(() => replaceForm(update(formRef.current)))) setNotice(null);
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
    const chosen = parsePlatformDate(next);
    if (!chosen) {
      setNotice("Tuần không hợp lệ. Dùng dạng YYYY-MM-DD.");
      return false;
    }
    const monday = platformDateKey(weekDates(chosen)[0]);
    if (monday === weekStart) return true;
    if (blocked()) {
      setNotice(DATE_GUARD);
      return false;
    }
    onWeek(monday);
    return true;
  }

  async function fetchServer(replace: boolean) {
    const operation = replace ? "reload" : "retry";
    const revision = draft.begin(operation);
    if (revision === null) return;
    const result = await week.refetch();
    if (!result.isSuccess || !result.data) {
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
    replaceForm(editorFromWeek(result.data));
    sync.reset();
    setReady(true);
    setNotice(null);
  }

  const failure = dailyDraftFailure({ ready, error: week.isError });
  if (failure === "initial") {
    return <div className="page-shell"><DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} /><p role="alert">{notice ?? dailyErrorMessage(week.error)}</p><Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(false)}>Thử lại</Button></div>;
  }
  if (failure === "loading") return <div className="page-shell"><DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} /><p role="status">Đang tải tuần {weekStart}.</p></div>;

  const showNotice = Boolean(notice || draft.conflict || failure === "inline" || blocker.state === "blocked");

  return <div className="page-shell study-notebook study-week-editor">
    {confirmation}
    <StudyAreaNav area="daily" onNavigate={guardNavigation} />
    <DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} />
    <PageHeader
      title="Nhìn lại tuần"
      description="Nhận ra điều đã hiệu quả. Chọn điều chỉnh cho tuần tới."
      actions={
        <div className="study-toolbar">
          <StudyDatePicker date={weekStart} onSelect={go} disabled={draft.busy} label="Chọn tuần" blockedMessage={DATE_GUARD}>{chosen => <>
            <Link to={`${ROUTES.DAILY}?date=${chosen}`} onClick={guardNavigation}>Mở ngày trên lịch</Link>
            <Link to={`${ROUTES.DAILY}?view=history`} onClick={guardNavigation}>Các tuần đã lưu</Link>
          </>}</StudyDatePicker>
          <Button asChild variant="ghost"><Link to={`${ROUTES.DAILY}?date=${weekStart}`} aria-label={`Mở kế hoạch ngày ${weekStart}`} onClick={guardNavigation}>Mở ngày</Link></Button>
        </div>
      }
    />

    {showNotice ? <div className="study-notice" role={draft.dirty || draft.conflict || failure === "inline" || blocker.state === "blocked" ? "alert" : "status"}>
      {blocker.state === "blocked" ? <p>{DATE_GUARD}</p> : null}
      {notice ? <p>{notice}</p> : null}
      {draft.conflict ? <p>Bản trên máy chủ đã đổi. Tải lại trước khi tiếp tục.</p> : null}
      {failure === "inline" && !notice ? <p>{dailyErrorMessage(week.error)} Bản đang nhập vẫn được giữ.</p> : null}
      {blocker.state === "blocked" ? <Button type="button" variant="outline" onClick={() => blocker.reset()}>Ở lại trang</Button> : null}
      {failure === "inline" ? <Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(false)}>Thử lại</Button> : null}
      {(draft.dirty || draft.conflict) ? <Button type="button" variant="outline" disabled={draft.busy} onClick={async () => { if (!draft.dirty || await confirm("Thay bản đang nhập bằng nhìn lại tuần trên máy chủ?")) void fetchServer(true); }}>Tải bản trên máy chủ</Button> : null}
    </div> : null}
    <div className="study-week-workspace">
    <form id="daily-week-form" className="study-work-surface" onSubmit={(event) => { event.preventDefault(); }}>
      <fieldset disabled={editingLocked} className="m-0 min-w-0 border-0 p-0">
        <StudyDisclosure id="week-review" title="Nhìn lại tuần" defaultOpen>
          <DailyReflectionField id="week-unfinished" label="Việc còn dở" value={form.recurringUnfinished} onChange={(value) => edit((current) => ({ ...current, recurringUnfinished: value }))} />
          <DailyReflectionField id="week-issues" label="Vấn đề lặp lại" value={form.issues} onChange={(value) => edit((current) => ({ ...current, issues: value }))} />
          <DailyReflectionField id="week-reflection" label="Nhìn lại" value={form.reflection} onChange={(value) => edit((current) => ({ ...current, reflection: value }))} />
          <DailyReflectionField id="week-next" label="Tuần sau" value={form.nextWeekChanges} onChange={(value) => edit((current) => ({ ...current, nextWeekChanges: value }))} />
        </StudyDisclosure>
      </fieldset>
    </form>
    <aside className="study-reflection-rail">
      {week.data ? <StudyWeekStats {...week.data} /> : null}
      {draft.dirty && !showNotice ? <Button type="button" variant="ghost" disabled={draft.busy} onClick={async () => { if (await confirm("Thay bản đang nhập bằng nhìn lại tuần trên máy chủ?")) void fetchServer(true); }}>Tải bản trên máy chủ</Button> : null}
    </aside>
    </div>
    <div className="study-savebar" aria-label="Đồng bộ nhìn lại tuần">
      <div><DailySyncStatus dirty={draft.dirty} busy={draft.busy} syncing={sync.syncing} saved={Boolean(form.id)} issue={sync.issue} conflict={draft.conflict} onRetry={sync.retry} /><p className="study-note">Nhận xét tự động lưu; không đổi số liệu ngày.</p></div>
    </div>
  </div>;
}
