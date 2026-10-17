import { useState } from "react";
import AvatarPicker, { type AvatarMember } from "@/components/kokonutui/avatar-picker";
import TeamSelector from "@/components/kokonutui/team-selector";
import type { StudyRoomSnapshot } from "../types/study-room";

export function RoomMembers({ room, currentUserId, synchronized }: { room: StudyRoomSnapshot; currentUserId: string; synchronized: boolean }) {
  const [selectedId, setSelectedId] = useState(currentUserId);
  const [filter, setFilter] = useState<"all" | "online">("all");
  const members: AvatarMember[] = room.members.map(member => ({ id: member.userId, name: member.displayName, avatarUrl: member.avatarUrl, avatarCrop: member.avatarCrop,
    focusSeconds: member.focusSeconds, online: member.online,
    detail: !synchronized ? "Chờ đồng bộ" : !member.online ? "Tạm mất kết nối" : room.phase === "FOCUS" ? "Đang trong giờ tập trung" : "Đang trong giờ nghỉ",
    isHost: member.userId === room.ownerId, isSelf: member.userId === currentUserId }));
  const shown = filter === "online" ? members.filter(member => member.online) : members;
  const selected = shown.find(member => member.id === selectedId) ?? shown.find(member => member.isSelf) ?? shown[0];
  return <section className="room-team" aria-labelledby="room-team-title">
    <div className="room-section-heading"><div><h2 id="room-team-title">Bạn cùng học</h2><p>{room.activeMembers} đang có mặt{!synchronized && " · lần đồng bộ gần nhất"}</p></div></div>
    <TeamSelector members={members} value={filter} onChange={setFilter} />
    {selected ? <AvatarPicker members={shown} selectedId={selected.id} onSelect={setSelectedId} /> : <p className="study-room-note">{filter === "online" ? "Chưa có thành viên đang kết nối ở lần cập nhật gần nhất." : "Chưa có ai trong phòng. Bạn có thể là người đầu tiên."}</p>}
  </section>;
}
