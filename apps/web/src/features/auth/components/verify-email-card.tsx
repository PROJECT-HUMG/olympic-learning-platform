import { useEffect, useState } from "react";
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

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Mã xác thực không tồn tại.");
      return;
    }

    let mounted = true;

    async function verify() {
      try {
        await authService.verifyEmail({ token: token! });
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
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-12 w-60 max-w-full rounded-md" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      )}

      {status === "success" && (
        <div className="auth-status" role="status">
          <CheckCircle2Icon className="auth-status__icon" />
          <h1 className="auth-heading">Sẵn sàng<br />khám phá.</h1>
          <p className="auth-status__message">
            Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ.
          </p>
          <Button asChild className="h-11 rounded-full px-6">
            <Link to={ROUTES.LOGIN}>Đăng nhập ngay</Link>
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="auth-status" role="alert">
          <XCircleIcon className="size-12 text-destructive" strokeWidth={1.25} />
          <h1 className="auth-heading">Chưa thể xác thực.</h1>
          <p className="auth-status__message">{errorMessage}</p>
          <Button asChild variant="outline" className="h-11 rounded-full px-6">
            <Link to={ROUTES.LOGIN}>Về đăng nhập</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
