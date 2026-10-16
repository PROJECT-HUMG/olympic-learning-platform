import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/ui/form-field";
import { CreationDialog } from "@/components/ui/creation-dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { useTopics } from "@/features/questions/hooks/use-questions";
import type { TopicSummary } from "@/features/questions/types/question.types";
import { parseApiError } from "@/lib/api-error";
import { useCreateTopic, useDisableTopic } from "../hooks/use-system-categories";

export function TopicManagement() {
  const [params, setParams] = useSearchParams();
  const subjectId = params.get("subjectId") ?? "";
  const metadata = useDocumentMetadata();
  const subjects = metadata.data?.subjects ?? [];
  const subject = subjects.find(item => item.id === subjectId);
  const topics = useTopics(subjectId || undefined);
  const create = useCreateTopic();
  const disable = useDisableTopic();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<TopicSummary | null>(null);
  const [notice, setNotice] = useState("");
  const busy = create.isPending || disable.isPending;
  const ready = !!subject && !metadata.isError && !metadata.isFetching;
  const message = (reason: unknown) => parseApiError(reason).status === 409
    ? "Tên chủ đề đã được sử dụng trong môn này. Hãy kiểm tra danh sách hoặc chọn tên khác."
    : "Chưa lưu được thay đổi. Hãy thử lại; nội dung đang nhập được giữ nguyên.";
  return <section className="space-y-4" aria-labelledby="topic-heading">
    <div className="page-toolbar filter-panel">
      <label className="flex min-w-0 w-full flex-col gap-2 text-sm sm:max-w-sm">Môn học
        <NativeSelect value={subjectId} disabled={busy || metadata.isPending || metadata.isError} onChange={event => {
          const id = event.target.value;
          setParams(previous => { const next = new URLSearchParams(previous); if (id) next.set("subjectId", id); else next.delete("subjectId"); return next; });
          setNotice("");
        }}><option value="">Chọn môn học</option>{subjectId && !subject && <option value={subjectId}>Môn đã chọn không còn khả dụng</option>}{subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect>
      </label>
      <Button disabled={!ready || busy} onClick={() => { setName(""); setError(""); create.reset(); setCreating(true); }}>Thêm chủ đề</Button>
    </div>
    <h2 id="topic-heading" className="text-lg font-semibold">{subject ? `Chủ đề · ${subject.name}` : "Chủ đề câu hỏi"}</h2>
    <p className="text-sm text-muted-foreground">Chủ đề dùng khi soạn câu hỏi và duyệt câu hỏi nhập từ PDF.</p>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {metadata.isPending && <p role="status">Đang tải môn học…</p>}
    {metadata.isError && <div role="alert" className="space-y-2"><p>Chưa tải được môn học.</p><Button variant="outline" disabled={metadata.isFetching} onClick={() => void metadata.refetch()}>Thử tải môn học lại</Button></div>}
    {!subjectId && !metadata.isPending && !metadata.isError && <p>Chọn một môn học để xem và thêm chủ đề.</p>}
    {subjectId && topics.isPending && <p role="status">Đang tải chủ đề…</p>}
    {subjectId && topics.isError && <div role="alert" className="space-y-2"><p>Chưa tải được chủ đề.</p><Button variant="outline" disabled={topics.isFetching} onClick={() => void topics.refetch()}>Thử tải chủ đề lại</Button></div>}
    {ready && topics.isSuccess && !topics.isError && <ul className="space-y-2">
      {!topics.data.length && <li className="content-card p-4 text-sm">Môn này chưa có chủ đề. Thêm chủ đề để bắt đầu soạn câu hỏi.</li>}
      {topics.data.map(topic => <li key={topic.id} className="content-card flex min-w-0 flex-wrap items-center justify-between gap-3 p-4"><span className="min-w-0 break-words font-medium">{topic.name}</span><Button variant="outline" disabled={busy || topics.isFetching} aria-label={`Ngừng dùng chủ đề ${topic.name}`} onClick={() => { disable.reset(); setRemoving(topic); }}>Ngừng dùng</Button></li>)}
    </ul>}
    <CreationDialog className="creation-dialog--compact" open={creating} onOpenChange={setCreating} title="Thêm chủ đề" description={`Môn học: ${subject?.name ?? "Môn đã chọn"}. Chủ đề mới sẽ xuất hiện trong bộ chọn câu hỏi.`} dirty={!!name} busy={create.isPending}>
      {close => <form className="space-y-4" onSubmit={async event => {
        event.preventDefault(); if (!ready || create.isPending) return;
        if (!name.trim()) { setError("Vui lòng nhập tên chủ đề."); return; }
        setError("");
        try { await create.mutateAsync({ subjectId, name: name.trim() }); setCreating(false); setNotice(`Đã thêm chủ đề “${name.trim()}”.`); }
        catch (reason) { setError(message(reason)); }
      }}>
        <FormField id="topic-name" label="Tên chủ đề" value={name} onChange={event => setName(event.target.value)} maxLength={255} disabled={create.isPending} required />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!ready && <p role="alert">Môn học không còn khả dụng. Đóng biểu mẫu và tải lại danh sách môn.</p>}
        <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={create.isPending} onClick={close}>Hủy</Button><Button type="submit" loading={create.isPending} disabled={!ready}>Lưu chủ đề</Button></div>
      </form>}
    </CreationDialog>
    <AlertDialog open={!!removing} onOpenChange={open => { if (!open && !disable.isPending) setRemoving(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Ngừng dùng chủ đề?</AlertDialogTitle><AlertDialogDescription>“{removing?.name}” sẽ không còn trong bộ chọn. Câu hỏi hiện có được giữ lại; câu hỏi dùng chủ đề đã ngừng sẽ cần chủ đề hợp lệ trước khi xuất bản.</AlertDialogDescription></AlertDialogHeader>
      {disable.isError && <p role="alert" className="text-sm text-destructive">{message(disable.error)}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={disable.isPending}>Hủy</AlertDialogCancel><Button variant="destructive" loading={disable.isPending} onClick={async () => { if (!removing || disable.isPending) return; try { await disable.mutateAsync(removing.id); setRemoving(null); setNotice("Đã ngừng dùng chủ đề."); } catch { /* Keep confirmation and retry available. */ } }}>Ngừng dùng</Button></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </section>;
}
