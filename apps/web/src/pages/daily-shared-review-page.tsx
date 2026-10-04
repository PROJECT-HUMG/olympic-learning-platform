import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DailyAccountGate, DailyAccountWarning } from "@/features/daily/components/daily-account-gate";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EvidencePanel } from "@/features/daily/evidence/evidence-panel";
import { FeedbackPanel } from "@/features/daily/groups/feedback-panel";
import type { DailyPlan, DailyWeek } from "@/features/daily/lib/daily-contract";
import { Retry } from "@/features/daily/groups/group-controls";
import { groupService } from "@/features/daily/groups/group.service";
import { groupId, groupAccessLost } from "@/features/daily/groups/group-contract";
import { parsePlatformDate, platformDate, platformDateKey, weekDates } from "@/features/daily/lib/platform-calendar";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/features/daily/lib/review-display";
import { StudyAreaNav, StudyDisclosure, StudyEmpty, StudyIdentity, StudyProgress } from "@/features/daily/ui/study-notebook";
import { StudyDayList } from "@/features/daily/ui/study-calendar";

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
  const href=`/daily/groups/${groupId}/reviews/${ownerId}?date=${date}`;
  return <div className="page-shell study-notebook">
    <StudyAreaNav area="group" groupHref={`/daily/groups/${groupId}?date=${date}`} />
    <DailyAccountWarning show={warning} onRetry={retry}/>
    <PageHeader title={kind==="plans"?"Nhận xét ngày trong nhóm":"Nhận xét tuần trong nhóm"} description="Đọc để hiểu việc học của nhau, rồi gửi một góp ý hữu ích. Nội dung chỉ đọc theo quyền chia sẻ hiện tại và đúng nhóm này." actions={<Link className="inline-flex min-h-11 items-center text-primary underline underline-offset-4" to={`/daily/groups/${groupId}?date=${date}`}>Về nhóm</Link>}/>
    <StudyDisclosure title="Chọn kỳ xem"><div className="study-toolbar">
      <div className="space-y-2"><Label htmlFor="shared-date">Ngày trong kỳ xem</Label><Input id="shared-date" type="date" value={date} onChange={e=>{const next=new URLSearchParams(params);next.set("date",e.target.value);setParams(next);}}/></div>
      <nav className="study-area-nav" aria-label="Kỳ nhận xét"><Link aria-current={kind==="plans"?"page":undefined} to={href}>Xem ngày</Link>
      <Link aria-current={kind==="weeks"?"page":undefined} to={href+"&view=week"}>Xem tuần</Link></nav>
    </div></StudyDisclosure>
    <Button type="button" variant="outline" disabled={checking} onClick={()=>void refresh()}>Kiểm tra quyền và tải lại</Button>
    {checking?<p role="status">Đang kiểm tra quyền xem…</p>:null}
    {unavailable?<Retry error={query.isError?query.error:context.error} retry={()=>void refresh()}/>:null}
    {!revoked&&query.data&&context.data?<div hidden={checking||unavailable} className="space-y-8">
      {member?<div className="study-context"><StudyIdentity name={member.displayName} detail={<>{context.data.name} · {kind==="plans"?`Ngày ${date}`:`Tuần từ ${weekStart}`} · Chỉ đọc</>}/></div>:null}
      {week?<PageSection title="Các ngày trong tuần" description="Mở một ngày để xem kế hoạch và góp ý theo quyền chia sẻ hiện tại."><StudyDayList weekStart={weekStart} href={day=>`/daily/groups/${groupId}/reviews/${ownerId}?date=${day}`} /></PageSection>:null}
      {plan?<Link className="inline-flex min-h-11 items-center text-primary underline" to={`/daily/groups/${groupId}/reviews/${ownerId}?date=${weekStart}&view=week`}>Về tuần của người này</Link>:null}
      {plan?<><div className="study-progress-grid">
        <StudyProgress label="Việc đã hoàn thành" completed={plan.completedCount} total={plan.totalCount} rate={plan.totalCount === 0 ? null : plan.completedCount / plan.totalCount} caption="Kế hoạch đã lưu, chỉ đọc." />
        <StudyProgress label="Việc bắt buộc" completed={plan.mustCompleted} total={plan.mustTotal} rate={plan.mustTotal === 0 ? null : plan.mustCompleted / plan.mustTotal} />
      </div><PageSection title={`Kế hoạch ${plan.planDate}`} description="Việc được giữ theo thứ tự của người lập kế hoạch. Minh chứng chỉ xem được với quyền hiện tại.">
        {!plan.tasks.length ? <StudyEmpty title="Kế hoạch đã lưu chưa có việc." /> : null}
        <ul>{plan.tasks.map(task=><li key={task.id} className="study-task space-y-3" data-complete={task.status === "COMPLETED"}><p className="break-words font-medium">{task.title}</p><p className="study-note">{PRIORITY_LABEL[task.priority]} · {STATUS_LABEL[task.status]}</p><EvidencePanel userId={userId} planId={plan.id} taskId={task.id} groupId={groupId} readOnly/></li>)}</ul>
      </PageSection><StudyDisclosure title="Nhận xét của người lập kế hoạch">
        <ReviewText label="Lý do chưa hoàn thành" value={plan.reviewReasons}/><ReviewText label="Điều làm tốt" value={plan.reviewWentWell}/><ReviewText label="Điều chỉnh ngày mai" value={plan.reviewTomorrow}/>
      </StudyDisclosure></>:null}
      {week?<><StudyDisclosure title="Số liệu tuần đã ghi nhận" description="Số liệu từ kế hoạch đã lưu; nhận xét do người học tự viết.">
        <div className="study-week-summary"><div><h3 className="text-sm font-medium">Ngày có kế hoạch</h3><p>{week.plannedDays}/7 ngày</p></div><div><h3 className="text-sm font-medium">Ngày nộp đúng giờ</h3><p>{week.onTimeDays} ngày</p></div><div><h3 className="text-sm font-medium">Hoàn thành trung bình</h3><p>{week.completionRate===null?"Không áp dụng":Math.round(week.completionRate*100)+"%"}</p><p className="study-note">Trung bình các ngày có việc.</p></div><StudyProgress label="Việc bắt buộc trong tuần" completed={week.mustCompleted} total={week.mustTotal} rate={week.mustRate} caption="Gộp việc bắt buộc của các ngày đã lưu." /></div>
      </StudyDisclosure><StudyDisclosure title="Nhìn lại và tuần tới">
        <ReviewText label="Việc chưa hoàn thành lặp lại" value={week.recurringUnfinished}/><ReviewText label="Vấn đề" value={week.issues}/><ReviewText label="Nhìn lại tuần" value={week.reflection}/><ReviewText label="Thay đổi tuần tới" value={week.nextWeekChanges}/>
      </StudyDisclosure></>:null}
      {query.data.id?<FeedbackPanel key={`${userId}:${groupId}:${ownerId}:${kind}:${query.data.id}`} userId={userId} groupId={groupId} ownerId={ownerId} kind={kind} reviewId={query.data.id}/>:<StudyEmpty title="Chưa có nhận xét tuần đã lưu.">Chỉ có số liệu tổng hợp; chưa thể góp ý.</StudyEmpty>}
    </div>:null}
  </div>;
}
function ReviewText({label,value}:{label:string;value:string|null}) {
  return <div className="max-w-prose space-y-1 py-2"><h3 className="text-sm font-semibold">{label}</h3><p className="whitespace-pre-wrap break-words">{value||"Chưa ghi nhận."}</p></div>;
}
