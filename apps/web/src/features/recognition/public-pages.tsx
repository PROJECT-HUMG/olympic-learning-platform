import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { getListReturnPath, getPageNumber } from "@/lib/list-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { recognitionService as service } from "./service";
import { CATEGORIES, AWARDS } from "./scoring";
import { Field, HonorImage, Pager, Participants, QueryFeedback, ScoringRules, YearField } from "./components";
import type { Achievement } from "./types";
import "./recognition.css";

function useListFilters() {
  const [params, setParams] = useSearchParams();
  const page = getPageNumber(params.get("page")) - 1;
  const yearText = params.get("year") ?? "";
  const yearNumber = Number(yearText);
  const year = /^\d{4}$/.test(yearText) && yearNumber >= 1900 && yearNumber <= new Date().getFullYear() ? yearNumber : undefined;
  const change = (key: string, value: string) => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); if (key !== "page") next.delete("page"); return next; });
  return { params, page, year, yearText: year ? String(year) : "", change };
}
export function HonorsPage() {
  const filters = useListFilters();
  const location = useLocation();
  const from = getListReturnPath(location.pathname + location.search + location.hash, "/honors");
  const subject = filters.params.get("subject") ?? "";
  const [search, setSearch] = useState(subject);
  useEffect(() => setSearch(subject), [subject]);
  const honors = useQuery({ queryKey: ["recognition", "honors", filters.page, filters.year, subject], queryFn: () => service.honors({ page: filters.page, size: 12, year: filters.year, subject: subject || undefined }) });
  return <div className="page-shell page-shell--public recognition-page"><PageHeader title="Vinh danh" description="Những gương mặt, dấu mốc và kỷ niệm của Olympic HUMG." actions={<Button asChild variant="outline"><Link to="/rankings">Xếp hạng thành tích</Link></Button>} />
    <form className="recognition-filters" onSubmit={e => { e.preventDefault(); filters.change("subject", search.trim()); }}><YearField value={filters.yearText} onChange={value => filters.change("year", value)} /><Field title="Môn học hoặc lĩnh vực">{id => <Input id={id} value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm lĩnh vực" />}</Field><Button type="submit" variant="outline">Tìm</Button></form>
    <QueryFeedback pending={honors.isPending} error={honors.isError} empty={!honors.data?.content.length} retry={() => void honors.refetch()}><div className="recognition-gallery">{honors.data?.content.map(honor => <article key={honor.id} className="recognition-memory">
      {honor.photos[0] && <div className="recognition-memory__photo"><HonorImage honor={honor} photoId={honor.photos[0].id} alt={`Kỷ niệm ${honor.title}`} /></div>}
      <p className="recognition-hint">{honor.subject} · {honor.year}</p><h2><Link to={`/honors/${honor.id}`} state={{ from }}>{honor.title}</Link></h2><Participants items={honor.participants} />
    </article>)}</div><Pager page={filters.page} value={honors.data} onChange={page => filters.change("page", String(page + 1))} /></QueryFeedback>
  </div>;
}
export function HonorDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const from = getListReturnPath(location.state?.from, "/honors");
  const honor = useQuery({ queryKey: ["recognition", "honor", id], queryFn: () => service.honor(id) });
  const [selected, setSelected] = useState<string | null>(null);
  const photo = honor.data?.photos.find(item => item.id === selected);
  return <div className="page-shell page-shell--public recognition-page"><div className="recognition-links"><Link to={from}>Về vinh danh</Link><Link to="/rankings">Xếp hạng</Link></div><QueryFeedback pending={honor.isPending} error={honor.isError} retry={() => void honor.refetch()}>{honor.data && <>
    <PageHeader title={honor.data.title} description={`${honor.data.subject} · ${honor.data.year}`} />
    {honor.data.description && <p>{honor.data.description}</p>}
    <PageSection title={`Những gương mặt được vinh danh (${honor.data.participants.length})`}><Participants items={honor.data.participants} /></PageSection>
    <PageSection title={`Album kỷ niệm (${honor.data.photos.length} ảnh)`}><div className="recognition-photo-grid">{honor.data.photos.map((item, index) => <button key={item.id} className="recognition-photo" onClick={() => setSelected(item.id)} aria-label={`Mở ảnh ${index + 1}: ${item.originalName}`}><HonorImage honor={honor.data!} photoId={item.id} alt={`${honor.data!.title}, ảnh ${index + 1}`} interactive={false} /></button>)}</div>{!honor.data.photos.length && <p className="recognition-hint">Chưa có ảnh kỷ niệm.</p>}</PageSection>
    <Dialog open={!!photo} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="recognition-review-dialog"><DialogTitle>{honor.data.title}</DialogTitle><DialogDescription>{photo?.originalName}</DialogDescription>{photo && <div className="recognition-photo recognition-photo--full"><HonorImage honor={honor.data} photoId={photo.id} alt={photo.originalName} /></div>}</DialogContent></Dialog>
  </>}</QueryFeedback></div>;
}
export function RankingsPage() {
  const filters = useListFilters();
  const location = useLocation();
  const from = getListReturnPath(location.pathname + location.search + location.hash, "/rankings");
  const ranking = useQuery({ queryKey: ["recognition", "rankings", filters.year, filters.page], queryFn: () => service.rankings({ year: filters.year, page: filters.page, size: 20 }) });
  return <div className="page-shell page-shell--public recognition-page"><PageHeader title="Xếp hạng thành tích" description="Ghi nhận thành tích đã được duyệt của các thành viên chọn tham gia bảng xếp hạng." actions={<Button asChild variant="outline"><Link to="/honors">Xem vinh danh</Link></Button>} />
    <div className="recognition-filters"><YearField value={filters.yearText} allTime onChange={value => filters.change("year", value)} /></div>
    <QueryFeedback pending={ranking.isPending} error={ranking.isError} empty={!ranking.data?.content.length} retry={() => void ranking.refetch()}><ol className="recognition-ranking">{ranking.data?.content.map(person => <li key={person.userId}><span className="recognition-rank" aria-label={`Hạng ${person.rank}`}>{person.rank}</span><div><Link to={`/achievements/${person.userId}`} state={{ from }}>{person.fullName}</Link><small>{person.approvedCount} thành tích đã duyệt</small></div><strong>{person.totalPoints}<small>điểm</small></strong></li>)}</ol><Pager page={filters.page} value={ranking.data} onChange={page => filters.change("page", String(page + 1))} /></QueryFeedback>
    <ScoringRules />
  </div>;
}
export function PublicAchievementList({ records }: { records: Achievement[] }) {
  return <div>{records.map(record => <article className="recognition-record" key={record.id}><div className="recognition-record__heading"><h3>{record.title}</h3><strong>{record.totalPoints} điểm</strong></div><p className="recognition-hint">{CATEGORIES[record.category]} · {AWARDS[record.award]} · {new Date(record.achievedDate + "T00:00:00").toLocaleDateString("vi-VN")}</p>{record.description && <p>{record.description}</p>}{record.includeParticipation && <p className="recognition-hint">Gồm {record.awardPoints} điểm giải và {record.participationPoints} điểm tham gia.</p>}</article>)}</div>;
}
export function AchievementProfilePage() {
  const { userId = "" } = useParams();
  const location = useLocation();
  const from = getListReturnPath(location.state?.from, "/rankings");
  const profile = useQuery({ queryKey: ["recognition", "profile", userId], queryFn: () => service.publicProfile(userId) });
  return <div className="page-shell page-shell--public recognition-page"><div className="recognition-links"><Link to={from}>Về bảng xếp hạng</Link><Link to="/honors">Vinh danh</Link></div><QueryFeedback pending={profile.isPending} error={profile.isError} retry={() => void profile.refetch()}>{profile.data && <><PageHeader title={`Thành tích của ${profile.data.fullName}`} description="Các thành tích đã duyệt và được chủ tài khoản chọn công khai." /><PageSection title="Điểm từ thành tích công khai"><strong>{profile.data.publicPoints} điểm</strong><p className="recognition-hint">Điểm trên bảng xếp hạng có thể gồm cả thành tích riêng tư đã duyệt.</p></PageSection><PageSection title="Lịch sử thành tích công khai">{profile.data.achievements.length ? <PublicAchievementList records={profile.data.achievements} /> : <p className="recognition-hint">Chưa có thành tích công khai.</p>}</PageSection></>}</QueryFeedback></div>;
}
