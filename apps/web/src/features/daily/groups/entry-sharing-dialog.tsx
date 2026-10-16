import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DailyDialogHeader } from "../ui/daily-dialog-header";
import { useDailyConfirm } from "../ui/use-daily-confirm";
import { groupService } from "./group.service";
import { groupError, readEntrySharing, type EntryAudience } from "./group-contract";

export function EntrySharingDialog({ userId, planId, version, date, blocked, onSave }: {
  userId: string; planId: string | null; version: number | null; date: string; blocked: boolean;
  onSave: (audiences: EntryAudience[]) => Promise<void>;
}) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<EntryAudience[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, confirmation } = useDailyConfirm();
  const data = useQuery({
    queryKey: ["daily-entry-sharing", userId, planId, version], enabled: !!planId,
    retry: false, staleTime: 0, gcTime: 0,
    queryFn: async ({ signal }) => readEntrySharing((await apiClient.get(`/daily/plans/${planId}/sharing`, { signal })).data, planId!),
  });
  const groups = useQuery({
    queryKey: ["daily-entry-sharing-groups", userId], enabled: open,
    retry: false, staleTime: 0, gcTime: 0,
    queryFn: async ({ signal }) => {
      const list = await groupService.list(signal);
      return Promise.all(list.map(g => groupService.detail(g.id, signal)));
    },
  });
  const selected = selection ?? data.data?.audiences ?? [];
  async function changeOpen(next: boolean) {
    if (busy) return;
    if (!next && selection && !await confirm("Bỏ thay đổi người xem chưa lưu?", { title: "Chia sẻ chưa lưu", action: "Bỏ thay đổi" })) return;
    setOpen(next); setSelection(null); setError(null);
  }
  function choose(group: string, people: string[]) {
    setSelection([...selected.filter(a => a.groupId !== group), ...(people.length ? [{ groupId: group, viewerIds: people }] : [])]);
    setError(null);
  }
  return <>
    {confirmation}
    <Dialog open={open} onOpenChange={next => { void changeOpen(next); }}>
      <div className="daily-sharing-control"><span className="study-note" role="status">{data.isFetching ? "Đang kiểm tra người xem…" : data.isError ? "Chưa kiểm tra được người xem" : data.data?.audiences.length ? `Đã chia sẻ · ${data.data.audiences.length} nhóm` : "Chỉ mình tôi"}</span><DialogTrigger asChild><Button type="button" disabled={blocked || !planId} title={!planId ? "Thêm việc hoặc ghi nhìn lại để lưu ngày này trước" : undefined}><Share2 size={16} aria-hidden="true" />Chia sẻ ngày</Button></DialogTrigger></div>
      <DialogContent className="daily-dialog" showCloseButton={false} onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onInteractOutside={e => { if (busy) e.preventDefault(); }}>
        <DailyDialogHeader busy={busy}><DialogTitle>Chia sẻ ngày {date}</DialogTitle><DialogDescription>Chỉ ngày này và minh chứng của ngày này. Những ngày khác vẫn riêng tư.</DialogDescription></DailyDialogHeader>
        {data.isPending || data.isFetching || groups.isPending || groups.isFetching ? <p role="status">Đang tải nhóm và người xem…</p> : null}
        {data.isError || groups.isError ? <div role="alert"><p>{groupError(data.error ?? groups.error)}</p><Button type="button" variant="outline" onClick={() => { void data.refetch(); void groups.refetch(); }}>Thử lại</Button></div> : null}
        {data.data && groups.data && !data.isError && !groups.isError && !data.isFetching && !groups.isFetching ? <>
          <p className="study-note">Chọn nhóm để chọn nhanh các thành viên hiện tại, hoặc chỉ chọn vài người. Sau khi chia sẻ, họ cũng thấy các chỉnh sửa được lưu của ngày này.</p>
          {!groups.data.length ? <p>Bạn chưa tham gia nhóm nào. Tạo hoặc nhận lời mời tại Nhóm Daily trước khi chia sẻ.</p> : null}
          <div className="daily-audience-list">
            {groups.data.map(group => {
              const people = group.members.filter(m => m.userId !== userId);
              const ids = selected.find(a => a.groupId === group.id)?.viewerIds ?? [];
              return <fieldset key={group.id} disabled={busy} className="daily-audience-group">
                <legend>{group.name}</legend>
                <label className="study-selection"><input type="checkbox" checked={people.length > 0 && people.every(p => ids.includes(p.userId))} disabled={!people.length} onChange={e => choose(group.id, e.target.checked ? people.map(p => p.userId) : [])} />Tất cả {people.length} thành viên hiện tại</label>
                {people.map(person => <label key={person.userId} className="study-selection"><input type="checkbox" checked={ids.includes(person.userId)} onChange={e => choose(group.id, e.target.checked ? [...ids, person.userId] : ids.filter(id => id !== person.userId))} />{person.displayName}</label>)}
              </fieldset>;
            })}
          </div>
          <p className="study-note">Bỏ chọn tất cả rồi lưu để thu hồi chia sẻ. Người tham gia nhóm sau này không tự có quyền xem.</p>
          {error ? <p role="alert" className="study-notice">{error} Nếu ngày đã thay đổi, đóng hộp thoại và tải bản trên máy chủ trước khi thử lại.</p> : null}
          <div className="daily-dialog-actions"><Button type="button" variant="outline" disabled={busy} onClick={() => void changeOpen(false)}>Hủy</Button><Button type="button" disabled={busy || blocked} onClick={async () => {
            setBusy(true); setError(null);
            try { await onSave(selected); await cache.invalidateQueries({ queryKey: ["daily-entry-sharing", userId, planId] }); setOpen(false); setSelection(null); }
            catch (e) { setError(groupError(e)); }
            finally { setBusy(false); }
          }}>{busy ? "Đang lưu người xem…" : selected.length ? "Lưu chia sẻ" : "Giữ riêng tư"}</Button></div>
        </> : null}
      </DialogContent>
    </Dialog>
  </>;
}
