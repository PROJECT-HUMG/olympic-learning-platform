import { ArrowRight, Brain, Sparkles } from "lucide-react";
import { STUDENT_TOOLS_MOCK } from "../data/toolkit-data";

export function ToolkitGrid() {
  const tools = STUDENT_TOOLS_MOCK;

  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-6 shadow-xs space-y-5">
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Brain className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Toolkit Sinh Viên</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Bộ công cụ tiện ích hỗ trợ ôn luyện</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isComingSoon = tool.status === "coming_soon";

          return (
            <div 
              key={tool.id}
              className={`relative flex flex-col items-start justify-between rounded-xl border p-3.5 transition-all ${
                isComingSoon 
                  ? "border-border/40 bg-muted/20 opacity-80 cursor-not-allowed" 
                  : "border-border/80 bg-background hover:border-primary/40 hover:shadow-sm cursor-pointer"
              }`}
            >
              {isComingSoon && (
                <div className="absolute top-2 right-2">
                  <Sparkles className="size-3 text-muted-foreground/50" />
                </div>
              )}
              
              <div className={`flex size-8 items-center justify-center rounded-lg ${tool.bgColor} ${tool.color} mb-3`}>
                <Icon className="size-4" />
              </div>
              
              <div className="space-y-1 w-full">
                <h4 className="text-sm font-semibold text-foreground truncate">{tool.title}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 min-h-[30px] leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-3 w-full pt-3 border-t border-border/40 flex items-center justify-between">
                <span className={`text-[10px] font-medium ${isComingSoon ? "text-muted-foreground" : "text-primary"}`}>
                  {tool.actionLabel}
                </span>
                {!isComingSoon && <ArrowRight className="size-3 text-primary" />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
