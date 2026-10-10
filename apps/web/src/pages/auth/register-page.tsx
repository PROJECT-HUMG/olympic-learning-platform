import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreationDialog, type CreationState } from "@/components/ui/creation-dialog";
import { RegisterForm } from "@/features/auth/components/register-form";
import { ROUTES } from "@/router/route-constants";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<CreationState>({ dirty: false, busy: false });
  return <CreationDialog className="creation-dialog--compact" returnFocusSelector={`a[href="${ROUTES.REGISTER}"], main h1`} open onOpenChange={open => { if (!open) navigate(ROUTES.LOGIN, { state: location.state }); }} title="Tạo tài khoản" description="Đăng ký và xác thực email. Phiên xác thực đã tạo vẫn có thể tiếp tục sau khi đóng." {...state}>{close => <RegisterForm onStateChange={setState} onClose={close} />}</CreationDialog>;
}
