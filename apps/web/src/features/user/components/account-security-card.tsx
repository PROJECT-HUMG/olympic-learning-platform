import { useRef, useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import { ChangePasswordModal } from "./change-password-modal";
import type { UserProfile } from "../types/user.types";

export function AccountSecurityCard({ user }: { user: UserProfile }) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const passwordTriggerRef = useRef<HTMLButtonElement>(null);
  const isEmailVerified = user.status === "ACTIVE";
  return <>
    <PageSection title="Bảo mật tài khoản" description="Kiểm tra xác thực email và quản lý mật khẩu đăng nhập.">
      <div className="profile-security">
        <div className="profile-security__row">
          <div className="profile-security__copy">
            <h3>{isEmailVerified ? "Email đã được xác thực" : "Chưa xác thực email"}</h3>
            <p>{isEmailVerified ? "Tài khoản của bạn đã được xác minh." : "Kiểm tra hộp thư để hoàn tất kích hoạt tài khoản."}</p>
          </div>
          {isEmailVerified ? <CheckCircle2 aria-label="Đã xác thực" className="size-5 shrink-0 text-primary" />
            : <ShieldAlert aria-label="Cần xác thực" className="size-5 shrink-0 text-destructive" />}
        </div>
        <div className="profile-security__row">
          <div className="profile-security__copy"><h3>Mật khẩu đăng nhập</h3><p>Đổi mật khẩu nếu bạn nghi ngờ tài khoản bị lộ thông tin.</p></div>
          <Button ref={passwordTriggerRef} variant="outline" onClick={() => setIsPasswordModalOpen(true)}>Đổi mật khẩu</Button>
        </div>
      </div>
    </PageSection>
    <ChangePasswordModal open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen} returnFocusRef={passwordTriggerRef} />
  </>;
}
