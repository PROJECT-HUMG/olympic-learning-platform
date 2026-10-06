import { PageHeader } from "@/components/ui/page-header";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, Check, Copy, Crown, Headphones, LogOut, MoreHorizontal, Plus, Settings, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { useStudyRoom } from "../hooks/use-study-room";
import type { RoomSettings, StudyRoomSnapshot } from "../types/study-room";
import { RoomPolicyFields } from "./room-policy-fields";
import { StudyRoomAccess } from "./study-room-access";
import { StudyMusicPlayer, type LocalPlayerControls, type LocalPlayerState } from "./study-music-player";
import { RoomListeningBar } from "./room-listening-bar";
import { RoomTrackDialog } from "./room-track-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomMusicDialog } from "./room-music-dialog";
import type { LocalMusicStatus } from "../lib/room-world-layout";
import { TransferRoomOwnership } from "./transfer-room-ownership";
import { StudyRoomScene } from "./study-room-scene";
import { EditRoomRhythm } from "./edit-room-rhythm";
import { PhaseCelebration } from "./phase-celebration";
import { useRoomBell } from "../hooks/use-room-bell";
import { usePhaseFeedback } from "../hooks/use-phase-feedback";
import "./study-room.css";

const lobby = `${ROUTES.TOOLKIT}?tool=rooms`;

function HostSettings({ room, busy, onSave }: { room: StudyRoomSnapshot; busy: boolean; onSave: (value: RoomSettings) => void }) {
  const [value, setValue] = useState<RoomSettings>({ requestPolicy: room.requestPolicy, minimumStudyMinutes: room.minimumStudyMinutes });
  return (
    <details className="study-room-settings">
      <summary>Quyền đề xuất nhạc</summary>
      <form onSubmit={(event) => { event.preventDefault(); onSave(value); }}>
        <RoomPolicyFields prefix="settings" value={value} onChange={setValue} disabled={busy} />
        <Button type="submit" variant="outline" disabled={busy}>Lưu quy định</Button>
      </form>
    </details>
  );
}

