import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, RefreshCw } from "lucide-react";
import { DailyAccountGate, DailyAccountWarning } from "@/features/daily/components/daily-account-gate";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { GroupList, GroupConsent, Retry } from "@/features/daily/groups/group-controls";
import { groupService } from "@/features/daily/groups/group.service";
import { groupId, groupAccessLost } from "@/features/daily/groups/group-contract";
import { parsePlatformDate, platformDate, platformDateKey } from "@/features/daily/lib/platform-calendar";
import { StudyAreaNav, StudyIdentity } from "@/features/daily/ui/study-notebook";
import { openStudySection } from "@/features/daily/ui/study-section";
import { StudyDatePicker } from "@/features/daily/ui/study-date-picker";
import { GroupAvatarEditor, GroupAvatarImage } from "@/features/daily/groups/group-avatar";
import "@/features/daily/groups/groups.css";

export function DailyGroupsPage() {
  const {groupId:id}=useParams();
  if(id&&!groupId(id))return <div className="page-shell"><p role="alert">Nhóm không hợp lệ.</p></div>;
  return <DailyAccountGate>{(userId,warning,retry)=>id?<GroupScreen key={`${userId}:${id}`} userId={userId} id={id} warning={warning} retry={retry}/>:<GroupList key={userId} userId={userId} warning={warning} retry={retry}/>}</DailyAccountGate>;
}

function GroupScreen({userId,id,warning,retry}:{userId:string;id:string;warning:boolean;retry:()=>void}) {
  const [params,setParams]=useSearchParams();
  const today=platformDate(new Date());
  const date=params.get("date")??(today?platformDateKey(today):"");
  const valid=!!parsePlatformDate(date);
  const group=useQuery({queryKey:["daily-groups",userId,id,"detail"],queryFn:({signal})=>groupService.detail(id,signal),retry:false,staleTime:0,gcTime:0});
  const dashboard=useQuery({queryKey:["daily-groups",userId,id,"dashboard",date],queryFn:({signal})=>groupService.dashboard(id,date,signal),enabled:valid&&group.isSuccess,retry:false,staleTime:0,gcTime:0});
  const revoked=group.isError&&groupAccessLost(group.error);
  async function refresh(){await Promise.all([group.refetch(),dashboard.refetch()]);}

  return <div className="page-shell study-notebook">
    <StudyAreaNav area="group" />
    <DailyAccountWarning show={warning} onRetry={retry}/>

    <PageHeader
      title={group.isSuccess&&!group.isFetching?group.data.name:"Nhóm Daily"}
      description={group.isSuccess&&!group.isFetching?`${group.data.members.length} thành viên`:undefined}
      actions={
        <div className="study-toolbar study-group-header-controls">
          <Link to="/daily/groups" aria-label="Tất cả nhóm" title="Tất cả nhóm" className="study-group-back">
            <ArrowLeft size={16} aria-hidden="true" /><span>Tất cả nhóm</span>
          </Link>
          {valid ? <StudyDatePicker date={date} label="Ngày xem trong nhóm" onSelect={next => { setParams(current => { const updated = new URLSearchParams(current); updated.set("date", next); return updated; }, { state: { studyDateFocus: true } }); return true; }} /> : null}
          <Button type="button" variant="ghost" size="icon" aria-label="Tải lại nhóm" title="Tải lại nhóm" disabled={group.isFetching||dashboard.isFetching} onClick={()=>void refresh()}>
            <RefreshCw size={16} aria-hidden="true" />
          </Button>
        </div>
      }
    />

    {group.isFetching?<p role="status" className="text-sm text-muted-foreground">Đang kiểm tra thành viên…</p>:null}
    {group.isError?<Retry error={group.error} retry={()=>void refresh()}/>:null}

    {!revoked&&group.data?<div hidden={group.isFetching||group.isError} className="space-y-6">
      <div className="group-context-row">
        <span className="group-hero__avatar"><GroupAvatarImage group={group.data} /></span>
        <span className={`group-sharing-status ${group.data.mySharing.shareDaily ? "group-sharing-status--on" : "group-sharing-status--off"}`}>
          {group.data.mySharing.shareDaily
            ? <><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Đang chia sẻ</>
            : <><EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Riêng tư</>}
        </span>
        <Button type="button" variant="outline" onClick={() => openStudySection("group-sharing")}>Quản lý chia sẻ</Button>
      </div>

      <section className="page-section study-work-surface" aria-label="Daily theo thành viên">
        <header className="page-section__heading">
          <div>
            <h2>Daily theo thành viên</h2>
          </div>
        </header>
        <div className="page-section__content">
        {!valid?<p role="alert" className="text-sm text-destructive mt-3">Ngày không hợp lệ.</p>:null}
        {dashboard.isFetching?<p role="status" className="text-sm text-muted-foreground mt-3">Đang kiểm tra chia sẻ ngày {date}…</p>:null}
        {dashboard.isError?<div className="mt-3"><Retry error={dashboard.error} retry={()=>void dashboard.refetch()}/></div>:null}

        {dashboard.isSuccess&&!dashboard.isFetching?<ul className="group-member-grid">{dashboard.data.members.map(m=><li key={m.userId} className="group-member-card" data-group-member={m.userId}>
          <div className="group-member-card__header">
            <StudyIdentity name={m.displayName} detail={m.access === "SHARED" ? m.summary ? m.summary.firstSubmittedAt ? m.summary.onTime ? "Nộp đúng giờ" : "Nộp sau giờ" : "Chưa nộp" : "Chưa có kế hoạch đã lưu" : "Chưa chia sẻ với bạn"} />
          </div>

          {m.access === "SHARED" && m.summary ? <div className="group-member-card__progress">
            <div className="group-member-card__progress-row">
              <span className="text-muted-foreground">Hoàn thành</span>
              <strong className="text-primary font-semibold tabular-nums">{m.summary.completedCount}/{m.summary.totalCount}</strong>
            </div>
            <span className="study-note">Bắt buộc <strong>{m.summary.mustCompleted}/{m.summary.mustTotal}</strong></span>
          </div> : null}

          {m.access === "SHARED" ? <div className="group-member-card__actions">
            <Link className="study-member-day" to={`/daily/groups/${id}/reviews/${m.userId}?date=${date}`}>Xem ngày</Link>
            <Link className="study-member-week" to={`/daily/groups/${id}/reviews/${m.userId}?date=${date}&view=week`}>Xem tuần</Link>
          </div> : null}
        </li>)}</ul>:null}
        </div>
      </section>

      <GroupConsent userId={userId} group={group.data} refresh={refresh}/>
      {group.data.ownerId === userId ? <GroupAvatarEditor group={group.data} refresh={refresh} /> : null}
    </div>:null}
  </div>;
}
