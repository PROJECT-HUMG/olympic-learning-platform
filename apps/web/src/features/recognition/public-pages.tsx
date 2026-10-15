import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { getListReturnPath, getPageNumber, replaceListParam } from "@/lib/list-navigation";
import { Button } from "@/components/ui/button";
import { useUrlListSearch } from "@/hooks/use-list-search";
import { SearchInput } from "@/components/ui/search-input";
import { PageHeader } from "@/components/ui/page-header";
import { PublicPageHeader } from "@/components/ui/public-page-header";
import { PageSection } from "@/components/ui/page-section";
import { HonorGallery } from "./honor-gallery";
import { recognitionService as service } from "./service";
import { HonorImage, Pager, Participants, QueryFeedback, ScoringRules, YearField } from "./components";
import type { PublicAchievement } from "./types";
import { RankingList } from "./ranking-presentation";
import { EditorialHonorLabel, PublicAchievementMilestones } from "./achievement-presentation";
import { UserAvatar } from "@/features/user/components/user-avatar";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { publicProfileReturnTarget } from "@/features/user/lib/public-identity";
import { parseApiError } from "@/lib/api-error";
import { usePublicProfile } from "@/features/user/hooks/use-public-profile";
import "@/features/user/components/public-profile.css";
import "./recognition.css";
import "./individual-recognition.css";

