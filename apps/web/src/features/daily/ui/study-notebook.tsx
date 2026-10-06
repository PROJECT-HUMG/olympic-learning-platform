import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarCheck, Users } from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import "./study-notebook.css";

/** Presentation only: callers retain draft navigation guards and access decisions. */
export function StudyAreaNav({ area, dailyHref = ROUTES.DAILY, groupHref = ROUTES.DAILY_GROUPS, onNavigate }: {
  area: "daily" | "group";
  dailyHref?: string;
  groupHref?: string;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return <nav className="study-area-nav" aria-label="Khu vực học tập">
    <Link to={dailyHref} aria-label="Daily của tôi" aria-current={area === "daily" ? "page" : undefined} onClick={onNavigate}>
      <CalendarCheck size={18} aria-hidden="true" />Cá nhân
    </Link>
    <Link to={groupHref} aria-label="Nhóm Daily" aria-current={area === "group" ? "page" : undefined} onClick={onNavigate}>
      <Users size={18} aria-hidden="true" />Nhóm
    </Link>
  </nav>;
}

/** Rates are supplied by existing feature calculations, never inferred for private/missing data. */
export function StudyProgress({ label, completed, total, rate, caption }: {
  label: string;
  completed: number;
  total: number;
  rate: number | null;
  caption?: ReactNode;
}) {
  const percent = rate === null ? null : Math.round(rate * 100);
  return <div className="study-progress">
    <div className="study-progress__label"><span>{label}</span><strong>{completed}/{total}</strong></div>
    {percent === null ? <p className="study-note">Không áp dụng</p> : <>
      <div className="study-progress__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${completed}/${total}, ${percent}%`}>
        <span style={{ transform: `scaleX(${Math.max(0, Math.min(1, rate!))})` }} />
      </div>
    </>}
    {caption ? <p className="study-note">{caption}</p> : null}
  </div>;
}

/** Supporting facts, not a dashboard hero. Definitions remain available in one disclosure. */
export function StudyWeekStats({ plannedDays, onTimeDays, completionRate, mustCompleted, mustTotal, mustRate }: {
  plannedDays: number; onTimeDays: number; completionRate: number | null;
  mustCompleted: number; mustTotal: number; mustRate: number | null;
}) {
  return <section className="study-week-facts" aria-label="Số liệu đã ghi nhận">
    <h2>Số liệu đã ghi nhận</h2>
    <dl>
      <div><dt>Ngày có kế hoạch</dt><dd>{plannedDays}/7 <span>ngày</span></dd></div>
      <div><dt>Nộp đúng giờ</dt><dd>{onTimeDays} <span>ngày</span></dd></div>
      <div><dt>Hoàn thành trung bình</dt><dd>{completionRate === null ? "Không áp dụng" : `${Math.round(completionRate * 100)}%`}</dd></div>
      <div><dt>Việc bắt buộc</dt><dd>{mustCompleted}/{mustTotal} <span>{mustRate === null ? "Không áp dụng" : `${Math.round(mustRate * 100)}%`}</span></dd></div>
    </dl>
    <details className="study-stat-definitions"><summary>Cách tính số liệu</summary><p className="study-note">Ngày có kế hoạch kể cả ngày đã lưu chưa có việc. Nộp đúng giờ theo mốc nộp đầu. Hoàn thành là trung bình các ngày đã lưu có việc. Việc bắt buộc gộp các ngày, không phải trung bình. Mẫu số bằng 0 không áp dụng.</p></details>
  </section>;
}

export function StudyIdentity({ name, detail, avatar }: { name: string; detail?: ReactNode; avatar?: ReactNode }) {
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase("vi") ?? "?";
  return <span className="study-identity">
    <span className="study-identity__initial" aria-hidden="true">{avatar ?? initial}</span>
    <span className="min-w-0"><span className="study-identity__name block">{name}</span>{detail ? <span className="study-note block">{detail}</span> : null}</span>
  </span>;
}

export function StudyEmpty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="study-empty"><BookOpen size={24} aria-hidden="true" /><div><p className="font-medium">{title}</p>{children ? <div className="study-note">{children}</div> : null}</div></div>;
}

/** Native disclosure keeps editor state mounted; collapsing never saves or discards. */
export function StudyDisclosure({ title, description, children, defaultOpen = false, id }: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  id?: string;
}) {
  return <details id={id} className="study-disclosure" open={defaultOpen}>
    <summary><span>{title}</span></summary>
    <div className="study-disclosure__body">
      {description ? <p className="study-note mb-4">{description}</p> : null}
      {children}
    </div>
  </details>;
}
