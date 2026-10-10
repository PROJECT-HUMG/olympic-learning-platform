/** Expiry is a presentation state of a published post, never of a draft/archive. */
export function postDisplayStatus(post: { status: string; expiredAt: string | null }, now = Date.now()): string {
  return post.status === "PUBLISHED" && post.expiredAt && Date.parse(post.expiredAt) <= now ? "EXPIRED" : post.status;
}

/** Uses only the existing management API's status and expiry predicates. */
export function postManagementStatusQuery(value: string | null): { status?: string; expired?: boolean } {
  if (value === "EXPIRED") return { status: "PUBLISHED", expired: true };
  if (value === "PUBLISHED") return { status: "PUBLISHED", expired: false };
  if (value === "DRAFT" || value === "ARCHIVED") return { status: value };
  return {};
}
