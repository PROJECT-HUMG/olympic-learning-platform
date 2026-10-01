import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CinematicScene } from "@/components/ui/cinematic-scene";
import { ROUTES } from "@/router/route-constants";
import { HomeStudyNotebook } from "./home-study-notebook";
import "./home-hero-section.css";

export function HomeHeroSection() {
  const navigate = useNavigate();

  function searchDocuments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = String(new FormData(event.currentTarget).get("keyword") ?? "").trim();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    navigate({ pathname: ROUTES.DOCUMENTS, search: params.toString() });
  }

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__intro">
        <div className="home-hero__window">
          <CinematicScene />
        </div>

        <div className="home-hero__content">
          <h1 id="home-hero-title">
            <span>Hôm nay,</span>
            <span>bạn muốn học gì?</span>
          </h1>

          <form className="home-hero__search" role="search" aria-label="Tìm tài liệu" onSubmit={searchDocuments}>
            <label htmlFor="home-document-search">Tìm trong kho tài liệu</label>
            <div className="home-hero__search-field">
              <Input id="home-document-search" name="keyword" type="search" placeholder="Tên tài liệu hoặc từ khóa" />
              <Button type="submit" variant="secondary">
                <Search aria-hidden="true" className="size-4" />
                Tìm
              </Button>
            </div>
          </form>

          <div className="home-hero__links">
            <Link to={ROUTES.DOCUMENTS}>
              <BookOpen aria-hidden="true" size={16} />
              Mở kho tài liệu
            </Link>
            <a href="#study-notebook">
              Khám phá bàn học
              <ArrowDown aria-hidden="true" size={15} />
            </a>
          </div>
        </div>
      </div>

      <div id="study-notebook" className="home-hero__notebook">
        <HomeStudyNotebook />
      </div>
    </section>
  );
}
