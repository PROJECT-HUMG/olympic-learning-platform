import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DailyAccountGate, DailyAccountWarning } from "@/features/daily/components/daily-account-gate";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { EvidencePanel } from "@/features/daily/evidence/evidence-panel";
import { FeedbackPanel } from "@/features/daily/groups/feedback-panel";
import type { DailyPlan, DailyWeek } from "@/features/daily/lib/daily-contract";
import { Retry } from "@/features/daily/groups/group-controls";
import { groupService } from "@/features/daily/groups/group.service";
import { groupId, groupAccessLost } from "@/features/daily/groups/group-contract";
import { parsePlatformDate, platformDate, platformDateKey, weekDates } from "@/features/daily/lib/platform-calendar";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/features/daily/lib/review-display";
import { StudyAreaNav, StudyDisclosure, StudyEmpty, StudyProgress, StudyWeekStats } from "@/features/daily/ui/study-notebook";
import { openStudySection } from "@/features/daily/ui/study-section";
import { StudyDatePicker } from "@/features/daily/ui/study-date-picker";
import { ArrowLeft, BookOpen, RefreshCw } from "lucide-react";

export function DailySharedReviewPage() {
  const {groupId:id,ownerId:owner}=useParams();
  const [params]=useSearchParams();
  const today=platformDate(new Date());
  const date=params.get("date")??(today?platformDateKey(today):"");
  if(!groupId(id)||!groupId(owner)||!parsePlatformDate(date))return <div className="page-shell"><p role="alert">Nhóm, người nhận hoặc ngày không hợp lệ.</p></div>;
  const kind=params.get("view")==="week"||!params.has("date")?"weeks":"plans";
  return <DailyAccountGate>{(userId,warning,retry)=><Review key={`${userId}:${id}:${owner}:${date}:${kind}`} userId={userId} groupId={id} ownerId={owner} date={date} kind={kind} warning={warning} retry={retry}/>}</DailyAccountGate>;
}
function Review({userId,groupId,ownerId,date,kind,warning,retry}:{userId:string;groupId:string;ownerId:string;date:string;kind:"plans"|"weeks";warning:boolean;retry:()=>void}) {
  const [params,setParams]=useSearchParams();
  const weekStart=platformDateKey(weekDates(parsePlatformDate(date)!)[0]);
  const context=useQuery({queryKey:["daily-groups",userId,groupId,"detail"],
    queryFn:({signal})=>groupService.detail(groupId,signal),
    retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:"always"});
  const query=useQuery<DailyPlan | DailyWeek>({queryKey:["daily-groups",userId,groupId,ownerId,kind,date],
    queryFn:({signal})=>kind==="plans"?groupService.plan(groupId,ownerId,date,signal):groupService.week(groupId,ownerId,weekStart,signal),
    retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:"always"});
  const revoked=(query.isError&&groupAccessLost(query.error))||(context.isError&&groupAccessLost(context.error));
  const checking=query.isFetching||context.isFetching;
  const unavailable=query.isError||context.isError;
  const member=context.isSuccess&&!checking&&!unavailable?context.data.members.find(member=>member.userId===ownerId):null;
  async function refresh(){await Promise.all([query.refetch(),context.refetch()]);}
  const plan=query.data&&"tasks" in query.data?query.data:null;
  const week=query.data&&"weekStart" in query.data?query.data:null;
  return <div className="page-shell study-notebook study-shared-review">
    <StudyAreaNav area="group" groupHref={`/daily/groups/${groupId}?date=${date}`} />
    <DailyAccountWarning show={warning} onRetry={retry}/>
    <PageHeader title={kind==="plans"?"Nhận xét ngày":"Nhận xét tuần"} description={member?<>{member.displayName} · {context.data?.name} · Chỉ đọc</>:undefined} actions={<div className="study-toolbar">
      <Button asChild type="button" variant="ghost" size="icon"><Link aria-label="Về nhóm" title="Về nhóm" to={`/daily/groups/${groupId}?date=${date}`}><ArrowLeft size={18} aria-hidden="true" /></Link></Button>
      <StudyDatePicker date={date} disabled={checking} onSelect={selected => { const next=new URLSearchParams(params);next.set("date",selected);setParams(next,{state:{studyDateFocus:true}});return true; }}>{selected => <>
        <Link to={`/daily/groups/${groupId}/reviews/${ownerId}?date=${selected}`}>Xem ngày</Link>
        <Link to={`/daily/groups/${groupId}/reviews/${ownerId}?date=${selected}&view=week`}>Xem tuần</Link>
      </>}</StudyDatePicker>
      <Button type="button" variant="ghost" size="icon" aria-label="Tải lại nhận xét" title="Tải lại nhận xét" disabled={checking} onClick={()=>void refresh()}><RefreshCw size={16} aria-hidden="true" /></Button>
    </div>}/>
    {checking?<p role="status">Đang kiểm tra quyền xem…</p>:null}
    {unavailable?<Retry error={query.isError?query.error:context.error} retry={()=>void refresh()}/>:null}
    {!revoked&&query.data&&context.data?<div hidden={checking||unavailable} className="study-review-workspace">
      <div className="study-review-main study-work-surface">
      {plan?<><PageSection title="Việc đã lưu" actions={<div className="study-toolbar"><Button type="button" variant="ghost" className="study-read-reflection" aria-label="Đọc nhận xét của người học" title="Đọc nhận xét của người học" onClick={() => openStudySection("shared-reflection")}><BookOpen size={16} aria-hidden="true" /><span>Nhận xét</span></Button>{query.data.id?<Button type="button" variant="outline" aria-label="Góp ý trong nhóm" onClick={() => openStudySection("shared-feedback")}>Góp ý</Button>:null}</div>}><div className="study-progress-grid">
        <StudyProgress label="Hoàn thành" completed={plan.completedCount} total={plan.totalCount} rate={plan.totalCount === 0 ? null : plan.completedCount / plan.totalCount} />
        <StudyProgress label="Bắt buộc" completed={plan.mustCompleted} total={plan.mustTotal} rate={plan.mustTotal === 0 ? null : plan.mustCompleted / plan.mustTotal} />
      </div>
        {!plan.tasks.length ? <StudyEmpty title="Kế hoạch đã lưu chưa có việc." /> : null}
        <ul>{plan.tasks.map(task=><li key={task.id} className="study-task study-task--read-only" data-complete={task.status === "COMPLETED"}><div><p className="break-words font-medium">{task.title}</p><p className="study-note">{PRIORITY_LABEL[task.priority]} · {STATUS_LABEL[task.status]}</p></div><EvidencePanel userId={userId} planId={plan.id} taskId={task.id} taskTitle={task.title} groupId={groupId} readOnly/></li>)}</ul>
      </PageSection><StudyDisclosure id="shared-reflection" title="Nhận xét của người lập kế hoạch" defaultOpen>
        <ReviewText label="Lý do chưa hoàn thành" value={plan.reviewReasons}/><ReviewText label="Điều làm tốt" value={plan.reviewWentWell}/><ReviewText label="Điều chỉnh ngày mai" value={plan.reviewTomorrow}/>
      </StudyDisclosure></>:null}
      {week?<><div className="study-toolbar study-week-review-actions">{query.data.id?<Button type="button" variant="outline" onClick={() => openStudySection("shared-feedback")}>Góp ý trong nhóm</Button>:null}</div><StudyDisclosure id="shared-reflection" title="Nhìn lại và tuần tới" defaultOpen>
        <ReviewText label="Việc chưa hoàn thành lặp lại" value={week.recurringUnfinished}/><ReviewText label="Vấn đề" value={week.issues}/><ReviewText label="Nhìn lại tuần" value={week.reflection}/><ReviewText label="Thay đổi tuần tới" value={week.nextWeekChanges}/>
      </StudyDisclosure></>:null}
      </div>
      <aside className="study-review-rail">
      {week?<StudyWeekStats {...week} />:null}
      {query.data.id?<FeedbackPanel key={`${userId}:${groupId}:${ownerId}:${kind}:${query.data.id}`} userId={userId} groupId={groupId} ownerId={ownerId} kind={kind} reviewId={query.data.id}/>:<StudyEmpty title="Chưa có nhận xét tuần đã lưu.">Chỉ có số liệu tổng hợp; chưa thể góp ý.</StudyEmpty>}
      </aside>
    </div>:null}
  </div>;
}
function ReviewText({label,value}:{label:string;value:string|null}) {
  return <div className="max-w-prose space-y-1 py-2"><h3 className="text-sm font-semibold">{label}</h3><p className="whitespace-pre-wrap break-words">{value||"Chưa ghi nhận."}</p></div>;
}
