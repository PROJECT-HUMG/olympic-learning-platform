import { HomeHeroSection } from "@/features/home/components/home-hero-section";
import { HomeStatsSection } from "@/features/home/components/home-stats-section";
import { HomeFeaturedSubjectsSection } from "@/features/home/components/home-featured-subjects-section";
import { HomeUpcomingCompetitionsSection } from "@/features/home/components/home-upcoming-competitions-section";
import { HomeFeaturedDocumentsSection } from "@/features/home/components/home-featured-documents-section";
import { HomeLatestNewsSection } from "@/features/home/components/home-latest-news-section";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-20">
      <HomeHeroSection />
      <HomeStatsSection />
      <HomeFeaturedSubjectsSection />
      <HomeUpcomingCompetitionsSection />
      <HomeFeaturedDocumentsSection />
      <HomeLatestNewsSection />
    </div>
  );
}
