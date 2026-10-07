import { NativeSelect } from "@/components/ui/native-select";
import { useDailyConfirm } from "../ui/use-daily-confirm";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Mail, Plus, RefreshCw, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyAccountWarning } from "../components/daily-account-gate";
import { groupService } from "./group.service";
import { groupError, type GroupDetail, type GroupSharing } from "./group-contract";
import { useDailyDraftLeave, useDailyEditorSession } from "../hooks/use-daily-editor";
import { isDailyConflict } from "../lib/daily-contract";
import { useGroupAction } from "./use-group-action";
import { StudyAreaNav, StudyDisclosure, StudyEmpty, StudyIdentity } from "../ui/study-notebook";
import { GroupAvatarImage } from "./group-avatar";
import { openStudySection } from "../ui/study-section";
import "./groups.css";

export function GroupList({userId,warning,retry}:{userId:string;warning:boolean;retry:()=>void}) {
  const cache=useQueryClient();
  const navigate=useNavigate();
  const [name,setName]=useState("");
  const createDialogRef=useRef<HTMLDialogElement|null>(null);
  const action=useGroupAction();
  const groups=useQuery({queryKey:["daily-groups",userId,"list"],queryFn:({signal})=>groupService.list(signal),retry:false,staleTime:0,gcTime:0});
  const invites=useQuery({queryKey:["daily-groups",userId,"invitations"],queryFn:({signal})=>groupService.invitations(userId,signal),retry:false,staleTime:0,gcTime:0});

  const pendingCount = invites.isSuccess && !invites.isFetching ? invites.data.length : 0;
  const invitationsFirst = invites.isFetching || invites.isError || pendingCount > 0;
  const invitationsSection = <section id="invitations-section" className="group-invitations" aria-label="Lời mời">
    {invites.isSuccess && !invites.isFetching && !pendingCount ? (
      <p className="group-invitations__empty study-note" role="status"><Mail size={16} aria-hidden="true" />Chưa có lời mời đang chờ.</p>
    ) : <>
      <h2><Mail size={18} aria-hidden="true" />Lời mời của bạn{pendingCount > 0 ? <span className="study-note">({pendingCount})</span> : null}</h2>
      {invites.isFetching ? <p role="status" className="study-note">Đang kiểm tra lời mời…</p> : null}
      {invites.isError ? <Retry error={invites.error} retry={() => void invites.refetch()} /> : null}
      {invites.isSuccess && !invites.isFetching && pendingCount > 0 ? <>
        <p className="study-note">Chấp nhận chỉ thêm bạn vào nhóm, không bật chia sẻ.</p>
        <ul className="group-invite-list">{invites.data.map(inv => <li key={inv.id} className="group-invite-card" data-group-invitation={inv.id}>
          <StudyIdentity name={inv.groupName} detail={`${inv.inviterDisplayName} mời bạn`} />
          <div className="group-invite-card__actions">
            <Button type="button" disabled={action.busy} onClick={() => void action.run(async signal => {
              await groupService.respond(inv.id, "accept", signal); if (!signal.aborted) await cache.invalidateQueries({queryKey:["daily-groups",userId]}); return "Đã tham gia nhóm. Chia sẻ của bạn đang tắt.";
            })}>Chấp nhận</Button>
            <Button type="button" variant="outline" disabled={action.busy} onClick={() => void action.run(async signal => {
              await groupService.respond(inv.id, "decline", signal); if (!signal.aborted) await invites.refetch(); return "Đã từ chối lời mời.";
            })}>Từ chối</Button>
          </div>
        </li>)}</ul>
      </> : null}
    </>}
  </section>;

  return <div className="page-shell study-notebook">
    <StudyAreaNav area="group" />
    <DailyAccountWarning show={warning} onRetry={retry}/>
    <PageHeader
      title="Nhóm Daily"
      description="Một nơi để cùng học và góp ý. Tham gia bằng lời mời đích danh; Daily vẫn riêng tư cho tới khi bạn chọn chia sẻ."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={action.busy||groups.isFetching||invites.isFetching}
            onClick={()=>void Promise.all([groups.refetch(),invites.refetch()])}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tải lại
          </Button>
          <Button
            type="button"
            className="gap-1.5"
            onClick={() => createDialogRef.current?.showModal()}
          >
            <Plus className="h-4 w-4" /> Tạo nhóm mới
          </Button>
        </div>
      }
    />

    {/* Create group dialog */}
    <dialog
      ref={createDialogRef}
      aria-labelledby="create-group-title"
      className="study-dialog rounded-xl border bg-card p-6 shadow-xl text-card-foreground m-auto"
    >
      <div className="flex items-center justify-between pb-3 border-b mb-4">
        <div>
          <h2 id="create-group-title" className="text-base font-semibold text-foreground">Tạo nhóm Daily mới</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Đặt một tên dễ nhận ra, rồi mời những người bạn muốn học cùng.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Đóng tạo nhóm"
          onClick={() => createDialogRef.current?.close()}
        >
          ✕
        </Button>
      </div>
      <form
        className="space-y-4"
        onSubmit={event => {
          event.preventDefault();
          void action.run(async signal => {
            const group = await groupService.create(name, signal);
            if (!signal.aborted) {
              setName("");
              createDialogRef.current?.close();
              navigate(`/daily/groups/${group.id}`);
            }
            return "Đã tạo nhóm.";
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="group-name">Tên nhóm</Label>
          <Input
            id="group-name"
            value={name}
            maxLength={120}
            disabled={action.busy}
            onChange={e => setName(e.target.value)}
            placeholder="Ví dụ: Nhóm Olympic Tin học..."
            autoFocus
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => createDialogRef.current?.close()}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={action.busy || !name.trim()}
          >
            Tạo nhóm
          </Button>
        </div>
      </form>
    </dialog>

    {invitationsFirst ? invitationsSection : null}

    {/* Groups card grid */}
    {groups.isFetching?<p role="status" className="text-sm text-muted-foreground py-4">Đang kiểm tra nhóm…</p>:null}
    {groups.isError?<Retry error={groups.error} retry={()=>void groups.refetch()}/>:null}
    {groups.isSuccess&&!groups.isFetching&&!groups.data.length?<StudyEmpty title="Chưa tham gia nhóm nào.">Tạo nhóm mới hoặc tham gia qua lời mời. Daily chỉ chia sẻ khi bạn bật.</StudyEmpty>:null}
    {groups.isSuccess&&!groups.isFetching&&groups.data.length > 0 ? <ul className="group-card-grid">{groups.data.map(g=><li key={g.id} className="group-card">
      <Link className="group-card__link" to={`/daily/groups/${g.id}`}>
        <span className="group-card__avatar"><GroupAvatarImage group={g} /></span>
        <div className="group-card__info">
          <span className="group-card__name">{g.name}</span>
          <span className="group-card__meta">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Nhóm học tập
          </span>
        </div>
        <ChevronRight className="h-5 w-5 group-card__chevron" aria-hidden="true" />
      </Link>
    </li>)}</ul>:null}

    {action.notice?<p role="status" className="study-context">{action.notice}</p>:null}

    {!invitationsFirst ? invitationsSection : null}
  </div>;
}
export function Retry({error,retry}:{error:unknown;retry:()=>void}) {
  return <div className="study-notice"><p role="alert">{groupError(error)}</p><Button type="button" variant="outline" className="self-start" onClick={retry}>Thử lại</Button></div>;
}
export function GroupConsent({userId,group,refresh}:{userId:string;group:GroupDetail;refresh:()=>Promise<unknown>}) {
  const navigate=useNavigate();
  const cache=useQueryClient();
  const [settings,setSettings]=useState<GroupSharing>(group.mySharing);
  const [username,setUsername]=useState("");
  const { confirm, confirmation } = useDailyConfirm();
  const draft=useDailyEditorSession();
  const blocker=useDailyDraftLeave(draft.session,draft.snapshot);
  useEffect(()=>{if(blocker.state==="blocked")openStudySection("group-sharing","group-sharing-leave");},[blocker.state]);
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
    {confirmation}
    <StudyDisclosure id="group-sharing" title={draft.dirty ? "Chia sẻ của tôi · Chưa lưu" : "Chia sẻ của tôi"} description="Áp dụng cả kế hoạch, nhận xét tuần và minh chứng cũ. Không thay đổi bản Daily cá nhân.">
      {blocker.state==="blocked"?<div id="group-sharing-leave" role="alert" className="study-notice"><p>Chia sẻ đang chỉnh chưa được lưu. Rời màn này?</p><Button type="button" onClick={()=>blocker.reset()}>Ở lại</Button><Button type="button" variant="outline" disabled={draft.busy} onClick={()=>blocker.proceed()}>Bỏ thay đổi và rời</Button></div>:null}
      {notice?<p role="status" className="study-context">{notice}</p>:null}
      <p className="study-context">{group.mySharing.shareDaily ? "Chia sẻ đã lưu: đang bật." : "Chia sẻ đã lưu: đang tắt."} Thay đổi bên dưới chỉ có hiệu lực sau khi bấm Lưu chia sẻ.</p>
      <form className="max-w-xl space-y-4" onSubmit={event=>{event.preventDefault();void save();}}>
        <fieldset disabled={draft.busy} className="space-y-4">
          <label className="study-selection"><input type="checkbox" checked={settings.shareDaily} onChange={e=>draft.edit(()=>setSettings({...settings,shareDaily:e.target.checked}))}/>Cho phép xem Daily của tôi trong nhóm</label>
          <Label htmlFor="group-sharing-mode">Người được xem</Label>
          <NativeSelect id="group-sharing-mode" value={settings.sharingMode} onChange={e=>draft.edit(()=>setSettings({...settings,sharingMode:e.target.value as GroupSharing["sharingMode"]}))}>
            <option value="GROUP">Tất cả thành viên đang tham gia</option><option value="SELECTED_MEMBERS">Chỉ người tôi chọn</option>
          </NativeSelect>
          <fieldset hidden={settings.sharingMode !== "SELECTED_MEMBERS"} className="space-y-1"><legend className="text-sm font-medium">Danh sách người xem đã chọn</legend>
            <p className="text-sm text-muted-foreground">Danh sách này chỉ cấp quyền khi chọn "Chỉ người tôi chọn" và bật chia sẻ.</p>
            {group.members.filter(m=>m.userId!==userId).map(m=><label key={m.userId} className="study-selection">
              <input type="checkbox" aria-label={`Cho ${m.displayName} xem`} checked={settings.selectedViewerIds.includes(m.userId)} onChange={e=>draft.edit(()=>setSettings({...settings,selectedViewerIds:e.target.checked?[...settings.selectedViewerIds,m.userId]:settings.selectedViewerIds.filter(id=>id!==m.userId)}))}/>
              {m.displayName}
            </label>)}
          </fieldset>
        </fieldset>
        <div className="study-actions"><Button type="submit" disabled={draft.busy||inviteAction.busy||!draft.dirty}>Lưu chia sẻ</Button>
        <Button type="button" variant="outline" disabled={draft.busy||inviteAction.busy} onClick={async ()=>{
          if(draft.dirty&&!await confirm("Thay bản chia sẻ đang chỉnh bằng bản trên máy chủ?"))return;
          const revision=draft.begin("reload");if(revision===null)return;
          const controller=new AbortController();active.current=controller;
          void groupService.detail(group.id,controller.signal).then(async server=>{
            if(controller.signal.aborted)return;
            setSettings(server.mySharing);draft.finish("reload",revision,"apply");setNotice("Đã tải chia sẻ trên máy chủ.");
            await refresh();
          }).catch(error=>{if(!controller.signal.aborted){draft.finish("reload",revision,"keep");setNotice(groupError(error));}})
          .finally(()=>{if(active.current===controller)active.current=null;});
        }}>Tải chia sẻ đã lưu</Button></div>
        <p role="status" className="study-note">{draft.busy?"Đang lưu chia sẻ…":draft.dirty?"Có thay đổi chưa lưu.":group.mySharing.shareDaily?"Chia sẻ đã lưu đang bật.":"Chia sẻ đã lưu đang tắt."}</p>
      </form>
    </StudyDisclosure>
    {group.ownerId===userId?<StudyDisclosure title="Mời thành viên" description="Nhập tên đăng nhập đã biết. Người nhận phải tự chấp nhận. Không gửi thông báo ra ngoài.">
      <form className="max-w-lg space-y-3" onSubmit={e=>{e.preventDefault();void inviteAction.run(async signal=>{
        await groupService.invite(group.id,username,signal);if(!signal.aborted)setUsername("");return "Đã lưu lời mời đang chờ.";
      });}}><Label htmlFor="group-target">Tên đăng nhập người được mời</Label><Input id="group-target" value={username} disabled={inviteAction.busy||draft.busy} maxLength={64} onChange={e=>setUsername(e.target.value)}/>
        <Button type="submit" disabled={inviteAction.busy||draft.busy||!username.trim()}>Gửi lời mời</Button>
      </form>{inviteAction.notice?<p role="status">{inviteAction.notice}</p>:null}
    </StudyDisclosure>:null}
    <StudyDisclosure title="Rời nhóm" description="Quyền xem và chia sẻ trong nhóm bị thu hồi. Daily và các bản đã lưu của bạn không bị xóa.">
      <Button type="button" variant="outline" disabled={draft.busy||inviteAction.busy} onClick={async () => {
        if(!await confirm("Rời nhóm và bỏ thay đổi chia sẻ chưa lưu?"))return;
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
      }} className="text-destructive">Rời nhóm</Button>
    </StudyDisclosure>
  </>;
}
