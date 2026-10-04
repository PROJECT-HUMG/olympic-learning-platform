import { useSearchParams } from "react-router-dom";
import { DailyAccountGate, DailyAccountWarning } from "@/features/daily/components/daily-account-gate";
import { DailyPlanEditor } from "@/features/daily/components/daily-plan-editor";
import { parsePlatformDate, platformDate, platformDateKey } from "@/features/daily/lib/platform-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudyAreaNav, StudyDisclosure } from "@/features/daily/ui/study-notebook";
import { StudyWeekList } from "@/features/daily/ui/study-calendar";

export function DailyOwnerPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("date");
  const todayDate = platformDate(new Date());
  const today = todayDate ? platformDateKey(todayDate) : null;

  if (raw === null) {
    const chosen = params.get("week") ?? today ?? "";
    return <DailyAccountGate>{(_userId, warning, retry) => <div className="page-shell study-notebook">
      <StudyAreaNav area="daily" />
      <DailyAccountWarning show={warning} onRetry={retry} />
      <PageHeader title="Daily của tôi" description="Chọn một tuần, mở từng ngày để lập kế hoạch và nhìn lại." />
      <PageSection title="Các tuần" description="Danh sách theo lịch, không phải lịch sử các tuần đã lưu.">
        <StudyWeekList date={chosen} href={weekStart => `/daily/week?weekStart=${weekStart}`} />
      </PageSection>
      <StudyDisclosure title="Chọn tuần khác">
        <Label htmlFor="daily-calendar-week">Ngày trong tuần cần mở</Label>
        <Input className="mt-2 max-w-xs" id="daily-calendar-week" type="date" value={chosen} onChange={event => setParams({ week: event.target.value })} />
        {!parsePlatformDate(chosen) ? <p role="alert">Ngày không hợp lệ.</p> : null}
      </StudyDisclosure>
    </div>}</DailyAccountGate>;
  }
  if (!parsePlatformDate(raw)) return <div className="page-shell"><p role="alert">Ngày không hợp lệ. Dùng dạng YYYY-MM-DD.</p></div>;

  return <DailyOwnerScreen date={raw} onDate={(date) => setParams((current) => {
    const next = new URLSearchParams(current);
    next.set("date", date);
    return next;
  })} />;
}

function DailyOwnerScreen({ date, onDate }: { date: string; onDate: (date: string) => void }) {
  return <DailyAccountGate>{(userId, accountWarning, retryAccount) => (
    <DailyPlanEditor key={`${userId}:${date}`} userId={userId} date={date} onDate={onDate} accountWarning={accountWarning} onRetryAccount={retryAccount} />
  )}</DailyAccountGate>;
}
