import { useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getAvatarCrop, getAvatarOffset, getAvatarSelection } from "../lib/avatar-crop";
import type { AvatarCrop } from "../types/user.types";

interface AvatarCropDialogProps {
  initialCrop?: AvatarCrop | null;
  src: string;
  onApply: (crop: AvatarCrop) => void;
  onCancel: () => void;
  onCloseFocus: () => void;
}

export function AvatarCropDialog({ initialCrop, src, onApply, onCancel, onCloseFocus }: AvatarCropDialogProps) {
  const id = useId();
  const imageRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; offset: { x: number; y: number } } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(Math.max(1, Math.min(3, initialCrop?.zoom ?? 1)));
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const crop = dimensions ? getAvatarCrop(dimensions.width, dimensions.height, zoom, offset) : null;

  function move(x: number, y: number) {
    if (!dimensions) return;
    setOffset((current) => getAvatarCrop(dimensions.width, dimensions.height, zoom,
      { x: current.x + x, y: current.y + y }).offset);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!crop || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: crop.offset };
  }

  function dragImage(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId || !dimensions) return;
    const side = event.currentTarget.getBoundingClientRect().width;
    setOffset(getAvatarCrop(dimensions.width, dimensions.height, zoom, {
      x: start.offset.x + (event.clientX - start.x) / side,
      y: start.offset.y + (event.clientY - start.y) / side,
    }).offset);
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? .1 : .02;
    switch (event.key) {
      case "ArrowLeft": event.preventDefault(); move(-step, 0); break;
      case "ArrowRight": event.preventDefault(); move(step, 0); break;
      case "ArrowUp": event.preventDefault(); move(0, -step); break;
      case "ArrowDown": event.preventDefault(); move(0, step); break;
      default: break;
    }
  }

  function applyCrop() {
    if (!dimensions) return;
    onApply(getAvatarSelection(dimensions.width, dimensions.height, zoom, offset));
  }

  return <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
    <DialogContent className="avatar-crop-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); requestAnimationFrame(onCloseFocus); }}>
      <DialogHeader>
        <DialogTitle>Chỉnh ảnh đại diện</DialogTitle>
        <DialogDescription>Kéo ảnh để chọn phần bạn muốn hiển thị.</DialogDescription>
      </DialogHeader>
      <div className="avatar-crop__viewport" role="group" tabIndex={0}
        aria-label="Vị trí ảnh trong khung" aria-describedby={id + "-hint"} aria-disabled={!crop}
        onPointerDown={startDrag} onPointerMove={dragImage}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }} onKeyDown={moveWithKeyboard}>
        <img ref={imageRef} src={src} alt="" draggable={false}
          onLoad={(event) => {
            const size = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight };
            setDimensions(size);
            if (initialCrop) setOffset(getAvatarOffset(size.width, size.height, initialCrop));
          }}
          onError={() => setError("Không đọc được ảnh này. Hãy chọn một ảnh JPG, PNG hoặc WebP khác.")}
          style={crop ? { width: crop.displayWidth * 100 + "%", height: crop.displayHeight * 100 + "%",
            left: 50 + crop.offset.x * 100 + "%", top: 50 + crop.offset.y * 100 + "%" } : { visibility: "hidden" }} />
        <span className="avatar-crop__mask" aria-hidden="true" />
        {!crop && !error && <span className="avatar-crop__loading" role="status" aria-label="Đang đọc ảnh">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
        </span>}
      </div>
      <p id={id + "-hint"} className="avatar-crop__hint">Dùng chuột, cảm ứng hoặc phím mũi tên để di chuyển ảnh.</p>
      <div className="avatar-crop__zoom">
        <label htmlFor={id + "-zoom"}>Độ phóng</label>
        <output htmlFor={id + "-zoom"}>{zoom.toFixed(1)}×</output>
        <input id={id + "-zoom"} type="range" min="1" max="3" step="0.05" value={zoom}
          disabled={!dimensions} onChange={(event) => {
            const value = Number(event.currentTarget.value);
            setZoom(value);
            if (dimensions) setOffset(getAvatarCrop(dimensions.width, dimensions.height, value,
              { x: offset.x * value / zoom, y: offset.y * value / zoom }).offset);
          }} />
      </div>
      <Button type="button" variant="ghost" className="avatar-crop__reset" disabled={!crop}
        onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>Đặt lại</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        <Button type="button" disabled={!crop} onClick={applyCrop}>Dùng ảnh này</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
