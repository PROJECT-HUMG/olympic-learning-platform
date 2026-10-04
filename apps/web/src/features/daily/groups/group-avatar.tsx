import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AvatarCropDialog } from "@/features/user/components/avatar-crop-dialog";
import { AvatarImage } from "@/features/user/components/avatar-image";
import type { AvatarCrop } from "@/features/user/types/user.types";
import "@/features/user/components/profile.css";
import { StudyDisclosure } from "../ui/study-notebook";
import { groupService } from "./group.service";
import type { GroupSummary } from "./group-contract";
import { useGroupAction } from "./use-group-action";

function useGroupImage(group: GroupSummary, revision = 0) {
  const id = group.avatar?.id;
  const key = `${group.id}:${id ?? ""}:${revision}`;
  const [loaded, setLoaded] = useState<{ key: string; url: string | null }>({ key: "", url: null });
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let url: string | null = null;
    void groupService.avatarBytes(group.id, id, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob);
      setLoaded({ key, url });
    }).catch(() => { if (!controller.signal.aborted) setLoaded({ key, url: null }); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [group.id, id, key]);
  return loaded.key === key ? loaded.url : null;
}

export function GroupAvatarImage({ group }: { group: GroupSummary }) {
  const src = useGroupImage(group);
  const [failed, setFailed] = useState<string | null>(null);
  return src && src !== failed ? <AvatarImage src={src} crop={group.avatar?.crop} alt="" onError={() => setFailed(src)} />
    : <>{Array.from(group.name.trim())[0]?.toLocaleUpperCase("vi") ?? "?"}</>;
}

interface Selection { file: File | null; url: string; crop?: AvatarCrop; avatarId: string | null }

/** Uses the exact profile crop dialog, original-image preview, validation and explicit save flow. */
export function GroupAvatarEditor({ group, refresh }: { group: GroupSummary; refresh: () => Promise<unknown> }) {
  const input = useRef<HTMLInputElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const action = useGroupAction();
  const [revision, setRevision] = useState(0);
  const savedUrl = useGroupImage(group, revision);
  const [source, setSource] = useState<Selection | null>(null);
  const [preview, setPreview] = useState<(Selection & { crop: AvatarCrop }) | null>(null);
  const [issue, setIssue] = useState<string | null>(null);

  useEffect(() => () => { if (source?.file) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { if (preview?.file) URL.revokeObjectURL(preview.url); }, [preview]);

  function cancel() { setPreview(null); setSource(null); setIssue(null); if (input.current) input.current.value = ""; }
  function select(file?: File) {
    if (!file) return;
    if (input.current) input.current.value = "";
    if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setIssue("Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.");
      return;
    }
    setIssue(null);
    setSource({ file, url: URL.createObjectURL(file), avatarId: null });
  }
  function editCrop() {
    const chosen = preview ?? (savedUrl && group.avatar ? { file: null, url: savedUrl, crop: group.avatar.crop, avatarId: group.avatar.id } : null);
    if (chosen) setSource({ ...chosen, url: chosen.file ? URL.createObjectURL(chosen.file) : chosen.url });
  }
  function save() {
    if (!preview) return;
    void action.run(async signal => {
      if (preview.file) await groupService.uploadAvatar(group.id, preview.file, preview.crop, signal);
      else if (preview.avatarId) await groupService.cropAvatar(group.id, preview.avatarId, preview.crop, signal);
      if (signal.aborted) return "";
      cancel();
      await refresh();
      return "Đã lưu ảnh nhóm.";
    });
  }
  return <StudyDisclosure title="Ảnh đại diện nhóm" description="Chỉ chủ nhóm được đổi ảnh. Dùng cùng cách chọn khung với hồ sơ cá nhân; ảnh gốc được giữ nguyên.">
    <div className="study-group-avatar-editor">
      <span className="study-group-avatar-editor__image">
        {preview ? <AvatarImage src={preview.url} crop={preview.crop} alt="Ảnh nhóm đang xem trước" />
          : savedUrl ? <AvatarImage src={savedUrl} crop={group.avatar?.crop} alt="Ảnh nhóm đã lưu" />
          : <>{Array.from(group.name.trim())[0]?.toLocaleUpperCase("vi") ?? "?"}</>}
      </span>
      <div className="min-w-0 space-y-3">
        <p className="study-note">{preview ? "Xem trước · Chưa lưu. Đóng mục này vẫn giữ bản xem trước; rời trang sẽ bỏ bản xem trước." : "JPG, PNG hoặc WebP. Tối đa 5 MB."}</p>
        <input id="group-avatar-file" ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Chọn file ảnh nhóm" disabled={action.busy} onChange={event => select(event.target.files?.[0])} />
        <div className="flex flex-wrap gap-2">
          {preview ? <>
            <Button ref={actionRef} type="button" disabled={action.busy} onClick={save}>Lưu ảnh nhóm</Button>
            <Button type="button" variant="outline" disabled={action.busy} onClick={editCrop}>Chỉnh khung</Button>
            <Button type="button" variant="ghost" disabled={action.busy} onClick={cancel}>Hủy ảnh đang chọn</Button>
          </> : <>
            <Button ref={actionRef} type="button" variant="outline" disabled={action.busy} onClick={() => input.current?.click()}>Chọn ảnh nhóm</Button>
            {savedUrl ? <Button type="button" variant="outline" disabled={action.busy} onClick={editCrop}>Chỉnh khung</Button> : null}
            {group.avatar ? <>
              <Button type="button" variant="ghost" disabled={action.busy} onClick={() => setRevision(value => value + 1)}>Tải lại ảnh</Button>
              <Button type="button" variant="outline" disabled={action.busy} onClick={() => {
                if (!group.avatar || !window.confirm("Xóa ảnh đại diện nhóm? Ảnh cá nhân và Daily không thay đổi.")) return;
                const id = group.avatar.id;
                void action.run(async signal => { await groupService.removeAvatar(group.id, id, signal); if (!signal.aborted) await refresh(); return "Đã xóa ảnh nhóm."; });
              }}>Xóa ảnh nhóm</Button>
            </> : null}
          </>}
        </div>
        {issue ? <p role="alert">{issue}</p> : null}
        {action.notice ? <p role="status">{action.notice}</p> : null}
        {action.busy ? <p role="status">Đang lưu ảnh nhóm…</p> : null}
      </div>
    </div>
    {source ? <AvatarCropDialog key={source.url} src={source.url} initialCrop={source.crop}
      onApply={crop => { setPreview({ ...source, url: source.file ? URL.createObjectURL(source.file) : source.url, crop }); setSource(null); }}
      onCancel={() => setSource(null)} onCloseFocus={() => actionRef.current?.focus()} /> : null}
  </StudyDisclosure>;
}