function useListFilters() {
  const [params, setParams] = useSearchParams();
  const page = getPageNumber(params.get("page")) - 1;
  const yearText = params.get("year") ?? "";
  const yearNumber = Number(yearText);
  const year = /^\d{4}$/.test(yearText) && yearNumber >= 1900 && yearNumber <= new Date().getFullYear() ? yearNumber : undefined;
  const change = (key: string, value: string) => setParams(previous => replaceListParam(previous, key, value));
  return { params, setParams, page, year, yearText: year ? String(year) : "", change };
}
function RecognitionNavigation() {
  const location = useLocation();
  return <nav className="page-local-nav" aria-label="Vinh danh và thành tích">
    {[{ href: "/honors", label: "Vinh danh" }, { href: "/rankings", label: "Xếp hạng" }].map(item => {
      const selected = location.pathname === item.href;
      return <Button key={item.href} asChild variant={selected ? "secondary" : "ghost"}>
        <Link to={selected ? location.pathname + location.search + location.hash : item.href} aria-current={selected ? "page" : undefined}>{item.label}</Link>
      </Button>;
    })}
  </nav>;
}
export function HonorsPage() {
  const filters = useListFilters();
  const location = useLocation();
  const from = getListReturnPath(location.pathname + location.search + location.hash, "/honors");
  const subject = filters.params.get("subject") ?? "";
  const search = useUrlListSearch(subject, value => filters.setParams(previous => replaceListParam(previous, "subject", value), { replace: true }));
  const honors = useQuery({ meta: { publicRead: true }, queryKey: ["recognition", "honors", filters.page, filters.year, subject], queryFn: () => service.honors({ page: filters.page, size: 12, year: filters.year, subject: subject || undefined }) });
  return <div className="page-shell page-shell--public recognition-page recognition-page--honors">
    <PublicPageHeader
      breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Vinh danh" }]}
      title="Vinh danh"
      description="Những gương mặt, dấu mốc và kỷ niệm của Olympic HUMG."
      actions={<RecognitionNavigation />}
    />
    <div className="recognition-filters filter-panel" role="search" aria-label="Lọc vinh danh">
      <SearchInput {...search.input} aria-label="Môn học hoặc lĩnh vực" placeholder="Tìm môn học hoặc lĩnh vực…" />
      <YearField hideLabel value={filters.yearText} onChange={value => filters.change("year", value)} />
      {(subject || filters.year || search.pending) && <Button variant="ghost" onClick={() => { search.resetDraft(); filters.setParams(previous => { const next = new URLSearchParams(previous); for (const key of ["subject", "year", "page"]) next.delete(key); return next; }); }}>Xóa bộ lọc</Button>}
    </div>
    <p className="list-search-status" role="status">{search.pending || honors.isFetching ? "Đang cập nhật album…" : honors.isError ? "" : `${honors.data?.totalElements ?? 0} album`}</p>
    <QueryFeedback pending={honors.isPending} error={honors.isError} empty={!honors.data?.content.length} retrying={honors.isFetching} retry={() => void honors.refetch()}><div className="recognition-gallery">{honors.data?.content.map(honor => <article key={honor.id} className="recognition-memory content-card">
      <div className="recognition-memory__cover">
        {honor.photos[0] ? <div className="recognition-memory__photo"><HonorImage honor={honor} photoId={honor.photos[0].id} alt={`Kỷ niệm ${honor.title}`} /></div> : <div className="recognition-memory__photo recognition-memory__no-photo">Album chưa có ảnh</div>}
      </div>
      <div className="recognition-memory__body">
        <header className="recognition-memory__heading"><EditorialHonorLabel /><h2><Link to={`/honors/${honor.id}`} state={{ from }}>{honor.title}</Link></h2><p className="recognition-memory__context"><span>{honor.year}</span>{honor.subject && <span>{honor.subject}</span>}</p></header>
        <Participants items={honor.participants.slice(0, 3)} />
        <footer className="recognition-memory__footer">
          {honor.participants.length > 3 && <p className="recognition-hint">Còn {honor.participants.length - 3} gương mặt trong album.</p>}
          <Button asChild variant="outline" className="recognition-memory__action"><Link to={`/honors/${honor.id}`} state={{ from }}>Xem album{honor.photos.length ? ` · ${honor.photos.length} ảnh` : ""}</Link></Button>
        </footer>
      </div>
    </article>)}</div><Pager page={filters.page} value={honors.data} onChange={page => filters.change("page", String(page + 1))} /></QueryFeedback>
  </div>;
}
export function HonorDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const from = getListReturnPath(location.state?.from, "/honors");
  const honor = useQuery({ meta: { publicRead: true }, queryKey: ["recognition", "honor", id], queryFn: () => service.honor(id) });
  return <div className="page-shell page-shell--public recognition-page"><nav className="recognition-links" aria-label="Điều hướng vinh danh"><Button asChild variant="outline"><Link to={from}>Về vinh danh</Link></Button><Button asChild variant="outline"><Link to="/rankings">Xếp hạng</Link></Button></nav><QueryFeedback pending={honor.isPending} error={honor.isError} retrying={honor.isFetching} retry={() => void honor.refetch()}>{honor.data && <>
    <EditorialHonorLabel /><p className="recognition-hint">Kỷ niệm do ban quản trị biên tập; không phải hồ sơ thành tích đã duyệt và không cộng điểm.</p>
    <PageHeader title={honor.data.title} description={`${honor.data.subject} · ${honor.data.year}`} />
    {honor.data.description && <p>{honor.data.description}</p>}
    <PageSection title={`Những gương mặt được vinh danh (${honor.data.participants.length})`}><Participants items={honor.data.participants} /></PageSection>
    <PageSection title={`Album kỷ niệm (${honor.data.photos.length} ảnh)`}><HonorGallery key={`${honor.data.id}:${honor.data.version}`} honor={honor.data} /></PageSection>
  </>}</QueryFeedback></div>;
}
export function RankingsPage() {
  const filters = useListFilters();
  const location = useLocation();
  const from = getListReturnPath(location.pathname + location.search + location.hash, "/rankings");
  const ranking = useQuery({ meta: { publicRead: true }, queryKey: ["recognition", "rankings", filters.year, filters.page], queryFn: () => service.rankings({ year: filters.year, page: filters.page, size: 20 }) });
  return <div className="page-shell page-shell--public recognition-page recognition-page--rankings">
    <PublicPageHeader
      breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Bảng xếp hạng" }]}
      title="Xếp hạng thành tích"
      description="Thành tích đã duyệt của thành viên chọn tham gia xếp hạng."
      actions={<RecognitionNavigation />}
    />
    <div className="ranking-toolbar">
      <YearField value={filters.yearText} allTime onChange={value => filters.change("year", value)} />
      <p className="ranking-toolbar__context" role="status">{ranking.isFetching ? "Đang cập nhật xếp hạng…" : ranking.isError ? "" : `${ranking.data?.totalElements ?? 0} thành viên · ${filters.year ? `Năm ${filters.year}` : "Tất cả thời gian"}`}</p>
    </div>
    <QueryFeedback pending={ranking.isPending} error={ranking.isError} empty={!ranking.data?.content.length} retrying={ranking.isFetching} retry={() => void ranking.refetch()}><RankingList records={ranking.data?.content ?? []} year={filters.year} from={from} /><Pager page={filters.page} value={ranking.data} onChange={page => filters.change("page", String(page + 1))} /></QueryFeedback>
    <p className="recognition-hint">Điểm nền tảng không phải đánh giá học thuật chính thức. Tổng xếp hạng có thể gồm thành tích riêng tư; nhãn và chi tiết công khai chỉ có trên hồ sơ theo lựa chọn của chủ tài khoản.</p>
    <ScoringRules />
  </div>;
}
export function PublicAchievementList({ records }: { records: PublicAchievement[] }) {
  return <PublicAchievementMilestones records={records} />;
}
export function AchievementProfilePage() {
  const { userId = "" } = useParams();
  const location = useLocation();
  const back = publicProfileReturnTarget(location.state?.from);
  const profile = usePublicProfile(userId);
  const current = useCurrentUser();
  // Revalidation/error clears public data exactly as before; never seed from the private record list.
  const data = !profile.isError && !profile.isFetching ? profile.data : undefined;
  const ownStudentProfile = !current.isError && !current.isFetching && current.data?.id === userId && current.data.role === "STUDENT";
  const unavailable = profile.isError && parseApiError(profile.error).status === 404;
  return <div className="page-shell page-shell--public recognition-page recognition-person">
    <nav className="recognition-links" aria-label="Điều hướng hồ sơ">
      <Button asChild variant="outline"><Link to={back.to}>{back.label}</Link></Button>
      {ownStudentProfile && <Button asChild variant="secondary"><Link to="/profile/achievements">Quản lý thành tích</Link></Button>}
    </nav>
    {!data && <PageHeader title="Hồ sơ thành viên" />}
    <QueryFeedback pending={profile.isPending || profile.isFetching} error={profile.isError} retrying={profile.isFetching} retry={() => void profile.refetch()}
      pendingText="Đang tải hồ sơ…" errorText={unavailable ? "Không tìm thấy hồ sơ hoặc tài khoản hiện không khả dụng." : "Chưa tải được hồ sơ. Vui lòng thử lại."}>
      {data && <div className="public-profile-layout">
        <header className="public-profile-identity">
          <div className="recognition-person__identity"><UserAvatar user={data} className="user-avatar--profile" /><div><p className="recognition-person__eyebrow">Hồ sơ thành viên</p><h1>{data.fullName}</h1><p className="recognition-hint">@{data.username}</p></div></div>
          <dl className="recognition-person__totals"><div><dt className="sr-only">Số thành tích</dt><dd>Có <strong>{data.achievements.length}</strong> thành tích</dd></div><div><dt className="sr-only">Tổng điểm thành tích</dt><dd>Tổng <strong>{data.publicPoints}</strong> điểm</dd></div></dl>
        </header>
        <div className="public-profile-main">
          <div className="recognition-person__section-heading"><h2>Thành tích và giải thưởng</h2><p className="recognition-hint">Các kết quả đã được duyệt, mới nhất trước.</p></div>
          {data.achievements.length ? <PublicAchievementList records={data.achievements} /> : <div className="recognition-person__empty" role="status"><h3>Chưa có thành tích để hiển thị</h3><p>Khi có thành tích được duyệt và cho phép hiển thị, bạn sẽ thấy tại đây.</p></div>}
          <footer className="recognition-person__footnote"><p>Tổng điểm chỉ tính các thành tích hiển thị trong hồ sơ.</p>
            {data.rankingOptIn && <Button asChild variant="outline"><Link to="/rankings">Xem bảng xếp hạng</Link></Button>}
          </footer>
        </div>
      </div>}
    </QueryFeedback>
  </div>;
}
