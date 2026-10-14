import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Presentation only: the feature decides state precedence and owns recovery. */
export function ListFeedback({ icon, title, children, actions, tone = "empty" }: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  tone?: "empty" | "error";
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className="flex min-w-0 flex-col items-start rounded-lg border border-border bg-card p-4 sm:p-5">
      <div aria-hidden="true" className={cn(
        "mb-3 flex size-8 shrink-0 items-center justify-center rounded-md [&_svg]:size-4",
        tone === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}>{icon}</div>
      <h3 className="max-w-full text-base font-semibold text-foreground [overflow-wrap:anywhere]">{title}</h3>
      <div className="mt-2 max-w-prose text-sm text-muted-foreground leading-relaxed [overflow-wrap:anywhere]">{children}</div>
      {actions && <div className="mt-4 flex max-w-full flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
