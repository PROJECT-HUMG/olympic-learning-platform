/** Presentation capability only; the API remains authoritative for every mutation. */
export function canCreateDocument(role?: string, permissions: readonly string[] = []) {
  return role === "ADMIN" || role === "LECTURER" || (role === "STUDENT" && permissions.includes("DOCUMENT_UPLOAD"));
}
