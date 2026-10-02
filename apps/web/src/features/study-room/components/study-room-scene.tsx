import { useId, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Crown, Headphones, Moon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { memberInitials, memberLook, reconcileSceneSeats } from "../lib/scene-seats";
import type { StudyRoomMember, StudyRoomSnapshot } from "../types/study-room";
import "./study-room-scene.css";

const DESKS_PER_PAGE = 12;

function MemberAvatar({ member }: { member: StudyRoomMember }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <span className="room-scene-avatar" aria-hidden="true">
    {member.avatarUrl && member.avatarUrl !== failedUrl
      ? <img src={member.avatarUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(member.avatarUrl!)} />
      : memberInitials(member.displayName)}
  </span>;
}

function RoomWall() {
  return <svg className="room-scene-wall" viewBox="0 0 900 155" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path d="M0 147H900" className="room-scene-wall__line" />
    <g className="room-scene-window">
      <rect x="50" y="13" width="147" height="120" rx="50" />
      <path d="M59 90Q95 58 126 88T189 73V125H59Z" className="room-scene-window__hill" />
      <circle cx="155" cy="45" r="13" className="room-scene-window__sun" />
      <path d="M123 14V133M52 78H196" className="room-scene-wall__line" />
      <path d="M40 136H206" className="room-scene-window__ledge" />
    </g>
    <g className="room-scene-shelf">
      <path d="M701 58H861M722 128H846" />
      <rect x="718" y="24" width="12" height="32" rx="2" />
      <rect x="734" y="17" width="15" height="39" rx="2" />
      <rect x="754" y="25" width="10" height="31" rx="2" />
      <path d="M778 56L768 23L780 20L790 56Z" />
      <rect x="785" y="108" width="38" height="7" rx="2" />
      <rect x="792" y="118" width="36" height="7" rx="2" />
      <path d="M825 43Q800 18 814 14Q832 10 830 43M830 42Q838 9 848 22Q853 35 830 43" className="room-scene-shelf__plant" />
      <path d="M817 42H843L839 56H821Z" />
    </g>
    <g className="room-scene-clock-art">
      <circle cx="451" cy="32" r="20" /><path d="M451 19V32L460 38" />
      <path d="M400 83H500M416 96H485" />
    </g>
  </svg>;
}

function Desk({ member, state, reduceMotion }: {
  member?: StudyRoomMember;
  state: "focus" | "rest" | "offline" | "waiting";
  reduceMotion: boolean;
}) {
  const hair = member ? memberLook(member.userId).hair : 0;
  return <svg className="room-scene-desk" viewBox="0 0 180 158" aria-hidden="true">
    <ellipse cx="90" cy="148" rx="65" ry="7" className="room-scene-desk__shadow" />
    <path d="M70 100V142M110 100V142" className="room-scene-chair__legs" />
    <rect x="63" y="62" width="54" height="47" rx="10" className="room-scene-chair" />
    <AnimatePresence>
      {member && <motion.g key={member.userId} className="room-scene-person"
        initial={reduceMotion ? false : { opacity: 0, x: -22, y: -5 }} animate={{ opacity: 1, x: 0, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 26, y: -6 }} transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}>
        <path d="M76 100L72 136H83L90 108L98 136H109L104 100Z" className="room-scene-person__trousers" />
        <path d="M71 136H84V143H67Q65 138 71 136ZM97 136H109Q115 139 112 143H97Z" className="room-scene-person__shoes" />
        <g className="room-scene-person__body">
          <path d="M73 65Q90 58 107 65L116 106H64Z" className="room-scene-person__shirt" />
          <path d="M84 57V66Q90 72 96 66V57" className="room-scene-person__skin" />
          <g className="room-scene-person__head">
            {hair === 2 && <path d="M72 33Q65 53 69 68H110Q116 46 105 29Z" className="room-scene-person__hair" />}
            <circle cx="90" cy="43" r="18" className="room-scene-person__skin" />
            <path d={hair === 0 ? "M72 42Q67 18 90 22Q114 18 109 43L100 31Q90 40 78 33Z" : hair === 1 ? "M71 41Q66 23 79 22Q86 12 98 23Q115 24 109 42L100 32L83 35Z" : "M71 43Q67 19 91 21Q113 19 109 44L99 31Q82 30 73 45Z"} className="room-scene-person__hair" />
            <path d="M82 45V47M98 45V47M86 53Q90 56 94 53" className="room-scene-person__face" />
            <path d="M70 44V40Q70 20 90 20Q111 20 111 40V44" className="room-scene-person__headphones" />
            <rect x="68" y="39" width="6" height="13" rx="3" className="room-scene-person__headphones-pad" />
            <rect x="107" y="39" width="6" height="13" rx="3" className="room-scene-person__headphones-pad" />
          </g>
          <path d={state === "rest" ? "M76 73Q60 71 64 51" : "M76 73Q64 83 66 102"} className="room-scene-person__sleeve" />
          <circle cx={state === "rest" ? 64 : 66} cy={state === "rest" ? 50 : 103} r="4" className="room-scene-person__skin" />
          <g className="room-scene-person__writing">
            <path d={state === "rest" ? "M104 74Q123 72 118 51" : "M104 74Q124 86 119 102"} className="room-scene-person__sleeve" />
            <circle cx={state === "rest" ? 118 : 119} cy={state === "rest" ? 50 : 103} r="4" className="room-scene-person__skin" />
            {state === "focus" && <path d="M119 100L108 110" className="room-scene-person__pencil" />}
          </g>
        </g>
      </motion.g>}
    </AnimatePresence>
    <path d="M36 120L31 145M144 120L149 145" className="room-scene-table__legs" />
    <rect x="23" y="111" width="134" height="12" rx="4" className="room-scene-table" />
    <path d="M75 104L90 101L108 105V111L90 108L75 111Z" className="room-scene-book" />
    <path d="M90 102V108M79 107L85 106M95 106L103 107" className="room-scene-book__line" />
    <path d="M43 99H54V110H43ZM54 101Q62 100 60 106Q59 109 54 108" className="room-scene-cup" />
    <path d="M136 110V88L125 83" className="room-scene-lamp__stand" />
    <path d="M121 82L130 87L125 94L113 88Z" className="room-scene-lamp" />
  </svg>;
}

