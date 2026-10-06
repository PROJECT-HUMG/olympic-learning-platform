import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, FileText, Link as LinkIcon, Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DailyDialogHeader } from "../ui/daily-dialog-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dailyEvidenceKey, evidenceErrorMessage, evidenceTargetReady, type EvidenceRecord, type EvidenceScope } from "./evidence-contract";
import { evidenceRoom, evidenceScopeKey, evidenceUploadIssue } from "./evidence-policy";
import { evidenceService, type SavedEvidenceScope } from "./evidence.service";
import { evidenceIsImage, evidenceRaster } from "./evidence-preview";
import { useDailyConfirm } from "../ui/use-daily-confirm";

// A keyed scope drops selections, requests and private URLs on account/resource changes.
export function EvidencePanel(props: EvidenceScope & { disabled?: boolean; readOnly?: boolean; taskTitle?: string; taskHeader?: ReactNode }) {
  const { disabled = false, readOnly = props.groupId !== null, taskTitle = "Công việc đã lưu", taskHeader } = props;
  if (!evidenceTargetReady(props)) return <>{taskHeader}<p className="study-note daily-evidence-unsaved"><Paperclip size={16} aria-hidden="true" />Lưu việc trước khi thêm minh chứng.</p></>;
  return <SavedPanel key={evidenceScopeKey(props.userId, props.planId, props.taskId, props.groupId)} scope={props} disabled={disabled} readOnly={readOnly} taskTitle={taskTitle} taskHeader={taskHeader} />;
}

