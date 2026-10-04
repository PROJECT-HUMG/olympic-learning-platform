import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DailyAccountGate, DailyAccountWarning } from "@/features/daily/components/daily-account-gate";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GroupList, GroupConsent, Retry } from "@/features/daily/groups/group-controls";
import { groupService } from "@/features/daily/groups/group.service";
import { groupId, groupAccessLost } from "@/features/daily/groups/group-contract";
import { parsePlatformDate, platformDate, platformDateKey } from "@/features/daily/lib/platform-calendar";

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
  return <div className="page-shell">
    <DailyAccountWarning show={warning} onRetry={retry}/>
    <PageHeader title={group.isSuccess?group.data.name:"Nhóm Daily"} description="Quyền xem được kiểm tra theo chia sẻ và thành viên hiện tại, kể cả ngày cũ." actions={<Link to="/daily/groups" className="underline">Tất cả nhóm</Link>}/>
    <Button type="button" variant="outline" disabled={group.isFetching||dashboard.isFetching} onClick={()=>void refresh()}>Kiểm tra quyền và tải lại</Button>
    {group.isFetching?<p role="status">Đang kiểm tra thành viên…</p>:null}
    {group.isError?<Retry error={group.error} retry={()=>void refresh()}/>:null}
    {!revoked&&group.data?<div hidden={group.isFetching||group.isError}>
      <PageSection title="Daily của thành viên">
        <div className="max-w-sm space-y-2"><Label htmlFor="group-date">Ngày xem</Label><Input id="group-date" type="date" value={date} onChange={e=>setParams({date:e.target.value})}/></div>
        {!valid?<p role="alert">Ngày không hợp lệ.</p>:null}
        {dashboard.isFetching?<p role="status">Đang kiểm tra chia sẻ ngày {date}…</p>:null}
        {dashboard.isError?<Retry error={dashboard.error} retry={()=>void dashboard.refetch()}/>:null}
        {dashboard.isSuccess&&!dashboard.isFetching?<ul className="divide-y">{dashboard.data.members.map(m=><li key={m.userId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-4" data-group-member={m.userId}>
          <div className="min-w-0 break-words"><p className="font-medium">{m.displayName}</p>
            {m.access==="NOT_SHARED"?<p className="text-sm text-muted-foreground">Chưa chia sẻ với bạn.</p>:m.summary?<p className="text-sm">Hoàn thành {m.summary.completedCount}/{m.summary.totalCount} · MUST {m.summary.mustCompleted}/{m.summary.mustTotal} · {m.summary.firstSubmittedAt?m.summary.onTime?"Nộp đúng giờ":"Nộp sau giờ":"Chưa nộp"}</p>:<p className="text-sm">Chưa có kế hoạch đã lưu cho ngày này.</p>}
          </div>
          {m.access==="SHARED"?<Link className="inline-flex min-h-11 items-center text-primary underline" to={`/daily/groups/${id}/reviews/${m.userId}?date=${date}`}>Xem ngày và tuần</Link>:null}
        </li>)}</ul>:null}
      </PageSection>
      <GroupConsent userId={userId} group={group.data} refresh={refresh}/>
    </div>:null}
  </div>;
}

