import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadTurnstile, turnstileConfig } from "../lib/turnstile";
import type { TurnstileAction } from "../lib/turnstile";

const config = turnstileConfig(import.meta.env.VITE_TURNSTILE_ENABLED, import.meta.env.VITE_TURNSTILE_SITE_KEY);

export function TurnstileChallenge({ action, generation, onToken }: {
  action: TurnstileAction; generation: number; onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  useEffect(() => { callback.current = onToken; }, [onToken]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!config.enabled || config.invalid) return;
    let disposed = false;
    let id: string | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    callback.current("");
    const invalidate = (message: string) => {
      if (disposed) return;
      clearTimeout(expiry); callback.current(""); setError(message);
    };
    void loadTurnstile().then(api => {
      if (disposed || !container.current) return;
      setError("");
      id = api.render(container.current, {
        sitekey: config.siteKey, action, size: "flexible", "response-field": false,
        callback: token => {
          if (disposed) return;
          clearTimeout(expiry); callback.current(token); setError("");
          expiry = setTimeout(() => invalidate("Xác minh đã hết hạn. Hãy xác minh lại."), 300_000);
        },
        "expired-callback": () => invalidate("Xác minh đã hết hạn. Hãy xác minh lại."),
        "timeout-callback": () => invalidate("Xác minh quá thời gian. Hãy thử lại."),
        "error-callback": () => invalidate("Không xác minh được. Hãy thử lại."),
      });
    }).catch(() => { if (!disposed) invalidate("Không tải được xác minh chống spam. Hãy thử lại."); });
    return () => { disposed = true; clearTimeout(expiry); if (id) window.turnstile?.remove(id); };
  }, [action, generation, retry]);
  if (!config.enabled) return null;
  if (config.invalid) return <p role="alert" className="text-sm text-destructive">Chưa cấu hình khóa công khai chống spam. Vui lòng liên hệ quản trị viên.</p>;
  return <div className="space-y-2"><div ref={container} aria-label="Xác minh chống spam" />{error && <div role="alert" className="text-sm text-destructive">{error} <Button type="button" variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Xác minh lại</Button></div>}</div>;
}
