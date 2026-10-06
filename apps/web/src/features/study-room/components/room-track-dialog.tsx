import { useState, type FormEvent, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseApiError } from "@/lib/api-error";

export function RoomTrackDialog({ open, onOpenChange, allowed, busy, reason, isHost, onRequest, opener }: {
  open: boolean; onOpenChange: (open: boolean) => void; allowed: boolean; busy: boolean;
  reason: string; isHost: boolean;
  opener: RefObject<HTMLButtonElement | null>;
  onRequest: (input: { title: string; youtubeUrl: string }, success: () => void, fail: (error: unknown) => void) => void;
}) {
  const [title, setTitle] = useState(""), [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState(""), [saved, setSaved] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault(); if (!allowed || busy) return;
    setError(""); setSaved(false);
    onRequest({ title: title.trim(), youtubeUrl: youtubeUrl.trim() }, () => {
      setTitle(""); setYoutubeUrl(""); setSaved(true);
    }, error => setError(parseApiError(error).detail));
  }
  return <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
    <DialogContent className="room-track-dialog" onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>Góp một bài cho buổi học</DialogTitle><DialogDescription>Thêm đường dẫn YouTube và tên bài. Mỗi người có tối đa một bài trong hàng đợi, kể cả chủ phòng.</DialogDescription></DialogHeader>
      <p className="study-room-note" id="room-request-reason">{reason}</p>
      {saved && <p role="status" className="room-track-success">{isHost ? "Đã thêm bài vào hàng đợi đã duyệt." : "Đã gửi bài để chủ phòng duyệt."} Bạn có thể gửi tiếp khi bài này được phát hoặc gỡ.</p>}
      <form className="room-track-form" onSubmit={submit} aria-busy={busy}>
        <label htmlFor="room-youtube">Đường dẫn YouTube</label><input id="room-youtube" type="url" required maxLength={500} placeholder="https://www.youtube.com/watch?v=…" value={youtubeUrl} disabled={!allowed || busy} onChange={event => setYoutubeUrl(event.target.value)} />
        <label htmlFor="room-track-title">Tên bài</label><input id="room-track-title" required maxLength={120} value={title} disabled={!allowed || busy} onChange={event => setTitle(event.target.value)} />
        {error && <p className="study-room-error" role="alert">{error}</p>}
        <div className="room-track-actions"><Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Đóng</Button><Button type="submit" disabled={!allowed || busy || !title.trim() || !youtubeUrl.trim()} aria-describedby="room-request-reason">{busy ? "Đang gửi…" : isHost ? "Thêm vào hàng đợi" : "Gửi chủ phòng duyệt"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
