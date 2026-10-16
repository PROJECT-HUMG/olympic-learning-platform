import { useRef, useState } from "react";
import { DepthCarousel } from "@/components/react-bits/depth-carousel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { HonorImage } from "./components";
import type { Honor } from "./types";

/** Keeps original server order and media service; the carousel never invents URLs. */
export function HonorGallery({ honor }: { honor: Honor }) {
  const [selectedId, setSelectedId] = useState(honor.photos[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const items = honor.photos.map((photo, index) => ({ ...photo, name: `Ảnh ${index + 1} trong album ${honor.title}` }));
  const selected = items.find(item => item.id === selectedId) ?? items[0];
  if (!selected) return <p className="recognition-hint">Chưa có ảnh kỷ niệm.</p>;
  const gallery = <DepthCarousel preloadNeighbors items={items} selectedId={selected.id} onSelect={setSelectedId} label={`Ảnh album ${honor.title}`}
    renderItem={item => <HonorImage key={item.id} honor={honor} photoId={item.id} alt={item.name} />} />;
  return <>
    {!open ? gallery : <div className="honor-gallery-placeholder" aria-hidden="true" />}
    <Button ref={opener} type="button" variant="outline" onClick={() => setOpen(true)}>Mở ảnh lớn</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="recognition-review-dialog honor-gallery-dialog" showCloseButton={false}
      onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}>
      <header className="honor-gallery-dialog__header"><DialogTitle>{honor.title}</DialogTitle><DialogClose asChild><Button type="button" size="icon" variant="ghost" aria-label="Đóng hộp thoại"><X size={18} aria-hidden="true" /></Button></DialogClose></header><DialogDescription>{selected.name}</DialogDescription>{gallery}
    </DialogContent></Dialog>
  </>;
}
