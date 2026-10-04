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
import { StudyAreaNav, StudyDisclosure, StudyIdentity, StudyProgress } from "@/features/daily/ui/study-notebook";
import { StudyWeekList } from "@/features/daily/ui/study-calendar";
import { GroupAvatarEditor, GroupAvatarImage } from "@/features/daily/groups/group-avatar";

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
    <PageHeader title={group.isSuccess&&!group.isFetching?group.data.name:"Nhóm Daily"} description="Cùng học, cùng nhìn lại. Mỗi người tự chọn chia sẻ; quyền xem hiện tại áp dụng cả ngày cũ." actions={<Link to="/daily/groups" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">Tất cả nhóm</Link>}/>
    <Button type="button" variant="outline" disabled={group.isFetching||dashboard.isFetching} onClick={()=>void refresh()}>Kiểm tra quyền và tải lại</Button>
    {group.isFetching?<p role="status">Đang kiểm tra thành viên…</p>:null}
    {group.isError?<Retry error={group.error} retry={()=>void refresh()}/>:null}
    {!revoked&&group.data?<div hidden={group.isFetching||group.isError} className="space-y-8">
      <StudyIdentity name={group.data.name} detail={`${group.data.members.length} thành viên`} avatar={<GroupAvatarImage group={group.data} />} />
      <p className="study-context">{group.data.mySharing.shareDaily ? "Daily của bạn đang được chia sẻ theo người xem đã lưu trong nhóm này." : "Daily của bạn đang riêng tư trong nhóm này. Bạn có thể chọn chia sẻ ở phần bên dưới."}</p>
      <PageSection title="Daily theo thành viên" description="Mở một người, chọn tuần rồi xem từng ngày. Chỉ nội dung được chia sẻ với bạn mới mở được.">
        <StudyDisclosure title="Chọn kỳ xem"><div className="max-w-sm space-y-2"><Label htmlFor="group-date">Ngày trong tuần cần xem</Label><Input id="group-date" type="date" value={date} onChange={e=>setParams({date:e.target.value})}/></div></StudyDisclosure>
        {!valid?<p role="alert">Ngày không hợp lệ.</p>:null}
        {dashboard.isFetching?<p role="status">Đang kiểm tra chia sẻ ngày {date}…</p>:null}
        {dashboard.isError?<Retry error={dashboard.error} retry={()=>void dashboard.refetch()}/>:null}
        {dashboard.isSuccess&&!dashboard.isFetching?<ul className="study-member-list">{dashboard.data.members.map(m=><li key={m.userId} data-group-member={m.userId}>
          <StudyDisclosure title={<StudyIdentity name={m.displayName} detail={m.access==="NOT_SHARED"?"Chưa chia sẻ với bạn.":"Mở các tuần được chia sẻ"}/>}>
          {m.access === "SHARED" ? <><p className="study-note mb-4">Chọn tuần theo lịch; quyền chia sẻ được kiểm tra lại khi mở.</p><StudyWeekList date={date} href={start=>`/daily/groups/${id}/reviews/${m.userId}?date=${start}&view=week`} /></> : <p className="study-note">Người này chưa cho phép bạn xem Daily trong nhóm.</p>}
          {m.access === "SHARED" ? <StudyDisclosure title={`Tiến độ ngày ${date}`}>
          <p className="study-note">{m.summary?m.summary.firstSubmittedAt?m.summary.onTime?"Nộp đúng giờ":"Nộp sau giờ":"Chưa nộp":"Chưa có kế hoạch đã lưu cho ngày này."}</p>
          {m.access === "SHARED" && m.summary ? <div className="study-person__progress"><StudyProgress label="Hoàn thành" completed={m.summary.completedCount} total={m.summary.totalCount} rate={m.summary.totalCount === 0 ? null : m.summary.completedCount / m.summary.totalCount} caption={m.summary.mustTotal === 0 ? "Bắt buộc: Không áp dụng" : `Bắt buộc ${m.summary.mustCompleted}/${m.summary.mustTotal}`} /></div> : null}
          <Link className="inline-flex min-h-11 items-center text-primary underline" to={`/daily/groups/${id}/reviews/${m.userId}?date=${date}`}>Xem ngày</Link>
          </StudyDisclosure> : null}
          </StudyDisclosure>
        </li>)}</ul>:null}
      </PageSection>
      {group.data.ownerId === userId ? <GroupAvatarEditor group={group.data} refresh={refresh} /> : null}
      <GroupConsent userId={userId} group={group.data} refresh={refresh}/>
    </div>:null}
  </div>;
}
