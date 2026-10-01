import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 ">
      <h1 className="text-2xl font-semibold tracking-tight">Lịch sử làm bài</h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        Lịch sử sẽ xuất hiện khi tính năng làm bài và chấm điểm được mở. Hiện
        bạn có thể ôn tài liệu hoặc học cùng bạn bè.
      </p>
      <div className="flex flex-wrap gap-3">
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
