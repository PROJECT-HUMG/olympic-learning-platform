import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DailyAccountGate } from "@/features/daily/components/daily-account-gate";
import { DailyWeekEditor } from "@/features/daily/components/daily-week-editor";
import { parsePlatformDate, platformDate, platformDateKey, weekDates } from "@/features/daily/lib/platform-calendar";

export function DailyWeekPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("weekStart");
  const todayDate = platformDate(new Date());
  const todayMonday = todayDate ? platformDateKey(weekDates(todayDate)[0]) : null;
  const parsed = raw === null ? null : parsePlatformDate(raw);
  const monday = parsed ? platformDateKey(weekDates(parsed)[0]) : null;

  useEffect(() => {
    const target = raw === null ? todayMonday : monday;
    if (!target || target === raw) return;
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("weekStart", target);
      return next;
    }, { replace: true });
  }, [raw, todayMonday, monday, setParams]);

  if (raw === null) return <div className="page-shell"><p role="status">Đang mở tuần này.</p></div>;
  if (!parsed) return <div className="page-shell"><p role="alert">Tuần không hợp lệ. Dùng ngày thứ Hai dạng YYYY-MM-DD.</p></div>;
  if (monday !== raw) return <div className="page-shell"><p role="status">Đang mở thứ Hai của tuần.</p></div>;

  return <DailyWeekScreen weekStart={raw} onWeek={(weekStart) => setParams((current) => {
    const next = new URLSearchParams(current);
    next.set("weekStart", weekStart);
    return next;
  })} />;
}

function DailyWeekScreen({ weekStart, onWeek }: { weekStart: string; onWeek: (weekStart: string) => void }) {
  return <DailyAccountGate>{(userId, accountWarning, retryAccount) => (
    <DailyWeekEditor key={`${userId}:${weekStart}`} userId={userId} weekStart={weekStart} onWeek={onWeek} accountWarning={accountWarning} onRetryAccount={retryAccount} />
  )}</DailyAccountGate>;
}
