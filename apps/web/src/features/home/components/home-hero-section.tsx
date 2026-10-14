import { type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calculator, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BlurText from "@/components/react-bits/blur-text";
import { ROUTES } from "@/router/route-constants";
import { CinematicScene } from "@/components/ui/cinematic-scene";
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
        <div className="home-hero__content">
          <h1 id="home-hero-title">
            <BlurText text="Tài nguyên học tập Olympic HUMG" />
          </h1>

          <div className="home-hero__discovery">
            <form className="home-hero__search" role="search" aria-label="Tìm tài liệu" onSubmit={searchDocuments}>
              <label htmlFor="home-document-search">Tìm trong kho tài liệu</label>
              <div className="home-hero__search-field">
                <Input id="home-document-search" name="keyword" type="search" placeholder="Tên tài liệu hoặc từ khóa" />
                <Button type="submit" variant="secondary">
                  <Search aria-hidden="true" className="size-4" />
                  Mở kho tài liệu
                </Button>
              </div>
            </form>

            <div className="home-hero__links">
              <Link to={`${ROUTES.TOOLKIT}?tool=rooms`}>
                <Users aria-hidden="true" size={16} />
                Phòng học chung
              </Link>
              <Link to={`${ROUTES.TOOLKIT}?tool=gpa`}>
                <Calculator aria-hidden="true" size={16} />Tính GPA
              </Link>
            </div>
          </div>
        </div>
        <div className="home-hero__window" aria-hidden="true">
          <CinematicScene preloadAtStartup={false} />
        </div>
      </div>
    </section>
  );
}
