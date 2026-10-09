import type { ReactNode } from "react";

/** Compact error presentation. Consumers own query precedence, retries and gates. */
export function RetryFeedback({ message, actions }: { message: string; actions: ReactNode }) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-border p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {actions}
    </div>
  );
}
