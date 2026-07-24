import { ArrowRight, Sparkles } from "lucide-react";
import { STUDENT_TOOLS_MOCK } from "../data/toolkit-data";
import { cn } from "@/lib/utils";

export function ToolkitGrid() {
  const tools = STUDENT_TOOLS_MOCK;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {tools.map((tool) => {
        const isComingSoon = tool.status === "coming_soon";

        return (
          <div 
            key={tool.id}
            className={cn(
              "relative flex flex-col items-start justify-between rounded-2xl border p-6 transition-all duration-300",
              isComingSoon 
                ? "border-border/40 bg-muted/20 opacity-80 cursor-not-allowed" 
                : "border-border/80 bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-1 cursor-pointer"
            )}
          >
            {isComingSoon && (
              <div className="absolute top-4 right-4">
                <Sparkles className="size-4 text-muted-foreground/50" />
              </div>
            )}
            

            
            <div className="space-y-1.5 w-full">
              <h4 className="text-base sm:text-lg font-bold text-foreground truncate">{tool.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="mt-5 w-full pt-4 border-t border-border/50 flex items-center justify-between">
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                isComingSoon ? "text-muted-foreground" : "text-primary"
              )}>
                {tool.actionLabel}
              </span>
              {!isComingSoon && <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
