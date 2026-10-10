import "./floating-controls.css";
import type { ComponentProps } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return <PopoverPrimitive.Portal><PopoverPrimitive.Content data-slot="popover-content" align={align} sideOffset={sideOffset}
    className={cn("floating-content origin-(--radix-popover-content-transform-origin) z-50 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none", className)} {...props} /></PopoverPrimitive.Portal>;
}
