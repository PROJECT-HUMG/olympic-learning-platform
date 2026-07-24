import { Calculator, Target, BookOpen, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface StudentTool {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  status: "active" | "coming_soon";
  actionLabel: string;
}

export const STUDENT_TOOLS_MOCK: StudentTool[] = [
  {
    id: "gpa-calculator",
    title: "Mô phỏng GPA",
    description: "Tính điểm trung bình mục tiêu",
    icon: Calculator,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    status: "active",
    actionLabel: "Tính ngay",
  },
  {
    id: "study-roadmap",
    title: "Định hướng Lộ trình",
    description: "Gợi ý các chủ đề còn yếu",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    status: "coming_soon",
    actionLabel: "Sắp ra mắt",
  },
  {
    id: "formula-vault",
    title: "Tra cứu Công thức",
    description: "Kho công thức Toán, Lý, Hóa",
    icon: BookOpen,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    status: "coming_soon",
    actionLabel: "Sắp ra mắt",
  },
  {
    id: "pomodoro",
    title: "Đồng hồ Pomodoro",
    description: "Tập trung cao độ giải đề",
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    status: "coming_soon",
    actionLabel: "Sắp ra mắt",
  },
];
