/** Existing POST image policy; the storage API remains the authoritative validator. */
export function validatePostImage(file: Pick<File, "type" | "size">): "type" | "size" | null {
  if (!file.type.startsWith("image/")) return "type";
  if (file.size > 5 * 1024 * 1024) return "size";
  return null;
}
