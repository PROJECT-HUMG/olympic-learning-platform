import { useId, useState, type FormEvent } from "react";
import { TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { RoomRhythm, StudyRoomSnapshot } from "../types/study-room";

const presets = [[25, 5, 15], [50, 10, 20], [90, 15, 30]];

export function EditRoomRhythm({ room, disabled, busy, onApply }: {
  room: StudyRoomSnapshot;
  disabled: boolean;
  busy: boolean;
  onApply: (input: RoomRhythm, onSuccess: () => void) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState([String(room.focusMinutes), String(room.breakMinutes), String(room.longBreakMinutes)]);
  const [version, setVersion] = useState(room.rhythmVersion ?? 0);
  const stale = version !== (room.rhythmVersion ?? 0);
  const reset = () => {
    setValues([String(room.focusMinutes), String(room.breakMinutes), String(room.longBreakMinutes)]);
    setVersion(room.rhythmVersion ?? 0);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || stale || busy) return;
    onApply({ focusMinutes: Number(values[0]), breakMinutes: Number(values[1]), longBreakMinutes: Number(values[2]), expectedVersion: version }, () => setOpen(false));
  };
  return <Dialog open={open} onOpenChange={(next) => { if (next) reset(); setOpen(next); }}>
    <DialogTrigger asChild><Button variant="outline" disabled={disabled}><TimerReset aria-hidden="true" /> Chỉnh giờ</Button></DialogTrigger>
    <DialogContent className="room-rhythm-dialog">
      <DialogHeader><DialogTitle>Chỉnh nhịp học chung</DialogTitle><DialogDescription>Chọn thời lượng cho cả phòng. Áp dụng sẽ bắt đầu một phiên tập trung mới ngay bây giờ.</DialogDescription></DialogHeader>
      <form onSubmit={submit}>
        <div className="room-rhythm-presets" aria-label="Nhịp học gợi ý">
          {presets.map((preset) => <Button key={preset[0]} type="button" variant="outline" disabled={busy || disabled}
            aria-label={`Chọn ${preset[0]} phút học, ${preset[1]} phút nghỉ, ${preset[2]} phút nghỉ dài`}
            onClick={() => setValues(preset.map(String))}>{preset[0]} / {preset[1]} / {preset[2]}</Button>)}
        </div>
        <div className="room-rhythm-fields">
          {["Tập trung (phút)", "Nghỉ ngắn (phút)", "Nghỉ dài (phút)"].map((label, index) => <div key={label}>
            <label htmlFor={`${id}-${index}`}>{label}</label>
            <input id={`${id}-${index}`} type="number" inputMode="numeric" required step="1" min={index === 0 ? 15 : index === 1 ? 3 : Math.max(10, Number(values[1]) || 10)}
              max={index === 0 ? 90 : index === 1 ? 30 : 45} disabled={busy || disabled} value={values[index]}
              onChange={(event) => setValues((current) => current.map((value, at) => at === index ? event.target.value : value))} />
          </div>)}
        </div>
        <p className="room-rhythm-note">Học 15–90 phút, nghỉ ngắn 3–30 phút, nghỉ dài 10–45 phút và không ngắn hơn nghỉ ngắn. Nghỉ dài sau mỗi 4 phiên tập trung.</p>
        <div className="room-rhythm-confirmation"><strong>Đồng hồ của mọi người sẽ bắt đầu lại.</strong><p>Thời gian đã ghi nhận, chỗ ngồi và nhạc đang phát được giữ nguyên.</p></div>
        {stale && <div className="room-rhythm-stale" role="alert"><p>Nhịp học vừa được thay đổi trong lúc bạn chỉnh. Lấy thời lượng mới trước khi áp dụng.</p><Button type="button" variant="outline" onClick={reset} disabled={busy}>Lấy thời lượng mới</Button></div>}
        <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Đóng</Button><Button type="submit" disabled={disabled || busy || stale}>{busy ? "Đang áp dụng…" : "Bắt đầu nhịp mới"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
