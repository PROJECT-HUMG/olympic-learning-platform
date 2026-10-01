import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateGpa, newCourse, restoreGpa, type CourseRow, type GpaState } from "../lib/gpa";
import { readToolState, saveToolState } from "../lib/toolkit-storage";

const STORAGE_KEY = "olympic-toolkit-gpa-v1";

export function GpaCalculator() {
  const [state, setState] = useState<GpaState>(() => restoreGpa(readToolState(STORAGE_KEY)));
  const [canSave, setCanSave] = useState(true);
  useEffect(() => { setCanSave(saveToolState(STORAGE_KEY, state)); }, [state]);
  const result = calculateGpa(state.courses, state.scale);

  function update(id: string, field: keyof Pick<CourseRow, "name" | "credits" | "grade">, value: string) {
    setState((current) => ({ ...current, courses: current.courses.map((row) => row.id === id ? { ...row, [field]: value } : row) }));
  }

  return (
    <section className="toolkit-gpa" aria-labelledby="gpa-heading">
      <div className="toolkit-panel-heading">
        <h2 id="gpa-heading">Tính điểm theo tín chỉ</h2>
        <p>Nhập điểm của từng học phần trên cùng một thang điểm.</p>
      </div>
      <div className="toolkit-gpa__scale">
        <label htmlFor="gpa-scale">Thang điểm</label>
        <select id="gpa-scale" value={state.scale} onChange={(event) => setState((current) => ({ ...current, scale: event.target.value === "10" ? 10 : 4 }))}>
          <option value="4">Hệ 4</option><option value="10">Hệ 10</option>
        </select>
        <p>Khi đổi thang điểm, hãy nhập lại điểm tương ứng. Công cụ giữ nguyên số đã nhập, không tự quy đổi điểm chữ hoặc áp dụng quy chế riêng của trường.</p>
      </div>
      <div className="toolkit-gpa__rows">
        {state.courses.map((row, index) => {
          const error = result.errors[row.id];
          return (
            <fieldset key={row.id} className="toolkit-gpa__row">
              <legend className="sr-only">Học phần {index + 1}</legend>
              <div className="toolkit-gpa__name">
                <label htmlFor={`${row.id}-name`}>Học phần {index + 1} <span>(không bắt buộc)</span></label>
                <Input id={`${row.id}-name`} value={row.name} onChange={(event) => update(row.id, "name", event.target.value)} placeholder="Tên học phần" />
              </div>
              <div>
                <label htmlFor={`${row.id}-credits`}>Tín chỉ</label>
                <Input id={`${row.id}-credits`} inputMode="decimal" value={row.credits} onChange={(event) => update(row.id, "credits", event.target.value)} aria-invalid={!!error?.credits} aria-describedby={error?.credits ? `${row.id}-credits-error` : undefined} placeholder="3" />
                {error?.credits && <p id={`${row.id}-credits-error`} className="toolkit-gpa__error">{error.credits}</p>}
              </div>
              <div>
                <label htmlFor={`${row.id}-grade`}>Điểm / {state.scale}</label>
                <Input id={`${row.id}-grade`} inputMode="decimal" value={row.grade} onChange={(event) => update(row.id, "grade", event.target.value)} aria-invalid={!!error?.grade} aria-describedby={error?.grade ? `${row.id}-grade-error` : undefined} placeholder={state.scale === 4 ? "3.5" : "8.5"} />
                {error?.grade && <p id={`${row.id}-grade-error`} className="toolkit-gpa__error">{error.grade}</p>}
              </div>
              <Button className="toolkit-gpa__remove" variant="ghost" size="icon" aria-label={`Xóa học phần ${index + 1}`} onClick={() => setState((current) => ({ ...current, courses: current.courses.length === 1 ? [newCourse()] : current.courses.filter((item) => item.id !== row.id) }))}><Trash2 aria-hidden="true" /></Button>
            </fieldset>
          );
        })}
      </div>
      <Button className="toolkit-gpa__add" variant="outline" onClick={() => setState((current) => ({ ...current, courses: [...current.courses, newCourse()] }))}><Plus aria-hidden="true" /> Thêm học phần</Button>
      <div className="toolkit-gpa__result" role="status">
        <div>
          <p>{state.scale === 4 ? "GPA dự tính" : "Điểm trung bình dự tính"}</p>
          <strong>{result.average === null ? "—" : result.average.toFixed(2)}<small> / {state.scale}</small></strong>
        </div>
        <p>{result.invalid ? "Hoàn thiện điểm và tín chỉ hợp lệ của các học phần để tính kết quả." : result.average === null ? "Thêm tín chỉ và điểm để bắt đầu tính." : `${result.courseCount} học phần, ${Number(result.totalCredits.toFixed(2))} tín chỉ. Tính theo tổng (điểm × tín chỉ) / tổng tín chỉ.`}</p>
      </div>
      <p className="toolkit-storage-note">{canSave ? "Bảng điểm được lưu trên trình duyệt này, chưa đồng bộ với tài khoản." : "Trình duyệt không lưu được bảng điểm. Dữ liệu sẽ mất khi bạn tải lại trang."}</p>
    </section>
  );
}
