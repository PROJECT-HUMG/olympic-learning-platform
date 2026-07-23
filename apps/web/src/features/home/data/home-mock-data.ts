import { BookOpen, FileText, Trophy, Users } from "lucide-react";

export interface HomeStat {
  label: string;
  value: string;
  icon: typeof BookOpen;
  color: string;
}

export interface FeaturedSubject {
  id: string;
  title: string;
  description: string;
  problemsCount: number;
  studentsCount: number;
  tag: string;
}

export interface LatestNewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
}

export interface FeaturedDocument {
  id: string;
  title: string;
  type: string;
  size: string;
  downloads: number;
  subject: string;
}

export interface UpcomingCompetition {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  participants: number;
  status: string;
}

export const HOME_STATS: HomeStat[] = [
  { label: "Môn học Olympic", value: "12+", icon: BookOpen, color: "text-blue-500 bg-blue-500/10" },
  { label: "Bộ tài liệu & Đề thi", value: "850+", icon: FileText, color: "text-emerald-500 bg-emerald-500/10" },
  { label: "Kỳ thi đã tổ chức", value: "64", icon: Trophy, color: "text-amber-500 bg-amber-500/10" },
  { label: "Học sinh tham gia", value: "12,400+", icon: Users, color: "text-purple-500 bg-purple-500/10" },
];

export const FEATURED_SUBJECTS: FeaturedSubject[] = [
  {
    id: "1",
    title: "Tin Học Chuyên & Thuật Toán",
    description: "Cấu trúc dữ liệu nâng cao, đồ thị, quy hoạch động và các dạng bài thi HSG Quốc gia.",
    problemsCount: 320,
    studentsCount: 4500,
    tag: "Phổ biến nhất",
  },
  {
    id: "2",
    title: "Toán Học Olympic",
    description: "Đại số, hình học không gian, số học và tổ hợp dành cho các kỳ thi VMO & Olympic.",
    problemsCount: 240,
    studentsCount: 3800,
    tag: "Mới cập nhật",
  },
  {
    id: "3",
    title: "Vật Lý Đại Học & Olympic",
    description: "Cơ học lý thuyết, điện từ học, nhiệt học và quang học ứng dụng.",
    problemsCount: 180,
    studentsCount: 2100,
    tag: "Chuyên sâu",
  },
];

export const LATEST_NEWS: LatestNewsItem[] = [
  {
    id: "1",
    title: "Khai mạc Kỳ thi Olympic Tin học Sinh viên Toàn quốc năm 2026",
    summary: "Thu hút hơn 800 thí sinh từ 65 trường Đại học và Học viện trên cả nước tham gia tranh tài.",
    date: "22/07/2026",
    category: "Tin sự kiện",
  },
  {
    id: "2",
    title: "Công bố bộ đề thi và đáp án chính thức Olympic Toán học 2026",
    summary: "Tải về trọn bộ đề thi thử và hướng dẫn giải chi tiết từ Hội đồng Giám khảo.",
    date: "18/07/2026",
    category: "Tài liệu mới",
  },
  {
    id: "3",
    title: "Mở hệ thống đăng ký tài khoản luyện thi trực tuyến miễn phí",
    summary: "Học sinh toàn quốc có thể tạo tài khoản và tham gia làm bài thi thử ngay từ hôm nay.",
    date: "10/07/2026",
    category: "Thông báo",
  },
];

export const FEATURED_DOCUMENTS: FeaturedDocument[] = [
  {
    id: "1",
    title: "Tuyển tập 100 bài toán Quy hoạch động chuẩn Olympic",
    type: "PDF",
    size: "4.2 MB",
    downloads: 3420,
    subject: "Tin học",
  },
  {
    id: "2",
    title: "Bộ đề thi thử Olympic Toán Sinh viên có lời giải chi tiết",
    type: "PDF",
    size: "8.5 MB",
    downloads: 2890,
    subject: "Toán học",
  },
  {
    id: "3",
    title: "Cấu trúc dữ liệu & Thuật toán nâng cao - C++ Guide",
    type: "ZIP",
    size: "12.1 MB",
    downloads: 5120,
    subject: "Tin học",
  },
];

export const UPCOMING_COMPETITIONS: UpcomingCompetition[] = [
  {
    id: "1",
    title: "Olympic Tin học Sinh viên - Vòng Thi Thử Tháng 8",
    startTime: "08:00 - 15/08/2026",
    duration: "180 phút",
    participants: 450,
    status: "Đang mở đăng ký",
  },
  {
    id: "2",
    title: "Kỳ thi Thách thức Thuật toán Thu Đông 2026",
    startTime: "14:00 - 28/08/2026",
    duration: "150 phút",
    participants: 620,
    status: "Đang mở đăng ký",
  },
];
