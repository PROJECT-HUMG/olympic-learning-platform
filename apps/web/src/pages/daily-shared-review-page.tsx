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

export function DailySharedReviewPage() {
  const {groupId:id,ownerId:owner}=useParams();
  const [params]=useSearchParams();
  const today=platformDate(new Date());
  const date=params.get("date")??(today?platformDateKey(today):"");
  if(!groupId(id)||!groupId(owner)||!parsePlatformDate(date))return <div className="page-shell"><p role="alert">Nhóm, người nhận hoặc ngày không hợp lệ.</p></div>;
  const kind=params.get("view")==="week"?"weeks":"plans";
  return <DailyAccountGate>{(userId,warning,retry)=><Review key={`${userId}:${id}:${owner}:${date}:${kind}`} userId={userId} groupId={id} ownerId={owner} date={date} kind={kind} warning={warning} retry={retry}/>}</DailyAccountGate>;
}
function Review({userId,groupId,ownerId,date,kind,warning,retry}:{userId:string;groupId:string;ownerId:string;date:string;kind:"plans"|"weeks";warning:boolean;retry:()=>void}) {
  const [params,setParams]=useSearchParams();
  const weekStart=platformDateKey(weekDates(parsePlatformDate(date)!)[0]);
  const query=useQuery<DailyPlan | DailyWeek>({queryKey:["daily-groups",userId,groupId,ownerId,kind,date],
    queryFn:({signal})=>kind==="plans"?groupService.plan(groupId,ownerId,date,signal):groupService.week(groupId,ownerId,weekStart,signal),
    retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:"always"});
  const revoked=query.isError&&groupAccessLost(query.error);
  const plan=query.data&&"tasks" in query.data?query.data:null;
  const week=query.data&&"weekStart" in query.data?query.data:null;
  const href=`/daily/groups/${groupId}/reviews/${ownerId}?date=${date}`;
  return <div className="page-shell">
    <DailyAccountWarning show={warning} onRetry={retry}/>
    <PageHeader title={kind==="plans"?"Nhận xét ngày trong nhóm":"Nhận xét tuần trong nhóm"} description="Nội dung chỉ đọc theo quyền hiện tại. Tên và góp ý được giữ trong đúng nhóm này." actions={<Link className="underline" to={`/daily/groups/${groupId}?date=${date}`}>Về nhóm</Link>}/>
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2"><Label htmlFor="shared-date">Ngày trong kỳ xem</Label><Input id="shared-date" type="date" value={date} onChange={e=>{const next=new URLSearchParams(params);next.set("date",e.target.value);setParams(next);}}/></div>
      <Link className="inline-flex min-h-11 items-center underline" aria-current={kind==="plans"?"page":undefined} to={href}>Xem ngày</Link>
      <Link className="inline-flex min-h-11 items-center underline" aria-current={kind==="weeks"?"page":undefined} to={href+"&view=week"}>Xem tuần</Link>
      <Button type="button" variant="outline" disabled={query.isFetching} onClick={()=>void query.refetch()}>Kiểm tra quyền và tải lại</Button>
    </div>
    {query.isFetching?<p role="status">Đang kiểm tra quyền xem…</p>:null}
    {query.isError?<Retry error={query.error} retry={()=>void query.refetch()}/>:null}
    {!revoked&&query.data?<div hidden={query.isFetching||query.isError} className="space-y-8">
      {plan?<><PageSection title={`Kế hoạch ${plan.planDate}`} description={`Hoàn thành ${plan.completedCount}/${plan.totalCount} · MUST ${plan.mustCompleted}/${plan.mustTotal}`}>
        <ul className="divide-y">{plan.tasks.map(task=><li key={task.id} className="min-w-0 space-y-3 py-4"><p className="break-words">{task.title} — {task.priority} — {task.status==="COMPLETED"?"Hoàn thành":"Chưa hoàn thành"}</p><EvidencePanel userId={userId} planId={plan.id} taskId={task.id} groupId={groupId} readOnly/></li>)}</ul>
      </PageSection><PageSection title="Nhận xét của người lập kế hoạch">
        <ReviewText label="Lý do chưa hoàn thành" value={plan.reviewReasons}/><ReviewText label="Điều làm tốt" value={plan.reviewWentWell}/><ReviewText label="Điều chỉnh ngày mai" value={plan.reviewTomorrow}/>
      </PageSection></>:null}
      {week?<PageSection title={`Tuần từ ${week.weekStart}`} description={`Có kế hoạch ${week.plannedDays}/7 ngày · Nộp đúng giờ ${week.onTimeDays} ngày · Hoàn thành trung bình ${week.completionRate===null?"Không áp dụng":Math.round(week.completionRate*100)+"%"} · MUST ${week.mustCompleted}/${week.mustTotal}`}>
        <ReviewText label="Việc chưa hoàn thành lặp lại" value={week.recurringUnfinished}/><ReviewText label="Vấn đề" value={week.issues}/><ReviewText label="Nhìn lại tuần" value={week.reflection}/><ReviewText label="Thay đổi tuần tới" value={week.nextWeekChanges}/>
      </PageSection>:null}
      {query.data.id?<FeedbackPanel key={`${userId}:${groupId}:${ownerId}:${kind}:${query.data.id}`} userId={userId} groupId={groupId} ownerId={ownerId} kind={kind} reviewId={query.data.id}/>:<p>Chưa có nhận xét tuần đã lưu. Chỉ có số liệu tổng hợp; chưa thể góp ý.</p>}
    </div>:null}
  </div>;
}
function ReviewText({label,value}:{label:string;value:string|null}) {
  return <div className="max-w-prose space-y-1 py-2"><h3 className="text-sm font-semibold">{label}</h3><p className="whitespace-pre-wrap break-words">{value||"Chưa ghi nhận."}</p></div>;
}
