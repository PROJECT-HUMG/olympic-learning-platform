import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, RefreshCw, Settings2, Users } from "lucide-react";
import { DailyAccountGate, DailyAccountWarning } from "@/features/daily/components/daily-account-gate";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { GroupList, GroupConsent, Retry } from "@/features/daily/groups/group-controls";
import { groupService } from "@/features/daily/groups/group.service";
import { groupId, groupAccessLost } from "@/features/daily/groups/group-contract";
import { parsePlatformDate, platformDate, platformDateKey } from "@/features/daily/lib/platform-calendar";
import { StudyAreaNav, StudyEmpty, StudyIdentity } from "@/features/daily/ui/study-notebook";
import { StudyDatePicker } from "@/features/daily/ui/study-date-picker";
import { GroupAvatarEditor, GroupAvatarImage } from "@/features/daily/groups/group-avatar";
import "@/features/daily/groups/groups.css";

export function DailyGroupsPage() {
  const { groupId: id } = useParams();
  if (id && !groupId(id)) return <div className="page-shell"><p role="alert">Nhóm không hợp lệ.</p></div>;
  return <DailyAccountGate>{(userId, warning, retry) => id
    ? <GroupScreen key={`${userId}:${id}`} userId={userId} id={id} warning={warning} retry={retry} />
    : <GroupList key={userId} userId={userId} warning={warning} retry={retry} />}</DailyAccountGate>;
}

