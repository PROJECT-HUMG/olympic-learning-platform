import { Link } from "react-router-dom";
import { GraduationCap, Award, BookOpen, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Section */}
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

      {/* Highlights Grid */}
      <section className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Kho Bài Tập Đa Dạng</h3>
          <p className="text-sm text-muted-foreground">
            Hàng nghìn bài tập được phân loại rõ ràng theo cấp độ từ cơ bản đến nâng cao.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Trophy className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Kỳ Thi Giả Định</h3>
          <p className="text-sm text-muted-foreground">
            Trải nghiệm không khí thi đấu thực tế với hệ thống chấm điểm tự động tức thì.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Tài Liệu Chuẩn Xịn</h3>
          <p className="text-sm text-muted-foreground">
            Bộ tài liệu và bài giảng được biên soạn bởi các giảng viên và chuyên gia Olympic.
          </p>
        </div>
      </section>
    </div>
  );
}
