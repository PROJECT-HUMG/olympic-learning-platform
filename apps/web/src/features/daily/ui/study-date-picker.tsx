import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Popover } from "radix-ui";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calendarMonthDates, shiftCalendarMonth } from "../lib/date-selection";
import { addPlatformDays, mondayIndex, parsePlatformDate, platformDate, platformDateKey } from "../lib/platform-calendar";
import "./study-notebook.css";

/** One calendar surface. The owner must approve selection before any draft/URL changes. */
export function StudyDatePicker({ date, onSelect, disabled = false, label = "Chọn ngày", children }: {
  date: string;
  onSelect: (date: string) => boolean;
  disabled?: boolean;
  label?: string;
  children?: ReactNode | ((date: string) => ReactNode);
}) {
  const id = useId();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(date);
  const [typed, setTyped] = useState(date);
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const parsed = parsePlatformDate(focused);
  const todayDate = platformDate(new Date());
  const today = todayDate ? platformDateKey(todayDate) : "";
  const keys = calendarMonthDates(focused);

  useLayoutEffect(() => {
    if (open) cells.current.get(focused)?.focus();
  }, [focused, open]);
  useEffect(() => {
    if ((location.state as { studyDateFocus?: boolean } | null)?.studyDateFocus) trigger.current?.focus();
  }, [date, location.key, location.state]);

  function choose(next: string) {
    if (!parsePlatformDate(next)) { setNotice("Ngày không hợp lệ."); return; }
    if (!onSelect(next)) { setNotice("Hãy lưu hoặc tải lại trước khi đổi ngày."); return; }
    setOpen(false);
  }

  function keyboard(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    const day = parsePlatformDate(key);
    if (!day) return;
    const shifts: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -mondayIndex(day), End: 6 - mondayIndex(day) };
    const next = event.key in shifts ? platformDateKey(addPlatformDays(day, shifts[event.key]))
      : event.key === "PageUp" ? shiftCalendarMonth(key, -1)
        : event.key === "PageDown" ? shiftCalendarMonth(key, 1) : null;
    if (!next || !parsePlatformDate(next)) return;
    event.preventDefault();
    setFocused(next);
  }

  return <Popover.Root open={open} onOpenChange={value => {
    if (value) { setFocused(date); setTyped(date); setNotice(""); }
    setOpen(value);
  }}>
    <Popover.Trigger asChild>
      <Button ref={trigger} type="button" variant="outline" disabled={disabled} className="study-date-trigger" aria-label={`${label}: ${date}`}>
        <Calendar size={16} aria-hidden="true" /><span>{date.split("-").reverse().join("/")}</span><ChevronDown size={16} aria-hidden="true" />
      </Button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className="study-date-popover study-notebook" align="start" sideOffset={8} collisionPadding={12} aria-label={label}
        onOpenAutoFocus={event => { event.preventDefault(); cells.current.get(focused)?.focus(); }}>
        <div className="study-calendar-heading">
          <Button type="button" variant="ghost" size="icon" aria-label="Tháng trước" onClick={() => setFocused(value => shiftCalendarMonth(value, -1))}><ChevronLeft size={16} aria-hidden="true" /></Button>
          <h2 id={`${id}-month`} aria-live="polite">Tháng {parsed?.month}/{parsed?.year}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label="Tháng sau" onClick={() => setFocused(value => shiftCalendarMonth(value, 1))}><ChevronRight size={16} aria-hidden="true" /></Button>
        </div>
        <p id={`${id}-keys`} className="sr-only">Dùng phím mũi tên để đổi ngày, Home/End để tới đầu/cuối tuần, Page Up/Down để đổi tháng, Enter hoặc Space để chọn. Escape để đóng.</p>
        <div role="grid" aria-labelledby={`${id}-month`} aria-describedby={`${id}-keys`} className="study-calendar-month">
          <div role="row">{["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"].map((name, index) => <span role="columnheader" aria-label={name} key={name}>{index === 6 ? "CN" : `T${index + 2}`}</span>)}</div>
          {Array.from({ length: 6 }, (_, row) => <div role="row" key={row}>
            {keys.slice(row * 7, row * 7 + 7).map(key => <span role="gridcell" aria-selected={key === date} key={key}>
              <button ref={node => { if (node) cells.current.set(key, node); else cells.current.delete(key); }} type="button" data-calendar-date={key}
                tabIndex={key === focused ? 0 : -1} disabled={!parsePlatformDate(key)} aria-label={key} aria-current={key === today ? "date" : undefined}
                className={key.slice(0, 7) !== focused.slice(0, 7) ? "is-outside" : undefined}
                onKeyDown={event => keyboard(event, key)} onClick={() => choose(key)}>{Number(key.slice(8))}</button>
            </span>)}
          </div>)}
        </div>
        <div className="study-calendar-jump">
          <Label htmlFor={`${id}-date`}>Đến ngày khác</Label>
          <div><Input id={`${id}-date`} type="date" value={typed} onChange={event => setTyped(event.target.value)} /><Button type="button" variant="outline" onClick={() => choose(typed)}>Chọn</Button></div>
        </div>
        {notice ? <p role="alert" className="study-note">{notice}</p> : null}
        <div className="study-calendar-links"><Button type="button" variant="ghost" onClick={() => choose(today)}>Hôm nay</Button>{typeof children === "function" ? children(focused) : children}<Popover.Close asChild><Button type="button" variant="ghost">Đóng lịch</Button></Popover.Close></div>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
