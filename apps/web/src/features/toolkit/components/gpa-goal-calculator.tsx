import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { calculateGpaGoal, restoreGpaGoal, type GpaGoalInput } from "../lib/gpa-goal";
import { readToolState, saveToolState } from "../lib/toolkit-storage";

const STORAGE_KEY = "olympic-toolkit-gpa-goal-v1";
const fields: { key: keyof GpaGoalInput; label: string; placeholder: string }[] = [
  { key: "currentGpa", label: "GPA tích lũy hiện tại", placeholder: "Ví dụ: 2,8" },
  { key: "completedCredits", label: "Tín chỉ đã tính vào GPA", placeholder: "Ví dụ: 60" },
  { key: "remainingCredits", label: "Tín chỉ còn lại", placeholder: "Ví dụ: 20" },
  { key: "targetGpa", label: "GPA mục tiêu", placeholder: "Ví dụ: 3,0" },
];

export function GpaGoalCalculator({ scale }: { scale: 4 | 10 }) {
  const id = useId();
  const [input, setInput] = useState(() => restoreGpaGoal(readToolState(STORAGE_KEY)));
  const [canSave, setCanSave] = useState(true);
  useEffect(() => { setCanSave(saveToolState(STORAGE_KEY, input)); }, [input]);
  const result = calculateGpaGoal(input, scale);
  return (
    <section className="toolkit-gpa-goal" aria-labelledby={`${id}-title`}>
      <div className="toolkit-panel-heading">
        <h2 id={`${id}-title`}>Lên kế hoạch GPA mục tiêu</h2>
        <p>Dùng hệ {scale} đã chọn ở trên để tính điểm trung bình cần đạt cho số tín chỉ còn lại.</p>
      </div>
      <div className="toolkit-gpa-goal__fields">
        {fields.map(({ key, label, placeholder }) => <div key={key}>
          <label htmlFor={`${id}-${key}`}>{label}{key.includes("Gpa") && ` / ${scale}`}</label>
          <Input id={`${id}-${key}`} inputMode="decimal" value={input[key]} placeholder={scale === 10 && key.includes("Gpa") ? "Điểm trên hệ 10" : placeholder}
            aria-invalid={!!result.errors[key]} aria-describedby={result.errors[key] ? `${id}-${key}-error` : undefined}
            onChange={(event) => setInput((current) => ({ ...current, [key]: event.target.value }))} />
          {result.errors[key] && <p id={`${id}-${key}-error`} className="toolkit-gpa__error">{result.errors[key]}</p>}
        </div>)}
      </div>
      <div className="toolkit-gpa-goal__result" role="status">
        {result.status === "empty" ? <p>Nhập GPA, tín chỉ và mục tiêu để bắt đầu.</p>
          : result.status === "invalid" ? <p>Hoàn thiện các giá trị hợp lệ để tính mục tiêu.</p>
          : result.status === "achieved" ? <p>Bạn đã đạt mục tiêu với số tín chỉ hiện tại và không còn tín chỉ dự tính.</p>
          : result.status === "unreachable" ? <><p className="font-medium">Mục tiêu vượt khả năng với số tín chỉ này.</p><p>Ngay cả khi đạt tối đa {scale}/{scale} ở các tín chỉ còn lại, GPA tích lũy cao nhất là {result.maximumGpa?.toFixed(2)}. Hãy điều chỉnh mục tiêu hoặc kế hoạch tín chỉ.</p></>
          : <><p>Điểm trung bình tối thiểu cần đạt</p><strong>{(Math.ceil((result.requiredAverage! - 1e-10) * 100) / 100).toFixed(2)}<small> / {scale}</small></strong><p>Trên {input.remainingCredits} tín chỉ còn lại. Mức cần đạt được làm tròn lên đến hai chữ số thập phân.</p></>}
      </div>
      <p className="toolkit-storage-note">{canSave ? "Kế hoạch được lưu trên trình duyệt này, chưa đồng bộ tài khoản." : "Trình duyệt không lưu được kế hoạch. Dữ liệu sẽ mất khi tải lại trang."} Mô phỏng giả định GPA hiện tại giữ nguyên và toàn bộ tín chỉ còn lại đều được tính; chưa áp dụng quy định học lại hoặc quy đổi điểm của trường.</p>
    </section>
  );
}
