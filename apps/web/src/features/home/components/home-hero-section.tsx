import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export function HomeHeroSection() {
  return (
    <section className="text-center space-y-10 max-w-5xl mx-auto py-8">
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Nền Tảng Ôn Luyện <span className="text-primary">Olympic</span> Trực Tuyến
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Trau dồi kiến thức, rèn luyện tư duy thuật toán và thử sức với hàng trăm bài thi Olympic Tin học, Toán học chất lượng cao.
        </p>
      </div>

      {/* Hero Image / Banner */}
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
        {/* Responsive aspect ratio: 16:9 on mobile, 21:9 on tablet, 2.5:1 on desktop */}
        <div className="w-full bg-muted aspect-video md:aspect-[21/9] lg:aspect-[2.5/1]">
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
            alt="Đội ngũ giảng viên Khoa Khoa học Cơ bản"
            className="size-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
        {/* Subtle gradient overlay to make it look premium */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Button asChild size="lg" className="rounded-full px-8 shadow-md">
          <Link to={ROUTES.COMPETITIONS}>
            Khám phá kỳ thi
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-background/50 backdrop-blur-sm">
          <Link to={ROUTES.SUBJECTS}>
            Danh mục môn học
          </Link>
        </Button>
      </div>
    </section>
  );
}
