import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDailyDraftLeave, useDailyEditorSession } from "../hooks/use-daily-editor";
import { isDailyConflict } from "../lib/daily-contract";
import { groupService } from "./group.service";
import { groupAccessLost, groupError, type Contribution } from "./group-contract";
import { Retry } from "./group-controls";
import { StudyDisclosure, StudyEmpty, StudyIdentity } from "../ui/study-notebook";

interface Scope { userId:string; groupId:string; ownerId:string; kind:"plans"|"weeks"; reviewId:string }
export function FeedbackPanel(props:Scope) {
  const query=useQuery({queryKey:["daily-groups",props.userId,props.groupId,props.ownerId,props.kind,props.reviewId,"feedback"],
    queryFn:({signal})=>groupService.feedback(props.groupId,props.ownerId,props.kind,props.reviewId,signal),
    retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:"always"});
  const rows=query.isSuccess&&!query.isFetching?query.data.contributions:[];
  const revoked=query.isError&&groupAccessLost(query.error);
  const own=query.data?.contributions.find(c=>c.authorId===props.userId)??null;
  return <StudyDisclosure title="Góp ý trong nhóm" defaultOpen description="Ghi nhận một điều làm tốt hoặc một gợi ý cho lần tới. Mỗi người có một bản góp ý có thể sửa; chỉ hiện người còn quyền xem.">
    {query.isFetching?<p role="status">Đang kiểm tra người góp ý…</p>:null}
    {query.isError?<Retry error={query.error} retry={()=>void query.refetch()}/>:null}
    {query.isSuccess&&!query.isFetching?<p className="study-note" data-contributor-count={rows.length}>Người góp ý hiện được phép: {rows.length}</p>:null}
    {query.isSuccess&&!query.isFetching&&!rows.length ? <StudyEmpty title="Chưa có góp ý đang hiển thị.">Góp ý được giữ riêng trong đúng nhóm và theo quyền xem hiện tại.</StudyEmpty> : null}
    <ul>{rows.map(c=><li key={c.id} className="study-feedback"><StudyIdentity name={c.authorDisplayName}/><p className="study-feedback__text">{c.text}</p></li>)}</ul>
    {!revoked&&query.data&&props.userId!==props.ownerId?<div hidden={query.isFetching||query.isError}><FeedbackEditor {...props} initial={own} latest={own} refresh={()=>query.refetch()}/></div>:null}
    {props.userId===props.ownerId?<p className="text-sm text-muted-foreground">Bạn đọc góp ý trong nhóm ở đây. Chỉnh nhận xét của mình tại Daily cá nhân.</p>:null}
  </StudyDisclosure>;
}
function FeedbackEditor(props:Scope&{initial:Contribution|null;latest:Contribution|null;refresh:()=>Promise<unknown>}) {
  const [text,setText]=useState(props.initial?.text??"");
  const [saved,setSaved]=useState<Contribution|null>(props.initial);
  const [notice,setNotice]=useState<string|null>(null);
  const draft=useDailyEditorSession();
  const blocker=useDailyDraftLeave(draft.session,draft.snapshot);
  const active=useRef<AbortController|null>(null);
  useEffect(()=>()=>active.current?.abort(),[]);
  async function run(operation:"save"|"reload",remove=false) {
    const revision=draft.begin(operation);if(revision===null)return;
    const controller=new AbortController();active.current=controller;setNotice(null);
    try {
      if(operation==="reload") {
        const result=await groupService.feedback(props.groupId,props.ownerId,props.kind,props.reviewId,controller.signal);
        if(controller.signal.aborted)return;
        const own=result.contributions.find(c=>c.authorId===props.userId)??null;
        setSaved(own);setText(own?.text??"");setNotice("Đã tải lại góp ý của bạn.");
      } else if(remove&&saved) {
        await groupService.removeFeedback(props.groupId,props.ownerId,props.kind,props.reviewId,saved.version,controller.signal);
        if(controller.signal.aborted)return;
        setSaved(null);setText("");setNotice("Đã xóa góp ý của bạn.");
      } else {
        const own=await groupService.saveFeedback(props.groupId,props.ownerId,props.kind,props.reviewId,text,saved?.version??null,controller.signal);
        if(controller.signal.aborted)return;
        if(own.authorId!==props.userId)throw new Error("Dữ liệu nhóm không đúng hợp đồng.");
        setSaved(own);setText(own.text);setNotice("Đã lưu góp ý của bạn.");
      }
      draft.finish(operation,revision,"apply");await props.refresh();
    }catch(error){if(!controller.signal.aborted){draft.finish(operation,revision,"keep",isDailyConflict(error));setNotice(groupError(error));}}
    finally{if(active.current===controller)active.current=null;}
  }
  return <div className="space-y-3 border-t pt-4">
    <h3 className="text-sm font-semibold">{saved ? "Sửa góp ý của bạn" : "Viết góp ý của bạn"}</h3>
    {blocker.state==="blocked"?<div role="alert" className="study-notice"><p>Góp ý đang nhập chưa được lưu. Rời màn này?</p><Button type="button" onClick={()=>blocker.reset()}>Ở lại</Button><Button type="button" variant="outline" disabled={draft.busy} onClick={()=>blocker.proceed()}>Bỏ bản nhập và rời</Button></div>:null}
    {notice?<p role="status" className="study-context">{notice}</p>:null}
    {props.latest?.version!==saved?.version?<p className="study-notice">Góp ý trên máy chủ đã đổi. Bản đang nhập được giữ; tải lại để dùng bản mới.</p>:null}
    <form className="max-w-2xl space-y-3" onSubmit={e=>{e.preventDefault();void run("save");}}>
      <Label htmlFor="daily-feedback-text">Góp ý của tôi</Label><Textarea id="daily-feedback-text" rows={5} maxLength={4000} aria-describedby="daily-feedback-guidance daily-feedback-length" value={text} disabled={draft.busy} onChange={e=>draft.edit(()=>setText(e.target.value))}/>
      <p id="daily-feedback-guidance" className="study-note">Ghi nhận xét hoặc gợi ý; có thể xuống dòng. Tên của bạn luôn hiện với người nhận.</p>
      <p id="daily-feedback-length" className="study-note">{text.length}/4000 ký tự</p>
      <p className="study-note" role="status">{draft.busy ? "Đang xử lý góp ý…" : draft.dirty ? "Bản đang nhập chưa được lưu." : saved ? "Góp ý của bạn đã được lưu." : "Chưa gửi góp ý."}</p>
      <div className="study-actions">
        <Button type="submit" disabled={draft.busy||!text.trim()||!draft.dirty}>Lưu góp ý</Button>
        <Button type="button" variant="outline" disabled={draft.busy} onClick={()=>{if(draft.dirty&&!window.confirm("Thay bản đang nhập bằng góp ý trên máy chủ?"))return;void run("reload");}}>Tải lại góp ý</Button>
        {saved?<Button type="button" variant="outline" disabled={draft.busy} onClick={()=>{if(window.confirm("Xóa góp ý của bạn?"))void run("save",true);}}>Xóa góp ý</Button>:null}
      </div>
    </form>
  </div>;
}
