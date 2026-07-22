import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { MagneticPhysicsGrid } from "@/components/ui/magnetic-physics-grid";
import { HomeIcon, ArrowLeftIcon } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8">
      {/* Interactive Magnetic Physics Grid Canvas Background */}
      <MagneticPhysicsGrid />

      {/* Ambient Soft Center Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-primary/10 blur-[130px] dark:bg-primary/15"
        aria-hidden="true"
      />

      {/* 404 Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-8 shadow-xl backdrop-blur-md sm:p-10 space-y-6">
          {/* Crisp Bold 404 Number */}
          <div className="relative select-none">
            <h1 className="text-8xl font-black tracking-tighter text-foreground sm:text-9xl">
              404
            </h1>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Đường Dẫn Không Tồn Tại
            </h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
              Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ mới trong hệ thống Olympic.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-medium px-6">
              <Link to={ROUTES.HOME}>
                <HomeIcon className="size-4" />
                <span>Quay Về Trang Chủ</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto gap-2 font-medium px-6"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Quay Lại Trang Trước</span>
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Olympic Learning Platform.
        </p>
      </div>
    </div>
  );
}
