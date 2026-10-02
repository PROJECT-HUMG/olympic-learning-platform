import { HomeHeroSection } from "@/features/home/components/home-hero-section";
import { HomeLatestNewsSection } from "@/features/home/components/home-latest-news-section";
import { HomeStudyNotebook } from "@/features/home/components/home-study-notebook";
import "./home-page.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <HomeHeroSection />
      <section id="study-notebook" className="home-study" aria-labelledby="home-study-title">
        <div className="home-page__container">
          <header className="home-study__heading">
            <h2 id="home-study-title">Bàn học của bạn</h2>
            <p>Tài liệu mới, thông báo và các tiện ích học tập.</p>
          </header>
          <HomeStudyNotebook />
        </div>
      </section>
      <div className="home-page__sections">
        <div className="home-page__section">
          <HomeLatestNewsSection />
        </div>
      </div>
    </div>
  );
}
