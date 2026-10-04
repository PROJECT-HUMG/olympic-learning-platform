import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Link as LinkIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dailyEvidenceKey, evidenceErrorMessage, evidenceHttpUrl, evidenceLabel, evidenceTargetReady, type EvidenceRecord, type EvidenceScope, type EvidenceStage } from "./evidence-contract";
import { evidenceRoom, evidenceScopeKey, evidenceUploadIssue } from "./evidence-policy";
import { evidenceService, type SavedEvidenceScope } from "./evidence.service";
import { StudyEmpty } from "../ui/study-notebook";

const STAGES = { START: "Trước khi làm", FINISH: "Sau khi làm" } as const;

// The keyed child drops local selections, requests and private lists on account/resource changes.
export function EvidencePanel(props: EvidenceScope & { disabled?: boolean; readOnly?: boolean }) {
  const { disabled = false, readOnly = props.groupId !== null } = props;
  if (!evidenceTargetReady(props)) return <p className="study-note flex items-center gap-2"><Paperclip size={16} aria-hidden="true" />Lưu kế hoạch trước khi thêm minh chứng cho việc này.</p>;
  return <SavedPanel key={evidenceScopeKey(props.userId, props.planId, props.taskId, props.groupId)}
    scope={props} disabled={disabled} readOnly={readOnly} />;
}

function SavedPanel({ scope, disabled, readOnly }: { scope: SavedEvidenceScope; disabled: boolean; readOnly: boolean }) {
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  return <details className="study-evidence" onToggle={(event) => { setOpen(event.currentTarget.open); if (event.currentTarget.open) setVisited(true); }}>
    <summary><Paperclip size={16} aria-hidden="true" />Minh chứng của việc này</summary>
    {visited ? <div hidden={!open}><EvidenceControls scope={scope} disabled={disabled} readOnly={readOnly} open={open} /></div> : null}
  </details>;
}

