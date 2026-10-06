import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DailyAccountGate, DailyAccountWarning } from "@/features/daily/components/daily-account-gate";
import { DailyPlanEditor } from "@/features/daily/components/daily-plan-editor";
import { useDailyPlanDates } from "@/features/daily/hooks/use-daily";
import { parsePlatformDate, platformDate, platformDateKey } from "@/features/daily/lib/platform-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StudyAreaNav } from "@/features/daily/ui/study-notebook";
import { StudyWeekList } from "@/features/daily/ui/study-calendar";
import { dailyErrorMessage } from "@/features/daily/lib/daily-contract";
import { dailyEntryDate } from "@/features/daily/lib/date-selection";
import { StudyDatePicker } from "@/features/daily/ui/study-date-picker";

export function DailyOwnerPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("date");
  const day = platformDate(new Date());
  const today = day ? platformDateKey(day) : "";

  if (raw === null && (params.get("view") === "history" || params.has("week"))) {
    const chosen = params.get("week") ?? today ?? "";
    return <DailyAccountGate>{(userId, warning, retry) => (
      <DailyWeekOverview
        userId={userId}
        warning={warning}
        retry={retry}
        chosen={chosen}
        today={today}
        onWeekChange={(week) => setParams(current => {
          const next = new URLSearchParams(current);
          next.set("week", week);
          return next;
        }, { state: { studyDateFocus: true } })}
      />
    )}</DailyAccountGate>;
  }

  if (raw !== null && !parsePlatformDate(raw)) return <div className="page-shell"><p role="alert">Ngày không hợp lệ. Dùng dạng YYYY-MM-DD.</p></div>;

  return <DailyOwnerScreen requestedDate={raw} onDate={(date) => setParams((current) => {
    const next = new URLSearchParams(current);
    next.set("date", date);
    return next;
  }, { state: { studyDateFocus: true } })} />;
}

function DailyWeekOverview({
  userId,
  warning,
  retry,
  chosen,
  today,
  onWeekChange,
}: {
  userId: string;
  warning: boolean;
  retry: () => void;
  chosen: string;
  today: string | null;
  onWeekChange: (week: string) => void;
}) {
  const planDatesQuery = useDailyPlanDates(userId);

  return <div className="page-shell study-notebook">
    <StudyAreaNav area="daily" />
    <DailyAccountWarning show={warning} onRetry={retry} />
    <PageHeader
      title="Các tuần đã lưu"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StudyDatePicker date={parsePlatformDate(chosen) ? chosen : today ?? ""} onSelect={date => { onWeekChange(date); return true; }} label="Chọn tuần" />
          {parsePlatformDate(chosen) ? <Button asChild variant="outline"><Link to={`/daily/week?weekStart=${chosen}`}>Mở tuần đã chọn</Link></Button> : null}
          {today ? (
            <Button asChild variant="ghost">
              <Link to={`/daily?date=${today}`}>
                Về hôm nay
              </Link>
            </Button>
          ) : null}
        </div>
      }
    />
    {!parsePlatformDate(chosen) ? <p role="alert" className="text-xs text-destructive">Ngày không hợp lệ.</p> : null}

    <section aria-label="Các tuần đã lưu" className="space-y-3">
      <p className="study-note">Chỉ gồm tuần có kế hoạch đã lưu. Dùng lịch phía trên để mở một tuần bất kỳ.</p>
      {planDatesQuery.isPending ? <p role="status">Đang tải lịch sử kế hoạch…</p> : null}
      {planDatesQuery.isError ? <div className="study-notice"><p role="alert">{dailyErrorMessage(planDatesQuery.error)}</p><Button type="button" variant="outline" disabled={planDatesQuery.isFetching} onClick={() => void planDatesQuery.refetch()}>Thử lại lịch sử</Button></div> : null}
      {planDatesQuery.isSuccess ? <StudyWeekList
        date={chosen}
        plannedDates={planDatesQuery.data}
        href={weekStart => `/daily/week?weekStart=${weekStart}`}
      /> : null}
    </section>
  </div>;
}

function DailyOwnerScreen({ requestedDate, onDate }: { requestedDate: string | null; onDate: (date: string) => void }) {
  // Capture at day-screen entry, not on refetch/edit; a new entry after history is fresh.
  const [today] = useState(() => { const day = platformDate(new Date()); return day ? platformDateKey(day) : ""; });
  const date = dailyEntryDate(requestedDate, today);
  if (!parsePlatformDate(date)) return <div className="page-shell"><p role="alert">Không xác định được ngày hiện tại.</p></div>;
  return <DailyAccountGate>{(userId, accountWarning, retryAccount) => (
    <DailyPlanEditor key={`${userId}:${date}`} userId={userId} date={date} onDate={onDate} accountWarning={accountWarning} onRetryAccount={retryAccount} />
  )}</DailyAccountGate>;
}
