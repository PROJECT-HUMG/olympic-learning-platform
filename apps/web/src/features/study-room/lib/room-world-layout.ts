/** Scene coordinates are presentation only; no reservation or server seat contract. */
export function deskPosition(index: number, count: number): [number, number] {
  const columns = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / columns);
  return [(index % columns - (columns - 1) / 2) * (columns === 2 ? 3.3 : 2.5),
    (Math.floor(index / columns) - (rows - 1) / 2) * 2.25 + .6];
}

export const LOCAL_MUSIC_LABELS = {
  idle: "Mở nhạc để nghe trên thiết bị này",
  loading: "Đang kết nối YouTube…",
  ready: "Sẵn sàng trên thiết bị này",
  playing: "Đang phát trên thiết bị này",
  paused: "Bạn đã tạm dừng",
  buffering: "Đang tải nhạc…",
  blocked: "Bấm Bật nhạc để bắt đầu",
  ended: "Đã kết thúc trên thiết bị này",
  error: "Chưa phát được · mở nhạc để thử lại",
} as const;
export type LocalMusicStatus = keyof typeof LOCAL_MUSIC_LABELS;
