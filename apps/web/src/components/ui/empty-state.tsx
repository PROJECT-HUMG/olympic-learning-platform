import type { ReactNode } from "react";

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center px-4 py-12 border border-dashed border-border/60 rounded-2xl bg-card/30 text-center">
      <div aria-hidden="true" className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-5 ring-8 ring-primary/5 [&_svg]:size-10 [&_svg]:text-primary/40">{icon}</div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mt-2">{children}</p>
    </div>
  );
}
