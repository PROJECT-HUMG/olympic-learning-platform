import { PageHeader } from "@/components/ui/page-header";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function Page() {
  return (
    <div className="page-shell">
      <PageHeader title="Luyện tập" description="Phần làm bài và chấm điểm đang được chuẩn bị. Bạn có thể ôn tài liệu hoặc vào phòng học chung ngay hôm nay." />
      <section className="page-guidance" aria-label="Bạn có thể tiếp tục"><p>Tiếp tục học với các nội dung hiện có.</p><div className="page-guidance__actions">
        <Button asChild>
          <Link to={ROUTES.DOCUMENTS}>Mở kho tài liệu</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`${ROUTES.TOOLKIT}?tool=rooms`}>Phòng học chung</Link>
        </Button>
      </div></section>
    </div>
  );
}