function SavedPanel({ scope, disabled, readOnly, taskTitle, taskHeader }: { scope: SavedEvidenceScope; disabled: boolean; readOnly: boolean; taskTitle: string; taskHeader?: ReactNode }) {
  const prefix = useId();
  const surface = useRef<HTMLDivElement>(null);
  const galleryOpener = useRef<HTMLButtonElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null);
  const [visible, setVisible] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { confirm, confirmation } = useDailyConfirm();
  const query = useQuery({
    queryKey: dailyEvidenceKey(scope.userId, scope.planId, scope.taskId, scope.groupId),
    queryFn: ({ signal }) => evidenceService.list(scope, signal),
    enabled: visible || uploadOpen || galleryOpen,
    staleTime: 0, gcTime: 0, retry: false, refetchOnMount: "always", refetchOnWindowFocus: "always",
  });
  useEffect(() => {
    const node = surface.current;
    if (!node) return;
    if (!globalThis.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: "160px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => { active.current?.abort(); }, []);
  // Never mount old metadata or byte previews while a permission check is pending/failed.
  const rows = query.isSuccess && !query.isFetching ? query.data : [];
  const images = rows.filter(item => item.kind === "FILE" && evidenceIsImage(item.contentType));
  const files = rows.filter(item => !images.includes(item));
  const selected = rows.find(item => item.id === selectedId) ?? rows[0];
  const selectedIndex = selected ? rows.indexOf(selected) : 0;
  const blocked = disabled || busy;
  const canCreate = !blocked && !readOnly && query.isSuccess && !query.isFetching && evidenceRoom(rows.length);

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (active.current || disabled) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setFailure(null); setNotice(null);
    try { await action(controller.signal); }
    catch (error) { if (!controller.signal.aborted) setFailure(evidenceErrorMessage(error)); }
    finally { if (!controller.signal.aborted) setBusy(false); if (active.current === controller) active.current = null; }
  }
  function upload() {
    if (!canCreate) return;
    const issue = evidenceUploadIssue(file);
    if (issue) { setFailure(issue); return; }
    void run(async signal => {
      await evidenceService.upload(scope, "GENERAL", file!, signal);
      if (signal.aborted) return;
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setNotice("Đã lưu tệp minh chứng.");
      await query.refetch();
    });
  }
  async function remove(item: EvidenceRecord) {
    if (!await confirm(`Gỡ minh chứng “${item.originalName ?? item.label}”? Mục đã lưu sẽ bị xóa; kế hoạch không thay đổi.`)) return;
    void run(async signal => { await evidenceService.remove(scope, item.id, signal); if (!signal.aborted) { setNotice("Đã gỡ minh chứng."); await query.refetch(); } });
  }
  function download(item: EvidenceRecord) {
    void run(async signal => {
      const blob = await evidenceService.download(scope, item.id, signal);
      if (signal.aborted) return;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl; anchor.download = item.originalName ?? "evidence.bin";
      document.body.append(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setNotice("Đã bắt đầu tải tệp.");
    });
  }
  function openGallery(item: EvidenceRecord, opener: HTMLButtonElement) { galleryOpener.current = opener; setNotice(null); setFailure(null); setSelectedId(item.id); setGalleryOpen(true); }
  function move(delta: number) { if (rows.length) setSelectedId(rows[(selectedIndex + delta + rows.length) % rows.length].id); }
  const state = <>
    {query.isFetching ? <p role="status" className="study-note">Đang kiểm tra minh chứng…</p> : null}
    {query.isError ? <div><p role="alert" className="study-note">{evidenceErrorMessage(query.error)}</p><Button type="button" variant="outline" disabled={blocked} onClick={() => void query.refetch()}>Thử lại minh chứng</Button></div> : null}
    {busy ? <p role="status" className="study-note">Đang xử lý minh chứng…</p> : null}
    {notice ? <p role="status" className="study-note">{notice}</p> : null}
    {failure ? <p role="alert" className="study-notice">{failure} Chưa xác nhận thao tác. Kiểm tra danh sách trước khi tải lên lại để tránh trùng tệp.</p> : null}
  </>;
  return <div ref={surface} className="daily-evidence-surface" data-evidence-task={scope.taskId}>
    <div className={taskHeader ? "daily-task-heading" : undefined}>
    {taskHeader}
    <div className="daily-evidence-heading">
      {rows.length && !taskHeader ? <span className="study-note">{rows.length} minh chứng</span> : null}
      {!readOnly ? <Dialog open={uploadOpen} onOpenChange={open => { if (!busy) setUploadOpen(open); }}>
        <DialogTrigger asChild><Button type="button" variant="ghost" disabled={disabled} className="daily-evidence-add" aria-label={`Thêm minh chứng cho ${taskTitle}`}><Paperclip size={16} aria-hidden="true" /><span>Minh chứng</span></Button></DialogTrigger>
        <DialogContent className="daily-dialog daily-evidence-dialog" showCloseButton={false} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }}>
          <DailyDialogHeader busy={busy}><DialogTitle>Thêm minh chứng</DialogTitle><DialogDescription>Tải tệp cho việc này. Minh chứng lưu riêng; không lưu bản nháp, nộp kế hoạch hay bật chia sẻ.</DialogDescription></DailyDialogHeader>
          <p className="daily-evidence-task-context">{taskTitle}</p>
          {state}
          <div className="daily-upload-zone"><Upload size={24} aria-hidden="true" /><Label htmlFor={prefix + "-file"}>Chọn tệp minh chứng</Label><Input ref={fileInput} id={prefix + "-file"} type="file" disabled={blocked} aria-describedby={prefix + "-file-help"} onChange={event => { setFile(event.target.files?.[0] ?? null); setFailure(null); }} /><p id={prefix + "-file-help"} className="study-note">Tối đa 10 mục, mỗi tệp 5 MiB. Ảnh được xem trước; tài liệu khác giữ dạng tệp. Chỉ thông báo thành công xác nhận đã lưu.</p></div>
          {file ? <p className="study-note">Đã chọn: {file.name} · {formatBytes(file.size)}</p> : null}
          {!evidenceRoom(rows.length) ? <p className="study-note">Đã đủ 10 mục. Mở bộ minh chứng để gỡ một mục trước khi thêm.</p> : null}
          <div className="daily-dialog-actions"><Button type="button" variant="outline" disabled={blocked} onClick={() => void query.refetch()}>Kiểm tra danh sách</Button><Button type="button" onClick={upload} disabled={!canCreate || !file}>Lưu tệp minh chứng</Button></div>
        </DialogContent>
      </Dialog> : null}
    </div>
    </div>
    {!uploadOpen && !galleryOpen ? state : null}
    {rows.length ? <div className="daily-evidence-previews">
      {images.slice(0, 2).map((item, i) => <button type="button" className="daily-evidence-photo" key={item.id} onClick={event => openGallery(item, event.currentTarget)} aria-label={`Xem ${item.originalName}${i === 1 && images.length > 2 ? ` và ${images.length - 2} ảnh khác` : ""}`}>
        {!galleryOpen ? <PrivateImage scope={scope} item={item} /> : null}
        <span className="daily-evidence-photo__name">{item.originalName}</span>
        {i === 1 && images.length > 2 ? <span className="daily-evidence-photo__more">+{images.length - 2}</span> : null}
      </button>)}
      {files.slice(0, images.length ? 1 : 2).map(item => <button type="button" className="daily-evidence-file" key={item.id} onClick={event => openGallery(item, event.currentTarget)}>{item.kind === "LINK" ? <LinkIcon size={20} /> : <FileText size={20} />}<span>{item.originalName ?? item.label}</span><small>{item.kind === "LINK" ? "Liên kết đã lưu" : formatBytes(item.sizeBytes!)}</small></button>)}
      <Button type="button" variant="ghost" className="daily-evidence-all" onClick={event => openGallery(rows[0], event.currentTarget)}>Xem tất cả ({rows.length})</Button>
    </div> : readOnly && query.isSuccess && !query.isFetching ? <p className="study-note daily-evidence-empty">Chưa có minh chứng được chia sẻ.</p> : null}
    <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
      <DialogContent className="daily-dialog daily-gallery-dialog" showCloseButton={false} onOpenAutoFocus={event => { event.preventDefault(); document.querySelector<HTMLElement>(".daily-gallery-dialog [data-slot=dialog-title]")?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); const target = galleryOpener.current?.isConnected ? galleryOpener.current : surface.current?.querySelector<HTMLButtonElement>(".daily-evidence-all, .daily-evidence-add"); target?.focus(); }}>
        <DailyDialogHeader><DialogTitle tabIndex={-1}>Minh chứng</DialogTitle><DialogDescription className="daily-gallery-context">{taskTitle} · {readOnly ? "Chỉ đọc theo quyền chia sẻ" : "Riêng tư"}</DialogDescription></DailyDialogHeader>
        {state}
        {selected ? <>
          <div className="daily-gallery-view" aria-live="polite">
            {selected.kind === "FILE" && evidenceIsImage(selected.contentType) ? <PrivateImage key={selected.id} scope={scope} item={selected} /> : <div className="daily-gallery-file"><FileText size={40} aria-hidden="true" /><p>{selected.originalName ?? selected.label}</p><p className="study-note">{selected.kind === "LINK" ? "Liên kết đã lưu từ trước; không có bản xem trước." : "Tệp đính kèm; không tạo hình xem trước giả."}</p></div>}
          </div>
          <div className="daily-gallery-caption"><strong>{selected.originalName ?? selected.label}</strong><span>{selectedIndex + 1} / {rows.length}</span></div>
          <div className="daily-gallery-controls"><Button type="button" variant="outline" onClick={() => move(-1)} disabled={rows.length < 2}><ChevronLeft size={16} />Trước</Button><Button type="button" variant="outline" onClick={() => move(1)} disabled={rows.length < 2}>Sau<ChevronRight size={16} /></Button>
            {selected.kind === "FILE" ? <Button type="button" variant="outline" disabled={blocked} onClick={() => download(selected)}><Download size={16} />Tải tệp</Button> : <a className="daily-legacy-link" href={selected.url!} target="_blank" rel="noreferrer noopener">Mở liên kết cũ</a>}
            {!readOnly ? <Button type="button" variant="ghost" disabled={blocked} onClick={() => void remove(selected)}>Gỡ minh chứng</Button> : null}
            <Button type="button" variant="ghost" disabled={blocked} onClick={() => void query.refetch()}>Kiểm tra lại minh chứng</Button>
          </div>
          <div className="daily-gallery-index" aria-label="Chọn minh chứng">{rows.map((item, i) => <Button type="button" key={item.id} variant={item.id === selected.id ? "secondary" : "ghost"} aria-pressed={item.id === selected.id} onClick={() => setSelectedId(item.id)} aria-label={`Minh chứng ${i + 1}: ${item.originalName ?? item.label}`}>{i + 1}</Button>)}</div>
        </> : !query.isFetching && !query.isError ? <p className="study-note">Chưa có minh chứng.</p> : null}
      </DialogContent>
    </Dialog>
    {confirmation}
  </div>;
}

