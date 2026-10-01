import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { WelcomeLayout } from "@/layouts/welcome-layout";
import { HomeIcon, ArrowLeftIcon } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <WelcomeLayout>
      <div className="auth-status">
        <h1 className="not-found-code">404</h1>
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Lạc đường một chút.</h2>
          <p className="auth-description">
            Trang bạn đang tìm không tồn tại hoặc đã được chuyển sang địa chỉ mới.
            Hãy về trang chủ để tiếp tục khám phá.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild className="h-11 rounded-full px-6">
            <Link to={ROUTES.HOME}>
              <HomeIcon className="size-4" />
              Về trang chủ
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} className="h-11 rounded-full px-3">
            <ArrowLeftIcon className="size-4" />
            Quay lại trang trước
          </Button>
        </div>
      </div>
    </WelcomeLayout>
  );
}
