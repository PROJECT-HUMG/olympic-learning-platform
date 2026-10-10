import { Button } from "./button";
import { InlineRetryFeedback } from "./inline-retry-feedback";

/** Option-loading presentation only; callers own queries, values and disabled gates. */
export function OptionQueryFeedback({ label, pending, error, retrying, onRetry }: {
  label: string;
  pending: boolean;
  error: boolean;
  retrying: boolean;
  onRetry: () => void;
}) {
  if (pending) return <p role="status" className="text-sm text-muted-foreground">Đang tải {label}…</p>;
  if (!error) return null;
  return <InlineRetryFeedback message={`Chưa tải được ${label}. Lựa chọn đang có được giữ lại.`}
    actions={<Button type="button" variant="outline" loading={retrying} onClick={onRetry}>Thử lại {label}</Button>} />;
}
