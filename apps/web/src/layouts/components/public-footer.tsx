import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { Logo } from "@/components/ui/logo";

const FaviconIcon = ({ domain, className }: { domain: string; className?: string }) => (
  <img 
    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
    alt={`${domain} icon`}
    className={className}
    loading="lazy"
  />
);

const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://www.facebook.com/people/Olympic-HUMG/61586595247041/#", domain: "facebook.com" },
  { name: "YouTube", href: "https://youtube.com", domain: "youtube.com" },
  { name: "Zalo", href: "https://zalo.me/g/qogcgc751", domain: "zalo.me" },
  { name: "GitHub", href: "https://github.com/PROJECT-HUMG/olympic-learning-platform", domain: "github.com" },
];

const FOOTER_GROUPS = [
  {
    title: "Khám phá",
    links: [
      { label: "Môn học", href: ROUTES.SUBJECTS, isExternal: false },
      { label: "Kỳ thi", href: ROUTES.COMPETITIONS, isExternal: false },
      { label: "Tài liệu", href: ROUTES.DOCUMENTS, isExternal: false },
      { label: "Tin tức", href: ROUTES.NEWS, isExternal: false },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Hướng dẫn sử dụng", href: "#", isExternal: false },
      { label: "Câu hỏi thường gặp", href: "#", isExternal: false },
      { label: "Liên hệ", href: "#", isExternal: false },
      { label: "Cộng đồng Zalo", href: "https://zalo.me/g/qogcgc751", isExternal: true },
    ],
  },
  {
    title: "Pháp lý",
    links: [
      { label: "Điều khoản sử dụng", href: "#", isExternal: false },
      { label: "Chính sách bảo mật", href: "#", isExternal: false },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-border/50 bg-card/40 backdrop-blur-xl pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Nền tảng ôn luyện và thi thử Olympic trực tuyến chất lượng cao dành cho học sinh đam mê học thuật.
            </p>
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-transform hover:-translate-y-1 group"
                >
                  <FaviconIcon domain={social.domain} className="size-5 rounded-sm grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-300" />
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links Groups */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.isExternal ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-all hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-all hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Olympic Learning Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
