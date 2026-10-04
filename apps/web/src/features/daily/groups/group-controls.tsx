import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyAccountWarning } from "../components/daily-account-gate";
import { groupService } from "./group.service";
import { groupError, type GroupDetail, type GroupSharing } from "./group-contract";
import { useDailyDraftLeave, useDailyEditorSession } from "../hooks/use-daily-editor";
import { isDailyConflict } from "../lib/daily-contract";
import { useGroupAction } from "./use-group-action";
export function GroupList({userId,warning,retry}:{userId:string;warning:boolean;retry:()=>void}) {
  const cache=useQueryClient();
  const navigate=useNavigate();
  const [name,setName]=useState("");
  const action=useGroupAction();
  const groups=useQuery({queryKey:["daily-groups",userId,"list"],queryFn:({signal})=>groupService.list(signal),retry:false,staleTime:0,gcTime:0});
  const invites=useQuery({queryKey:["daily-groups",userId,"invitations"],queryFn:({signal})=>groupService.invitations(userId,signal),retry:false,staleTime:0,gcTime:0});
  return <div className="page-shell">
    <DailyAccountWarning show={warning} onRetry={retry}/>
    <PageHeader title="Nhóm Daily" description="Tham gia bằng lời mời đích danh. Chia sẻ luôn tắt khi bắt đầu." actions={<Link className="underline" to="/daily">Daily của tôi</Link>}/>
    <Button type="button" variant="outline" disabled={action.busy||groups.isFetching||invites.isFetching} onClick={()=>void Promise.all([groups.refetch(),invites.refetch()])}>Tải lại nhóm và lời mời</Button>
    {action.notice?<p role="status">{action.notice}</p>:null}
    <PageSection title="Lời mời của bạn" description="Chấp nhận chỉ thêm bạn vào nhóm, không bật chia sẻ.">
      {invites.isFetching?<p role="status">Đang kiểm tra lời mời…</p>:null}
      {invites.isError?<Retry error={invites.error} retry={()=>void invites.refetch()}/>:null}
      {invites.isSuccess&&!invites.isFetching&&!invites.data.length?<p>Chưa có lời mời đang chờ.</p>:null}
      {invites.isSuccess&&!invites.isFetching?invites.data.map(inv=><div key={inv.id} data-group-invitation={inv.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
        <p className="min-w-0 break-words">{inv.groupName} — {inv.inviterDisplayName} mời bạn</p>
        <div className="flex gap-2"><Button type="button" disabled={action.busy} onClick={()=>void action.run(async signal=>{
          await groupService.respond(inv.id,"accept",signal);if(!signal.aborted)await cache.invalidateQueries({queryKey:["daily-groups",userId]});return "Đã tham gia nhóm. Chia sẻ của bạn đang tắt.";
        })}>Chấp nhận</Button><Button type="button" variant="outline" disabled={action.busy} onClick={()=>void action.run(async signal=>{
          await groupService.respond(inv.id,"decline",signal);if(!signal.aborted)await invites.refetch();return "Đã từ chối lời mời.";
        })}>Từ chối</Button></div>
      </div>):null}
    </PageSection>
    <PageSection title="Nhóm đang tham gia">
      {groups.isFetching?<p role="status">Đang kiểm tra nhóm…</p>:null}
      {groups.isError?<Retry error={groups.error} retry={()=>void groups.refetch()}/>:null}
      {groups.isSuccess&&!groups.isFetching&&!groups.data.length?<p>Chưa tham gia nhóm. Tạo nhóm hoặc chấp nhận lời mời ở trên.</p>:null}
      {groups.isSuccess&&!groups.isFetching?<ul className="divide-y">{groups.data.map(g=><li key={g.id}><Link className="block min-h-11 break-words py-3 text-primary underline" to={`/daily/groups/${g.id}`}>{g.name}</Link></li>)}</ul>:null}
    </PageSection>
    <PageSection title="Tạo nhóm">
      <form className="max-w-lg space-y-3" onSubmit={event=>{event.preventDefault();void action.run(async signal=>{
        const group=await groupService.create(name,signal);if(!signal.aborted){setName("");navigate(`/daily/groups/${group.id}`);}return "Đã tạo nhóm.";
      });}}>
        <Label htmlFor="group-name">Tên nhóm</Label><Input id="group-name" value={name} maxLength={120} disabled={action.busy} onChange={e=>setName(e.target.value)}/>
        <Button type="submit" disabled={action.busy||!name.trim()}>Tạo nhóm</Button>
      </form>
    </PageSection>
  </div>;
}
export function Retry({error,retry}:{error:unknown;retry:()=>void}) {
  return <div className="space-y-2"><p role="alert">{groupError(error)}</p><Button type="button" variant="outline" onClick={retry}>Thử lại</Button></div>;
}
export function GroupConsent({userId,group,refresh}:{userId:string;group:GroupDetail;refresh:()=>Promise<unknown>}) {
  const navigate=useNavigate();
  const cache=useQueryClient();
  const [settings,setSettings]=useState<GroupSharing>(group.mySharing);
  const [username,setUsername]=useState("");
  const draft=useDailyEditorSession();
  const blocker=useDailyDraftLeave(draft.session,draft.snapshot);
  const [notice,setNotice]=useState<string|null>(null);
  const inviteAction=useGroupAction();
  const active=useRef<AbortController|null>(null);
  useEffect(()=>()=>active.current?.abort(),[]);
  async function save() {
    const revision=draft.begin("save");if(revision===null)return;
    const controller=new AbortController();active.current=controller;setNotice(null);
    try {
      const saved=await groupService.sharing(group.id,settings,controller.signal);
      if(controller.signal.aborted)return;
      setSettings(saved);draft.finish("save",revision,"apply");setNotice("Đã lưu chia sẻ và người xem.");
      await refresh();
    } catch(error){if(!controller.signal.aborted){draft.finish("save",revision,"keep",isDailyConflict(error));setNotice(groupError(error));}}
    finally{if(active.current===controller)active.current=null;}
  }
  return <>
    {blocker.state==="blocked"?<div role="alert" className="space-y-3 border p-4"><p>Chia sẻ đang chỉnh chưa được lưu. Rời màn này?</p><Button type="button" onClick={()=>blocker.reset()}>Ở lại</Button><Button type="button" variant="outline" disabled={draft.busy} onClick={()=>blocker.proceed()}>Bỏ thay đổi và rời</Button></div>:null}
    <PageSection title="Chia sẻ của tôi" description="Áp dụng cả kế hoạch, nhận xét tuần và minh chứng cũ. Không thay đổi bản Daily cá nhân.">
      {notice?<p role="status">{notice}</p>:null}
      <form className="max-w-xl space-y-4" onSubmit={event=>{event.preventDefault();void save();}}>
        <fieldset disabled={draft.busy} className="space-y-4">
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={settings.shareDaily} onChange={e=>draft.edit(()=>setSettings({...settings,shareDaily:e.target.checked}))}/>Cho phép xem Daily của tôi trong nhóm</label>
          <Label htmlFor="group-sharing-mode">Người được xem</Label>
          <select id="group-sharing-mode" className="h-11 w-full rounded-lg border bg-background px-3" value={settings.sharingMode} onChange={e=>draft.edit(()=>setSettings({...settings,sharingMode:e.target.value as GroupSharing["sharingMode"]}))}>
            <option value="GROUP">Tất cả thành viên đang tham gia</option><option value="SELECTED_MEMBERS">Chỉ người tôi chọn</option>
          </select>
          <fieldset className="space-y-1"><legend className="text-sm font-medium">Danh sách người xem đã chọn</legend>
            <p className="text-sm text-muted-foreground">Danh sách này chỉ cấp quyền khi chọn “Chỉ người tôi chọn” và bật chia sẻ.</p>
            {group.members.filter(m=>m.userId!==userId).map(m=><label key={m.userId} className="flex min-h-11 items-center gap-3 break-words">
              <input type="checkbox" aria-label={`Cho ${m.displayName} xem`} checked={settings.selectedViewerIds.includes(m.userId)} onChange={e=>draft.edit(()=>setSettings({...settings,selectedViewerIds:e.target.checked?[...settings.selectedViewerIds,m.userId]:settings.selectedViewerIds.filter(id=>id!==m.userId)}))}/>{m.displayName}
            </label>)}
          </fieldset>
        </fieldset>
        <Button type="submit" disabled={draft.busy||inviteAction.busy||!draft.dirty}>Lưu chia sẻ</Button>
        <Button type="button" variant="outline" disabled={draft.busy||inviteAction.busy} onClick={()=>{
          if(draft.dirty&&!window.confirm("Thay bản chia sẻ đang chỉnh bằng bản trên máy chủ?"))return;
          const revision=draft.begin("reload");if(revision===null)return;
          const controller=new AbortController();active.current=controller;
          void groupService.detail(group.id,controller.signal).then(server=>{
            if(controller.signal.aborted)return;
            setSettings(server.mySharing);draft.finish("reload",revision,"apply");setNotice("Đã tải chia sẻ trên máy chủ.");
          }).catch(error=>{if(!controller.signal.aborted){draft.finish("reload",revision,"keep");setNotice(groupError(error));}})
          .finally(()=>{if(active.current===controller)active.current=null;});
        }}>Tải chia sẻ đã lưu</Button>
        <p role="status" className="text-sm">{draft.busy?"Đang lưu chia sẻ…":draft.dirty?"Có thay đổi chưa lưu.":group.mySharing.shareDaily?"Chia sẻ đã lưu đang bật.":"Chia sẻ đã lưu đang tắt."}</p>
      </form>
    </PageSection>
    {group.ownerId===userId?<PageSection title="Mời thành viên" description="Nhập tên đăng nhập đã biết. Người nhận phải tự chấp nhận. Không gửi thông báo ra ngoài.">
      <form className="max-w-lg space-y-3" onSubmit={e=>{e.preventDefault();void inviteAction.run(async signal=>{
        await groupService.invite(group.id,username,signal);if(!signal.aborted)setUsername("");return "Đã lưu lời mời đang chờ.";
      });}}><Label htmlFor="group-target">Tên đăng nhập người được mời</Label><Input id="group-target" value={username} disabled={inviteAction.busy||draft.busy} maxLength={64} onChange={e=>setUsername(e.target.value)}/>
        <Button type="submit" disabled={inviteAction.busy||draft.busy||!username.trim()}>Gửi lời mời</Button>
      </form>{inviteAction.notice?<p role="status">{inviteAction.notice}</p>:null}
    </PageSection>:null}
    <PageSection title="Rời nhóm" description="Quyền xem và chia sẻ trong nhóm bị thu hồi. Daily và các bản đã lưu của bạn không bị xóa.">
      <Button type="button" variant="outline" disabled={draft.busy||inviteAction.busy} onClick={()=> {
        if(!window.confirm("Rời nhóm và bỏ thay đổi chia sẻ chưa lưu?"))return;
        void inviteAction.run(async signal=>{
          const revision=draft.begin("save");if(revision===null)return "Chờ thao tác hiện tại hoàn tất.";
          try {
            await groupService.leave(group.id,signal);
            if(!signal.aborted){
              // Only the successful, explicitly confirmed leave discards this sharing draft.
              draft.finish("save",revision,"apply");
              await cache.cancelQueries({queryKey:["daily-groups",userId]});cache.removeQueries({queryKey:["daily-groups",userId]});navigate("/daily/groups");
            }
          } catch(error){if(!signal.aborted)draft.finish("save",revision,"keep");throw error;}
          return "Đã rời nhóm.";
        });
      }}>Rời nhóm</Button>
    </PageSection>
  </>;
}
