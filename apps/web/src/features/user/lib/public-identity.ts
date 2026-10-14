export function publicProfilePath(id: string): string {
  return `/users/${encodeURIComponent(id)}`;
}

export function identityInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return "?";
  return [words[0], ...(words.length > 1 ? [words[words.length - 1]] : [])]
    .map(word => Array.from(word)[0]).join("").toLocaleUpperCase("vi");
}

/** Return only to recognized profile entry points; never accept an external/privileged target. */
export function publicProfileReturnTarget(from: unknown): { to: string; label: string } {
  const fallback = { to: "/rankings", label: "Xếp hạng thành tích" };
  if (typeof from !== "string" || !from.startsWith("/")) return fallback;
  try {
    const origin = "https://local.invalid";
    const url = new URL(from, origin);
    if (url.origin !== origin) return fallback;
    const entry = [
      { pattern: /^\/rankings$/, label: "Về xếp hạng" },
      { pattern: /^\/honors$/, label: "Về vinh danh" },
      { pattern: /^\/honors\/[^/]+$/, label: "Về album vinh danh" },
      { pattern: /^\/news(?:\/[^/]+)?$/, label: "Về bảng tin" },
      { pattern: /^\/documents(?:\/[^/]+)?$/, label: "Về tài liệu" },
      { pattern: /^\/profile\/achievements$/, label: "Về thành tích của tôi" },
    ].find(item => item.pattern.test(url.pathname));
    return entry ? { to: url.pathname + url.search + url.hash, label: entry.label } : fallback;
  } catch {
    return fallback;
  }
}
