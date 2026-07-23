import { KeyRound, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "../types/user.types";

interface AccountSecurityCardProps {
  user: UserProfile;
}

export function AccountSecurityCard({ user }: AccountSecurityCardProps) {
  const isEmailVerified = user.status === "ACTIVE";

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8 space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Bảo Mật & Tài Khoản
        </h3>
        <p className="text-sm text-muted-foreground">
          Trạng thái xác thực email và quản lý bảo mật mật khẩu.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Email Verification status */}
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          {isEmailVerified ? (
            <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-foreground">
              {isEmailVerified ? "Email đã được xác thực" : "Chưa xác thực email"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isEmailVerified
                ? "Tài khoản của bạn đã được xác minh an toàn."
                : "Vui lòng kiểm tra hộp thư để hoàn tất kích hoạt tài khoản."}
            </p>
          </div>
        </div>

        {/* Password Reset option */}
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          <KeyRound className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Mật khẩu đăng nhập</h4>
            <p className="text-xs text-muted-foreground">
              Đổi mật khẩu nếu bạn nghi ngờ tài khoản bị lộ thông tin.
            </p>
            <Link to={ROUTES.FORGOT_PASSWORD}>
              <Button variant="outline" size="sm" className="mt-1">
                Yêu cầu đổi mật khẩu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
