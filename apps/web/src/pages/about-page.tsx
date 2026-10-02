import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export default function AboutPage() {
  return (
    <div className="page-shell page-shell--public">
      <PageHeader title="Về nền tảng Olympic" description="Một nơi để tìm tài liệu theo môn học và học cùng bạn bè." />
      <PageSection title="Học tập trên nền tảng" description="Bắt đầu với những công cụ hiện có.">
        <div className="page-prose">
          <p>Tìm giáo trình và đề ôn tập trong kho tài liệu, theo dõi bảng tin học đường, hoặc vào phòng học chung để giữ nhịp tập trung. Công cụ GPA giúp bạn tính điểm và dự kiến mục tiêu học tập.</p>
          <div className="page-guidance__actions">
            <Button asChild><Link to={ROUTES.SUBJECTS}>Tìm môn học</Link></Button>
            <Button asChild variant="outline"><Link to={ROUTES.TOOLKIT}>Mở tiện ích học tập</Link></Button>
          </div>
        </div>
      </PageSection>
      <p className="page-note">Tính năng luyện tập, lịch sử làm bài và đăng ký kỳ thi đang được chuẩn bị.</p>
    </div>
  );
}
