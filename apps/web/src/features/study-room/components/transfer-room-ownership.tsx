import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StudyRoomSnapshot } from "../types/study-room";

export function TransferRoomOwnership({ room, disabled, onTransfer }: {
  room: StudyRoomSnapshot;
  disabled: boolean;
  onTransfer: (userId: string, onSuccess: () => void) => void;
}) {
  const selectId = useId();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const candidates = room.members.filter((member) => member.online && member.userId !== room.ownerId);
  const selected = candidates.find((member) => member.userId === selectedId);
  return (
    <section className="study-room-transfer">
      <h2>Chuyển quyền chủ phòng</h2>
      <p className="study-room-note">Giao quyền duyệt nhạc và quản lý phòng cho một thành viên đang có mặt. Bạn vẫn ở lại học cùng mọi người.</p>
      <Button variant="outline" disabled={disabled || !candidates.length} onClick={() => { setSelectedId(""); setOpen(true); }}>Chọn chủ phòng mới</Button>
      {!candidates.length && <p className="study-room-note">Cần có một thành viên khác đang kết nối để chuyển quyền.</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển quyền chủ phòng</DialogTitle>
            <DialogDescription>Chủ phòng mới có thể duyệt nhạc, đổi quy định và kết thúc buổi học. Sau khi chuyển, bạn sẽ trở thành thành viên.</DialogDescription>
          </DialogHeader>
          <label htmlFor={selectId}>Chủ phòng mới</label>
          <select id={selectId} className="w-full min-h-11 rounded-md border border-input bg-background px-3 text-foreground" value={selectedId} disabled={disabled} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Chọn thành viên đang có mặt</option>
            {candidates.map((member) => <option key={member.userId} value={member.userId}>{member.displayName}</option>)}
          </select>
          {selected && <p className="text-sm text-muted-foreground">Xác nhận giao phòng cho {selected.displayName}?</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button disabled={disabled || !selected} onClick={() => selected && onTransfer(selected.userId, () => setOpen(false))}>Xác nhận chuyển quyền</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
