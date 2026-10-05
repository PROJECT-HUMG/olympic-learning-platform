import { PageHeader } from "@/components/ui/page-header";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, Check, Copy, Crown, Headphones, LogOut, SkipForward, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { useStudyRoom } from "../hooks/use-study-room";
import type { RoomSettings, StudyRoomSnapshot } from "../types/study-room";
import { RoomPolicyFields } from "./room-policy-fields";
import { StudyRoomAccess } from "./study-room-access";
import { StudyMusicPlayer } from "./study-music-player";
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
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicVisited, setMusicVisited] = useState(false);
  const [localMusicStatus, setLocalMusicStatus] = useState<LocalMusicStatus>("idle");
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
      setMusicOpen(false); setMusicVisited(false); setLocalMusicStatus("idle");
    }
  }, [id, joinedUserId, roomClosed]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const nextTrack = useCallback((version: number) => {
    if (!busy && synchronized) run({ type: "next", expectedVersion: version });
  }, [busy, synchronized, run]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFailed(false);
      toast.success("Đã sao chép đường dẫn phòng.");
    } catch { setCopyFailed(true); }
  }

  function requestTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run({ type: "request", input: { title: title.trim(), youtubeUrl: youtubeUrl.trim() } }, {
      onSuccess: () => { setTitle(""); setYoutubeUrl(""); toast.success("Đã thêm bài vào hàng đợi."); },
    });
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
  const requestAllowed = canAct && !!room.me?.canRequest && !hasRequest;
  const policyText = room.requestPolicy === "HOST_ONLY" ? "Chủ phòng đang tự chọn nhạc." : room.requestPolicy === "OPEN" ? "Mọi thành viên có thể đề xuất nhạc." : `Học đủ ${room.minimumStudyMinutes} phút để đề xuất nhạc.`;

  return (
    <div className="study-room-page">
      <Link className="study-room-back" to={lobby}><ArrowLeft aria-hidden="true" /> Phòng học chung</Link>
      <PageHeader title={room.name} className="study-room-header"
        description={<span className="study-room-header__meta"><span><Crown aria-hidden="true" />{room.ownerName}</span><span><Users aria-hidden="true" />{room.activeMembers} đang có mặt</span></span>}
        actions={<>
          <Button variant="outline" onClick={() => void copyInvite()}><Copy aria-hidden="true" />Mời bạn</Button>
          {joined && <Button variant="ghost" aria-haspopup="dialog" aria-expanded={musicOpen} onClick={event => openMusic(event.currentTarget)}><Headphones aria-hidden="true" />Nhạc</Button>}
          {joined && <Button variant="ghost" disabled={busy} onClick={leave}><LogOut aria-hidden="true" />Rời phòng</Button>}
        </>} />
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
          <div className="study-room-focus">
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
            <StudyRoomScene room={room} currentUserId={user.data.id} synchronized={synchronized} celebrating={!!feedback.notice}
              onMusic={openMusic} localMusicStatus={localMusicStatus} musicOpen={musicOpen} />
          </div>
          <RoomMusicDialog open={musicOpen} onClose={() => setMusicOpen(false)} opener={musicOpener}>
            <section className="study-room-music" aria-label="Bài phòng chọn và trình phát cá nhân">
              {musicVisited && <StudyMusicPlayer playback={room.playback} onStatusChange={setLocalMusicStatus} />}
              {isHost && <div className="room-music-next"><Button variant="outline" disabled={!canAct} onClick={() => nextTrack(room.playback.version)}><SkipForward aria-hidden="true" /> Phát tiếp</Button>
                <p className="study-room-note">Chỉ thao tác này đổi bài cho cả phòng. Kết thúc bài trên máy bạn không đổi nhạc của người khác.</p></div>}
            </section>
          </RoomMusicDialog>
          <div className="study-room-layout">
          <div className="study-room-main">
            <section className="study-room-request" aria-labelledby="room-request-heading">
              <h2 id="room-request-heading">Góp một bài cho buổi học</h2>
              <p>{policyText}</p>
              {(room.me?.remainingStudySeconds ?? 0) > 0 && <p role="status">Còn {Math.ceil((room.me?.remainingStudySeconds ?? 0) / 60)} phút học để mở quyền đề xuất.</p>}
              {hasRequest && <p role="status">Bài của bạn đang trong hàng đợi. Bạn có thể đề xuất tiếp sau khi bài này được phát hoặc từ chối.</p>}
              {room.tracks.length >= 50 && <p role="status">Hàng đợi đã đầy. Đợi chủ phòng phát hoặc gỡ bớt bài để đề xuất tiếp.</p>}
              <form onSubmit={requestTrack}>
                <label htmlFor="room-youtube">Đường dẫn YouTube</label>
                <input id="room-youtube" type="url" required maxLength={500} placeholder="https://www.youtube.com/watch?v=…" value={youtubeUrl} disabled={!requestAllowed} onChange={(event) => setYoutubeUrl(event.target.value)} />
                <label htmlFor="room-track-title">Tên bài</label>
                <input id="room-track-title" required maxLength={120} placeholder="Một bài lofi bạn muốn chia sẻ" value={title} disabled={!requestAllowed} onChange={(event) => setTitle(event.target.value)} />
                <Button type="submit" disabled={!requestAllowed || !title.trim() || !youtubeUrl.trim()}>{isHost ? "Thêm vào hàng đợi" : "Gửi chủ phòng duyệt"}</Button>
              </form>
            </section>
          </div>
          <aside className="study-room-aside">
            <section className="study-room-queue" aria-labelledby="room-queue-heading">
              <h2 id="room-queue-heading">Hàng đợi nhạc <span>{room.tracks.length}</span></h2>
              {!room.tracks.length ? <p className="study-room-note">Chưa có bài trong hàng đợi. Bài phòng chọn giữ nguyên cho đến khi chủ phòng bấm “Phát tiếp”.</p> : <ol>{room.tracks.map((track) => <li key={track.id}>
                <a href={`https://www.youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noreferrer">{track.title}</a>
                <p>{track.requestedByName}<span>{track.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}</span></p>
                {isHost && <div className="study-room-queue__actions">
                  {track.status === "PENDING" && <Button variant="outline" disabled={!canAct} onClick={() => run({ type: "approve", trackId: track.id })} aria-label={`Duyệt ${track.title}`}><Check aria-hidden="true" /> Duyệt</Button>}
                  <Button variant="ghost" disabled={!canAct} onClick={() => run({ type: "reject", trackId: track.id })} aria-label={`Bỏ ${track.title}`}><X aria-hidden="true" /> Bỏ</Button>
                </div>}
              </li>)}</ol>}
            </section>
            {isHost && <>
              <HostSettings key={`${room.requestPolicy}-${room.minimumStudyMinutes}`} room={room} busy={!canAct} onSave={(input) => run({ type: "settings", input })} />
              <TransferRoomOwnership room={room} disabled={!canAct} onTransfer={(userId, onSuccess) => run({ type: "owner", userId }, { onSuccess: () => { onSuccess(); toast.success("Đã chuyển quyền chủ phòng. Bạn vẫn là thành viên của phòng."); } })} />
              <div className="study-room-close">
                {confirmClose ? <><p>Đóng phòng sẽ kết thúc buổi học cho tất cả thành viên.</p><div><Button variant="destructive" disabled={!canAct} onClick={() => run({ type: "close" })}>Đóng phòng học</Button><Button variant="ghost" onClick={() => setConfirmClose(false)}>Học tiếp</Button></div></> : <Button variant="ghost" onClick={() => setConfirmClose(true)}>Kết thúc buổi học</Button>}
              </div>
            </>}
          </aside>
        </div>
        </>
      )}
    </div>
  );
}
