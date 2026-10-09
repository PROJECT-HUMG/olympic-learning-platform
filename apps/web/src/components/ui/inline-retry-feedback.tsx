import type { ReactNode } from "react";

/** Cached-refresh warning presentation; callers retain identity/cache gates and retry state. */
export function InlineRetryFeedback({ message, actions }: { message: string; actions: ReactNode }) {
  return <div role="alert" className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
    <span>{message}</span>{actions}
  </div>;
}
