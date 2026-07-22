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
    <div className="space-y-6 text-center" aria-busy={status === "loading"}>
      {status === "loading" && (
        <div className="space-y-4 text-center" role="status" aria-label="Đang xác thực email">
          <Skeleton className="mx-auto size-14 rounded-full" />
          <Skeleton className="mx-auto h-7 w-60 rounded-md" />
          <Skeleton className="mx-auto h-4 w-72 rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <CheckCircle2Icon className="mx-auto size-14 text-green-500" />
          <h1 className="text-2xl font-bold text-foreground">Xác Thực Email Thành Công!</h1>
          <p className="text-sm text-muted-foreground">
            Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ.
          </p>
          <Button asChild className="w-full">
            <Link to={ROUTES.LOGIN}>Đăng Nhập Ngay</Link>
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <XCircleIcon className="mx-auto size-14 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Xác Thực Thất Bại</h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to={ROUTES.LOGIN}>Quay lại Đăng nhập</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
