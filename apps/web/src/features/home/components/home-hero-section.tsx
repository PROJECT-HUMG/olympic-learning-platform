import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, BookOpenText, FileText, Trophy } from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { HOME_HERO_DATA } from "../data/home-mock-data";
import "./home-hero-section.css";

const paths = [
  { label: "Môn học", detail: "Bắt đầu từ nền tảng", href: ROUTES.SUBJECTS, icon: BookOpenText, className: "hero-path--subjects" },
  { label: "Tài liệu", detail: "Đào sâu từng chủ đề", href: ROUTES.DOCUMENTS, icon: FileText, className: "hero-path--documents" },
  { label: "Kỳ thi", detail: "Thử sức và tiến xa", href: ROUTES.COMPETITIONS, icon: Trophy, className: "hero-path--competitions" },
] as const;

export function HomeHeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__copy">
        <p className="home-hero__eyebrow"><span className="home-hero__eyebrow-mark" /> Không gian học tập Olympic HUMG</p>
        <h1 id="home-hero-title" className="home-hero__title">
          <span>{HOME_HERO_DATA.titleStart}</span>
          <span className="home-hero__title-accent">{HOME_HERO_DATA.titleHighlight}<span className="home-hero__title-dot">.</span></span>
          <span>{HOME_HERO_DATA.titleEnd}</span>
        </h1>
        <p className="home-hero__description">{HOME_HERO_DATA.description}</p>
        <div className="home-hero__actions">
          <Link className="home-hero__primary" to={ROUTES.COMPETITIONS}>
            Khám phá kỳ thi <ArrowUpRight aria-hidden="true" size={19} />
          </Link>
          <Link className="home-hero__secondary" to={ROUTES.SUBJECTS}>
            Danh mục môn học <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <div className="home-hero__footnote">
          <span className="home-hero__footnote-line" aria-hidden="true" />
          Một hành trình học tập, nhiều hướng khám phá
        </div>
      </div>

      <nav className="home-hero__visual" aria-label="Khám phá môn học, tài liệu và kỳ thi">
        <div className="home-hero__visual-grid" aria-hidden="true" />
        <div className="home-hero__orbit home-hero__orbit--outer" aria-hidden="true" />
        <div className="home-hero__orbit home-hero__orbit--inner" aria-hidden="true" />
        <div className="home-hero__orbit-point" aria-hidden="true" />
        <div className="home-hero__core" aria-hidden="true">
          <span>HỌC</span>
          <span className="home-hero__core-star">✳</span>
          <span>THỬ SỨC</span>
          <span className="home-hero__core-rule" />
          <small>PHÁT TRIỂN TƯ DUY</small>
        </div>
        {paths.map(({ label, detail, href, icon: Icon, className }) => (
          <Link key={href} className={`hero-path ${className}`} to={href}>
            <span className="hero-path__icon"><Icon aria-hidden="true" size={18} strokeWidth={1.8} /></span>
            <span className="hero-path__text"><strong>{label}</strong><small>{detail}</small></span>
            <ArrowUpRight className="hero-path__arrow" aria-hidden="true" size={17} />
          </Link>
        ))}
        <span className="home-hero__visual-caption">Từ tò mò đến bứt phá <ArrowDownRight aria-hidden="true" size={16} /></span>
      </nav>
    </section>
  );
}