export function StudyRoomSession({ id }: { id: string }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { query, action, recovering, online, reconnect } = useStudyRoom(id, user.data?.id);
  const [now, setNow] = useState(Date.now);
  const [trackOpen, setTrackOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [companionTab, setCompanionTab] = useState("queue");
  const [peopleHost, setPeopleHost] = useState<HTMLDivElement | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicVisited, setMusicVisited] = useState(false);
  const [localMusic, setLocalMusic] = useState<Omit<LocalPlayerState, "status"> & { status: LocalMusicStatus }>({ status: "idle", ready: false, muted: false, volume: 40 });
  const playerControls = useRef<LocalPlayerControls | null>(null);
  const trackOpener = useRef<HTMLButtonElement>(null);
  const settingsOpener = useRef<HTMLButtonElement>(null);
  const closeOpener = useRef<HTMLButtonElement>(null);
  const showPeople = useCallback(() => setCompanionTab("people"), []);
  const musicOpener = useRef<HTMLElement | null>(null);
  const openMusic = useCallback((opener: HTMLElement) => {
    musicOpener.current = opener; setMusicVisited(true); setMusicOpen(true);
  }, []);
  const room = query.data?.room;
  const joinedUserId = room?.me?.userId;
  const roomClosed = room?.closed;
  const synchronized = online && !recovering && !query.isError && now - query.dataUpdatedAt <= 30_000;
  const busy = action.isPending;
  const run = action.mutate;
  const bell = useRoomBell();
  const feedback = usePhaseFeedback({ room, now, synchronized, joined: !!room?.me, serverOffsetMs: query.data?.serverOffsetMs ?? 0, onBell: bell.play });

  useEffect(() => {
    if (!joinedUserId || roomClosed) {
      setMusicOpen(false); setMusicVisited(false); setTrackOpen(false); setSettingsOpen(false);
      setLocalMusic({ status: "idle", ready: false, muted: false, volume: 40 });
    }
  }, [id, joinedUserId, roomClosed]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const nextTrack = useCallback((version: number) => {
    if (!busy && synchronized && room?.me && !room.closed && room.ownerId === user.data?.id) run({ type: "next", expectedVersion: version });
  }, [busy, synchronized, run, room?.me, room?.closed, room?.ownerId, user.data?.id]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFailed(false);
      toast.success("Đã sao chép đường dẫn phòng.");
    } catch { setCopyFailed(true); }
  }

  function leave() {
    run({ type: "leave" }, { onSuccess: () => navigate(lobby) });
  }

  if (user.isPending) return <div className="study-room-page" role="status">Đang kiểm tra phiên đăng nhập…</div>;
  if (!user.data || (query.error as { status?: number } | null)?.status === 401) return <div className="study-room-page"><StudyRoomAccess /></div>;
  if (!room) return (
    <div className="study-room-page"><div className="study-room-feedback">
      <Link to={lobby}>Về danh sách phòng</Link>
      {query.isPending ? <p role="status">Đang mở phòng học…</p> : <><p role="alert">{parseApiError(query.error).status === 404 ? "Phòng học này không còn tồn tại." : "Chưa kết nối được với phòng học."}</p><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Thử kết nối lại</Button></>}
    </div></div>
  );

  const isHost = room.ownerId === user.data.id;
  const joined = !!room.me && !room.closed;
  const canAct = joined && !busy && synchronized;
  const remaining = Math.max(0, Math.ceil((Date.parse(room.phaseEndsAt) - now - (query.data?.serverOffsetMs ?? 0)) / 1000));
  const duration = 60 * (room.phase === "FOCUS" ? room.focusMinutes : room.phase === "BREAK" ? room.breakMinutes : room.longBreakMinutes);
  const hasRequest = room.tracks.some((track) => track.requestedById === user.data.id);
  const requestAllowed = canAct && !!room.me?.canRequest && !hasRequest && room.tracks.length < 50;
  const policyText = room.requestPolicy === "HOST_ONLY" ? "Chủ phòng đang tự chọn nhạc." : room.requestPolicy === "OPEN" ? "Mọi thành viên có thể đề xuất nhạc." : `Học đủ ${room.minimumStudyMinutes} phút để đề xuất nhạc.`;
  const requestReason = !synchronized ? "Chờ kết nối với phòng được khôi phục trước khi gửi bài."
    : hasRequest ? "Bài của bạn đang trong hàng đợi. Đợi bài đó được phát hoặc gỡ trước khi gửi tiếp."
    : room.tracks.length >= 50 ? "Hàng đợi đã đủ 50 bài. Đợi chủ phòng phát hoặc gỡ bài."
    : (room.me?.remainingStudySeconds ?? 0) > 0 ? `Còn ${Math.ceil((room.me?.remainingStudySeconds ?? 0) / 60)} phút tập trung đã ghi nhận để đề xuất nhạc.` : policyText;
  const approved = room.tracks.filter(track => track.status === "APPROVED");
  const pending = room.tracks.filter(track => track.status === "PENDING");

  return (
    <div className="study-room-page">
      <div className="room-topline"><Link className="study-room-back" to={lobby}><ArrowLeft aria-hidden="true" /> Phòng học chung</Link><div className="room-topline__actions">
          <Button variant="outline" onClick={() => void copyInvite()}><Copy aria-hidden="true" />Mời bạn</Button>
          {joined && <DropdownMenu><DropdownMenuTrigger asChild><Button ref={settingsOpener} variant="ghost" size="icon" aria-label="Tùy chọn phòng"><MoreHorizontal aria-hidden="true" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="room-options-menu"><DropdownMenuItem onSelect={() => setSettingsOpen(true)}><Settings />Quy định và quản lý</DropdownMenuItem><DropdownMenuItem disabled={busy} onSelect={leave}><LogOut />Rời phòng</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>}
      </div></div>
      <PageHeader title={room.name} className="study-room-header"
        description={<span className="study-room-header__meta"><span>{room.closed ? "Phòng đã đóng" : "Phòng mở · cần đăng nhập"}</span><span><Crown aria-hidden="true" />{room.ownerName}</span><span><Users aria-hidden="true" />{room.activeMembers} đang có mặt{!synchronized && " · lần cập nhật gần nhất"}</span></span>} />
      {copyFailed && <label className="study-room-copy">Sao chép đường dẫn này để mời bạn<input readOnly value={window.location.href} onFocus={(event) => event.target.select()} /></label>}
      {!synchronized && <div className="study-room-feedback" role={recovering ? "status" : "alert"} aria-busy={recovering}>
        <p>{!online ? "Thiết bị đang mất mạng. Phòng sẽ được đồng bộ khi có kết nối trở lại." : recovering ? "Đang đồng bộ lại phòng học…" : "Trạng thái phòng chưa được cập nhật. Hãy kết nối lại trước khi tiếp tục thao tác."}</p>
        <p>Khoảng gián đoạn quá 30 giây không được cộng vào thời gian tập trung. Phiên tham gia hết hạn sẽ cần bạn bấm tham gia lại.</p>
        <Button variant="outline" onClick={() => void reconnect()} disabled={!online || query.isFetching || recovering}>Kết nối lại</Button>
      </div>}
      {action.isError && <p className="study-room-error" role="alert">{parseApiError(action.error).detail}</p>}
      {room.closed ? (
        <div className="study-room-feedback" role="status"><h2>Buổi học đã khép lại.</h2><p>Chủ phòng đã đóng bàn học này.</p><Button asChild><Link to={lobby}>Tìm một phòng khác</Link></Button></div>
      ) : !joined ? (
        <div className="study-room-preview">
        <div className="study-room-join">
          <Headphones aria-hidden="true" /><h2>Vào học cùng phòng</h2>
          <p>{room.focusMinutes} phút tập trung, {room.breakMinutes} phút nghỉ. Nhạc lofi và nhịp học được chia sẻ trong phòng.</p>
          <p>{policyText} Khi vào phòng này, bạn sẽ rời phòng đang tham gia trước đó.</p>
          <Button disabled={busy || !synchronized} onClick={() => run({ type: "join" })}>{busy ? "Đang vào phòng…" : "Tham gia phòng"}</Button>
        </div>
        <StudyRoomScene room={room} currentUserId={user.data.id} synchronized={synchronized} />
        </div>
      ) : (
        <>
          <div className="room-social-layout">
          <div className="room-stage">
            <RoomListeningBar room={room} local={localMusic} controls={playerControls} onMusic={openMusic} isHost={isHost} canAct={canAct} next={() => nextTrack(room.playback.version)} />
            <StudyRoomScene room={room} currentUserId={user.data.id} synchronized={synchronized} celebrating={!!feedback.notice}
              onMusic={openMusic} localMusicStatus={localMusic.status} musicOpen={musicOpen} hideNowPlaying peopleHost={peopleHost} onShowPeople={showPeople} obscured={trackOpen || settingsOpen || confirmClose} />
            <section className="study-room-clock" aria-label="Nhịp học chung" data-celebrating={feedback.notice?.kind}>
              <div className="study-room-clock__reading">
                <div className="study-room-clock__meta"><span>{room.phase === "FOCUS" ? "Cùng tập trung" : room.phase === "BREAK" ? "Nghỉ một chút" : "Một khoảng nghỉ dài"}</span><span>Phiên {room.sessionNumber}</span></div>
                <p className="study-room-clock__time" role="timer" aria-live="off">{synchronized ? `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}` : "—:—"}</p>
                <progress max={duration} value={synchronized ? Math.max(0, duration - remaining) : undefined} aria-label={synchronized ? "Tiến độ phiên học" : "Đang chờ đồng bộ phiên học"} />
                <small>{room.focusMinutes} phút học / {room.breakMinutes} phút nghỉ / nghỉ {room.longBreakMinutes} phút sau 4 phiên</small>
              </div>
              <div className="study-room-clock__guidance">
                <p>{!synchronized ? "Nhịp học sẽ cập nhật khi kết nối với phòng được khôi phục." : remaining === 0 ? "Đang đồng bộ phiên tiếp theo…" : room.phase === "FOCUS" ? "Chọn một việc nhỏ và dành trọn khoảng thời gian này cho nó." : "Rời mắt khỏi màn hình, đứng dậy và uống chút nước nhé."}</p>
                <div className="room-clock-controls">
                  {isHost && <EditRoomRhythm room={room} disabled={!canAct} busy={busy} onApply={(input, onSuccess) => run({ type: "rhythm", input }, {
                    onSuccess: () => { onSuccess(); toast.success("Đã chỉnh giờ và bắt đầu nhịp học mới cho cả phòng."); },
                  })} />}
                  <Button variant="outline" aria-pressed={bell.enabled && bell.ready} disabled={bell.activating} onClick={() => void bell.toggle()}>
                    {bell.enabled && bell.ready ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}{bell.activating ? "Đang bật…" : bell.enabled && bell.ready ? "Tắt chuông" : "Bật chuông"}
                  </Button>
                  {bell.enabled && bell.ready && <Button variant="ghost" onClick={bell.play}>Thử chuông</Button>}
                </div>
                <p className="room-clock-bell-note">{bell.error ?? (bell.enabled && bell.ready ? "Chuông sẽ reo khi chuyển phiên trên thiết bị này." : "Bật chuông để nghe khi hết giờ. Cần bật lại âm thanh sau khi tải lại trang.")}</p>
              </div>
              <div className="study-room-accounting">
                <p className="study-room-my-time">Đã ghi nhận <strong>{Math.floor((room.me?.focusSeconds ?? 0) / 60)} phút tập trung</strong></p>
                <details><summary>Cách ghi nhận thời gian</summary><p className="study-room-note">Thời gian do phòng ghi nhận khi còn kết nối trong phiên tập trung; không gồm giờ nghỉ hoặc khoảng mất kết nối quá 30 giây.</p></details>
                <p className="study-room-note" role="status">{synchronized ? "Đã đồng bộ · cập nhật mỗi 5 giây." : "Dữ liệu ở lần đồng bộ gần nhất."}</p>
              </div>
              <PhaseCelebration notice={feedback.notice} onDismiss={feedback.dismiss} />
            </section>
          </div>
          <aside className="room-companion" aria-label="Nhạc và thành viên">
            <Tabs value={companionTab} onValueChange={setCompanionTab}>
              <TabsList className="room-companion__tabs" aria-label="Nhạc hoặc thành viên"><TabsTrigger value="queue">Hàng đợi <span>{room.tracks.length}</span></TabsTrigger><TabsTrigger value="people">Mọi người <span>{room.members.length}</span></TabsTrigger></TabsList>
              <TabsContent value="queue" className="room-companion__content">
                <div className="room-queue-heading"><h2>Nhạc cho buổi học</h2><Button ref={trackOpener} variant="outline" size="icon" aria-label="Góp một bài" aria-haspopup="dialog" onClick={() => setTrackOpen(true)}><Plus aria-hidden="true" /></Button></div>
                <p className="study-room-note">{requestReason}</p>
                {[{ name: "Tiếp theo · đã duyệt", tracks: approved }, { name: "Chờ chủ phòng duyệt", tracks: pending }].map(group => <section key={group.name} className="study-room-queue" aria-label={group.name}>
                  <h3>{group.name} <span>{group.tracks.length}</span></h3>
                  {!group.tracks.length ? <p className="study-room-note">{group.tracks === approved ? "Chưa có bài đã duyệt. Đổi bài tiếp sẽ chọn livestream mặc định." : "Không có đề xuất chờ duyệt."}</p> : <ol>{group.tracks.map(track => <li key={track.id}>
                    <a href={`https://www.youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noreferrer">{track.title}<span className="sr-only"> (YouTube, tab mới)</span></a>
                    <p>Đề xuất bởi {track.requestedByName}</p>
                    {isHost && <div className="study-room-queue__actions">{track.status === "PENDING" && <Button variant="outline" disabled={!canAct} onClick={() => run({ type: "approve", trackId: track.id })} aria-label={`Duyệt ${track.title}`}><Check aria-hidden="true" />Duyệt</Button>}<Button variant="ghost" disabled={!canAct} onClick={() => run({ type: "reject", trackId: track.id })} aria-label={`Bỏ ${track.title}`}><X aria-hidden="true" />Bỏ</Button></div>}
                  </li>)}</ol>}
                </section>)}
              </TabsContent>
              <TabsContent value="people" forceMount className="room-companion__content"><h2>{room.activeMembers} đang có mặt{!synchronized && " · lần cập nhật gần nhất"}</h2><p className="study-room-note">Sự hiện diện theo kết nối, không phải số người đang nghe. Bấm tên hoặc nhân vật để xem thông tin.</p><div ref={setPeopleHost} className="room-people-host" /></TabsContent>
            </Tabs>
          </aside>
          </div>
          <RoomMusicDialog open={musicOpen} onClose={() => setMusicOpen(false)} opener={musicOpener}>
            <section className="study-room-music" aria-label="Bài phòng chọn và trình phát cá nhân">
              {musicVisited && <StudyMusicPlayer playback={room.playback} controlsRef={playerControls} onLocalStateChange={setLocalMusic} />}
            </section>
          </RoomMusicDialog>
          <RoomTrackDialog open={trackOpen} onOpenChange={setTrackOpen} opener={trackOpener} allowed={requestAllowed} busy={busy} reason={requestReason} isHost={isHost} onRequest={(input, success, fail) => run({ type: "request", input }, { onSuccess: () => { success(); toast.success("Đã thêm bài vào hàng đợi."); }, onError: fail })} />
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className="room-settings-dialog" onCloseAutoFocus={event => { event.preventDefault(); settingsOpener.current?.focus(); }}><DialogHeader><DialogTitle>Quy định và quản lý phòng</DialogTitle><DialogDescription>Phòng mở cho tài khoản hoạt động. {policyText} Nhịp học và quyền chọn bài do chủ phòng quản lý.</DialogDescription></DialogHeader>
            {isHost ? <>
              <HostSettings key={`${room.requestPolicy}-${room.minimumStudyMinutes}`} room={room} busy={!canAct} onSave={(input) => run({ type: "settings", input })} />
              <TransferRoomOwnership room={room} disabled={!canAct} onTransfer={(userId, onSuccess) => run({ type: "owner", userId }, { onSuccess: () => { onSuccess(); toast.success("Đã chuyển quyền chủ phòng. Bạn vẫn là thành viên của phòng."); } })} />
              <Button ref={closeOpener} variant="destructive" disabled={!canAct} onClick={() => setConfirmClose(true)}>Kết thúc buổi học</Button>
            </> : <p className="study-room-note">Chỉ {room.ownerName} có thể đổi bài, duyệt đề xuất và quản lý phòng. Bạn vẫn tự phát, tạm dừng, tua và chỉnh âm lượng.</p>}
            {action.isError && <p className="study-room-error" role="alert">{parseApiError(action.error).detail}</p>}
          </DialogContent></Dialog>
          <AlertDialog open={confirmClose} onOpenChange={value => { if (!busy) setConfirmClose(value); }}><AlertDialogContent onCloseAutoFocus={event => { event.preventDefault(); closeOpener.current?.focus(); }}><AlertDialogHeader><AlertDialogTitle>Kết thúc buổi học?</AlertDialogTitle><AlertDialogDescription>Đóng phòng cho tất cả thành viên và dừng phiên tham gia. Thời gian đã ghi nhận được giữ lại.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Học tiếp</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={!canAct} onClick={event => { event.preventDefault(); run({ type: "close" }, { onSuccess: () => setConfirmClose(false) }); }}>Đóng phòng học</AlertDialogAction></AlertDialogFooter>{action.isError && <p role="alert" className="study-room-error">{parseApiError(action.error).detail}</p>}</AlertDialogContent></AlertDialog>
        </>
      )}
    </div>
  );
}
