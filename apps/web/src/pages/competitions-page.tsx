import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Kỳ thi Olympic</h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        Lịch thi và đăng ký dự thi chưa được mở trên nền tảng. Hãy theo dõi
        thông báo đã công bố trong bảng tin.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={ROUTES.NEWS}>Xem bảng tin</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`${ROUTES.TOOLKIT}?tool=rooms`}>Phòng học chung</Link>
        </Button>
      </div>
    </div>
  );
}
