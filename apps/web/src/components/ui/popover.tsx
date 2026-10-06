import type { ComponentProps } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return <PopoverPrimitive.Portal><PopoverPrimitive.Content data-slot="popover-content" align={align} sideOffset={sideOffset}
    className={cn("z-50 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-150 motion-reduce:animate-none motion-reduce:transition-none", className)} {...props} /></PopoverPrimitive.Portal>;
}
