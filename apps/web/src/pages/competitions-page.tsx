import { PageHeader } from "@/components/ui/page-header";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function Page() {
  return (
    <div className="page-shell page-shell--public">
      <PageHeader title="Kỳ thi Olympic" description="Lịch thi và đăng ký dự thi chưa được mở trên nền tảng. Hãy theo dõi thông báo đã công bố trong bảng tin." />
      <div className="page-guidance__actions">
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
