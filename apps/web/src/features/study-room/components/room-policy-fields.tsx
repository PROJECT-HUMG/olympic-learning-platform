import { NativeSelect } from "@/components/ui/native-select";
import type { RoomSettings } from "../types/study-room";

export function RoomPolicyFields({ value, onChange, disabled = false, prefix }: {
  value: RoomSettings;
  onChange: (value: RoomSettings) => void;
  disabled?: boolean;
  prefix: string;
}) {
  return (
    <div className="study-room-policy">
      <label htmlFor={`${prefix}-policy`}>Ai được đề xuất nhạc?</label>
      <NativeSelect id={`${prefix}-policy`} value={value.requestPolicy} disabled={disabled}
        onChange={(event) => onChange({ ...value, minimumStudyMinutes: Number.isFinite(value.minimumStudyMinutes) ? value.minimumStudyMinutes : 15, requestPolicy: event.target.value as RoomSettings["requestPolicy"] })}>
        <option value="AFTER_FOCUS">Sau khi học đủ thời gian</option>
        <option value="OPEN">Tất cả thành viên</option>
        <option value="HOST_ONLY">Chỉ chủ phòng</option>
      </NativeSelect>
      {value.requestPolicy === "AFTER_FOCUS" && (
        <div className="study-room-policy__threshold">
          <label htmlFor={`${prefix}-minimum`}>Số phút học tối thiểu</label>
          <input id={`${prefix}-minimum`} type="number" min="0" max="120" step="1" required value={value.minimumStudyMinutes}
            disabled={disabled} onChange={(event) => onChange({ ...value, minimumStudyMinutes: event.target.valueAsNumber })} />
        </div>
      )}
      <p>Nhạc của thành viên cần chủ phòng duyệt trước khi phát.</p>
    </div>
  );
}
