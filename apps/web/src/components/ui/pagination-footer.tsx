import type { ReactNode } from "react";

/** Zero-based API range presentation only; pagination state/clamping belongs to the feature. */
export function PaginationFooter({ pageOffset, size, total, itemLabel, children }: {
  pageOffset: number; size: number; total: number; itemLabel: string; children: ReactNode;
}) {
  return <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
    <p className="text-sm text-muted-foreground">
      Hiển thị <span className="font-medium">{pageOffset * size + 1}</span>{" "}
      đến <span className="font-medium">{Math.min((pageOffset + 1) * size, total)}</span>{" "}
      trong tổng số <span className="font-medium">{total}</span> {itemLabel}
    </p>
    <div className="overflow-x-auto max-w-full">{children}</div>
  </div>;
}
