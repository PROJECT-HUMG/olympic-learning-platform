import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { WelcomeLayout } from "./welcome-layout";

export function AuthCardLayout({ children }: { children?: ReactNode }) {
  const { pathname, state } = useLocation();
  const isRegister = pathname === ROUTES.REGISTER;
  const showBackLink = pathname !== ROUTES.LOGIN && !isRegister;

  return (
    <WelcomeLayout animated contentSide={isRegister ? "right" : "left"}>
      {showBackLink && (
        <Link to={ROUTES.LOGIN} state={state} className="auth-back-link">
          <ArrowLeft className="size-4" />
          Về đăng nhập
        </Link>
      )}
      <div key={pathname} className="auth-route-content">
        {children ?? <Outlet />}
      </div>
    </WelcomeLayout>
  );
}
