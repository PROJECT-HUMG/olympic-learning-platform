import { useEffect, useRef, useState } from "react";
import { EvidencePreviews, EvidenceViewer } from "@/components/ui/evidence-gallery";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/stores/use-auth-store";
import { parseApiError } from "@/lib/api-error";
import { isRasterImageType, rasterImageType } from "@/lib/raster-image";
import { EvidenceDownload } from "./components";
import { recognitionService as service } from "./service";
import type { Achievement, Evidence } from "./types";

/** Public visibility never grants evidence access. The API remains authoritative. */
export function AchievementEvidence({ record }: { record: Achievement }) {
  const { data: user, isError, isFetching } = useCurrentUser();
  const revision = useAuthStore(state => state.revision);
  if (!user || isError || isFetching || (user.id !== record.userId && user.role !== "ADMIN")) return null;
  return <AuthorizedEvidence key={`${user.id}:${revision}:${record.id}:${record.version}:${record.evidence?.map(item => item.id).join(",")}`} record={record} />;
}

function AuthorizedEvidence({ record }: { record: Achievement }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const surface = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const fallback = useRef<HTMLElement | null>(null);
  const items = (record.evidence ?? []).map(item => ({ ...item, name: item.originalName, image: isRasterImageType(item.contentType), detail: `${Math.ceil(item.size / 1024)} KiB` }));
  if (!items.length) return null;
  return <div ref={surface}>
    <EvidencePreviews items={items} open={open} renderImage={item => <EvidenceImage key={item.id} achievementId={record.id} attachment={item} />}
      onOpen={(item, target) => { opener.current = target; fallback.current = target.closest("article")?.querySelector<HTMLElement>("h3") ?? null; setSelectedId(item.id); setRetry(0); setOpen(true); }} />
    <EvidenceViewer items={items} open={open} onOpenChange={setOpen} selectedId={selectedId} onSelect={id => { setSelectedId(id); setRetry(0); }}
      description={`${record.title} · Minh chứng riêng tư, chỉ chủ hồ sơ và quản trị viên được xem`}
      renderImage={item => <EvidenceImage key={`${item.id}:${retry}`} achievementId={record.id} attachment={item} immediate />}
      renderActions={item => <>
        <EvidenceDownload key={item.id} achievementId={record.id} attachment={item} />
        {item.image && <Button type="button" variant="ghost" data-retry-image onClick={() => setRetry(value => value + 1)}>Thử tải ảnh lại</Button>}
      </>}
      onCloseAutoFocus={event => { const target = opener.current?.isConnected ? opener.current : surface.current?.querySelector<HTMLButtonElement>(".evidence-all") ?? (fallback.current?.isConnected ? fallback.current : null); if (target) { event.preventDefault(); target.focus(); } }} />
  </div>;
}

function EvidenceImage({ achievementId, attachment, immediate = false }: { achievementId: string; attachment: Evidence; immediate?: boolean }) {
  const host = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(immediate);
  const [image, setImage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    if (visible) return;
    if (!globalThis.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: "160px" });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    let url: string | null = null;
    void service.evidence(achievementId, attachment.id, controller.signal).then(async blob => {
      const type = rasterImageType(new Uint8Array(await blob.arrayBuffer()));
      if (controller.signal.aborted) return;
      if (!type) { setFailure("Không có bản xem trước an toàn. Tệp gốc vẫn có thể tải."); return; }
      url = URL.createObjectURL(new Blob([blob], { type })); setImage(url);
    }).catch(error => { if (!controller.signal.aborted) setFailure(parseApiError(error).detail || "Chưa tải được ảnh. Hãy thử lại hoặc tải tệp."); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [visible, achievementId, attachment.id]);
  return <span ref={host} className="recognition-evidence-image">{failure ? <span className="evidence-image-failure" role="status">{failure}</span> : image ? <img src={image} alt={attachment.originalName} width={800} height={600} onError={() => setFailure("Không đọc được ảnh. Tệp gốc vẫn có thể tải.")} /> : <span role="status">Đang tải ảnh…</span>}</span>;
}
