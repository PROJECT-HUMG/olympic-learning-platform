import * as React from "react"
import { cn } from "@/lib/utils"

export interface MasonryProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * A Masonry layout component (Pinterest-style).
 * 
 * Uses native CSS grid `grid-template-rows: masonry` where supported,
 * and falls back to CSS Multi-column layout (`column-count`) for older browsers.
 * 
 * NOTE: Items in the fallback will flow top-to-bottom down each column,
 * not strictly left-to-right across rows.
 */
export const Masonry = React.forwardRef<HTMLDivElement, MasonryProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("masonry-grid", className)} 
        {...props}
      >
        {children}
      </div>
    )
  }
)
Masonry.displayName = "Masonry"
