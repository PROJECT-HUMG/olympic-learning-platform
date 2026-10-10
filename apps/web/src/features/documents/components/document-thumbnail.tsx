import { useState } from "react";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import "./document-discovery.css";

/** Only consumes the server preview URL; never derives one from a download/private URL. */
export function DocumentThumbnail({ src, compact = false }: { src?: string | null; compact?: boolean }) {
  // A new URL remounts the state owner, including after query/identity revalidation.
  return <ThumbnailImage key={src ?? "unavailable"} src={src} compact={compact} />;
}

function ThumbnailImage({ src, compact }: { src?: string | null; compact: boolean }) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const unavailable = !src || state === "failed";
  return (
    <div className={`document-thumbnail ${compact ? "document-thumbnail--compact" : ""}`}
      aria-busy={!unavailable && state === "loading"}>
      {unavailable ? (
        <div className="document-thumbnail__fallback">
          <FileText aria-hidden="true" className="size-7 shrink-0 text-primary/60" />
          <span className={compact ? "sr-only" : "text-xs leading-4 text-muted-foreground"}>
            {src ? "Không tải được ảnh xem trước" : "Chưa có ảnh xem trước"}
          </span>
        </div>
      ) : <>
        {state === "loading" && <div className="document-thumbnail__loading">
          <Skeleton className="h-full w-full rounded-sm" />
          <span className="sr-only">Đang tải trang đầu…</span>
        </div>}
        <img src={src} alt="" width={600} height={800} loading="lazy" decoding="async"
          className={state === "ready" ? "document-thumbnail__image" : "document-thumbnail__image invisible"}
          onLoad={() => setState("ready")} onError={() => setState("failed")} />
        {state === "ready" && !compact && <span className="document-thumbnail__caption">Trang đầu</span>}
      </>}
    </div>
  );
}
