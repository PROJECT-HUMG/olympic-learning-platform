import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/router/route-constants";
import { DailyAccountWarning } from "./daily-account-gate";
import { useDailyEditorSession, useDailyDraftLeave } from "../hooks/use-daily-editor";
import { useDailyWeek, useSaveDailyWeek } from "../hooks/use-daily";
import { dailyErrorMessage, isDailyConflict } from "../lib/daily-contract";
import { dailyDraftFailure, dailyLeaveBlocked, shouldApplyCompletedFetch } from "../lib/daily-lifecycle";
import { editorFromWeek, emptyWeekEditor, formatWeekSummary, shouldApplyServerDaily, weekSaveBody, type WeekEditor } from "../lib/plan-editor";
import { parsePlatformDate, platformDateKey, weekDates } from "../lib/platform-calendar";
import { StudyAreaNav, StudyDisclosure, StudyProgress } from "../ui/study-notebook";
import { StudyDayList } from "../ui/study-calendar";

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
    const chosen = parsePlatformDate(next);
    if (!chosen) {
      setNotice("Tuần không hợp lệ. Dùng dạng YYYY-MM-DD.");
      return;
    }
    const monday = platformDateKey(weekDates(chosen)[0]);
    if (monday === weekStart) return;
    if (blocked()) {
      setNotice(DATE_GUARD);
      return;
    }
    onWeek(monday);
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

  const showNotice = Boolean(notice || draft.dirty || draft.conflict || failure === "inline" || blocker.state === "blocked");

  return <div className="page-shell study-notebook">
    <StudyAreaNav area="daily" onNavigate={guardNavigation} />
    <DailyAccountWarning show={accountWarning} onRetry={onRetryAccount} />
    <PageHeader title={`Tuần từ ${weekStart}`} description="Mở một ngày để lập kế hoạch. Nhìn lại tuần ở bên dưới khi bạn cần." actions={<Link className="inline-flex h-11 items-center text-primary underline underline-offset-4" to={ROUTES.DAILY} onClick={guardNavigation}>Các tuần của tôi</Link>} />
    <PageSection title="Các ngày trong tuần" description="Thứ Hai đến chủ Nhật. Bấm một ngày để mở chi tiết; ngày trên lịch không đồng nghĩa đã có kế hoạch.">
      <StudyDayList weekStart={weekStart} href={day => `${ROUTES.DAILY}?date=${day}`} onNavigate={guardNavigation} />
    </PageSection>
    <StudyDisclosure title="Chọn tuần khác">
      <div className="space-y-2"><Label htmlFor="daily-week">Tuần</Label><Input id="daily-week" type="date" value={weekStart} disabled={draft.busy} onChange={(event) => go(event.target.value)} /></div>
    </StudyDisclosure>
    {week.data ? <StudyDisclosure title="Số liệu tuần đã ghi nhận" description={formatWeekSummary(week.data)}>
      <div className="study-week-summary">
        <div><h3 className="text-sm font-medium">Ngày có kế hoạch</h3><p>{week.data.plannedDays}/7 ngày</p><p className="study-note">Kể cả ngày đã lưu chưa có việc.</p></div>
        <div><h3 className="text-sm font-medium">Ngày nộp đúng giờ</h3><p>{week.data.onTimeDays} ngày</p><p className="study-note">Theo mốc nộp đầu của mỗi ngày.</p></div>
        <div><h3 className="text-sm font-medium">Hoàn thành trung bình</h3><p>{week.data.completionRate === null ? "Không áp dụng" : `${Math.round(week.data.completionRate * 100)}%`}</p><p className="study-note">Trung bình các ngày đã lưu có việc.</p></div>
        <StudyProgress label="Việc bắt buộc trong tuần" completed={week.data.mustCompleted} total={week.data.mustTotal} rate={week.data.mustRate} caption="Gộp việc bắt buộc, không phải trung bình các ngày." />
      </div>
    </StudyDisclosure> : null}
    {showNotice ? <div className="study-notice" role={draft.dirty || draft.conflict || failure === "inline" || blocker.state === "blocked" ? "alert" : "status"}>
      {blocker.state === "blocked" ? <p>{DATE_GUARD}</p> : null}
      {notice ? <p>{notice}</p> : null}
      {draft.dirty ? <p>Bản đang nhập chưa được lưu.</p> : null}
      {draft.conflict ? <p>Bản trên máy chủ đã đổi. Tải lại trước khi tiếp tục.</p> : null}
      {failure === "inline" && !notice ? <p>{dailyErrorMessage(week.error)} Bản đang nhập vẫn được giữ.</p> : null}
      {blocker.state === "blocked" ? <Button type="button" variant="outline" onClick={() => blocker.reset()}>Ở lại trang</Button> : null}
      {failure === "inline" ? <Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(false)}>Thử lại</Button> : null}
      {(draft.dirty || draft.conflict) ? <Button type="button" variant="outline" disabled={draft.busy} onClick={() => void fetchServer(true)}>Tải bản trên máy chủ</Button> : null}
    </div> : null}
    <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <fieldset disabled={draft.busy} className="m-0 min-w-0 border-0 p-0">
        <StudyDisclosure title={draft.dirty ? "Nhìn lại tuần · Chưa lưu" : "Nhìn lại tuần"} description="Ghi điều bạn nhận ra và một thay đổi thực tế cho tuần sau. Thu gọn không làm mất bản đang nhập.">
          <WeekField id="week-unfinished" label="Việc còn dở" value={form.recurringUnfinished} onChange={(value) => edit((current) => ({ ...current, recurringUnfinished: value }))} />
          <WeekField id="week-issues" label="Vấn đề lặp lại" value={form.issues} onChange={(value) => edit((current) => ({ ...current, issues: value }))} />
          <WeekField id="week-reflection" label="Nhìn lại" value={form.reflection} onChange={(value) => edit((current) => ({ ...current, reflection: value }))} />
          <WeekField id="week-next" label="Tuần sau" value={form.nextWeekChanges} onChange={(value) => edit((current) => ({ ...current, nextWeekChanges: value }))} />
        </StudyDisclosure>
        <div className="study-actions"><Button type="submit">Lưu nhìn lại</Button><p className="study-note">Lưu phản hồi của bạn; không thay đổi số liệu kế hoạch ngày.</p></div>
      </fieldset>
    </form>
  </div>;
}

function WeekField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="study-review-field space-y-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} maxLength={4000} onChange={(event) => onChange(event.target.value)} /></div>;
}
