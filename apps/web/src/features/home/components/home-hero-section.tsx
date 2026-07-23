import { Link } from "react-router-dom";
import { Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export function HomeHeroSection() {
  return (
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
  );
}
