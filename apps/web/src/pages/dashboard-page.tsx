import { Link } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  History,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  Play,
  Zap,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { ROUTES } from "@/router/route-constants";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();

  const activeCourse = {
    title: "Cấu Trúc Dữ Liệu & Thuật Toán Olympic",
    progress: 68,
    completedLessons: 17,
    totalLessons: 25,
    nextLesson: "Bài 18: Quy hoạch động trên cây (Tree DP)",
  };

  const recentActivities = [
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

  const upcomingContests = [
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

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* 1. Welcome Header Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Góc Học Tập Cá Nhân</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Chào mừng trở lại, {user?.fullName || user?.username || "Học viên"}!
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Tiếp tục hành trình ôn luyện Olympic. Bạn đã hoàn thành <strong className="font-semibold text-foreground">68%</strong> tiến trình học tập tháng này!
            </p>
          </div>

          <div className="flex shrink-0 gap-3">
            <Button asChild size="sm" className="rounded-xl">
              <Link to={ROUTES.PRACTICE}>
                <Play className="mr-2 size-4" />
                Bắt đầu luyện tập
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Main Grid: Learning Progress & Quick Actions */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (2 Cols): Continue Learning & Recent Activity */}
        <div className="space-y-8 lg:col-span-2">
          {/* Continue Learning Card */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Đang Học Gần Đây</h3>
                  <p className="text-xs text-muted-foreground">Khóa học bạn đang theo dõi</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {activeCourse.progress}% Hoàn thành
              </span>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-foreground">{activeCourse.title}</h4>
              
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tiến độ: {activeCourse.completedLessons}/{activeCourse.totalLessons} bài học</span>
                  <span>{activeCourse.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${activeCourse.progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Bài tiếp theo:</p>
                  <p className="text-sm font-medium text-foreground truncate mt-0.5">
                    {activeCourse.nextLesson}
                  </p>
                </div>
                <Button asChild size="sm" variant="default" className="shrink-0">
                  <Link to={ROUTES.PRACTICE}>
                    Học tiếp
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Recent Activities Timeline Card */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Hoạt Động Gần Đây</h3>
                  <p className="text-xs text-muted-foreground">Lịch sử bài nộp & tham gia thi</p>
                </div>
              </div>
              <Link to={ROUTES.HISTORY} className="text-xs font-medium text-primary hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <p className="font-semibold text-foreground truncate">{act.title}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center">
                      <Clock className="mr-1 size-3" />
                      {act.time}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-400">
                    {act.result}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (1 Col): Quick Actions & Upcoming Contests */}
        <div className="space-y-8">
          {/* Quick Actions Shortcuts */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Zap className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Thao Tác Nhanh</h3>
            </div>

            <div className="grid gap-2.5">
              <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
                <Link to={ROUTES.PRACTICE}>
                  <BookOpen className="mr-2.5 size-4 text-primary" />
                  Bắt đầu làm bài tập
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
                <Link to={ROUTES.HISTORY}>
                  <History className="mr-2.5 size-4 text-emerald-500" />
                  Xem lịch sử thi
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
                <Link to={ROUTES.DOCUMENTS}>
                  <GraduationCap className="mr-2.5 size-4 text-amber-500" />
                  Tải tài liệu mới
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
                <Link to={ROUTES.PROFILE}>
                  <User className="mr-2.5 size-4 text-purple-500" />
                  Cập nhật hồ sơ
                </Link>
              </Button>
            </div>
          </section>

          {/* Upcoming Competitions Card */}
          <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Trophy className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Kỳ Thi Nổi Bật</h3>
                <p className="text-xs text-muted-foreground">Kỳ thi sắp tới của bạn</p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingContests.map((comp) => (
                <div
                  key={comp.id}
                  className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {comp.registered ? "Đã đăng ký" : "Chưa đăng ký"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{comp.duration}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground leading-snug">{comp.title}</h4>
                  <p className="text-[11px] text-muted-foreground flex items-center">
                    <Calendar className="mr-1 size-3 text-primary" />
                    {comp.startTime}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
