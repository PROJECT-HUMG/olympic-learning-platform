import { PageHeader } from "@/components/ui/page-header";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, Check, Copy, Crown, Headphones, LogOut, Plus, Settings, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ParticleButton from "@/components/kokonutui/particle-button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { useStudyRoom } from "../hooks/use-study-room";
import type { RoomSettings, StudyRoomSnapshot } from "../types/study-room";
import { RoomPolicyFields } from "./room-policy-fields";
import { StudyRoomAccess } from "./study-room-access";
import { StudyMusicPlayer } from "./study-music-player";
import { LiquidGlassCard, NowPlayingDisc } from "@/components/kokonutui/liquid-glass-card";
import PullCord from "@/components/kokonutui/pull-cord";
import { RoomMembers } from "./room-members";
import { RoomTrackDialog } from "./room-track-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TransferRoomOwnership } from "./transfer-room-ownership";
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
  const [confirmClose, setConfirmClose] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyToastId = useRef<string | number | undefined>(undefined);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [lightsOn, setLightsOn] = useState(true);
  const backLink = useRef<HTMLAnchorElement>(null);
  const musicRegion = useRef<HTMLDivElement>(null);
  useEffect(() => { if (musicEnabled) musicRegion.current?.focus(); }, [musicEnabled]);
  const trackOpener = useRef<HTMLButtonElement>(null);
  const settingsOpener = useRef<HTMLButtonElement>(null);
  const closeOpener = useRef<HTMLButtonElement>(null);
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
      setMusicEnabled(false); setTrackOpen(false); setSettingsOpen(false);
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
    if (copyToastId.current !== undefined) { toast.dismiss(copyToastId.current); copyToastId.current = undefined; }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFailed(false);
      copyToastId.current = toast.success("Đã sao chép đường dẫn phòng.");
    } catch (error) { setCopyFailed(true); throw error; }
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
    <div className="study-room-page study-room-workspace" data-dimmed={!lightsOn}>
      <div className="room-topline">
        <Link ref={backLink} className="study-room-back" to={lobby}><ArrowLeft aria-hidden="true" /> Phòng học chung</Link>
        <div className="room-topline__actions">
          <ParticleButton variant="outline" onClick={copyInvite} pendingLabel="Đang sao chép…" successLabel="Đã sao chép" errorLabel="Thử sao chép lại" icon={<Copy aria-hidden="true" />}>Mời bạn</ParticleButton>
          {joined && <Button variant="ghost" disabled={busy} onClick={leave}><LogOut aria-hidden="true" />Rời phòng</Button>}
        </div>
      </div>
      <div className="room-title-row">
        <PageHeader title={room.name} className="study-room-header" description={<span className="study-room-header__meta"><span><Crown aria-hidden="true" />Chủ phòng: {room.ownerName}</span><span>{room.closed ? "Phòng đã đóng" : `${room.activeMembers} đang có mặt`}</span></span>} />
        {joined && isHost && <Button ref={settingsOpener} variant="outline" size="icon" aria-label="Quản lý phòng" aria-haspopup="dialog" onClick={() => setSettingsOpen(true)}><Settings aria-hidden="true" /></Button>}
      </div>
      {copyFailed && <label className="study-room-copy">Sao chép đường dẫn này để mời bạn<input readOnly value={window.location.href} onFocus={event => event.target.select()} /></label>}
      {!synchronized && <div className="study-room-feedback" role={recovering ? "status" : "alert"} aria-busy={recovering}>
        <p>{!online ? "Bạn đang mất mạng. Phòng sẽ cập nhật khi có kết nối trở lại." : recovering ? "Đang đồng bộ lại phòng…" : "Chưa cập nhật được phòng. Kết nối lại để tiếp tục thao tác."}</p>
        <Button variant="outline" onClick={() => void reconnect()} disabled={!online || query.isFetching || recovering}>Kết nối lại</Button>
      </div>}
      {action.isError && <p className="study-room-error" role="alert">{parseApiError(action.error).detail}</p>}
      {room.closed ? <div className="study-room-feedback" role="status"><h2>Buổi học đã kết thúc</h2><p>Thời gian đã ghi nhận được giữ lại.</p><Button asChild><Link to={lobby}>Tìm phòng khác</Link></Button></div> : <>
        {!joined && <section className="room-arrival" aria-labelledby="room-arrival-title"><div><h2 id="room-arrival-title">Một khoảng tập trung, cùng nhau.</h2><p>{room.focusMinutes} phút học, {room.breakMinutes} phút nghỉ. Vào phòng để cùng theo nhịp học và nghe nhạc nếu bạn muốn.</p><p className="study-room-note">Nếu đang ở phòng khác, bạn sẽ chuyển sang phòng này.</p></div><Button disabled={busy || !synchronized} onClick={() => run({ type: "join" })}>{busy ? "Đang vào phòng…" : "Tham gia phòng"}</Button></section>}
        <div className="room-workspace-grid">
          <div className="room-workspace-main">
            <section className="study-room-clock" aria-label="Nhịp học chung">
              <div className="room-clock-top"><div><p className="room-phase-label">{room.phase === "FOCUS" ? "Giờ tập trung" : room.phase === "BREAK" ? "Nghỉ một chút" : "Nghỉ dài"}</p><span className="study-room-note">Phiên {room.sessionNumber} · nhịp học chung</span></div><PullCord checked={lightsOn} onCheckedChange={setLightsOn} label="Đèn trên thiết bị này" /></div>
              <p className="study-room-clock__time" role="timer" aria-live="off">{synchronized ? `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}` : "—:—"}</p>
              <p className="room-clock-prompt">{!synchronized ? "Chờ kết nối để cập nhật đồng hồ." : remaining === 0 ? "Đang chuyển sang phiên tiếp theo…" : room.phase === "FOCUS" ? "Chọn một việc. Dành khoảng này cho nó." : "Rời mắt khỏi màn hình, đứng dậy và thả lỏng nhé."}</p>
              <progress max={duration} value={synchronized ? Math.max(0, duration - remaining) : undefined} aria-label="Tiến độ phiên học" />
              <div className="room-rhythm-summary"><span><strong>{room.focusMinutes}</strong> phút học</span><span><strong>{room.breakMinutes}</strong> phút nghỉ</span><span><strong>{room.longBreakMinutes}</strong> phút nghỉ sau 4 phiên</span></div>
              <p className="room-light-note">{lightsOn ? "Đèn sáng" : "Đã tắt đèn"} · chỉ trên thiết bị của bạn.</p>
              {joined && <>
                <div className="room-clock-controls">
                  {isHost && <EditRoomRhythm room={room} disabled={!canAct} busy={busy} error={action.isError ? parseApiError(action.error).detail : undefined} onApply={(input, onSuccess) => run({ type: "rhythm", input }, { onSuccess: () => { onSuccess(); toast.success("Đã bắt đầu nhịp học mới cho cả phòng."); } })} />}
                  <Button variant="ghost" aria-pressed={bell.enabled && bell.ready} disabled={bell.activating} onClick={() => void bell.toggle()}>{bell.enabled && bell.ready ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}{bell.activating ? "Đang bật…" : bell.enabled && bell.ready ? "Tắt chuông" : "Bật chuông"}</Button>
                </div>
                {bell.error && <p className="study-room-error" role="alert">{bell.error}</p>}
                <details className="study-room-accounting"><summary>Đã ghi nhận <strong>{Math.floor((room.me?.focusSeconds ?? 0) / 60)} phút tập trung</strong><span> · Cách tính</span></summary><p>Phòng ghi nhận giờ tập trung khi bạn còn kết nối. Không tính giờ nghỉ hoặc khoảng mất kết nối quá 30 giây. Chuông, nhạc và đèn chỉ thay đổi trên máy bạn.</p></details>
                <PhaseCelebration notice={feedback.notice} onDismiss={feedback.dismiss} />
              </>}
            </section>
            <RoomMembers room={room} currentUserId={user.data.id} synchronized={synchronized} />
          </div>
          <aside className="room-workspace-aside" aria-label="Nhạc cho buổi học">
            <div className="room-music-surface"><LiquidGlassCard className="room-music-card" aria-labelledby="room-music-title">
              <div ref={musicRegion} tabIndex={-1} aria-label="Nhạc cùng phòng">
              <div className="room-section-heading"><div><p className="room-section-caption">Nghe theo cách của bạn</p><h2 id="room-music-title">Nhạc cùng phòng</h2></div><Headphones aria-hidden="true" /></div>
              {!musicEnabled ? <div className="room-music-idle"><div className="room-now-playing-identity"><NowPlayingDisc playing={false} /><h3>{room.playback.title}</h3></div><p>Phòng chọn bài. Bạn tự phát, tạm dừng, tua và chỉnh âm lượng trên thiết bị của mình.</p><Button disabled={!joined} onClick={() => setMusicEnabled(true)}><Headphones aria-hidden="true" />Bật nhạc</Button>{!joined && <p className="study-room-note">Tham gia phòng để bắt đầu nghe.</p>}</div> : joined && <StudyMusicPlayer playback={room.playback} />}
              {joined && <div className="room-music-next"><p>Bài tiếp theo: <strong>{approved[0]?.title ?? "Livestream mặc định"}</strong></p>{isHost ? <Button variant="outline" disabled={!canAct} onClick={() => nextTrack(room.playback.version)}><SkipForward aria-hidden="true" />Đổi bài tiếp</Button> : <span>Chủ phòng đổi bài cho cả phòng.</span>}</div>}
              </div>
            </LiquidGlassCard></div>
            {joined && <section className="room-queue-panel" aria-labelledby="room-queue-title">
              <div className="room-section-heading"><h2 id="room-queue-title">Góp nhạc cùng nhau</h2><Button ref={trackOpener} variant="outline" size="icon" aria-label="Góp một bài" aria-haspopup="dialog" onClick={() => setTrackOpen(true)}><Plus aria-hidden="true" /></Button></div>
              <p className="study-room-note">{requestReason}</p>
              {[{ name: "Tiếp theo", tracks: approved }, { name: "Chờ duyệt", tracks: pending }].map(group => <section key={group.name} className="study-room-queue" aria-label={group.name}><h3>{group.name} <span>{group.tracks.length}</span></h3>
                {!group.tracks.length ? <p className="study-room-note">{group.tracks === approved ? "Chưa có bài đã duyệt." : "Không có đề xuất chờ duyệt."}</p> : <ol>{group.tracks.map(track => <li key={track.id}><a href={`https://www.youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noreferrer">{track.title}<span className="sr-only"> (YouTube, tab mới)</span></a><p>{track.requestedByName} đề xuất</p>{isHost && <div className="study-room-queue__actions">{track.status === "PENDING" && <Button variant="outline" disabled={!canAct} onClick={() => run({ type: "approve", trackId: track.id })} aria-label={`Duyệt ${track.title}`}><Check aria-hidden="true" />Duyệt</Button>}<Button variant="ghost" disabled={!canAct} onClick={() => run({ type: "reject", trackId: track.id })} aria-label={`Bỏ ${track.title}`}><X aria-hidden="true" />Bỏ</Button></div>}</li>)}</ol>}
              </section>)}
            </section>}
          </aside>
        </div>
      </>}
      {joined && <>
        <RoomTrackDialog open={trackOpen} onOpenChange={setTrackOpen} opener={trackOpener} allowed={requestAllowed} busy={busy} reason={requestReason} isHost={isHost} onRequest={(input, success, fail) => run({ type: "request", input }, { onSuccess: () => { success(); toast.success("Đã thêm bài vào hàng đợi."); }, onError: fail })} />
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className="room-settings-dialog" onCloseAutoFocus={event => { event.preventDefault(); (settingsOpener.current?.isConnected ? settingsOpener.current : backLink.current)?.focus(); }}><DialogHeader><DialogTitle>Quản lý phòng</DialogTitle><DialogDescription>{policyText} Nhịp học và quyền chọn bài do chủ phòng quản lý.</DialogDescription></DialogHeader>
          {isHost && <><HostSettings key={`${room.requestPolicy}-${room.minimumStudyMinutes}`} room={room} busy={!canAct} onSave={input => run({ type: "settings", input })} /><TransferRoomOwnership room={room} disabled={!canAct} onTransfer={(userId, onSuccess) => run({ type: "owner", userId }, { onSuccess: () => { onSuccess(); setSettingsOpen(false); toast.success("Đã chuyển quyền chủ phòng."); } })} /><Button ref={closeOpener} variant="destructive" disabled={!canAct} onClick={() => setConfirmClose(true)}>Kết thúc buổi học</Button></>}
          {action.isError && <p className="study-room-error" role="alert">{parseApiError(action.error).detail}</p>}
        </DialogContent></Dialog>
        <AlertDialog open={confirmClose} onOpenChange={value => { if (!busy) setConfirmClose(value); }}><AlertDialogContent onCloseAutoFocus={event => { event.preventDefault(); (closeOpener.current?.isConnected ? closeOpener.current : backLink.current)?.focus(); }}><AlertDialogHeader><AlertDialogTitle>Kết thúc buổi học?</AlertDialogTitle><AlertDialogDescription>Đóng phòng cho tất cả thành viên. Thời gian đã ghi nhận được giữ lại.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Học tiếp</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={!canAct} onClick={event => { event.preventDefault(); run({ type: "close" }, { onSuccess: () => setConfirmClose(false) }); }}>Đóng phòng học</AlertDialogAction></AlertDialogFooter>{action.isError && <p role="alert" className="study-room-error">{parseApiError(action.error).detail}</p>}</AlertDialogContent></AlertDialog>
      </>}
    </div>
  );
}
