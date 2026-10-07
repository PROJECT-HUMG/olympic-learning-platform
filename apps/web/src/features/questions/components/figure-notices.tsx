import { Button } from "@/components/ui/button";
import type { PrivateFigureState } from "./figure-resolution.ts";

export function FigureNotices({ figures, onRetry }: {
  figures: readonly PrivateFigureState[];
  onRetry?: (assetId: string) => void;
}) {
  const pending = figures.filter((figure) => figure.phase !== "ready");
  if (!pending.length) return null;
  return (
    <div className="space-y-2">
      {pending.map((figure) => (
        <p key={figure.assetId} className="flex flex-wrap items-center gap-2 text-sm" role={figure.phase === "error" ? "alert" : "status"}>
          <span>{figure.message}</span>
          {figure.phase === "error" && onRetry && (
            <Button type="button" variant="outline" onClick={() => onRetry(figure.assetId)}>Thử lại</Button>
          )}
        </p>
      ))}
    </div>
  );
}
