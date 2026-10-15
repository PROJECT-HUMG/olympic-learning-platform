import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

export function VerifyEmailCard() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  return <EmailVerification key={token ?? ""} token={token} />;
}

function EmailVerification({ token }: { token: string | null }) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verification = useRef<{ token: string; request: ReturnType<typeof authService.verifyEmail> } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Mã xác thực không tồn tại.");
      return;
    }

    if (verification.current?.token !== token) {
      verification.current = { token, request: authService.verifyEmail({ token }) };
    }
    const request = verification.current.request;
    let mounted = true;

    async function verify() {
      try {
        await request;
        if (mounted) setStatus("success");
      } catch (err) {
        if (mounted) {
          const apiError = parseApiError(err);
          setErrorMessage(apiError.detail || "Xác thực email thất bại.");
          setStatus("error");
        }
      }
    }

    verify();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div aria-busy={status === "loading"}>
      {status === "loading" && (
        <div className="auth-status" role="status" aria-label="Đang xác thực email">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-8 w-60 max-w-full rounded-md" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          <Skeleton className="h-11 w-40 max-w-full rounded-md" />
        </div>
      )}

      {status === "success" && (
        <div className="auth-status" role="status">
          <CheckCircle2Icon className="auth-status__icon" aria-hidden="true" />
          <h1 className="auth-heading">Email đã được xác thực</h1>
          <p className="auth-description">
            Tài khoản đã sẵn sàng. Bạn có thể đăng nhập ngay.
          </p>
          <Button asChild>
            <Link to={ROUTES.LOGIN}>Đăng nhập ngay</Link>
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="auth-status" role="alert">
          <XCircleIcon className="auth-status__icon auth-status__icon--error" aria-hidden="true" />
          <h1 className="auth-heading">Chưa thể xác thực email</h1>
          <p className="auth-description">{errorMessage}</p>
          <Button asChild variant="outline">
            <Link to={ROUTES.REGISTER + "?resume=1"}>Nhận mã xác thực mới</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
