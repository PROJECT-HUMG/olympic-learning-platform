import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { ROUTES } from "@/router/route-constants";

export function DashboardWelcomeBanner() {
  const { data: user } = useCurrentUser();
  const staff = user?.role === "ADMIN" || user?.role === "LECTURER";
  const documentsPath = user?.role === "ADMIN" ? "/admin/documents" : "/lecturer/documents";
  return <PageHeader
    title="Tổng quan"
    description={staff ? "Theo dõi tài nguyên, bài viết và dữ liệu học tập Olympic." : "Tiếp tục học với kho tài liệu, phòng học chung và công cụ học tập."}
    actions={<Button asChild><Link to={staff ? documentsPath : ROUTES.DOCUMENTS}>{staff ? "Quản lý nội dung" : "Mở kho tài liệu"}</Link></Button>}
  />;
}
