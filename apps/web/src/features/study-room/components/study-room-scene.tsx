import { AvatarImage } from "@/features/user/components/avatar-image";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Crown, Headphones, Moon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { memberInitials, reconcileSceneSeats } from "../lib/scene-seats";
import { LOCAL_MUSIC_LABELS, type LocalMusicStatus } from "../lib/room-world-layout";
import type { WorldState, createRoomWorld } from "../lib/room-world";
import type { StudyRoomMember, StudyRoomSnapshot } from "../types/study-room";
import "./study-room-scene.css";

const DESKS_PER_PAGE = 12;
type World = ReturnType<typeof createRoomWorld>;

function MemberAvatar({ member }: { member: StudyRoomMember }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <span className="room-scene-avatar" aria-hidden="true">
    {member.avatarUrl && member.avatarUrl !== failedUrl
      ? <AvatarImage crop={member.avatarCrop} src={member.avatarUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(member.avatarUrl!)} />
      : memberInitials(member.displayName)}
  </span>;
}

export function StudyRoomScene({ room, currentUserId, synchronized, celebrating = false, onMusic, localMusicStatus = "idle", musicOpen = false, hideNowPlaying = false, peopleHost, onShowPeople, obscured: otherDialog = false }: {
  room: StudyRoomSnapshot; currentUserId?: string; synchronized: boolean; celebrating?: boolean;
  onMusic?: (opener: HTMLElement) => void; localMusicStatus?: LocalMusicStatus; musicOpen?: boolean;
  hideNowPlaying?: boolean; peopleHost?: HTMLElement | null; onShowPeople?: () => void; obscured?: boolean;
}) {
  const headingId = useId();
  const sceneRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);
  const musicRef = useRef<HTMLButtonElement>(null);
  const memberButtons = useRef(new Map<string, HTMLButtonElement>());
  const selectedButton = useRef<HTMLButtonElement | null>(null);
  const [worldStatus, setWorldStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [worldAttempt, setWorldAttempt] = useState(0);
  const [seating, setSeating] = useState(() => ({ roomId: room.id, members: room.members,
    seats: reconcileSceneSeats([], room.members.map((member) => member.userId)) }));
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  let seats = seating.seats;
  if (seating.roomId !== room.id || seating.members !== room.members) {
    seats = reconcileSceneSeats(seating.roomId === room.id ? seats : [], room.members.map((member) => member.userId));
    setSeating({ roomId: room.id, members: room.members, seats });
    if (seating.roomId !== room.id) { setPage(0); setSelectedId(null); }
  }
  const members = new Map(room.members.map((member) => [member.userId, member]));
  const selected = selectedId ? members.get(selectedId) : undefined;
  if (selectedId && !selected) setSelectedId(null);
  const pages = Math.ceil(seats.length / DESKS_PER_PAGE);
  const visibleSeats = seats.slice(page * DESKS_PER_PAGE, (page + 1) * DESKS_PER_PAGE);
  const resting = room.phase !== "FOCUS";
  const statusOf = (member: StudyRoomMember) => !synchronized ? "Chờ đồng bộ" : !member.online ? "Tạm mất kết nối" : resting ? "Giờ nghỉ" : "Giờ tập trung";
  const state: WorldState = { seats: visibleSeats.map(id => ({ id, online: !!(id && members.get(id)?.online) })), resting, synchronized, title: room.playback.title, dark };
  const signature = JSON.stringify(state);
  const obscured = musicOpen || !!selected || otherDialog;
  const latest = useRef({ state, onMusic, obscured });
  useEffect(() => { latest.current = { state, onMusic, obscured }; });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let world: World | null = null;
    setWorldStatus("loading");
    const fallback = () => {
      if (disposed) return;
      world?.dispose(); world = null; worldRef.current = null; setWorldStatus("fallback");
    };
    void import("../lib/room-world").then(({ createRoomWorld }) => {
      if (disposed) return;
      try {
        world = createRoomWorld(host, pick => {
          if ("music" in pick) {
            if (musicRef.current) latest.current.onMusic?.(musicRef.current);
          } else {
            const button = memberButtons.current.get(pick.memberId);
            if (button) {
              onShowPeople?.();
              requestAnimationFrame(() => { if (button.isConnected) { button.focus({ preventScroll: true }); button.click(); } });
            }
          }
        }, fallback);
        worldRef.current = world;
        world.update(latest.current.state); world.setVisible(!latest.current.obscured);
        setWorldStatus("ready");
      } catch { fallback(); }
    }).catch(fallback);
    return () => { disposed = true; world?.dispose(); worldRef.current = null; };
  }, [room.id, worldAttempt, onShowPeople]);

  useEffect(() => { worldRef.current?.update(JSON.parse(signature) as WorldState); }, [signature]);
  useEffect(() => { worldRef.current?.setVisible(!obscured); }, [obscured]);

  const people = <ul className="room-scene-seats" aria-label="Thành viên · chỗ ngồi chỉ là minh họa">
      {visibleSeats.map((id, index) => {
        const member = id ? members.get(id) : undefined;
        const slot = page * DESKS_PER_PAGE + index;
        if (!member && hideNowPlaying) return null;
        return <li key={slot} className="room-scene-seat" data-state={!member ? "empty" : !synchronized ? "waiting" : !member.online ? "offline" : resting ? "rest" : "focus"}>
          {member ? <button ref={button => { if (button) memberButtons.current.set(member.userId, button); else memberButtons.current.delete(member.userId); }} type="button" className="room-scene-seat__button"
            onClick={event => { selectedButton.current = event.currentTarget; setSelectedId(member.userId); }}
            aria-label={`${member.displayName}${member.userId === currentUserId ? " (bạn)" : ""} · ${statusOf(member)} · Xem thông tin`}>
            <MemberAvatar member={member} /><span className="room-scene-identity"><span>{member.displayName}{member.userId === room.ownerId && <Crown aria-label="Chủ phòng" />}</span>
              <small>{member.userId === currentUserId && "Bạn · "}{statusOf(member)}</small></span>
          </button> : <span className="room-scene-empty-seat">Bàn {slot + 1} · Trống</span>}
        </li>;
      })}
      {!room.members.length && hideNowPlaying && <li className="study-room-note">Chưa có thành viên trong phòng.</li>}
    </ul>;

  return <section ref={sceneRef} tabIndex={-1} className="room-scene" data-phase={resting ? "rest" : "focus"} data-synchronized={synchronized}
    data-world={worldStatus} data-celebrating={celebrating || undefined} aria-labelledby={headingId}>
    <header className="room-scene-heading">
      <h2 id={headingId}>Không gian chung</h2>
      {!hideNowPlaying && <span className="room-scene-phase">{resting ? <Moon aria-hidden="true" /> : <Users aria-hidden="true" />}{!synchronized ? "Chờ đồng bộ" : resting ? "Giờ nghỉ" : "Giờ tập trung"}</span>}
      {hideNowPlaying && onMusic && <Button ref={musicRef} variant="ghost" aria-haspopup="dialog" aria-expanded={musicOpen} onClick={event => onMusic(event.currentTarget)}><Headphones aria-hidden="true" />Nhạc</Button>}
    </header>
    <div className="room-scene-interior">
      <div ref={hostRef} className="room-world" aria-hidden="true" />
      {worldStatus !== "ready" && <div className="room-world-feedback" role="status">
        <strong>{worldStatus === "loading" ? "Đang mở góc học 3D…" : "Góc học ở chế độ danh sách"}</strong>
        <p>{worldStatus === "loading" ? "Bạn vẫn có thể dùng đồng hồ và xem thành viên." : "Thiết bị chưa mở được cảnh 3D. Thành viên, đồng hồ và nhạc vẫn sử dụng được."}</p>
        {worldStatus === "fallback" && <Button type="button" variant="outline" onClick={() => setWorldAttempt(n => n + 1)}>Thử lại cảnh 3D</Button>}
      </div>}
    </div>
    {!hideNowPlaying && <div className="room-scene-now-playing">
      {onMusic ? <button ref={musicRef} type="button" className="room-scene-music" aria-haspopup="dialog" aria-expanded={musicOpen} onClick={event => onMusic(event.currentTarget)}>
        <span className="room-scene-music__icon" aria-hidden="true"><Headphones /></span>
        <span><small>Nhạc phòng chọn</small><strong>{room.playback.title}</strong><span role="status">{LOCAL_MUSIC_LABELS[localMusicStatus]}</span></span>
        <span className="room-scene-music__action">Mở nhạc</span>
      </button> : <p className="room-scene-selected-track"><Headphones aria-hidden="true" /><span>Nhạc phòng chọn: <strong>{room.playback.title}</strong><small>Tham gia phòng để nghe trên thiết bị này.</small></span></p>}
    </div>}
    {peopleHost ? createPortal(people, peopleHost) : people}
    <footer className="room-scene-footer">
      <p>Bấm nhân vật hoặc tên để xem thông tin. Chỗ ngồi là bố cục minh họa.</p>
      {pages > 1 && <nav aria-label="Các bàn trong phòng">
        <Button variant="ghost" size="icon" disabled={page === 0} aria-label="Bàn trước" onClick={() => setPage(n => n - 1)}><ChevronLeft aria-hidden="true" /></Button>
        <span>{page + 1} / {pages}</span>
        <Button variant="ghost" size="icon" disabled={page === pages - 1} aria-label="Bàn tiếp" onClick={() => setPage(n => n + 1)}><ChevronRight aria-hidden="true" /></Button>
      </nav>}
    </footer>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelectedId(null); }}>
      <DialogContent className="room-scene-member-dialog" onCloseAutoFocus={event => {
        event.preventDefault();
        if (selectedButton.current?.isConnected) selectedButton.current.focus(); else sceneRef.current?.focus();
      }}>
        <DialogHeader><DialogTitle>Bạn cùng bàn</DialogTitle><DialogDescription>Thời gian phòng đã ghi nhận trong các phiên tập trung còn kết nối; không phải số việc hoàn thành.</DialogDescription></DialogHeader>
        {selected && <div className="room-scene-member">
          <MemberAvatar member={selected} /><h3>{selected.displayName}{selected.userId === currentUserId && " (bạn)"}</h3>
          <p>{selected.userId === room.ownerId ? "Chủ phòng" : "Thành viên"} · {statusOf(selected)}</p>
          <strong>{Math.floor(selected.focusSeconds / 60)} phút</strong>
          {!synchronized && <p>Đây là dữ liệu ở lần đồng bộ gần nhất.</p>}
        </div>}
      </DialogContent>
    </Dialog>
  </section>;
}
