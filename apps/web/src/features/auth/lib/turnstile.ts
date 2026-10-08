export type TurnstileAction = "register" | "password_reset" | "login";

export function turnstileConfig(enabled: string | undefined, siteKey: string | undefined) {
  const active = enabled === "true";
  return { enabled: active, siteKey: siteKey?.trim() ?? "", invalid: active && !siteKey?.trim() };
}

export function usableTurnstileToken(token: string, issuedAt: number, now = Date.now()) {
  return token.length > 0 && token.length <= 2048 && now >= issuedAt && now - issuedAt < 300_000;
}

export interface TurnstileApi {
  render(container: HTMLElement, options: {
    sitekey: string; action: TurnstileAction; size: "flexible";
    callback: (token: string) => void;
    "expired-callback": () => void; "error-callback": () => void;
    "timeout-callback": () => void; "response-field": false;
  }): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global { interface Window { turnstile?: TurnstileApi } }

let loading: Promise<TurnstileApi> | undefined;
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timer = window.setTimeout(fail, 15_000);
    function fail() {
      window.clearTimeout(timer);
      script.remove();
      reject(new Error("Không tải được xác minh chống spam. Hãy thử lại."));
    }
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.turnstile) resolve(window.turnstile); else fail();
    };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
