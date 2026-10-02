export function getPostDeadline(expiredAt?: string | null, now = Date.now()): "expired" | "urgent" | "future" | null {
  if (!expiredAt) return null;
  const remaining = Date.parse(expiredAt) - now;
  if (!Number.isFinite(remaining)) return null;
  if (remaining <= 0) return "expired";
  return remaining <= 3 * 24 * 60 * 60 * 1000 ? "urgent" : "future";
}
