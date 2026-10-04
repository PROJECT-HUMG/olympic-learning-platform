import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DailyAccountGate } from "@/features/daily/components/daily-account-gate";
import { DailyPlanEditor } from "@/features/daily/components/daily-plan-editor";
import { parsePlatformDate, platformDate, platformDateKey } from "@/features/daily/lib/platform-calendar";

export function DailyOwnerPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("date");
  const todayDate = platformDate(new Date());
  const today = todayDate ? platformDateKey(todayDate) : null;

  useEffect(() => {
    if (raw !== null || !today) return;
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("date", today);
      return next;
    }, { replace: true });
  }, [raw, today, setParams]);

  if (raw === null) return <div className="page-shell"><p role="status">Đang mở ngày hôm nay.</p></div>;
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