function EvidenceControls({ scope, disabled, readOnly, open }: { scope: SavedEvidenceScope; disabled: boolean; readOnly: boolean; open: boolean }) {
  const prefix = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<EvidenceStage>("START");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const query = useQuery({
    queryKey: dailyEvidenceKey(scope.userId, scope.planId, scope.taskId, scope.groupId),
    queryFn: ({ signal }) => evidenceService.list(scope, signal),
    enabled: open,
    staleTime: 0, gcTime: 0, retry: false, refetchOnMount: "always", refetchOnWindowFocus: "always",
  });
  useEffect(() => () => { active.current?.abort(); }, []);
  // Never display old private rows while a current-permission check is pending or failed.
  const rows = query.isSuccess && !query.isFetching ? query.data : [];
  const blocked = disabled || busy;
  const canCreate = !blocked && !readOnly && query.isSuccess && !query.isFetching && evidenceRoom(rows.length);

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (active.current || disabled) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setFailure(null);
    setNotice(null);
    try {
      await action(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) setFailure(evidenceErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      if (active.current === controller) active.current = null;
    }
  }

  async function refresh() { await query.refetch(); }

  function upload() {
    if (!canCreate) return;
    const issue = evidenceUploadIssue(file);
    if (issue) { setFailure(issue); return; }
    void run(async (signal) => {
      await evidenceService.upload(scope, stage, file!, signal);
      if (signal.aborted) return;
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setNotice("Đã lưu tệp minh chứng.");
      await refresh();
    });
  }

  function saveLink() {
    if (!canCreate) return;
    if (!evidenceHttpUrl(url) || !evidenceLabel(label)) {
      setFailure("Nhập URL http/https không có thông tin đăng nhập và tên liên kết không trống.");
      return;
    }
    void run(async (signal) => {
      await evidenceService.link(scope, stage, url, label, signal);
      if (signal.aborted) return;
      setUrl(""); setLabel("");
      setNotice("Đã lưu liên kết minh chứng.");
      await refresh();
    });
  }

  function remove(item: EvidenceRecord) {
    void run(async (signal) => {
      await evidenceService.remove(scope, item.id, signal);
      if (signal.aborted) return;
      setNotice("Đã gỡ minh chứng.");
      await refresh();
    });
  }

  function download(item: EvidenceRecord) {
    void run(async (signal) => {
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

  return <div className="study-evidence__content space-y-4" data-evidence-task={scope.taskId}
    onKeyDown={(event) => { if (event.key === "Enter" && event.target instanceof HTMLInputElement && ["text", "url"].includes(event.target.type)) event.preventDefault(); }}>
    <p className="study-note">{readOnly ? "Minh chứng chỉ đọc theo quyền chia sẻ hiện tại. Tệp được tải qua nền tảng, không có bản xem trước công khai." : "Minh chứng lưu riêng, không thay đổi bản kế hoạch đang nhập. Tối đa 10 mục, mỗi tệp 5 MiB."}</p>
    {busy ? <p role="status" className="text-sm">Đang xử lý minh chứng…</p> : null}
    {notice ? <p role="status" className="study-context">{notice}</p> : null}
    {failure ? <p role="alert" className="study-notice">{failure} {!readOnly ? "Mục đang chọn chưa bị xóa." : "Bạn có thể kiểm tra quyền và thử lại."}</p> : null}
    {query.isFetching ? <p role="status" className="text-sm">Đang kiểm tra minh chứng trên máy chủ…</p> : null}
    {query.isError ? <div className="space-y-2"><p role="alert" className="text-sm">{evidenceErrorMessage(query.error)}</p><Button type="button" variant="outline" disabled={blocked} onClick={() => void run(refresh)}>Thử lại minh chứng</Button></div> : null}
    {query.isSuccess && !query.isFetching && !rows.length ? <StudyEmpty title="Chưa có minh chứng đã lưu.">{readOnly ? "Chỉ các minh chứng được chia sẻ hiện tại xuất hiện ở đây." : "Thêm tệp hoặc liên kết để ghi lại việc bạn đã làm."}</StudyEmpty> : null}
    {(["START", "FINISH"] as const).map((value) => <div key={value} className="space-y-2">
      <h4 className="text-sm font-medium">{STAGES[value]}</h4>
      <ul>{rows.filter((item) => item.stage === value).map((item) => <li key={item.id} className="study-evidence__item">
        <div className="flex min-w-0 flex-1 items-start gap-2 break-words text-sm">
          {item.kind === "LINK" ? <LinkIcon size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" /> : <FileText size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" />}
          {item.kind === "LINK" ? <a className="inline-block max-w-full break-all text-primary underline" href={item.url!} target="_blank" rel="noreferrer noopener">{item.label}</a> : <span>{item.originalName} ({formatBytes(item.sizeBytes!)})</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {item.kind === "FILE" ? <Button type="button" variant="outline" disabled={blocked} onClick={() => download(item)} aria-label={`Tải ${item.originalName}`}><Download size={16} aria-hidden="true" />Tải tệp</Button> : null}
          {!readOnly ? <Button type="button" variant="outline" disabled={blocked} onClick={() => remove(item)} aria-label={`Gỡ minh chứng ${item.originalName ?? item.label}`}>Gỡ</Button> : null}
        </div>
      </li>)}</ul>
    </div>)}
    {!readOnly ? <fieldset disabled={blocked || !canCreate} className="m-0 min-w-0 space-y-4 border-0 p-0">
      <legend className="mb-2 text-sm font-medium">Thêm minh chứng</legend>
      <div className="space-y-2"><Label htmlFor={`${prefix}-stage`}>Thời điểm</Label><select id={`${prefix}-stage`} className="h-11 w-full rounded-lg border bg-background px-3" value={stage} onChange={(event) => setStage(event.target.value as EvidenceStage)}>
        <option value="START">Trước khi làm</option><option value="FINISH">Sau khi làm</option>
      </select></div>
      <div className="space-y-2"><h4 className="text-sm font-medium">Thêm tệp</h4><Label htmlFor={`${prefix}-file`}>Tệp minh chứng</Label><Input ref={fileInput} id={`${prefix}-file`} type="file" aria-describedby={`${prefix}-file-help`} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setFailure(null); }} />
        <p id={`${prefix}-file-help`} className="study-note">Tệp tối đa 5 MiB. Chọn tệp rồi bấm lưu. Chỉ thông báo lưu thành công mới xác nhận tệp đã được giữ trên máy chủ.</p>
        <Button type="button" onClick={upload} disabled={!file}>Lưu tệp minh chứng</Button></div>
      <h4 className="text-sm font-medium">Thêm liên kết</h4>
      <p id={`${prefix}-link-help`} className="study-note">URL http/https không chứa thông tin đăng nhập. Liên kết mở bên ngoài, không có bản xem trước.</p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-label`}>Tên liên kết</Label><Input id={`${prefix}-label`} type="text" value={label} maxLength={200} onChange={(event) => setLabel(event.target.value)} /></div>
        <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-url`}>URL liên kết</Label><Input id={`${prefix}-url`} type="url" aria-describedby={`${prefix}-link-help`} value={url} maxLength={2048} onChange={(event) => setUrl(event.target.value)} /></div>
      </div>
      <Button type="button" variant="outline" onClick={saveLink} disabled={!url || !label}>Lưu liên kết minh chứng</Button>
    </fieldset> : null}
    {!readOnly && query.isSuccess && !query.isFetching && !evidenceRoom(rows.length) ? <p className="study-note">Đã đủ 10 mục. Gỡ một mục trước khi thêm.</p> : null}
    <p className="max-w-prose text-sm text-muted-foreground">Liên kết mở trang bên ngoài. Quyền truy cập và bản đã tải xuống không thể được thu hồi bởi nền tảng.</p>
  </div>;
}

function formatBytes(size: number) { return size < 1024 ? `${size} B` : `${Math.ceil(size / 1024)} KiB`; }
