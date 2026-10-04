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
    <Link to={dailyHref} aria-current={area === "daily" ? "page" : undefined} onClick={onNavigate}>
      <CalendarCheck size={18} aria-hidden="true" />Daily của tôi
    </Link>
    <Link to={groupHref} aria-current={area === "group" ? "page" : undefined} onClick={onNavigate}>
      <Users size={18} aria-hidden="true" />Nhóm Daily
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
      <span className="study-note">{percent}%</span>
    </>}
    {caption ? <p className="study-note">{caption}</p> : null}
  </div>;
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
export function StudyDisclosure({ title, description, children, defaultOpen = false }: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return <details className="study-disclosure" open={defaultOpen}>
    <summary><span>{title}</span></summary>
    <div className="study-disclosure__body">
      {description ? <p className="study-note mb-4">{description}</p> : null}
      {children}
    </div>
  </details>;
}
