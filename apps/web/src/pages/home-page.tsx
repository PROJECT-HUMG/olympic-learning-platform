import { HomeHeroSection } from "@/features/home/components/home-hero-section";
import { HomeFeaturedSubjectsSection } from "@/features/home/components/home-featured-subjects-section";
import { HomeUpcomingCompetitionsSection } from "@/features/home/components/home-upcoming-competitions-section";
import { HomeFeaturedDocumentsSection } from "@/features/home/components/home-featured-documents-section";
import { HomeLatestNewsSection } from "@/features/home/components/home-latest-news-section";
import { FadeIn } from "@/components/ui/fade-in";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-20">
      <FadeIn delay={0.1}>
        <HomeHeroSection />
      </FadeIn>
      <FadeIn delay={0.1}>
        <HomeFeaturedSubjectsSection />
      </FadeIn>
      <FadeIn delay={0.1}>
        <HomeUpcomingCompetitionsSection />
      </FadeIn>
      <FadeIn delay={0.1}>
        <HomeFeaturedDocumentsSection />
      </FadeIn>
      <FadeIn delay={0.1}>
        <HomeLatestNewsSection />
      </FadeIn>
    </div>
  );
}
