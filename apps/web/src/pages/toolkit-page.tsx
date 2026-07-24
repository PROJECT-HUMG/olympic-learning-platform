import { ToolkitGrid } from "@/features/toolkit/components/toolkit-grid";
import { Brain } from "lucide-react";

export default function ToolkitPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
          <Brain className="size-3.5" />
          <span>Công cụ & Tiện ích</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Toolkit <span className="text-primary">Olympic</span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Bộ công cụ tối ưu hóa quá trình ôn luyện và học tập dành cho sinh viên.
        </p>
      </section>

      <div className="max-w-4xl mx-auto">
        <ToolkitGrid />
      </div>
    </div>
  );
}
