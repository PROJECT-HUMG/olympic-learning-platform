export interface CourseRow {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

export interface GpaState { scale: 4 | 10; courses: CourseRow[] }

export function newCourse(): CourseRow {
  return { id: `course-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: "", credits: "", grade: "" };
}

export function restoreGpa(value: unknown): GpaState {
  const fallback: GpaState = { scale: 4, courses: [newCourse(), newCourse()] };
  if (!value || typeof value !== "object") return fallback;
  const state = value as Partial<GpaState>;
  if ((state.scale !== 4 && state.scale !== 10) || !Array.isArray(state.courses) || !state.courses.length) return fallback;
  const ids = new Set<string>();
  for (const row of state.courses) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || ids.has(row.id) || typeof row.name !== "string" || typeof row.credits !== "string" || typeof row.grade !== "string") return fallback;
    ids.add(row.id);
  }
  return state as GpaState;
}

function decimal(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return null;
  const number = Number(text.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export function calculateGpa(courses: CourseRow[], scale: 4 | 10) {
  const errors: Record<string, { credits?: string; grade?: string }> = Object.create(null);
  let totalCredits = 0;
  let weightedPoints = 0;
  let courseCount = 0;
  for (const row of courses) {
    if (!row.name.trim() && !row.credits.trim() && !row.grade.trim()) continue;
    const credits = decimal(row.credits);
    const grade = decimal(row.grade);
    const error: { credits?: string; grade?: string } = {};
    if (credits === null || credits <= 0) error.credits = "Nhập số tín chỉ lớn hơn 0.";
    if (grade === null || grade < 0 || grade > scale) error.grade = `Nhập điểm từ 0 đến ${scale}.`;
    if (error.credits || error.grade) {
      errors[row.id] = error;
      continue;
    }
    totalCredits += credits!;
    weightedPoints += credits! * grade!;
    courseCount++;
  }
  const invalid = Object.keys(errors).length > 0 || !Number.isFinite(totalCredits) || !Number.isFinite(weightedPoints);
  return { errors, invalid, courseCount, totalCredits, average: !invalid && totalCredits > 0 ? weightedPoints / totalCredits : null };
}
