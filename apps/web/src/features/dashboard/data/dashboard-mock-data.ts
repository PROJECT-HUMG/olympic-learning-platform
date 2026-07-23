export interface ActiveCourse {
  title: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLesson: string;
}

export interface RecentActivity {
  id: string;
  type: "submission" | "contest" | "document";
  title: string;
  time: string;
  result: string;
  status: "success" | "info" | "neutral";
}

export interface DashboardUpcomingContest {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  registered: boolean;
}

export const ACTIVE_COURSE_MOCK: ActiveCourse = {
  title: "Cấu Trúc Dữ Liệu & Thuật Toán Olympic",
  progress: 68,
  completedLessons: 17,
  totalLessons: 25,
  nextLesson: "Bài 18: Quy hoạch động trên cây (Tree DP)",
};

export const RECENT_ACTIVITIES_MOCK: RecentActivity[] = [
  {
    id: "1",
    type: "submission",
    title: "Nộp bài thành công: Khôi phục dãy số (Tree DP)",
    time: "20 phút trước",
    result: "Accepted (100/100)",
    status: "success",
  },
  {
    id: "2",
    type: "contest",
    title: "Tham gia Kỳ thi Thử Olympic Tin học Sinh viên #4",
    time: "Hôm qua, 15:30",
    result: "Hạng 14 / 320",
    status: "info",
  },
  {
    id: "3",
    type: "document",
    title: "Tải tài liệu: Tuyển tập 50 bài Đồ thị nâng cao",
    time: "2 ngày trước",
    result: "Đã tải về",
    status: "neutral",
  },
];

export const DASHBOARD_UPCOMING_CONTESTS_MOCK: DashboardUpcomingContest[] = [
  {
    id: "1",
    title: "Kỳ thi Olympic Tin học Sinh viên - Vòng Thi Thử 8",
    startTime: "15/08/2026 - 08:00",
    duration: "180 phút",
    registered: true,
  },
  {
    id: "2",
    title: "Thách thức Thuật toán Thu Đông 2026",
    startTime: "28/08/2026 - 14:00",
    duration: "150 phút",
    registered: false,
  },
];
