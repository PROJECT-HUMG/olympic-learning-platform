export function publicProfilePath(id: string): string {
  return `/users/${encodeURIComponent(id)}`;
}

export function identityInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return "?";
  return [words[0], ...(words.length > 1 ? [words[words.length - 1]] : [])]
    .map(word => Array.from(word)[0]).join("").toLocaleUpperCase("vi");
}
