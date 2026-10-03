import { useState } from "react";
import { turnstileConfig, usableTurnstileToken } from "../lib/turnstile";

const config = turnstileConfig(import.meta.env.VITE_TURNSTILE_ENABLED, import.meta.env.VITE_TURNSTILE_SITE_KEY);

export function useTurnstileChallenge() {
  const [value, setValue] = useState({ token: "", issuedAt: 0 });
  const [generation, setGeneration] = useState(0);
  const receive = (token: string) => setValue({ token, issuedAt: Date.now() });
  const reset = () => { setValue({ token: "", issuedAt: 0 }); setGeneration(value => value + 1); };
  return {
    generation, receive, reset,
    ready: !config.enabled || (!config.invalid && usableTurnstileToken(value.token, value.issuedAt)),
    token: () => {
      if (!config.enabled) return undefined;
      if (config.invalid || !usableTurnstileToken(value.token, value.issuedAt)) throw new Error("Vui lòng xác minh chống spam lại trước khi gửi.");
      return value.token;
    },
  };
}
