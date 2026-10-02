import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2Icon, MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "../services/auth.service";
import type { RegistrationChallenge } from "../types/auth.types";
import { secondsUntil } from "../lib/registration-session";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";

type Props = {
  challenge: RegistrationChallenge;
  onUpdate: (challenge: RegistrationChallenge | null) => void;
  onResume: () => void;
};

export function RegistrationVerification({ challenge, onUpdate, onResume }: Props) {
  const location = useLocation();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState(challenge.email);
  const [editingEmail, setEditingEmail] = useState(false);
  const [busy, setBusy] = useState<"verify" | "send" | "email" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [locked, setLocked] = useState(false);
  const [invalidSession, setInvalidSession] = useState(false);
  const [verified, setVerified] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef<HTMLInputElement>(null);
  const pending = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (notice) codeRef.current?.focus();
  }, [notice]);

  const resendSeconds = secondsUntil(challenge.resendAvailableAt, now);
  const codeSeconds = secondsUntil(challenge.expiresAt, now);
  const sessionExpired = invalidSession || secondsUntil(challenge.sessionExpiresAt, now) === 0;

  async function perform(action: "verify" | "send" | "email") {
    if (pending.current) return;
    if (action === "verify" && !/^[0-9]{6}$/.test(code)) {
      setError("Vui lòng nhập đủ 6 chữ số.");
      codeRef.current?.focus();
      return;
    }
    const parsedEmail = z.email().max(100).safeParse(email.trim());
    if (action === "email" && !parsedEmail.success) {
      setError("Vui lòng nhập địa chỉ email hợp lệ, tối đa 100 ký tự.");
      return;
    }
    pending.current = true;
    setBusy(action);
    setError("");
    setNotice("");
    try {
      if (action === "verify") {
        await authService.verifyRegistration({ verificationSession: challenge.verificationSession, code });
        setVerified(true);
        onUpdate(null);
      } else {
        const response = action === "email"
          ? await authService.changeRegistrationEmail({ verificationSession: challenge.verificationSession, email: parsedEmail.data! })
          : await authService.resendRegistration({ verificationSession: challenge.verificationSession });
        onUpdate(response.data);
        setEmail(response.data.email);
        setCode("");
        setLocked(false);
        setEditingEmail(false);
        setNotice("Mã mới đã được yêu cầu. Kiểm tra hộp thư và mục thư rác; mã cũ không còn hiệu lực.");
        setNow(Date.now());
        codeRef.current?.focus();
      }
    } catch (err) {
      const failure = parseApiError(err);
      setError(failure.detail);
      if (failure.messageKey === "error.auth.registrationOtpLocked") setLocked(true);
      if (failure.messageKey === "error.auth.registrationSessionInvalid") setInvalidSession(true);
      if (failure.messageKey === "error.auth.registrationAlreadyVerified") {
        setVerified(true);
        onUpdate(null);
      }
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }

  if (verified) return (
    <div className="auth-status" role="status">
      <CheckCircle2Icon className="auth-status__icon" />
      <h1 className="auth-heading">Email đã xác thực.</h1>
      <p className="auth-status__message">Tài khoản đã sẵn sàng. Đăng nhập để bắt đầu học nhé.</p>
      <Button asChild><Link to={ROUTES.LOGIN} state={location.state}>Đăng nhập ngay</Link></Button>
    </div>
  );

  return (
    <div className="auth-form" aria-busy={busy !== null}>
      <div className="space-y-3">
        <MailCheckIcon className="auth-status__icon" aria-hidden="true" />
        <h1 className="auth-heading">Xác thực email</h1>
        <p className="auth-description">Nhập mã 6 số gửi tới
          <strong className="mt-1 block break-words text-foreground [overflow-wrap:anywhere]">{challenge.email}</strong>
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">Chưa thấy email? Kiểm tra cả mục thư rác. Mã có hiệu lực trong 10 phút.</p>
      </div>

      {sessionExpired ? (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-muted-foreground">Phiên đăng ký đã hết hạn. Dùng email hoặc tên đăng nhập và mật khẩu đã tạo để tiếp tục.</p>
          <Button className="w-full" onClick={onResume}>Tiếp tục xác thực</Button>
        </div>
      ) : (
        <>
          <form noValidate className="space-y-4" onSubmit={(event) => { event.preventDefault(); void perform("verify"); }}>
            <FormField ref={codeRef} id="registration-code" label="Mã xác thực" type="text"
              inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              className="text-center text-xl tracking-[0.35em] tabular-nums" disabled={busy !== null || locked}
              helperText={locked ? "Đã nhập sai 5 lần. Hãy yêu cầu mã mới." : codeSeconds === 0 ? "Mã đã hết hạn. Hãy yêu cầu mã mới." : `Mã hết hạn sau ${Math.floor(codeSeconds / 60)}:${String(codeSeconds % 60).padStart(2, "0")}`}
            />
            <Button type="submit" className="w-full" loading={busy === "verify"} disabled={busy !== null || locked || codeSeconds === 0}>Xác thực email</Button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" loading={busy === "send"} disabled={busy !== null || resendSeconds > 0}
              onClick={() => void perform("send")}>{resendSeconds > 0 ? `Gửi lại sau ${resendSeconds}s` : "Gửi lại mã"}</Button>
            <Button type="button" variant="ghost" disabled={busy !== null} aria-expanded={editingEmail}
              onClick={() => { setEditingEmail(!editingEmail); setEmail(challenge.email); setError(""); }}>Sửa email</Button>
          </div>
          {editingEmail && (
            <form noValidate className="space-y-3 rounded-xl border border-border p-4" onSubmit={(event) => { event.preventDefault(); void perform("email"); }}>
              <FormField id="registration-new-email" type="email" label="Email chính xác" autoComplete="email"
                value={email} onChange={(event) => setEmail(event.target.value)} maxLength={100} disabled={busy !== null} autoFocus />
              <p className="text-xs leading-relaxed text-muted-foreground">Gửi mã tới email mới sẽ hủy mã đã gửi trước đó.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={busy === "email"} disabled={busy !== null}>Lưu và gửi mã</Button>
                <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => { setEditingEmail(false); setError(""); }}>Hủy</Button>
              </div>
            </form>
          )}
        </>
      )}
      {error && !sessionExpired && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm leading-relaxed text-muted-foreground">{notice}</p>}
      <Link to={ROUTES.LOGIN} state={location.state} className="text-center text-sm underline underline-offset-4">Về đăng nhập</Link>
    </div>
  );
}
