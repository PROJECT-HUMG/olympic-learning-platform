import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";
import { HOME_HERO_DATA } from "../data/home-mock-data";

export function HomeHeroSection() {
  return (
    <section className="text-center space-y-10 max-w-5xl mx-auto py-8">
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          {HOME_HERO_DATA.titleStart} <span className="text-primary">{HOME_HERO_DATA.titleHighlight}</span> {HOME_HERO_DATA.titleEnd}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {HOME_HERO_DATA.description}
        </p>
      </div>

      {/* Hero Image / Banner */}
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
        {/* Responsive aspect ratio: 16:9 on mobile, 21:9 on tablet, 2.5:1 on desktop */}
        <div className="w-full bg-muted aspect-video md:aspect-[21/9] lg:aspect-[2.5/1]">
          <img
            src={HOME_HERO_DATA.heroImage}
            alt={HOME_HERO_DATA.heroImageAlt}
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
