import { useState, type MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { addPlatformDays, parsePlatformDate, platformDate, platformDateKey, weekDates } from "../lib/platform-calendar";
import { calendarWeekKeys, plannedWeekKeys } from "../lib/calendar-presentation";
import { Button } from "@/components/ui/button";

/** Calendar choices, filtered by planned dates if supplied. */
export function StudyWeekList({ date, plannedDates, href, onNavigate }: {
  date: string;
  plannedDates?: string[];
  href: (weekStart: string) => string;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const [showAll, setShowAll] = useState(false);
  const parsed = parsePlatformDate(date);
  const chosenMonday = parsed ? platformDateKey(weekDates(parsed)[0]) : null;
  const todayDate = platformDate(new Date());
  const todayMonday = todayDate ? platformDateKey(weekDates(todayDate)[0]) : null;

  const weekKeys = plannedDates !== undefined ? plannedWeekKeys(plannedDates) : calendarWeekKeys(date);
  const visibleKeys = showAll ? weekKeys : weekKeys.slice(0, 6);

  if (weekKeys.length === 0) {
    return <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground bg-card/40">
      <Calendar className="h-7 w-7 mx-auto text-muted-foreground/60 mb-2" />
      <p className="text-sm font-medium text-foreground">Chưa có tuần nào có kế hoạch</p>
      <p className="text-xs text-muted-foreground mt-1">Các tuần có ngày bạn lên kế hoạch sẽ xuất hiện tại đây.</p>
    </div>;
  }

  return <div className="study-calendar-history"><ul className="study-calendar-list study-week-grid" aria-label={plannedDates !== undefined ? "Các tuần đã lưu" : "Chọn tuần theo lịch"}>
    {visibleKeys.map(key => {
      const start = parsePlatformDate(key);
      if (!start) return null;
      const endKey = platformDateKey(addPlatformDays(start, 6));
      const isCurrentWeek = key === todayMonday;
      const isSelected = key === chosenMonday;

      return <li key={key} className="study-week-card">
        <Link to={href(key)} onClick={onNavigate} className="study-week-card__link group">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`study-week-card__icon p-2.5 rounded-lg flex-shrink-0 transition-colors ${isCurrentWeek ? "bg-primary text-primary-foreground shadow-xs" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                  Tuần {key.slice(8)}/{key.slice(5, 7)} – {endKey.slice(8)}/{endKey.slice(5, 7)}
                </span>
                {isCurrentWeek && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                    Tuần này
                  </span>
                )}
                {isSelected && !isCurrentWeek && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    Đang xem
                  </span>
                )}
              </div>
              <span className="study-note block text-xs">
                Năm {key.slice(0, 4)}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" aria-hidden="true" />
        </Link>
      </li>;
    })}
  </ul>{weekKeys.length > 6 ? <Button type="button" variant="outline" className="mt-3" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>{showAll ? "Thu gọn lịch sử" : `Xem tất cả ${weekKeys.length} tuần`}</Button> : null}</div>;
}

export function StudyDayList({ weekStart, href, onNavigate }: {
  weekStart: string;
  href: (date: string) => string;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const parsed = parsePlatformDate(weekStart);
  if (!parsed) return null;
  const todayDate = platformDate(new Date());
  const todayKey = todayDate ? platformDateKey(todayDate) : null;

  return <ul className="study-calendar-list study-week-days" aria-label="Mở kế hoạch từng ngày">
    {weekDates(parsed).map((day, index) => {
      const date = platformDateKey(day);
      const isToday = date === todayKey;
      const dayName = index === 6 ? "Chủ Nhật" : `Thứ ${index + 2}`;

      return <li key={date} className={`study-day-card ${isToday ? "study-day-card--today" : ""}`}>
        <Link to={href(date)} onClick={onNavigate} aria-label={`${index === 6 ? "Chủ Nhật" : `Thứ ${index + 2}`}, ${date}`} className="study-day-card__link group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="study-day-card__name font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              {dayName}
            </span>
            {isToday && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground leading-none">
                Hôm nay
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="study-note text-xs font-medium">
              {date.slice(8)}/{date.slice(5, 7)}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </div>
        </Link>
      </li>;
    })}
  </ul>;
}
