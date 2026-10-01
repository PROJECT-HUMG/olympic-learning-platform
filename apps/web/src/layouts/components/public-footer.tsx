import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { Logo } from "@/components/ui/logo";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useThemeStore } from "@/stores/use-theme-store";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { Moon, Sun, MapPin, Mail, Phone } from "lucide-react";

const FaviconIcon = ({ src, domain, className }: { src: string; domain: string; className?: string }) => (
  <img
    src={src}
    alt={`${domain} icon`}
    className={className}
    loading="lazy"
  />
);

const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://www.facebook.com/people/Olympic-HUMG/61586595247041/#", domain: "facebook.com", iconSrc: "/social-icons/facebook.png" },
  { name: "Zalo", href: "https://zalo.me/g/qogcgc751", domain: "zalo.me", iconSrc: "/social-icons/zalo.png" },
  { name: "GitHub", href: "https://github.com/PROJECT-HUMG/olympic-learning-platform", domain: "github.com", iconSrc: "/social-icons/github.png" },
];

const DISCOVERY_LINKS = [
  { label: "Môn học", href: ROUTES.SUBJECTS },
  { label: "Phòng học chung", href: `${ROUTES.TOOLKIT}?tool=rooms` },
  { label: "Tài liệu ôn thi", href: ROUTES.DOCUMENTS },
  { label: "Bảng tin học đường", href: ROUTES.NEWS },
];

export function PublicFooter() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useResolvedTheme();

  const isDark = theme === "dark";

  return (
    <footer className="relative z-10 border-t border-border/60 bg-card/60 backdrop-blur-xl text-foreground transition-colors duration-300 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 mb-12">
          {/* Cột 1: Brand */}
          <div className="relative space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Tài liệu, thông báo và không gian học cùng bạn bè dành cho sinh viên HUMG.
            </p>
          </div>

          {/* Cột 2: Khám phá */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Khám phá
            </h3>
            <nav className="space-y-2.5 text-sm">
              {DISCOVERY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex min-h-11 items-center text-muted-foreground transition-all hover:text-primary hover:translate-x-1"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Cột 3: Liên hệ */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Liên hệ
            </h3>
            <address className="space-y-2.5 text-sm not-italic text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                <span>Số 18 Phố Viên, Phường Đức Thắng, Bắc Từ Liêm, Hà Nội</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-primary" />
                <span>(+84) 024 3838 9633</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-primary" />
                <a href="mailto:olympic@humg.edu.vn" className="hover:text-primary transition-colors">
                  olympic@humg.edu.vn
                </a>
              </p>
            </address>
          </div>

          {/* Cột 4: Theo dõi & Giao diện */}
          <div className="relative space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                Theo dõi chúng tôi
              </h3>
              <div className="flex items-center space-x-3">
                {SOCIAL_LINKS.map((social) => (
                  <TooltipProvider key={social.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex size-11 items-center justify-center rounded-full border border-border bg-background/80 hover:bg-accent hover:border-primary/50 transition-all duration-200 hover:scale-105 shadow-2xs"
                        >
                          <FaviconIcon
                            src={social.iconSrc}
                            domain={social.domain}
                            className="size-4.5 rounded-xs"
                          />
                          <span className="sr-only">{social.name}</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{social.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {/* Switch Dark/Light Mode */}
            <div className="pt-2">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Giao diện hiển thị
              </h4>
              <div className="flex items-center space-x-2.5">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  id="footer-dark-mode"
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="footer-dark-mode" className="text-xs text-muted-foreground cursor-pointer select-none">
                  {isDark ? "Chế độ tối" : "Chế độ sáng"}
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 text-center md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Olympic Learning Platform (HUMG). All rights reserved.
          </p>
          <Link to={ROUTES.ABOUT} className="text-xs text-muted-foreground hover:text-primary">Về Olympic HUMG</Link>
        </div>
      </div>
    </footer>
  );
}
