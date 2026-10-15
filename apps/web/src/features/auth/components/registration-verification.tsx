import type { CreationState } from "@/components/ui/creation-dialog";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { z } from "zod";
import { ArrowLeftIcon, CheckCircle2Icon, MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { CodeSlots } from "@/components/react-bits/code-slots";
import { authService } from "../services/auth.service";
import type { RegistrationChallenge } from "../types/auth.types";
import { secondsUntil } from "../lib/registration-session";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import "./registration-verification.css";

type Props = {
  onStateChange?: (state: CreationState) => void;
  onClose?: () => void;
  challenge: RegistrationChallenge;
  onUpdate: (challenge: RegistrationChallenge | null) => void;
  onResume: () => void;
};

export function RegistrationVerification({ challenge, onUpdate, onResume, onStateChange, onClose }: Props) {
  const location = useLocation();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState(challenge.email);
  const [editingEmail, setEditingEmail] = useState(false);
  const [busy, setBusy] = useState<"verify" | "send" | "email" | null>(null);
  const [error, setError] = useState("");
  const [errorTarget, setErrorTarget] = useState<"code" | "email">("code");
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

  const dirty = !verified && (!!code || (editingEmail && email !== challenge.email));
  useEffect(() => { onStateChange?.({ dirty, busy: busy !== null }); }, [onStateChange, dirty, busy]);
  const resendSeconds = secondsUntil(challenge.resendAvailableAt, now);
  const codeSeconds = secondsUntil(challenge.expiresAt, now);
  const sessionExpired = invalidSession || secondsUntil(challenge.sessionExpiresAt, now) === 0;

  async function perform(action: "verify" | "send" | "email") {
    if (pending.current) return;
    setErrorTarget(action === "email" ? "email" : "code");
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
        setNotice("Đã yêu cầu mã mới. Kiểm tra hộp thư và mục thư rác. Mã cũ không còn hiệu lực.");
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

  const codeWarning = locked ? "Đã nhập sai 5 lần. Hãy yêu cầu mã mới."
    : codeSeconds === 0 ? "Mã đã hết hạn. Hãy yêu cầu mã mới." : "";
  const showCodeWarning = !!codeWarning && !(errorTarget === "code" && error === codeWarning);

  const errorFeedback = error && <p id={`registration-${errorTarget}-error`} role="alert"
    className="registration-verification__feedback registration-verification__feedback--error">{error}</p>;

  if (verified) return (
    <div className="auth-status registration-verification" role="status">
      <CheckCircle2Icon className="auth-status__icon" aria-hidden="true" />
      <h1 className="auth-heading">Email đã được xác thực</h1>
      <p className="auth-description">Tài khoản đã sẵn sàng. Bạn có thể đăng nhập ngay.</p>
      <Button asChild><Link to={ROUTES.LOGIN} state={location.state} onClick={onClose ? event => { event.preventDefault(); onClose(); } : undefined}>Đăng nhập ngay</Link></Button>
    </div>
  );

  return (
    <div className="registration-verification" aria-busy={busy !== null}>
      <header className="registration-verification__header">
        <p className="registration-verification__eyebrow">Hoàn tất đăng ký</p>
        <h1 className="auth-heading">Xác thực email</h1>
        <p className="auth-description">Nhập mã 6 số đã gửi đến địa chỉ email của bạn.</p>
      </header>

      <div className="registration-verification__recipient">
        <div className="registration-verification__address">
          <MailCheckIcon aria-hidden="true" />
          <strong>{challenge.email.split("@").map((part, index) => (
            <Fragment key={index}>{index > 0 && <>@<wbr /></>}{part}</Fragment>
          ))}</strong>
        </div>
        {!sessionExpired && <Button type="button" variant="ghost" disabled={busy !== null}
          aria-expanded={editingEmail} aria-controls="registration-email-editor"
          onClick={() => {
            setEditingEmail(!editingEmail); setEmail(challenge.email); setError("");
            if (editingEmail) codeRef.current?.focus();
          }}>Sửa email</Button>}
      </div>

      {sessionExpired ? (
        <div className="registration-verification__recovery">
          <div role="alert" className="registration-verification__feedback">
            <p className="font-medium text-foreground">Phiên đăng ký đã hết hạn</p>
            <p>Dùng email hoặc tên đăng nhập và mật khẩu đã tạo để tiếp tục xác thực.</p>
          </div>
          <Button className="w-full" onClick={onResume}>Tiếp tục xác thực</Button>
        </div>
      ) : (
        <>
          {editingEmail && (
            <form id="registration-email-editor" noValidate className="registration-verification__email-editor"
              onSubmit={(event) => { event.preventDefault(); void perform("email"); }}>
              <FormField id="registration-new-email" type="email" label="Email nhận mã" autoComplete="email"
                value={email} onChange={(event) => setEmail(event.target.value)} maxLength={100} disabled={busy !== null} autoFocus
                aria-invalid={!!error && errorTarget === "email"}
                aria-describedby={error && errorTarget === "email" ? "registration-email-error" : undefined} />
              <p className="registration-verification__hint">Mã cũ sẽ hết hiệu lực khi bạn yêu cầu mã cho email mới.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={busy === "email"} disabled={busy !== null}>Lưu và gửi mã</Button>
                <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => {
                  setEditingEmail(false); setError(""); codeRef.current?.focus();
                }}>Hủy</Button>
              </div>
              {errorTarget === "email" && errorFeedback}
            </form>
          )}
          <form noValidate className="registration-verification__code-form"
            onSubmit={(event) => { event.preventDefault(); void perform("verify"); }}>
            <div className="registration-verification__code-label">
              <label htmlFor="registration-code">Mã xác thực</label>
              {!locked && codeSeconds > 0 && <span className="registration-verification__countdown">
                Còn {Math.floor(codeSeconds / 60)}:{String(codeSeconds % 60).padStart(2, "0")}
              </span>}
            </div>
            <CodeSlots ref={codeRef} id="registration-code" value={code} onValueChange={setCode}
              disabled={busy !== null || locked} aria-invalid={!!error && errorTarget === "code"}
              aria-describedby={`registration-code-helper${error && errorTarget === "code" ? " registration-code-error" : ""}`} />
            <p id="registration-code-helper" role={showCodeWarning ? "status" : undefined} className={showCodeWarning ? "registration-verification__hint text-destructive" : "sr-only"}>
              {showCodeWarning ? codeWarning : "Nhập đủ 6 chữ số. Mã có hiệu lực trong 10 phút."}
            </p>
            {errorTarget === "code" && errorFeedback}
            {notice && <p role="status" className="registration-verification__feedback">{notice}</p>}
            <Button type="submit" className="w-full registration-verification__submit" loading={busy === "verify"}
              disabled={busy !== null || locked || codeSeconds === 0}>Xác thực email</Button>
          </form>
          <div className="registration-verification__resend">
            <div>
              <p className="registration-verification__resend-title">Chưa nhận được mã?</p>
              <p className="registration-verification__hint">Kiểm tra cả mục thư rác.</p>
            </div>
            <Button type="button" variant="outline" loading={busy === "send"} disabled={busy !== null || resendSeconds > 0}
              onClick={() => void perform("send")}>{resendSeconds > 0 ? `Gửi lại sau ${resendSeconds}s` : "Gửi lại mã"}</Button>
          </div>
        </>
      )}
      <Link to={ROUTES.LOGIN} state={location.state} onClick={onClose ? event => { event.preventDefault(); onClose(); } : undefined}
        className="registration-verification__back"><ArrowLeftIcon aria-hidden="true" />Về đăng nhập</Link>
    </div>
  );
}
