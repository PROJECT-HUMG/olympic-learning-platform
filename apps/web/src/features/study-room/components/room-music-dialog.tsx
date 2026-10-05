import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A persistent native modal: hiding it never unmounts the YouTube player. */
export function RoomMusicDialog({ open, onClose, opener, children }: {
  open: boolean; onClose: () => void; opener: RefObject<HTMLElement | null>; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(), descriptionId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (!open) { if (node.open) node.close(); return; }
    const returnTarget = opener.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!node.open) node.showModal();
    return () => {
      if (node.open) node.close();
      document.body.style.overflow = previousOverflow;
      if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
    };
  }, [open, opener]);

  return <dialog ref={dialog} className="room-music-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), iframe, [tabindex='0']")]
        .filter(control => control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
    <header className="room-music-dialog__header">
      <div><h2 id={titleId}>Nhạc ở bàn học</h2><p id={descriptionId}>Phòng chọn bài. Bạn tự phát, tạm dừng, tua và chỉnh âm lượng.</p></div>
      <Button type="button" variant="ghost" size="icon" autoFocus aria-label="Đóng nhạc" onClick={onClose}><X aria-hidden="true" /></Button>
    </header>
    {children}
  </dialog>;
}
