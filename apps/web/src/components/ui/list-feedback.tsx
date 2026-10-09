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
    <div role={tone === "error" ? "alert" : "status"} className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 px-4 py-12 text-center">
      <div aria-hidden="true" className={cn(
        "mb-5 flex size-20 shrink-0 items-center justify-center rounded-full ring-8 [&_svg]:size-10",
        tone === "error" ? "bg-destructive/5 text-destructive ring-destructive/5" : "bg-primary/5 text-primary/40 ring-primary/5",
      )}>{icon}</div>
      <h3 className="max-w-full text-xl font-semibold tracking-tight [overflow-wrap:anywhere]">{title}</h3>
      <div className="mt-2 max-w-md text-sm text-muted-foreground [overflow-wrap:anywhere]">{children}</div>
      {actions && <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
