import type { Award, Category } from "./types";

export const CATEGORIES: Record<Category, string> = {
  OLYMPIC_NATIONAL: "Olympic cấp quốc gia", OLYMPIC_SCHOOL: "Olympic cấp trường",
  RESEARCH_MINISTRY: "Nghiên cứu khoa học cấp bộ", RESEARCH_SCHOOL: "Nghiên cứu khoa học cấp trường", RESEARCH_OTHER: "Nghiên cứu khoa học khác",
};
export const AWARDS: Record<Award, string> = { NONE: "Chỉ tham gia", FIRST: "Giải nhất", SECOND: "Giải nhì", THIRD: "Giải ba", CONSOLATION: "Khuyến khích" };
const POINTS: Record<Category, number[]> = { OLYMPIC_NATIONAL: [10, 9, 8, 7], OLYMPIC_SCHOOL: [5, 4, 3, 2], RESEARCH_MINISTRY: [8, 7, 6, 5], RESEARCH_SCHOOL: [6, 5, 4, 3], RESEARCH_OTHER: [6, 5, 4, 3] };
export const PARTICIPATION: Partial<Record<Category, number>> = { OLYMPIC_NATIONAL: 6, OLYMPIC_SCHOOL: 2, RESEARCH_SCHOOL: 3 };
export function estimatePoints(category: Category, award: Award, participation: boolean) {
  const index = (["FIRST", "SECOND", "THIRD", "CONSOLATION"] as Award[]).indexOf(award);
  return (index < 0 ? 0 : POINTS[category][index]) + (participation ? PARTICIPATION[category] ?? 0 : 0);
}
export const STATUS_LABELS = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Không được duyệt", REVOKED: "Đã thu hồi" };
