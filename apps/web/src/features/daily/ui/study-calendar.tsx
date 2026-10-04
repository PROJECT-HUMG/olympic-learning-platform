import type { MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { addPlatformDays, parsePlatformDate, platformDateKey, weekDates } from "../lib/platform-calendar";

/** Calendar choices, not a claim that these weeks/days contain saved activity. */
export function StudyWeekList({ date, href, onNavigate }: {
  date: string;
  href: (weekStart: string) => string;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const parsed = parsePlatformDate(date);
  if (!parsed) return null;
  const monday = weekDates(parsed)[0];
  return <ul className="study-calendar-list" aria-label="Chọn tuần">
    {[0, -1, -2, -3, -4, -5].map(offset => {
      const start = addPlatformDays(monday, offset * 7);
      const key = platformDateKey(start);
      return <li key={key}><Link to={href(key)} onClick={onNavigate}>
        <span>Tuần {key.slice(8)}/{key.slice(5, 7)} – {platformDateKey(addPlatformDays(start, 6)).slice(8)}/{platformDateKey(addPlatformDays(start, 6)).slice(5, 7)}</span>
        <span className="study-note">{key.slice(0, 4)}{offset === 0 ? " · Tuần đang chọn" : ""}</span>
      </Link></li>;
    })}
  </ul>;
}

export function StudyDayList({ weekStart, href, onNavigate }: {
  weekStart: string;
  href: (date: string) => string;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const parsed = parsePlatformDate(weekStart);
  if (!parsed) return null;
  return <ul className="study-calendar-list study-week-days" aria-label="Mở kế hoạch từng ngày">
    {weekDates(parsed).map((day, index) => {
      const date = platformDateKey(day);
      return <li key={date}><Link to={href(date)} onClick={onNavigate} aria-label={`${index === 6 ? "Chủ Nhật" : `Thứ ${index + 2}`}, ${date}`}>
        <span>{index === 6 ? "Chủ Nhật" : `Thứ ${index + 2}`}</span>
        <span className="study-note">{date.slice(8)}/{date.slice(5, 7)}</span>
      </Link></li>;
    })}
  </ul>;
}
