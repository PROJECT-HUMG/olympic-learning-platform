import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function NativeSelect({ className, controlSize = "default", ...props }: ComponentProps<"select"> & {
  controlSize?: "default" | "sm";
}) {
  return (
    <select
      data-slot="native-select"
      data-control-size={controlSize}
      className={cn(
        "w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        controlSize === "sm" ? "h-9" : "h-11",
        className,
      )}
      {...props}
    />
  );
}
