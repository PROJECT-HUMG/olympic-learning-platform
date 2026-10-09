import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Input presentation only; its feature owns submission and URL state. */
export function SearchInput({ className, type = "search", ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type={type} className={cn("pl-9", className)} {...props} />
    </div>
  );
}
