import { HomeHeroSection } from "@/features/home/components/home-hero-section";
import { HomeFeaturedSubjectsSection } from "@/features/home/components/home-featured-subjects-section";
import { HomeUpcomingCompetitionsSection } from "@/features/home/components/home-upcoming-competitions-section";
import { HomeFeaturedDocumentsSection } from "@/features/home/components/home-featured-documents-section";
import { HomeLatestNewsSection } from "@/features/home/components/home-latest-news-section";
import "./home-page.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <HomeHeroSection />
      <div className="home-page__sections mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="home-page__section">
          <HomeFeaturedSubjectsSection />
        </div>
        <div className="home-page__section">
          <HomeUpcomingCompetitionsSection />
        </div>
        <div className="home-page__section">
          <HomeFeaturedDocumentsSection />
        </div>
        <div className="home-page__section">
          <HomeLatestNewsSection />
        </div>
      </div>
    </div>
  );
}
