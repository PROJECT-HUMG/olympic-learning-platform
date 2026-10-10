import type { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-error.ts";

export const QUERY_KEY_CURRENT_USER = ["auth", "currentUser"] as const;

/** Notify mounted account observers as well as removing data from the old session. */
export function expireAuthSession(client: QueryClient, clearAuth: () => void) {
  clearAuth();
  void client.cancelQueries({ predicate: query => query.meta?.publicRead !== true });
  const expired = new ApiError({ status: 401, messageKey: "error.auth.refreshExpired" });
  for (const query of client.getQueryCache().getAll()) {
    // Only explicitly public, minimal DTO reads can survive an anonymous session expiry.
    if (query.meta?.publicRead === true) continue;
    if (query.queryKey[0] === "auth" && query.queryKey[1] === "currentUser") continue;
    if (query.getObserversCount()) {
      // Removing an observed query disconnects its observer and can leave loading stuck.
      // Clear its data in place and let the screen show expiry until navigation/retry.
      query.setState({ data: undefined, dataUpdatedAt: 0, error: expired,
        errorUpdatedAt: Date.now(), status: "error", fetchStatus: "idle", isInvalidated: true });
    } else client.removeQueries({ queryKey: query.queryKey, exact: true });
  }
  client.setQueryData(QUERY_KEY_CURRENT_USER, null);
}
