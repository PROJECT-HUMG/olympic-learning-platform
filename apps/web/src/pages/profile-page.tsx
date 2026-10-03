import { Link } from "react-router-dom";
import { useUserProfile } from "@/features/user/hooks/use-user-profile";
import { AvatarUploadCard } from "@/features/user/components/avatar-upload-card";
import { ProfileForm } from "@/features/user/components/profile-form";
import { AccountSecurityCard } from "@/features/user/components/account-security-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { getDashboardRoute, ROUTES } from "@/router/route-constants";
import "@/features/user/components/profile.css";

export default function ProfilePage() {
  const { data: user, isLoading, isError, isFetching, refetch } = useUserProfile();
  const staff = user?.role === "ADMIN" || user?.role === "LECTURER";
  return <div className="page-shell profile-page">
    <PageHeader title="Hồ sơ cá nhân" description="Thông tin của bạn, cách bạn xuất hiện và bảo mật tài khoản."
      actions={user && <Button asChild variant="outline"><Link to={getDashboardRoute(user.role)}>{staff ? "Về không gian quản lý" : "Về góc học tập"}</Link></Button>} />
    {isLoading ? <div className="profile-layout" role="status" aria-label="Đang tải hồ sơ">
      <Skeleton className="h-96 rounded-2xl" />
      <div className="profile-layout__main"><Skeleton className="h-80 rounded-2xl" /><Skeleton className="h-52 rounded-2xl" /></div>
    </div> : isError || !user ? <PageSection title="Chưa tải được hồ sơ" description="Kiểm tra kết nối và thử lấy lại thông tin tài khoản.">
      <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Thử lại</Button>
    </PageSection> : <div className="profile-layout">
      <AvatarUploadCard user={user} />
      <div className="profile-layout__main"><ProfileForm user={user} /><AccountSecurityCard user={user} />{user.role === "STUDENT" && <PageSection title="Thành tích học tập" description="Gửi minh chứng, theo dõi lịch sử xét duyệt và chọn tham gia bảng xếp hạng."><Button asChild variant="outline"><Link to={ROUTES.MY_ACHIEVEMENTS}>Quản lý thành tích của tôi</Link></Button></PageSection>}</div>
    </div>}
  </div>;
}
