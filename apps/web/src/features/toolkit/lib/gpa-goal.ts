export interface GpaGoalInput {
  currentGpa: string;
  completedCredits: string;
  remainingCredits: string;
  targetGpa: string;
}

export function restoreGpaGoal(value: unknown): GpaGoalInput {
  const empty = { currentGpa: "", completedCredits: "", remainingCredits: "", targetGpa: "" };
  if (!value || typeof value !== "object") return empty;
  const saved = value as Record<string, unknown>;
  if (!Object.keys(empty).every((key) => typeof saved[key] === "string")) return empty;
  return { currentGpa: saved.currentGpa as string, completedCredits: saved.completedCredits as string,
    remainingCredits: saved.remainingCredits as string, targetGpa: saved.targetGpa as string };
}

function number(value: string): number | null {
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateGpaGoal(input: GpaGoalInput, scale: 4 | 10) {
  const errors: Partial<Record<keyof GpaGoalInput, string>> = {};
  const result = { requiredAverage: null as number | null, maximumGpa: null as number | null, errors,
    status: "empty" as "empty" | "invalid" | "achievable" | "achieved" | "unreachable" };
  if (Object.values(input).every((value) => !value.trim())) return result;
  const current = number(input.currentGpa);
  const completed = number(input.completedCredits);
  const remaining = number(input.remainingCredits);
  const target = number(input.targetGpa);
  if (current === null || current > scale) errors.currentGpa = `Nhập GPA từ 0 đến ${scale}.`;
  if (target === null || target > scale) errors.targetGpa = `Nhập GPA mục tiêu từ 0 đến ${scale}.`;
  if (completed === null) errors.completedCredits = "Nhập số tín chỉ đã học từ 0 trở lên.";
  if (remaining === null) errors.remainingCredits = "Nhập số tín chỉ còn lại từ 0 trở lên.";
  if (completed !== null && remaining !== null && (!Number.isFinite(completed + remaining) || completed + remaining <= 0)) {
    errors.remainingCredits = "Tổng tín chỉ phải lớn hơn 0 và nằm trong giới hạn tính toán.";
  }
  if (Object.keys(errors).length) return { ...result, status: "invalid" as const };
  if (remaining === 0) return { ...result, maximumGpa: current, status: current! >= target! ? "achieved" as const : "unreachable" as const };
  const completedWeight = completed! / (completed! + remaining!);
  const maximumGpa = current! * completedWeight + scale * (1 - completedWeight);
  const required = target === current ? target! : target! + (target! - current!) * (completed! / remaining!);
  if (required > scale + 1e-10 || required === Infinity) {
    return { ...result, maximumGpa, requiredAverage: Number.isFinite(required) ? required : null, status: "unreachable" as const };
  }
  return { ...result, maximumGpa, requiredAverage: Math.max(0, Math.min(scale, required)), status: "achievable" as const };
}
