import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";
import { HOME_HERO_DATA } from "../data/home-mock-data";

export function HomeHeroSection() {
  const HeroImage = () => (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 aspect-video lg:aspect-[4/3] bg-muted">
      <img
        src={HOME_HERO_DATA.heroImage}
        alt={HOME_HERO_DATA.heroImageAlt}
        className="size-full object-cover object-center transition-transform duration-700 hover:scale-105"
      />
      {/* Subtle gradient overlay to make it look premium */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl pt-4 pb-12 sm:pt-12 sm:pb-20">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-10">
        
        {/* Text Content & Mobile Image */}
        <div className="flex-1 flex flex-col space-y-8 text-center lg:text-left max-w-3xl mx-auto lg:mx-0 w-full">

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.15]">
            {HOME_HERO_DATA.titleStart} <span className="text-primary">{HOME_HERO_DATA.titleHighlight}</span> <br className="hidden sm:block" /> {HOME_HERO_DATA.titleEnd}
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {HOME_HERO_DATA.description}
          </p>
          
          {/* Mobile Hero Image (Hidden on Desktop) */}
          <div className="block lg:hidden w-full max-w-2xl mx-auto pt-2">
            <HeroImage />
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 lg:pt-4">
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25">
              <Link to={ROUTES.COMPETITIONS}>
                Khám phá kỳ thi
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-background/50 backdrop-blur-sm border-border/80">
              <Link to={ROUTES.SUBJECTS}>
                Danh mục môn học
              </Link>
            </Button>
          </div>
        </div>

        {/* Desktop Hero Image (Hidden on Mobile) */}
        <div className="hidden lg:block flex-1 w-full max-w-2xl lg:max-w-none mx-auto">
          <HeroImage />
        </div>
        
      </div>
    </section>
  );
}
