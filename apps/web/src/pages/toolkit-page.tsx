import { ToolkitGrid } from "@/features/toolkit/components/toolkit-grid";

import { PublicPageHeader } from "@/components/ui/public-page-header";

export default function ToolkitPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-10 backdrop-blur-md shadow-sm min-h-[60vh] flex flex-col gap-8">
        <PublicPageHeader 
          title="Toolkit Olympic" 
          description="Bộ công cụ tối ưu hóa quá trình ôn luyện và học tập dành cho sinh viên." 
        />
        
        <div className="max-w-4xl">
          <ToolkitGrid />
        </div>
      </div>
    </div>
  );
}
