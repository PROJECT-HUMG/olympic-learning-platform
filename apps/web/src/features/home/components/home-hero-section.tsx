import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calculator, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CinematicScene } from "@/components/ui/cinematic-scene";
import { ROUTES } from "@/router/route-constants";
import { useHomeMotion } from "../hooks/use-home-motion";
import "./home-hero-section.css";

export function HomeHeroSection() {
  const navigate = useNavigate();
  const { enabled } = useHomeMotion();
  const introRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    const syncVisibility = () => setTabVisible(!document.hidden);
    observer.observe(intro);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  function searchDocuments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = String(new FormData(event.currentTarget).get("keyword") ?? "").trim();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    navigate({ pathname: ROUTES.DOCUMENTS, search: params.toString() });
  }

  return (
    <section className="home-hero" aria-labelledby="home-hero-title" data-motion={enabled} data-playing={enabled && visible && tabVisible}>
      <div ref={introRef} className="home-hero__intro">
        <div className="home-hero__ambient" aria-hidden="true" />
        <div className="home-hero__window">
          <CinematicScene animated={enabled} respectReducedMotion={false} />
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

    </section>
  );
}
