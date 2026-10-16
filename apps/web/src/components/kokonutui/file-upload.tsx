"use client";

/**
 * @author: @dorianbaffier
 * @description: File Upload
 * @version: 2.0.0
 * @date: 2026-10-16
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

// Adapted from https://kokonutui.com/r/file-upload.json (2.0.0).
// Share its drop-zone/list/thumbnail pattern across atomic selection and real callback uploads.
// Reuse installed Framer Motion; simulated uploads and synthetic failures are excluded.
import { RotateCw, Upload, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type DragEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileError { message: string; code: string }
export interface UploadHelpers {
  onProgress: (percent: number) => void;
  /** A real adapter must honor this signal to cancel its request. */
  signal: AbortSignal;
}
export interface FileUploadProps {
  /** Required real adapter; resolve only after persistence is confirmed. No demo fallback. */
  onUpload: (file: File, helpers: UploadHelpers) => Promise<void>;
  onUploadSuccess?: (file: File) => void;
  onUploadError?: (error: FileError, file: File) => void;
  onComplete?: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  maxFiles?: number;
  validateFile?: (file: File) => FileError | null;
  className?: string;
}
interface FileSelectionProps {
  id: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  validateFiles: (files: File[]) => string | null;
  acceptedFileTypes: string[];
  disabled?: boolean;
  progress?: number;
}
type ItemStatus = "selected" | "queued" | "uploading" | "done" | "error";
interface QueueItem {
  id: string;
  file: File;
  status: ItemStatus;
  progress?: number;
  error?: FileError;
}
const NO_ACCEPTED_TYPES: string[] = [];
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;
const CONCURRENCY = 3;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : Number(value.toFixed(1))} ${units[i]}`;
};
const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1, dot + 5).toUpperCase() : "TỆP";
};
const matchesAcceptedType = (file: File, type: string) => {
  const accepted = type.trim().toLowerCase();
  if (accepted.startsWith(".")) return file.name.toLowerCase().endsWith(accepted);
  return accepted.endsWith("/*") ? file.type.toLowerCase().startsWith(accepted.slice(0, -1)) : file.type.toLowerCase() === accepted;
};
const isFileDrag = (event: DragEvent) => event.dataTransfer.types.includes("Files");
const clampProgress = (value: number) => Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : undefined;

/** Local raster preview only. PDF/nonimages stay file badges; URLs never leave this component. */
function FileThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setUrl(undefined); return; }
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return url && !failed
    ? <img src={url} alt="" aria-hidden="true" onError={() => setFailed(true)} className="size-9 shrink-0 rounded-md border bg-muted object-cover" />
    : <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted font-mono text-[10px] text-muted-foreground">{extensionOf(file.name)}</span>;
}
function statusLine(item: QueueItem) {
  switch (item.status) {
    case "selected": return "Đã chọn";
    case "queued": return "Đang chờ gửi";
    case "uploading": return item.progress === undefined ? "Đang gửi…" : item.progress >= 100 ? "Đang chờ xác nhận…" : `Đang gửi ${Math.round(item.progress)}%`;
    case "done": return "Đã tải lên";
    case "error": return item.error?.message || "Chưa tải lên được. Hãy thử lại.";
  }
}
function FileRow({ item, disabled, onRemove, onRetry }: { item: QueueItem; disabled?: boolean; onRemove: () => void; onRetry?: () => void }) {
  const reduce = useReducedMotion();
  return <motion.li initial={false} animate={{ height: "auto", opacity: 1 }} exit={reduce ? undefined : { height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : .18, ease: EASE_OUT }} className="min-w-0">
    <div className="relative flex min-w-0 items-center gap-3 border-b px-1 py-2">
      <FileThumb file={item.file} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium [overflow-wrap:anywhere]">{item.file.name}</p>
        <p className={cn("text-xs leading-relaxed tabular-nums [overflow-wrap:anywhere]", item.status === "error" ? "text-destructive" : "text-muted-foreground")}>
          {formatBytes(item.file.size)}<span aria-hidden="true"> · </span>{statusLine(item)}
        </p>
      </div>
      {item.status === "error" && onRetry && <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Thử gửi lại ${item.file.name}`} onClick={onRetry}><RotateCw aria-hidden="true" /></Button>}
      <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`${item.status === "uploading" || item.status === "queued" ? "Hủy gửi" : "Bỏ tệp"} ${item.file.name}`} onClick={onRemove}><X aria-hidden="true" /></Button>
      {item.status === "uploading" && (!reduce || item.progress !== undefined) && <progress className="absolute inset-x-1 bottom-0 h-0.5 w-[calc(100%-0.5rem)] accent-primary" aria-label={`Tiến độ gửi ${item.file.name}`} max={100} value={item.progress} />}
    </div>
  </motion.li>;
}

