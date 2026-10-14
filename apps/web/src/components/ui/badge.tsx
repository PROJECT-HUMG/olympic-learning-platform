import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/10 text-primary font-semibold hover:bg-primary/20",
        secondary:
          "border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive dark:text-red-400 hover:bg-destructive/20",
        outline: "border-border text-foreground hover:bg-accent hover:border-border",
        success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400 hover:bg-amber-500/20",
        info: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20",
        purple: "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20",
        gradient: "border-transparent bg-gradient-to-r from-primary to-accent-indigo text-white shadow-2xs font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
