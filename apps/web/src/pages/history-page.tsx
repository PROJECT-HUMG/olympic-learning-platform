import { PageHeader } from "@/components/ui/page-header";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function Page() {
  return (
    <div className="page-shell">
      <PageHeader title="Lịch sử làm bài" description="Lịch sử sẽ xuất hiện khi tính năng làm bài và chấm điểm được mở. Hiện bạn có thể ôn tài liệu hoặc học cùng bạn bè." />
      <div className="page-guidance__actions">
        <Button asChild>
          <Link to={ROUTES.DOCUMENTS}>Mở kho tài liệu</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`${ROUTES.TOOLKIT}?tool=rooms`}>Phòng học chung</Link>
        </Button>
      </div>
    </div>
  );
}
