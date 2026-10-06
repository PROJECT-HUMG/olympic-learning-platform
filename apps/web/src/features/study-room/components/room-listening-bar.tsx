import { useId, type RefObject } from "react";
import { Headphones, Pause, Play, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCAL_MUSIC_LABELS, type LocalMusicStatus } from "../lib/room-world-layout";
import type { StudyRoomSnapshot } from "../types/study-room";
import type { LocalPlayerControls, LocalPlayerState } from "./study-music-player";

export function RoomListeningBar({ room, local, controls, onMusic, isHost, canAct, next }: {
  room: StudyRoomSnapshot;
  local: Omit<LocalPlayerState, "status"> & { status: LocalMusicStatus };
  controls: RefObject<LocalPlayerControls | null>;
  onMusic: (opener: HTMLElement) => void;
  isHost: boolean; canAct: boolean; next: () => void;
}) {
  const volumeId = useId(), compactVolumeId = useId(), permissionId = useId();
  const playing = local.status === "playing" || local.status === "buffering";
  const queued = room.tracks.find(track => track.status === "APPROVED");
  return <section className="room-listening" aria-label="Nhạc phòng chọn và điều khiển trên thiết bị bạn">
    <div className="room-listening__identity">
      <span className="room-listening__symbol" aria-hidden="true"><Headphones /></span>
      <div><p className="room-listening__eyeline">Nhạc phòng chọn{room.playback.isDefault && " · Livestream mặc định"}</p>
        <h2>{room.playback.title}</h2><p className="room-listening__state" role="status">{LOCAL_MUSIC_LABELS[local.status]}</p></div>
    </div>
    <div className="room-listening__controls">
      <Button className="room-listening__play" disabled={local.status === "loading"} onClick={event => {
        if (!local.ready || local.status === "error") onMusic(event.currentTarget);
        else controls.current?.togglePlayback();
      }}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{playing ? "Tạm dừng" : local.status === "ended" ? "Nghe lại" : "Bật nhạc"}</Button>
      <Button variant="ghost" aria-label="Mở trình phát" aria-haspopup="dialog" onClick={event => onMusic(event.currentTarget)}>Trình phát</Button>
      <div className="room-listening__volume">
        <Button variant="ghost" size="icon" disabled={!local.ready} aria-label={local.muted || !local.volume ? "Bật tiếng trên thiết bị này" : "Tắt tiếng trên thiết bị này"} aria-pressed={local.muted || !local.volume} onClick={() => controls.current?.toggleMute()}>{local.muted || !local.volume ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</Button>
        <label className="sr-only" htmlFor={volumeId}>Âm lượng trên thiết bị này</label>
        <input id={volumeId} type="range" min="0" max="100" value={local.volume} disabled={!local.ready} aria-valuetext={`${local.volume}%`} onChange={event => controls.current?.setVolume(Number(event.target.value))} />
        <output htmlFor={volumeId}>{local.volume}%</output>
      </div>
      <Popover><PopoverTrigger asChild><Button className="room-listening__audio-popover" variant="ghost" size="icon" disabled={!local.ready} aria-label="Âm lượng trên thiết bị này"><Volume2 aria-hidden="true" /></Button></PopoverTrigger>
        <PopoverContent className="room-volume-popover" align="end" collisionPadding={16}><label htmlFor={compactVolumeId}>Âm lượng trên thiết bị này</label><div><input id={compactVolumeId} type="range" min="0" max="100" value={local.volume} aria-valuetext={`${local.volume}%`} onChange={event => controls.current?.setVolume(Number(event.target.value))} /><output htmlFor={compactVolumeId}>{local.volume}%</output><Button variant="outline" size="icon" aria-label={local.muted || !local.volume ? "Bật tiếng" : "Tắt tiếng"} aria-pressed={local.muted || !local.volume} onClick={() => controls.current?.toggleMute()}>{local.muted || !local.volume ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</Button></div></PopoverContent>
      </Popover>
    </div>
    <div className="room-listening__next">
      <div><small>Bài tiếp theo</small><p>{queued?.title ?? "Livestream lofi mặc định"}</p></div>
      <Button variant="outline" disabled={!isHost || !canAct} aria-describedby={permissionId} onClick={next}><SkipForward aria-hidden="true" />Đổi bài tiếp</Button>
      <p id={permissionId}>{!isHost ? `${room.ownerName} đổi bài cho phòng. ` : !canAct ? "Chờ trạng thái phòng cập nhật để đổi bài. " : "Bạn đổi bài cho cả phòng. "}Điều khiển nghe riêng trên máy bạn; hết bài không tự đổi nhạc.</p>
    </div>
  </section>;
}