function GroupScreen({ userId, id, warning, retry }: { userId: string; id: string; warning: boolean; retry: () => void }) {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("journal");
  const today = platformDate(new Date());
  const date = params.get("date") ?? (today ? platformDateKey(today) : "");
  const valid = !!parsePlatformDate(date);
  const group = useQuery({ queryKey: ["daily-groups", userId, id, "detail"], queryFn: ({ signal }) => groupService.detail(id, signal), retry: false, staleTime: 0, gcTime: 0 });
  const dashboard = useQuery({ queryKey: ["daily-groups", userId, id, "dashboard", date], queryFn: ({ signal }) => groupService.dashboard(id, date, signal), enabled: valid && group.isSuccess, retry: false, staleTime: 0, gcTime: 0 });
  const revoked = group.isError && groupAccessLost(group.error);
  const shared = dashboard.data?.members.filter(m => m.userId !== userId && m.access === "SHARED" && m.summary) ?? [];
  async function refresh() { await Promise.all([group.refetch(), dashboard.refetch()]); }
  const checking = group.isFetching || dashboard.isFetching;

  return <div className="page-shell study-notebook daily-group-workspace">
    <StudyAreaNav area="group" />
    <DailyAccountWarning show={warning} onRetry={retry} />
    <Link to="/daily/groups" className="study-group-back"><ArrowLeft size={16} aria-hidden="true" /><span>Tất cả nhóm</span></Link>
    <PageHeader
      title={group.isSuccess && !group.isFetching ? group.data.name : "Nhóm Daily"}
      description="Cùng theo dõi một ngày học, để lại một lời góp ý."
      actions={<div className="study-toolbar">
        {valid ? <StudyDatePicker date={date} label="Ngày xem trong nhóm" onSelect={next => { setParams(current => { const updated = new URLSearchParams(current); updated.set("date", next); return updated; }, { state: { studyDateFocus: true } }); return true; }} /> : null}
        <Button asChild variant="outline"><Link to={`/daily?date=${date}`}>Viết ngày của tôi</Link></Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Tải lại nhóm" title="Tải lại nhóm" disabled={checking} onClick={() => void refresh()}><RefreshCw size={16} aria-hidden="true" /></Button>
      </div>}
    />
    {group.isFetching ? <p role="status">Đang kiểm tra thành viên…</p> : null}
    {group.isError ? <Retry error={group.error} retry={() => void refresh()} /> : null}
    {!revoked && group.data ? <div hidden={group.isFetching || group.isError}>
      <div className="daily-group-context"><span className="group-hero__avatar"><GroupAvatarImage group={group.data} /></span><p>{group.data.members.length} thành viên <span>· Chỉ đọc những ngày được chia sẻ với bạn</span></p></div>
      <Tabs value={tab} onValueChange={setTab} className="daily-group-tabs">
        <SmoothTab value={tab} label="Nội dung nhóm" items={[
          { value: "journal", label: "Nhật ký", icon: <BookOpen size={16} aria-hidden="true" /> },
          { value: "members", label: "Thành viên", icon: <Users size={16} aria-hidden="true" /> },
          { value: "manage", label: "Quản lý nhóm", icon: <Settings2 size={16} aria-hidden="true" /> },
        ]} />
        <TabsContent value="journal" forceMount hidden={tab !== "journal"}>
          <section className="daily-group-reading" aria-labelledby="group-journal-heading">
            <header><h2 id="group-journal-heading">Nhật ký ngày {date}</h2><p className="study-note">Mở một ngày để đọc công việc, nhìn lại và góp ý. Thay đổi ngày bằng lịch phía trên.</p></header>
            {!valid ? <p role="alert">Ngày không hợp lệ.</p> : null}
            {dashboard.isFetching ? <p role="status">Đang tải nhật ký được chia sẻ…</p> : null}
            {dashboard.isError ? <Retry error={dashboard.error} retry={() => void dashboard.refetch()} /> : null}
            {dashboard.isSuccess && !dashboard.isFetching ? shared.length ? <ul className="daily-shared-entries">{shared.map(m => <li key={m.userId}>
              <Link className="daily-shared-entry" to={`/daily/groups/${id}/reviews/${m.userId}?date=${date}`}>
                <StudyIdentity name={m.displayName} detail={`${m.summary!.completedCount}/${m.summary!.totalCount} việc đã xong`} />
                <span className="daily-shared-entry__action">Đọc và góp ý <span aria-hidden="true">↗</span></span>
              </Link>
            </li>)}</ul> : <StudyEmpty title="Chưa có nhật ký được chia sẻ với bạn trong ngày này.">Bạn có thể viết ngày của mình hoặc chọn một ngày khác để đọc.</StudyEmpty> : null}
          </section>
        </TabsContent>
        <TabsContent value="members" forceMount hidden={tab !== "members"}>
          <section className="daily-group-reading" aria-label="Daily theo thành viên">
            <h2>Thành viên trong ngày</h2>
            {checking ? <p role="status">Đang kiểm tra quyền xem…</p> : null}
            {dashboard.isError ? <Retry error={dashboard.error} retry={() => void dashboard.refetch()} /> : null}
            {dashboard.isSuccess && !dashboard.isFetching ? <ul className="group-member-grid">{dashboard.data.members.map(m => <li key={m.userId} className="group-member-card" data-group-member={m.userId}>
              <StudyIdentity name={m.displayName} detail={m.userId === userId ? "Nhật ký của bạn" : m.access === "SHARED" ? "Đã chia sẻ ngày này với bạn" : "Chưa chia sẻ ngày này với bạn"} />
              {m.access === "SHARED" && m.summary ? <p className="study-note">Đã xong <strong>{m.summary.completedCount}/{m.summary.totalCount}</strong> việc</p> : <span />}
              {m.access === "SHARED" && m.summary ? <Link className="study-member-day" to={m.userId === userId ? `/daily?date=${date}` : `/daily/groups/${id}/reviews/${m.userId}?date=${date}`}>Xem ngày</Link> : null}
            </li>)}</ul> : null}
          </section>
        </TabsContent>
        <TabsContent value="manage" forceMount hidden={tab !== "manage"}>
          <section className="daily-group-reading"><h2>Quản lý nhóm</h2><p className="study-note">Người xem được chọn riêng trong từng ngày tại Daily của tôi.</p>
            <GroupConsent userId={userId} group={group.data} refresh={refresh} />
            {group.data.ownerId === userId ? <GroupAvatarEditor group={group.data} refresh={refresh} /> : null}
          </section>
        </TabsContent>
      </Tabs>
    </div> : null}
  </div>;
}
