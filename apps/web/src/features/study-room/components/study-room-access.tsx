import { BookOpen, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export function StudyRoomAccess() {
  const location = useLocation();
  return (
    <div className="study-room-access">
      <BookOpen aria-hidden="true" />
      <h2>Có một chỗ học dành cho bạn.</h2>
      <p>Vào phòng cùng bạn bè, học theo một nhịp chung và góp một bài lofi vào danh sách nhạc.</p>
      <Button asChild>
        <Link to={ROUTES.LOGIN} state={{ from: location.pathname + location.search }}><LogIn aria-hidden="true" /> Đăng nhập để học cùng</Link>
      </Button>
    </div>
  );
}
