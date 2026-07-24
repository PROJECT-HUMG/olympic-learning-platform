import { PublicPageHeader } from "@/components/ui/public-page-header";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-10 backdrop-blur-md shadow-sm min-h-[60vh] flex flex-col gap-6">
        <PublicPageHeader title="Kho Tài Liệu" description="Tài liệu, giáo trình và đề thi các năm trước." />
        
        {/* Content goes here */}
        <div className="flex-1 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-muted-foreground">
          Đang cập nhật danh mục tài liệu...
        </div>
      </div>
    </div>
  );
}
