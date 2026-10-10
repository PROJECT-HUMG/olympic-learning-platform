import { CreationDialog } from "@/components/ui/creation-dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateGpa, newCourse, restoreGpa, type CourseRow, type GpaState } from "../lib/gpa";
import { readToolState, saveToolState } from "../lib/toolkit-storage";
import { GpaGoalCalculator } from "./gpa-goal-calculator";

const STORAGE_KEY = "olympic-toolkit-gpa-v1";

export function GpaCalculator() {
  const [state, setState] = useState<GpaState>(() => restoreGpa(readToolState(STORAGE_KEY)));
  const [adding, setAdding] = useState(false);
  const [course, setCourse] = useState(newCourse);
  const [attempted, setAttempted] = useState(false);
  const courseResult = calculateGpa([course], state.scale);
  const courseError = attempted ? courseResult.errors[course.id] : undefined;
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
        <NativeSelect className="w-auto" id="gpa-scale" value={state.scale} onChange={(event) => setState((current) => ({ ...current, scale: event.target.value === "10" ? 10 : 4 }))}>
          <option value="4">Hệ 4</option><option value="10">Hệ 10</option>
        </NativeSelect>
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
      <Button className="toolkit-gpa__add" variant="outline" onClick={() => { setCourse(newCourse()); setAttempted(false); setAdding(true); }}><Plus aria-hidden="true" /> Thêm học phần</Button>
      <CreationDialog className="creation-dialog--compact" open={adding} onOpenChange={setAdding} title="Thêm học phần" description={`Nhập tín chỉ và điểm trên thang ${state.scale}; tên học phần không bắt buộc.`} dirty={!!(course.name || course.credits || course.grade)}>{close => <form className="space-y-4" onSubmit={event => { event.preventDefault(); setAttempted(true); if (courseResult.invalid || !courseResult.courseCount) return; setState(current => ({ ...current, courses: [...current.courses, course] })); setAdding(false); }}>
        <div className="space-y-2"><label htmlFor="new-course-name">Tên học phần (không bắt buộc)</label><Input id="new-course-name" value={course.name} onChange={e => setCourse({ ...course, name:e.target.value })} /></div>
        <div className="space-y-2"><label htmlFor="new-course-credits">Tín chỉ</label><Input id="new-course-credits" required inputMode="decimal" value={course.credits} onChange={e => setCourse({ ...course, credits:e.target.value })} aria-invalid={!!courseError?.credits} aria-describedby={courseError?.credits ? "new-course-credits-error" : undefined} />{courseError?.credits && <p id="new-course-credits-error" role="alert" className="toolkit-gpa__error">{courseError.credits}</p>}</div>
        <div className="space-y-2"><label htmlFor="new-course-grade">Điểm / {state.scale}</label><Input id="new-course-grade" required inputMode="decimal" value={course.grade} onChange={e => setCourse({ ...course, grade:e.target.value })} aria-invalid={!!courseError?.grade} aria-describedby={courseError?.grade ? "new-course-grade-error" : undefined} />{courseError?.grade && <p id="new-course-grade-error" role="alert" className="toolkit-gpa__error">{courseError.grade}</p>}</div>
        <div className="flex flex-wrap gap-2"><Button type="submit">Thêm học phần</Button><Button type="button" variant="ghost" onClick={close}>Hủy</Button></div>
      </form>}</CreationDialog>
      <div className="toolkit-gpa__result" role="status">
        <div>
          <p>{state.scale === 4 ? "GPA dự tính" : "Điểm trung bình dự tính"}</p>
          <strong>{result.average === null ? "—" : result.average.toFixed(2)}<small> / {state.scale}</small></strong>
        </div>
        <p>{result.invalid ? "Hoàn thiện điểm và tín chỉ hợp lệ của các học phần để tính kết quả." : result.average === null ? "Thêm tín chỉ và điểm để bắt đầu tính." : `${result.courseCount} học phần, ${Number(result.totalCredits.toFixed(2))} tín chỉ. Tính theo tổng (điểm × tín chỉ) / tổng tín chỉ.`}</p>
      </div>
      <p className="toolkit-storage-note">{canSave ? "Bảng điểm được lưu trên trình duyệt này, chưa đồng bộ với tài khoản." : "Trình duyệt không lưu được bảng điểm. Dữ liệu sẽ mất khi bạn tải lại trang."}</p>
      <GpaGoalCalculator scale={state.scale} />
    </section>
  );
}