export function StudyRoomScene({ room, currentUserId, synchronized, celebrating = false }: {
  room: StudyRoomSnapshot;
  currentUserId?: string;
  synchronized: boolean;
  celebrating?: boolean;
}) {
  const headingId = useId();
  const sceneRef = useRef<HTMLElement>(null);
  const selectedButton = useRef<HTMLButtonElement | null>(null);
  const reduceMotion = !!useReducedMotion();
  const [seating, setSeating] = useState(() => ({ roomId: room.id, members: room.members,
    seats: reconcileSceneSeats([], room.members.map((member) => member.userId)) }));
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const stateOf = (member?: StudyRoomMember) => !synchronized ? "waiting" : !member?.online ? "offline" : resting ? "rest" : "focus";
  const statusOf = (member: StudyRoomMember) => !synchronized ? "Chờ đồng bộ" : !member.online ? "Tạm mất kết nối" : resting ? "Giờ nghỉ" : "Giờ tập trung";

  return <section ref={sceneRef} tabIndex={-1} className="room-scene" data-phase={resting ? "rest" : "focus"} data-synchronized={synchronized} data-celebrating={celebrating || undefined} aria-labelledby={headingId}>
    <header className="room-scene-heading">
      <div><p className="room-scene-eyebrow"><Headphones aria-hidden="true" /> Cùng một nhịp học</p><h2 id={headingId}>Bàn học của chúng mình</h2></div>
      <span className="room-scene-phase">{resting ? <Moon aria-hidden="true" /> : <Users aria-hidden="true" />}{!synchronized ? "Chờ đồng bộ" : resting ? "Một chút nghỉ ngơi" : `${room.activeMembers} đang có mặt`}</span>
    </header>
    <div className="room-scene-interior">
      <div className="room-scene-wall-space"><RoomWall /><p>{resting ? "Đặt bút xuống, thả lỏng một chút." : "Mỗi người một việc nhỏ. Cùng giữ nhịp học."}</p></div>
      <ul className="room-scene-seats" aria-label="Chỗ ngồi trong phòng">
        {visibleSeats.map((id, index) => {
          const member = id ? members.get(id) : undefined;
          const look = member ? memberLook(member.userId) : null;
          const slot = page * DESKS_PER_PAGE + index;
          return <li key={slot} className="room-scene-seat" data-state={stateOf(member)} data-color={look?.color ?? 0}
            style={{ "--person-delay": `${look?.delay ?? 0}s` } as CSSProperties}>
            <button type="button" className="room-scene-seat__button" disabled={!member} onClick={(event) => { if (member) { selectedButton.current = event.currentTarget; setSelectedId(member.userId); } }}
              aria-label={member ? `${member.displayName}${member.userId === currentUserId ? " (bạn)" : ""} · ${statusOf(member)} · Xem thông tin` : `Chỗ ${slot + 1} đang trống`}>
              <div className="room-scene-identity">
                <AnimatePresence>
                  {member && <motion.span key={member.userId} className="room-scene-nameplate"
                    initial={reduceMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.25 }}>
                    <MemberAvatar member={member} /><span title={member.displayName}>{member.displayName}</span>
                    {member.userId === room.ownerId && <Crown className="room-scene-crown" aria-hidden="true" />}
                  </motion.span>}
                </AnimatePresence>
              </div>
              <Desk member={member} state={stateOf(member)} reduceMotion={reduceMotion} />
              <span className="room-scene-seat__status">{member ? <><i aria-hidden="true" />{member.userId === currentUserId && "Bạn · "}{statusOf(member)}</> : "Một chỗ dành cho bạn"}</span>
            </button>
          </li>;
        })}
      </ul>
    </div>
    <footer className="room-scene-footer">
      <p>Nhân vật chuyển động theo nhịp chung. Bấm vào một bạn để xem thời gian đã ghi nhận.</p>
      {pages > 1 && <nav aria-label="Các bàn trong phòng">
        <Button variant="ghost" size="icon" disabled={page === 0} aria-label="Bàn trước" onClick={() => setPage((current) => current - 1)}><ChevronLeft aria-hidden="true" /></Button>
        <span>{page + 1} / {pages}</span>
        <Button variant="ghost" size="icon" disabled={page === pages - 1} aria-label="Bàn tiếp" onClick={() => setPage((current) => current + 1)}><ChevronRight aria-hidden="true" /></Button>
      </nav>}
    </footer>
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
      <DialogContent className="room-scene-member-dialog" onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (selectedButton.current?.isConnected && !selectedButton.current.disabled) selectedButton.current.focus();
        else sceneRef.current?.focus();
      }}>
        <DialogHeader><DialogTitle>Bạn cùng bàn</DialogTitle><DialogDescription>Thời gian phòng đã ghi nhận trong các phiên tập trung còn kết nối.</DialogDescription></DialogHeader>
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
