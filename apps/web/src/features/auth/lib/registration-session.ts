import type { RegistrationChallenge } from "../types/auth.types";

const KEY = "olympic-registration-session";

export function readRegistrationSession(storage?: Pick<Storage, "getItem" | "removeItem">, now = Date.now()): RegistrationChallenge | null {
  try {
    const source = storage ?? window.sessionStorage;
    const raw = source.getItem(KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const item = value as Record<string, unknown>;
    if (typeof item.verificationSession !== "string" || !/^[A-Za-z0-9_-]{64}$/.test(item.verificationSession) ||
      typeof item.email !== "string" || typeof item.expiresAt !== "string" ||
      typeof item.resendAvailableAt !== "string" || typeof item.sessionExpiresAt !== "string" ||
      !Number.isFinite(Date.parse(item.expiresAt)) || !Number.isFinite(Date.parse(item.resendAvailableAt)) ||
      !(Date.parse(item.sessionExpiresAt) > now)) {
      source.removeItem(KEY);
      return null;
    }
    return item as unknown as RegistrationChallenge;
  } catch {
    return null;
  }
}

export function storeRegistrationSession(value: RegistrationChallenge | null, storage?: Pick<Storage, "setItem" | "removeItem">) {
  try {
    const target = storage ?? window.sessionStorage;
    if (value) target.setItem(KEY, JSON.stringify(value));
    else target.removeItem(KEY);
  } catch {
    // Verification continues in memory when browser storage is unavailable.
  }
}

export function secondsUntil(timestamp: string, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(timestamp) - now) / 1000));
}
