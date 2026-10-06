import { useDailyConfirm } from "../ui/use-daily-confirm";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/router/route-constants";
import { DailyAccountWarning } from "./daily-account-gate";
import { useDailyEditorSession, useDailyDraftLeave } from "../hooks/use-daily-editor";
import { useDailyWeek, useSaveDailyWeek } from "../hooks/use-daily";
import { dailyErrorMessage, isDailyConflict } from "../lib/daily-contract";
import { dailyDraftFailure, dailyLeaveBlocked, shouldApplyCompletedFetch } from "../lib/daily-lifecycle";
import { editorFromWeek, emptyWeekEditor, shouldApplyServerDaily, weekSaveBody, type WeekEditor } from "../lib/plan-editor";
import { parsePlatformDate, platformDateKey, weekDates } from "../lib/platform-calendar";
import { StudyAreaNav, StudyDisclosure, StudyWeekStats } from "../ui/study-notebook";
import { StudyDatePicker } from "../ui/study-date-picker";

const DATE_GUARD = "Hãy lưu hoặc tải lại trước khi đổi ngày.";

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
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!week.isSuccess || !week.data || !shouldApplyServerDaily({
      dirty: draft.session.current.dirty,
      conflict: draft.session.current.conflict,
      busy: draft.session.current.gate.operation !== "idle",
    })) return;
    setForm(editorFromWeek(week.data));
    setReady(true);
  }, [week.isSuccess, week.data, draft.session]);

  function edit(update: (current: WeekEditor) => WeekEditor) {
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
    setForm(editorFromWeek(result.data));
    setReady(true);
    setNotice(null);
  }

  async function save() {
    const readyBody = weekSaveBody(form);
    if (!readyBody.ok) {
      setNotice(readyBody.message);
      return;
    }
    const revision = draft.begin("save");
    if (revision === null) return;
    try {
      const saved = await saveWeek.mutateAsync(readyBody.body);
      if (!draft.finish("save", revision, "apply")) return;
      setForm(editorFromWeek(saved));
      setNotice("Đã lưu nhìn lại tuần.");
    } catch (error) {
      draft.finish("save", revision, "keep", isDailyConflict(error) ? true : undefined);
      setNotice(dailyErrorMessage(error));
    }
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
          <StudyDatePicker date={weekStart} onSelect={go} disabled={draft.busy} label="Chọn tuần">{chosen => <>
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
    <form id="daily-week-form" className="study-work-surface" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <fieldset disabled={draft.busy} className="m-0 min-w-0 border-0 p-0">
        <StudyDisclosure id="week-review" title={draft.dirty ? "Nhìn lại tuần · Chưa lưu" : "Nhìn lại tuần"} defaultOpen>
          <WeekField id="week-unfinished" label="Việc còn dở" value={form.recurringUnfinished} onChange={(value) => edit((current) => ({ ...current, recurringUnfinished: value }))} />
          <WeekField id="week-issues" label="Vấn đề lặp lại" value={form.issues} onChange={(value) => edit((current) => ({ ...current, issues: value }))} />
          <WeekField id="week-reflection" label="Nhìn lại" value={form.reflection} onChange={(value) => edit((current) => ({ ...current, reflection: value }))} />
          <WeekField id="week-next" label="Tuần sau" value={form.nextWeekChanges} onChange={(value) => edit((current) => ({ ...current, nextWeekChanges: value }))} />
        </StudyDisclosure>
      </fieldset>
    </form>
    <aside className="study-reflection-rail">
      {week.data ? <StudyWeekStats {...week.data} /> : null}
      {draft.dirty && !showNotice ? <Button type="button" variant="ghost" disabled={draft.busy} onClick={async () => { if (await confirm("Thay bản đang nhập bằng nhìn lại tuần trên máy chủ?")) void fetchServer(true); }}>Tải bản trên máy chủ</Button> : null}
    </aside>
    </div>
    <div className="study-savebar" aria-label="Lưu nhìn lại tuần">
      <div><p className="text-sm font-medium" role="status">{draft.busy ? "Đang xử lý…" : draft.dirty ? "Bản nháp chưa lưu" : form.id ? "Nhìn lại đã lưu" : "Chưa có nhận xét đã lưu"}</p><p className="study-note">Lưu nhận xét; không đổi số liệu ngày.</p></div>
      <Button type="submit" form="daily-week-form" disabled={draft.busy}>Lưu nhìn lại</Button>
    </div>
  </div>;
}

function WeekField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="study-review-field space-y-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} maxLength={4000} onChange={(event) => onChange(event.target.value)} /></div>;
}
