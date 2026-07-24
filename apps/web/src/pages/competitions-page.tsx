import { PublicPageHeader } from "@/components/ui/public-page-header";

export default function CompetitionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-10 backdrop-blur-md shadow-sm min-h-[60vh] flex flex-col gap-6">
        <PublicPageHeader title="Kỳ Thi Olympic" description="Danh sách các kỳ thi đang diễn ra và sắp mở đăng ký." />
        
        {/* Content goes here */}
        <div className="flex-1 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-muted-foreground">
          Đang cập nhật danh sách kỳ thi...
        </div>
      </div>
    </div>
  );
}
