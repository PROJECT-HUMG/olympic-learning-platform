import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { studyRoomService } from "../services/study-room.service";
import type { CreateRoomInput } from "../types/study-room";
import { RoomPolicyFields } from "./room-policy-fields";
import { StudyRoomAccess } from "./study-room-access";
import "./study-room.css";

export function StudyRoomsLobby() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateRoomInput>({ name: "", focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, requestPolicy: "AFTER_FOCUS", minimumStudyMinutes: 15 });
  const rooms = useQuery({
    queryKey: ["study-rooms", user.data?.id],
    queryFn: ({ signal }) => studyRoomService.list(signal),
    enabled: !!user.data,
    refetchInterval: 15000,
  });
  const create = useMutation({
    mutationFn: studyRoomService.create,
    onSuccess: (room) => navigate(`${ROUTES.STUDY_ROOMS}/${room.id}`),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate({ ...form, name: form.name.trim() });
  }

  if (user.isPending) return <p role="status">Đang mở góc học tập…</p>;
  if (!user.data) return <StudyRoomAccess />;

  return (
    <section className="study-rooms-lobby">
      <header className="study-rooms-lobby__heading">
        <div><h2>Học cùng nhau.</h2><p>Một chiếc bàn chung, một chút lofi, một việc cần làm xong.</p></div>
        <Button onClick={() => setCreating((value) => !value)} aria-expanded={creating} aria-controls="create-study-room"><Plus aria-hidden="true" /> {creating ? "Đóng biểu mẫu" : "Tạo phòng"}</Button>
      </header>
      {creating && (
        <form id="create-study-room" className="study-room-create" onSubmit={submit}>
          <h3>Bàn học mới</h3>
          <label htmlFor="study-room-name">Tên phòng</label>
          <input id="study-room-name" required maxLength={80} value={form.name} placeholder="Ví dụ: Cùng ôn Giải tích" onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <fieldset className="study-room-create__rhythm">
            <legend>Nhịp học và nghỉ (phút)</legend>
            <label>Học<input type="number" required min="15" max="90" value={form.focusMinutes} onChange={(event) => setForm({ ...form, focusMinutes: event.target.valueAsNumber })} /></label>
            <label>Nghỉ ngắn<input type="number" required min="3" max="30" value={form.breakMinutes} onChange={(event) => setForm({ ...form, breakMinutes: event.target.valueAsNumber })} /></label>
            <label>Nghỉ dài<input type="number" required min={Math.max(10, form.breakMinutes || 0)} max="45" value={form.longBreakMinutes} onChange={(event) => setForm({ ...form, longBreakMinutes: event.target.valueAsNumber })} /></label>
          </fieldset>
          <p className="study-room-note">Nghỉ dài sau mỗi 4 phiên. Đồng hồ chung bắt đầu khi tạo phòng; bạn có thể rời bàn nghỉ thêm khi cần.</p>
          <RoomPolicyFields prefix="create" value={form} onChange={(value) => setForm({ ...form, ...value })} disabled={create.isPending} />
          {create.isError && <p className="study-room-error" role="alert">{parseApiError(create.error).detail}</p>}
          <Button type="submit" disabled={create.isPending || !form.name.trim()}>{create.isPending ? "Đang tạo…" : "Tạo phòng và vào học"}</Button>
        </form>
      )}
      <div className="study-rooms-lobby__list-heading"><h3>Những bàn học đang mở</h3><span>Lofi Girl là nhạc mặc định</span></div>
      {rooms.isPending ? <p className="study-room-feedback" role="status">Đang tìm phòng học…</p> : rooms.isError ? (
        <div className="study-room-feedback" role="alert"><p>Chưa tải được phòng học.</p><Button variant="outline" onClick={() => void rooms.refetch()} disabled={rooms.isFetching}>Thử lại</Button></div>
      ) : !rooms.data?.length ? (
        <div className="study-room-feedback"><Users aria-hidden="true" /><p>Chưa có phòng nào đang mở.</p><p>Tạo một bàn học rồi gửi đường dẫn cho bạn bè.</p></div>
      ) : (
        <ul className="study-rooms-lobby__list">
          {rooms.data.map((room) => (
            <li key={room.id}>
              <Link to={`${ROUTES.STUDY_ROOMS}/${room.id}`}>
                <div><h3>{room.name}</h3><p>Chủ phòng: {room.ownerName}</p><span>{room.focusMinutes} phút học / {room.breakMinutes} phút nghỉ</span></div>
                <div><span><Users aria-hidden="true" /> {room.activeMembers} đang có mặt</span><ArrowUpRight aria-hidden="true" /></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
