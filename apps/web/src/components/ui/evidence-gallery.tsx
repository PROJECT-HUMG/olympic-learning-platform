import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, FileText, X } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "@/lib/utils";
import "./evidence-gallery.css";

/** Presentation only. The feature must supply freshly authorized items and media. */
export interface EvidenceGalleryItem {
  id: string;
  name: string;
  image: boolean;
  detail?: ReactNode;
  icon?: ReactNode;
}

export function EvidencePreviews<T extends EvidenceGalleryItem>({ items, open, renderImage, onOpen, className }: {
  items: T[]; open: boolean; renderImage: (item: T) => ReactNode;
  onOpen: (item: T, opener: HTMLButtonElement) => void; className?: string;
}) {
  const images = items.filter(item => item.image), files = items.filter(item => !item.image);
  if (!items.length) return null;
  return <div className={cn("evidence-previews", className)}>
    {images.slice(0, 2).map((item, i) => <button type="button" className="evidence-photo" key={item.id}
      onClick={event => onOpen(item, event.currentTarget)} aria-label={`Xem ${item.name}${i === 1 && images.length > 2 ? ` và ${images.length - 2} ảnh khác` : ""}`}>
      {!open && renderImage(item)}<span className="evidence-photo__name">{item.name}</span>
      {i === 1 && images.length > 2 && <span className="evidence-photo__more">+{images.length - 2}</span>}
    </button>)}
    {files.slice(0, images.length ? 1 : 2).map(item => <button type="button" className="evidence-file" key={item.id} onClick={event => onOpen(item, event.currentTarget)}>
      {item.icon ?? <FileText size={20} aria-hidden="true" />}<span>{item.name}</span><small>{item.detail}</small>
    </button>)}
    <Button type="button" variant="ghost" className="evidence-all" onClick={event => onOpen(items[0], event.currentTarget)}>Xem tất cả ({items.length})</Button>
  </div>;
}

export function EvidenceViewer<T extends EvidenceGalleryItem>({ items, open, onOpenChange, selectedId, onSelect, description,
  renderImage, renderActions, feedback, empty, onCloseAutoFocus }: {
  items: T[]; open: boolean; onOpenChange: (open: boolean) => void; selectedId: string | null;
  onSelect: (id: string) => void; description: ReactNode; renderImage: (item: T) => ReactNode;
  renderActions: (item: T) => ReactNode; feedback?: ReactNode; empty?: ReactNode;
  onCloseAutoFocus: (event: Event) => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => setZoomed(false), [open, selectedId]);
  const selected = items.find(item => item.id === selectedId) ?? items[0];
  const index = selected ? items.indexOf(selected) : 0;
  const move = (delta: number) => { if (items.length) onSelect(items[(index + delta + items.length) % items.length].id); };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="evidence-viewer" showCloseButton={false}
      onOpenAutoFocus={event => { event.preventDefault(); title.current?.focus(); }} onCloseAutoFocus={onCloseAutoFocus}>
      <DialogHeader className="evidence-gallery-header">
        <DialogTitle ref={title} tabIndex={-1}>Minh chứng</DialogTitle><DialogDescription>{description}</DialogDescription>
        <DialogClose asChild><Button type="button" variant="ghost" size="icon" aria-label="Đóng hộp thoại" className="evidence-gallery-close"><X size={18} aria-hidden="true" /></Button></DialogClose>
      </DialogHeader>
      {feedback}
      {selected ? <>
        <div className={cn("evidence-gallery-view", zoomed && "evidence-gallery-view--zoomed")} aria-live="polite" tabIndex={zoomed ? 0 : undefined} aria-label={zoomed ? "Ảnh phóng to; cuộn để xem" : undefined}>
          {selected.image ? renderImage(selected) : <div className="evidence-gallery-file"><FileText size={40} aria-hidden="true" /><p>{selected.name}</p><p className="text-muted-foreground">Tệp đính kèm; không có bản xem trước ảnh.</p></div>}
        </div>
        <div className="evidence-gallery-caption"><strong>{selected.name}</strong><span>{index + 1} / {items.length}</span></div>
        <div className="evidence-gallery-controls">
          <Button type="button" variant="outline" onClick={() => move(-1)} disabled={items.length < 2}><ChevronLeft size={16} aria-hidden="true" />Trước</Button>
          <Button type="button" variant="outline" onClick={() => move(1)} disabled={items.length < 2}>Sau<ChevronRight size={16} aria-hidden="true" /></Button>
          {selected.image && <Button type="button" variant="outline" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{zoomed ? "Thu nhỏ" : "Phóng to"}</Button>}
          {renderActions(selected)}
        </div>
        <div className="evidence-gallery-index" aria-label="Chọn minh chứng">{items.map((item, i) => <Button type="button" key={item.id} variant={item.id === selected.id ? "secondary" : "ghost"} aria-pressed={item.id === selected.id} onClick={() => onSelect(item.id)} aria-label={`Minh chứng ${i + 1}: ${item.name}`}>{i + 1}</Button>)}</div>
      </> : empty}
    </DialogContent>
  </Dialog>;
}
