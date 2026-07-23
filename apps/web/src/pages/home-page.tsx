import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Trophy,
  ArrowRight,
  FileText,
  Newspaper,
  Users,
  Calendar,
  Clock,
  Download,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function HomePage() {
  // Mock Data for Portal Home Sections
  const stats = [
    { label: "Môn học Olympic", value: "12+", icon: BookOpen, color: "text-blue-500 bg-blue-500/10" },
    { label: "Bộ tài liệu & Đề thi", value: "850+", icon: FileText, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Kỳ thi đã tổ chức", value: "64", icon: Trophy, color: "text-amber-500 bg-amber-500/10" },
    { label: "Học sinh tham gia", value: "12,400+", icon: Users, color: "text-purple-500 bg-purple-500/10" },
  ];

  const featuredSubjects = [
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

  const latestNews = [
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

  const featuredDocuments = [
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

  const upcomingCompetitions = [
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-20">
      {/* 1. Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto py-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
          <Award className="size-3.5" />
          <span>Hệ Thống Luyện Thi Olympic Quốc Gia & Quốc Tế</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Nền Tảng Ôn Luyện <span className="text-primary">Olympic</span> Trực Tuyến
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Trau dồi kiến thức, rèn luyện tư duy thuật toán và thử sức với hàng trăm bài thi Olympic Tin học, Toán học chất lượng cao.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link to={ROUTES.COMPETITIONS}>
              Khám phá kỳ thi
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="rounded-full px-6">
            <Link to={ROUTES.SUBJECTS}>
              Danh mục môn học
            </Link>
          </Button>
        </div>
      </section>

      {/* 2. Statistics Section */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card p-6 text-center shadow-xs transition-transform hover:-translate-y-0.5"
            >
              <div className={`flex size-12 items-center justify-center rounded-2xl mb-3 ${stat.color}`}>
                <Icon className="size-6" />
              </div>
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1">
                {stat.label}
              </span>
            </div>
          );
        })}
      </section>

      {/* 3. Featured Subjects Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Môn Học Nổi Bật</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Các chuyên đề kiến thức cốt lõi dành cho các đội tuyển Olympic
            </p>
          </div>
          <Link
            to={ROUTES.SUBJECTS}
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            Xem tất cả <ChevronRight className="ml-1 size-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/50 transition-all hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {sub.tag}
                  </span>
                  <span className="text-xs text-muted-foreground">{sub.problemsCount} bài tập</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {sub.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <span>{sub.studentsCount.toLocaleString()} người học</span>
                <Link
                  to={ROUTES.SUBJECTS}
                  className="font-medium text-foreground group-hover:text-primary flex items-center"
                >
                  Học ngay <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Upcoming Competitions Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Flame className="size-6 text-amber-500" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Kỳ Thi Sắp Khởi Tranh</h2>
              <p className="text-sm text-muted-foreground mt-1">Thử sức trực tiếp với đồng đạo toàn quốc</p>
            </div>
          </div>
          <Link
            to={ROUTES.COMPETITIONS}
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            Tất cả kỳ thi <ChevronRight className="ml-1 size-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {upcomingCompetitions.map((comp) => (
            <div
              key={comp.id}
              className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card p-6 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {comp.status}
                  </span>
                  <span className="flex items-center text-xs text-muted-foreground">
                    <Users className="mr-1 size-3.5" />
                    {comp.participants} thí sinh
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{comp.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center">
                    <Calendar className="mr-1.5 size-3.5 text-primary" />
                    {comp.startTime}
                  </span>
                  <span className="flex items-center">
                    <Clock className="mr-1.5 size-3.5 text-primary" />
                    Thời gian: {comp.duration}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-border/60 pt-4 flex justify-end">
                <Button asChild size="sm">
                  <Link to={ROUTES.COMPETITIONS}>Đăng ký ngay</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Featured Documents Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Tài Liệu Ôn Luyện Nổi Bật</h2>
            <p className="text-sm text-muted-foreground mt-1">Đề thi mẫu, sách chuyên khảo và bài giải chi tiết</p>
          </div>
          <Link
            to={ROUTES.DOCUMENTS}
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            Kho tài liệu <ChevronRight className="ml-1 size-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-colors hover:bg-accent/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                {doc.type}
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{doc.title}</h4>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Download className="mr-1 size-3" />
                    {doc.downloads.toLocaleString()} lượt tải
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Latest News Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Tin Tức & Thông Báo</h2>
            <p className="text-sm text-muted-foreground mt-1">Tin tức mới nhất về các phong trào thi Olympic</p>
          </div>
          <Link
            to={ROUTES.NEWS}
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            Xem tin tức <ChevronRight className="ml-1 size-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {latestNews.map((news) => (
            <div
              key={news.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-primary">{news.category}</span>
                  <span className="flex items-center">
                    <Newspaper className="mr-1 size-3" />
                    {news.date}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-foreground leading-snug">{news.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{news.summary}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60">
                <Link
                  to={ROUTES.NEWS}
                  className="text-xs font-medium text-primary hover:underline flex items-center"
                >
                  Đọc tiếp <ArrowRight className="ml-1 size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
