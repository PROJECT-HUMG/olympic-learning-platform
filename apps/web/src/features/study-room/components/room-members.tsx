import { useRef, useState } from "react";
import AvatarPicker, { MemberAvatar, type AvatarMember } from "@/components/kokonutui/avatar-picker";
import TeamSelector from "@/components/kokonutui/team-selector";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StudyRoomSnapshot } from "../types/study-room";

export function RoomMembers({ room, currentUserId, synchronized }: { room: StudyRoomSnapshot; currentUserId: string; synchronized: boolean }) {
  const [selectedId, setSelectedId] = useState<string>();
  const opener = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const members: AvatarMember[] = room.members.map(member => ({ id: member.userId, name: member.displayName, avatarUrl: member.avatarUrl, avatarCrop: member.avatarCrop,
    detail: !synchronized ? "Chờ đồng bộ" : !member.online ? "Tạm mất kết nối" : room.phase === "FOCUS" ? "Đang trong giờ tập trung" : "Đang trong giờ nghỉ",
    isHost: member.userId === room.ownerId, isSelf: member.userId === currentUserId }));
  const selected = members.find(member => member.id === selectedId);
  const recorded = room.members.find(member => member.userId === selectedId);
  return <section className="room-team" aria-labelledby="room-team-title">
    <div className="room-section-heading"><div><h2 id="room-team-title" ref={heading} tabIndex={-1}>Bạn cùng học</h2><p>{room.activeMembers} đang có mặt{!synchronized && " · lần đồng bộ gần nhất"}</p></div><TeamSelector members={members} /></div>
    {members.length ? <AvatarPicker members={members} onSelect={(member, button) => { opener.current = button; setSelectedId(member.id); }} /> : <p className="study-room-note">Chưa có ai trong phòng. Bạn có thể là người đầu tiên.</p>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelectedId(undefined); }}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); else heading.current?.focus(); }}>
      <DialogHeader><DialogTitle>Bạn cùng học</DialogTitle><DialogDescription>Thông tin thành viên trong phòng này.</DialogDescription></DialogHeader>
      {selected && <div className="room-member-detail"><MemberAvatar member={selected} /><h3>{selected.name}{selected.isSelf && " (bạn)"}</h3><p>{selected.isHost ? "Chủ phòng" : "Thành viên"} · {selected.detail}</p><strong>{Math.floor((recorded?.focusSeconds ?? 0) / 60)} phút tập trung</strong><p className="study-room-note">Thời gian được phòng ghi nhận khi còn kết nối, không phải số việc đã hoàn thành.{!synchronized && " Đây là dữ liệu ở lần đồng bộ gần nhất."}</p></div>}
    </DialogContent></Dialog>
  </section>;
}
