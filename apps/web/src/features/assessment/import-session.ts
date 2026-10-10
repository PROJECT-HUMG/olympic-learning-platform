import { hasUuidFormat } from "../../lib/uuid.ts";

export function importJobId(value: string | null): string | undefined {
  return value && hasUuidFormat(value) ? value.toLowerCase() : undefined;
}

/** Denials/expiry remove cached private content; transient errors retain only local edits. */
export function importAccessDenied(status: number): boolean {
  return [401, 403, 404, 410].includes(status);
}
