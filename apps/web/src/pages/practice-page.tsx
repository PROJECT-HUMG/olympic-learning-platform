import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 ">
      <h1 className="text-2xl font-semibold tracking-tight">Luyện tập</h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        Phần làm bài và chấm điểm đang được chuẩn bị. Bạn có thể ôn tài liệu
        hoặc vào phòng học chung ngay hôm nay.
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