function PrivateImage({ scope, item }: { scope: SavedEvidenceScope; item: EvidenceRecord }) {
  const [image, setImage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { userId, planId, taskId, groupId } = scope;
  useEffect(() => {
    const controller = new AbortController();
    let url: string | null = null;
    setImage(null); setFailure(null);
    void evidenceService.download({ userId, planId, taskId, groupId }, item.id, controller.signal).then(async blob => {
      const type = evidenceRaster(new Uint8Array(await blob.arrayBuffer()));
      if (controller.signal.aborted) return;
      if (!type) { setFailure("Không có bản xem trước an toàn. Tệp gốc vẫn có thể tải."); return; }
      url = URL.createObjectURL(new Blob([blob], { type }));
      setImage(url);
    }).catch(error => { if (!controller.signal.aborted) setFailure(evidenceErrorMessage(error)); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [userId, planId, taskId, groupId, item.id]);
  if (failure) return <span className="daily-image-failure" role="status">{failure}</span>;
  return image ? <img src={image} alt={item.originalName ?? "Minh chứng công việc"} onError={() => setFailure("Không đọc được ảnh. Tệp gốc vẫn có thể tải.")} /> : <span className="study-note" role="status">Đang tải ảnh…</span>;
}
function formatBytes(size: number) { return size < 1024 ? `${size} B` : `${Math.ceil(size / 1024)} KiB`; }
