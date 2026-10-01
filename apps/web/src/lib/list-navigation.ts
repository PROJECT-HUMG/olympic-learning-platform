/** URL pages are one-based; malformed values must never reach API pagination. */
export function getPageNumber(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 2_147_483_647 ? page : 1;
}

/** Retain list filters without accepting external or unrelated return targets. */
export function getListReturnPath(from: unknown, listPath: string): string {
  if (typeof from !== "string" || !from.startsWith("/")) return listPath;
  try {
    const origin = "https://local.invalid";
    const url = new URL(from, origin);
    return url.origin === origin && url.pathname === listPath
      ? url.pathname + url.search + url.hash
      : listPath;
  } catch {
    return listPath;
  }
}