/** Native chooser/drop/paste surface from v2; no scheduler or persistence belongs in this view. */
function UploadFrame({ id, items, acceptedFileTypes, disabled = false, notice, onSelect, onRemove, onRetry, hint, progress, className, multiple = true }: {
  id: string; items: QueueItem[]; acceptedFileTypes: string[]; disabled?: boolean; notice?: string | null;
  onSelect: (files: File[]) => void; onRemove: (id: string) => void; onRetry?: (id: string) => void;
  hint: string; progress?: number; className?: string; multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const choose = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId(), errorId = useId();
  const reduce = useReducedMotion();
  // Guard against accidental file navigation outside the picker while this surface is mounted.
  useEffect(() => {
    const preventFileNavigation = (event: globalThis.DragEvent) => { if (event.dataTransfer?.types.includes("Files")) event.preventDefault(); };
    window.addEventListener("dragover", preventFileNavigation);
    window.addEventListener("drop", preventFileNavigation);
    return () => { window.removeEventListener("dragover", preventFileNavigation); window.removeEventListener("drop", preventFileNavigation); };
  }, []);
  function select(files: File[]) { if (!disabled && files.length) onSelect(files); }
  function drag(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrag(event)) return;
    event.preventDefault(); event.stopPropagation();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    if (!disabled) setDragging(true);
  }
  return <div className={cn("min-w-0 space-y-3 rounded-xl border bg-card p-2", className)} aria-busy={disabled}>
    <div onDragEnter={drag} onDragOver={drag} onDragLeave={event => {
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
      setDragging(false);
    }} onDrop={event => {
      event.preventDefault(); event.stopPropagation(); setDragging(false); select(Array.from(event.dataTransfer.files));
    }} onPaste={event => { if (event.clipboardData.files.length && !disabled) { event.preventDefault(); select(Array.from(event.clipboardData.files)); } }}>
      <button ref={choose} type="button" disabled={disabled} aria-controls={id} aria-describedby={`${hintId}${notice ? ` ${errorId}` : ""}`} onClick={() => input.current?.click()}
        className={cn("flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none", dragging && !disabled && "border-primary bg-accent")}>
        <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg border bg-card text-muted-foreground"><Upload className="size-4" /></span>
        <span className="text-sm leading-relaxed">{dragging && !disabled ? "Thả tệp vào đây" : <>Kéo tệp vào đây hoặc <span className="font-medium text-primary underline underline-offset-4">{items.length ? "thêm tệp minh chứng" : "chọn tệp minh chứng"}</span></>}</span>
        <span id={hintId} className="text-xs leading-relaxed text-muted-foreground">{hint}</span>
      </button>
      <input id={id} ref={input} type="file" className="hidden" multiple={multiple} disabled={disabled} accept={acceptedFileTypes.join(",")} aria-describedby={hintId} onChange={event => { select(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    </div>
    {notice && <p id={errorId} role="alert" className="px-1 text-sm text-destructive [overflow-wrap:anywhere]">{notice}</p>}
    <p role="status" className="sr-only">{items.length} tệp trong danh sách.</p>
    {!!items.length && <ul aria-label="Minh chứng đã chọn" className="grid min-w-0 gap-1"><AnimatePresence initial={false}>{items.map(item => <FileRow key={item.id} item={item} disabled={disabled} onRemove={() => { onRemove(item.id); choose.current?.focus(); }} onRetry={onRetry ? () => onRetry(item.id) : undefined} />)}</AnimatePresence></ul>}
    {disabled && <div role="status" className="space-y-2 px-1 text-sm">
      <p>{progress === undefined ? "Đang gửi thành tích và minh chứng…" : progress < 100 ? `Đang gửi dữ liệu: ${progress}%` : "Đã gửi dữ liệu, đang chờ xác nhận…"}</p>
      {(!reduce || progress !== undefined) && <progress className="h-2 w-full accent-primary" aria-label="Tiến độ gửi dữ liệu minh chứng" max={100} value={progress} />}
    </div>}
  </div>;
}

/** Controlled batch for an atomic multipart form; selecting never starts an upload. */
export function FileUploadSelection({ id, files, onFilesChange, validateFiles, acceptedFileTypes, disabled = false, progress }: FileSelectionProps) {
  const [error, setError] = useState("");
  const items: QueueItem[] = files.map((file, index) => ({ id: String(index), file, status: "selected" }));
  return <div data-file-selection><UploadFrame id={id} items={items} acceptedFileTypes={acceptedFileTypes} disabled={disabled} progress={progress} notice={error}
    hint="Tệp được gửi cùng thông tin thành tích khi bạn chọn Gửi để duyệt."
    onSelect={picked => { const next = [...files, ...picked]; const issue = validateFiles(next); setError(issue ?? ""); if (!issue) onFilesChange(next); }}
    onRemove={id => { onFilesChange(files.filter((_, index) => String(index) !== id)); setError(""); }} /></div>;
}

/** Optional immediate-upload owner, with genuine per-file progress/retry/cancel only. */
export default function FileUpload({ onUpload, onUploadSuccess, onUploadError, onComplete, onFileRemove, acceptedFileTypes = NO_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE, multiple = true, maxFiles = 5, validateFile, className }: FileUploadProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [notice, setNotice] = useState("");
  const base = useId(), counter = useRef(0);
  const controllers = useRef(new Map<string, AbortController>());
  const latest = useRef({ onUpload, onUploadSuccess, onUploadError, onComplete });
  const wasBusy = useRef(false);
  useEffect(() => { latest.current = { onUpload, onUploadSuccess, onUploadError, onComplete }; });
  const update = useCallback((id: string, patch: Partial<QueueItem>) => setItems(previous => previous.map(item => item.id === id ? { ...item, ...patch } : item)), []);
  useEffect(() => {
    const toStart = items.filter(item => item.status === "queued" && !controllers.current.has(item.id)).slice(0, Math.max(0, CONCURRENCY - controllers.current.size));
    for (const item of toStart) {
      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      update(item.id, { status: "uploading", progress: undefined });
      Promise.resolve().then(() => {
        if (controller.signal.aborted) return;
        if (!latest.current.onUpload) throw new Error("Chưa có kết nối tải tệp. Tệp chưa được gửi.");
        return latest.current.onUpload(item.file, { signal: controller.signal, onProgress: value => { if (!controller.signal.aborted) update(item.id, { progress: clampProgress(value) }); } });
      }).then(() => {
        if (controller.signal.aborted) return;
        controllers.current.delete(item.id);
        update(item.id, { status: "done", progress: 100 });
        latest.current.onUploadSuccess?.(item.file);
      }, reason => {
        if (controller.signal.aborted) return;
        controllers.current.delete(item.id);
        const error = { code: "UPLOAD_FAILED", message: reason instanceof Error ? reason.message : "Chưa tải lên được. Hãy thử lại." };
        update(item.id, { status: "error", error }); latest.current.onUploadError?.(error, item.file);
      });
    }
  }, [items, update]);
  useEffect(() => {
    const busy = items.some(item => item.status === "queued" || item.status === "uploading");
    if (wasBusy.current && !busy) latest.current.onComplete?.(items.filter(item => item.status === "done").map(item => item.file));
    wasBusy.current = busy;
  }, [items]);
  useEffect(() => { const active = controllers.current; return () => { for (const controller of active.values()) controller.abort(); active.clear(); }; }, []);
  const limit = multiple ? Math.max(1, maxFiles) : 1;
  return <UploadFrame id={`${base}-input`} className={className} multiple={multiple} items={items} acceptedFileTypes={acceptedFileTypes} notice={notice}
    hint={`Tối đa ${limit} tệp, mỗi tệp ${formatBytes(maxFileSize)}. Chỉ hoàn tất sau khi nhận xác nhận.`}
    onSelect={picked => {
      const next = [...items];
      for (const file of picked) {
        const issue = acceptedFileTypes.length && !acceptedFileTypes.some(type => matchesAcceptedType(file, type)) ? { code: "INVALID_FILE_TYPE", message: "Loại tệp chưa được hỗ trợ." }
          : file.size > maxFileSize ? { code: "FILE_TOO_LARGE", message: `Tệp phải nhỏ hơn hoặc bằng ${formatBytes(maxFileSize)}.` } : validateFile?.(file);
        if (issue) { setNotice(issue.message); onUploadError?.(issue, file); return; }
        if (next.length >= limit) { setNotice(`Chỉ chọn tối đa ${limit} tệp.`); return; }
        next.push({ id: `${base}-${counter.current++}`, file, status: "queued" });
      }
      setNotice(""); setItems(next);
    }}
    onRemove={id => { controllers.current.get(id)?.abort(); controllers.current.delete(id); const item = items.find(item => item.id === id); setItems(previous => previous.filter(item => item.id !== id)); setNotice(""); if (item) onFileRemove?.(item.file); }}
    onRetry={id => update(id, { status: "queued", progress: undefined, error: undefined })} />;
}
