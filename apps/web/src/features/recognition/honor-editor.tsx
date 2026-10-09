import { NativeSelect } from "@/components/ui/native-select";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, HonorImage, UserPicker } from "./components";
import { parseApiError } from "@/lib/api-error";
import { validateRecognitionFiles } from "./validation";
import { recognitionService as service } from "./service";
import { useRecognitionMutation } from "./hooks";
import type { Honor, HonorInput, Participant } from "./types";

export function HonorEditor({ honor, publishIntent = false, onDone, onCancel }: { honor?: Honor; publishIntent?: boolean; onDone: () => void; onCancel: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (publishIntent) { form.current?.scrollIntoView({ block: "start", behavior: "instant" }); form.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }); } }, [publishIntent]);
  const [saved, setSaved] = useState(honor);
  const [input, setInput] = useState<HonorInput>(() => honor ? { title: honor.title, subject: honor.subject, year: honor.year, description: honor.description ?? "", scope: honor.scope, status: publishIntent ? "PUBLISHED" : honor.status, participants: honor.participants } : { title: "", subject: "", year: new Date().getFullYear(), description: "", scope: "SCHOOL", status: "DRAFT", participants: [] });
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState("");
  const [manualName, setManualName] = useState("");
  const [participantAward, setParticipantAward] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [linkAccount, setLinkAccount] = useState(false);
  const update = <K extends keyof HonorInput>(key: K, value: HonorInput[K]) => setInput(previous => ({ ...previous, [key]: value }));
  const mutation = useRecognitionMutation(async () => {
    // Photo upload is completed while the album is a draft. A failed upload keeps
    // this saved draft available for retry instead of publishing an empty album.
    let album = await service.saveHonor({ ...input, title: input.title.trim(), subject: input.subject.trim(), status: files.length ? "DRAFT" : input.status }, saved?.id, saved?.version);
    setSaved(album);
    if (files.length) {
      album = await service.addPhotos(album.id, files); setSaved(album); setFiles([]); setFileKey(value => value + 1);
      if (input.status === "PUBLISHED") { album = await service.saveHonor({ ...input, status: "PUBLISHED" }, album.id, album.version); setSaved(album); }
    }
    return album;
  }, "Đã lưu vinh danh.", onDone);
  const removePhoto = useRecognitionMutation(async (photoId: string) => {
    if (!saved) return;
    const updated = await service.deletePhoto(saved.id, photoId);
    setSaved(updated);
  }, "Đã xóa ảnh khỏi album.");
  function addParticipant() {
    const name = (linkAccount ? participantName : manualName).trim();
    if (!name || (linkAccount && !participantId)) { setError("Nhập tên hoặc chọn tài khoản được vinh danh."); return; }
    if (input.participants.length >= 200) { setError("Mỗi vinh danh tối đa 200 người."); return; }
    if (linkAccount && input.participants.some(person => person.userId === participantId)) { setError("Tài khoản này đã có trong danh sách."); return; }
    const next: Participant = { fullName: name, award: participantAward.trim(), ...(linkAccount ? { userId: participantId } : {}) };
    update("participants", [...input.participants, next]); setManualName(""); setParticipantId(""); setParticipantName(""); setParticipantAward(""); setError("");
  }
  function save() {
    if (!input.title.trim() || !input.subject.trim() || !Number.isInteger(input.year) || input.year < 1900 || input.year > 2100) { setError("Nhập tiêu đề, môn/lĩnh vực và năm từ 1900 đến 2100."); return; }
    if (!input.participants.length) { setError("Thêm ít nhất một người được vinh danh."); return; }
    if (files.length) { const problem = validateRecognitionFiles(files, true); if (problem) { setError(problem); return; } }
    if (files.length + (saved?.photos.length ?? 0) > 10) { setError("Mỗi album tối đa 10 ảnh. Hãy bớt ảnh đã lưu hoặc ảnh mới."); return; }
    setError(""); mutation.mutate(undefined);
  }
  return <form ref={form} className="recognition-form" onSubmit={e => { e.preventDefault(); save(); }}><fieldset className="recognition-form" disabled={mutation.isPending || removePhoto.isPending}>
    {saved && <p className="recognition-hint">Đã lưu: {saved.status === "PUBLISHED" ? "Công khai" : "Bản nháp"}. {files.length > 0 ? "Ảnh mới được tải thành công trước khi công bố." : ""}</p>}
    <Field title="Tiêu đề">{id => <Input id={id} required maxLength={200} value={input.title} onChange={e => update("title", e.target.value)} />}</Field>
    <div className="recognition-form-row"><Field title="Môn học hoặc lĩnh vực">{id => <Input id={id} required maxLength={100} value={input.subject} onChange={e => update("subject", e.target.value)} />}</Field><Field title="Năm">{id => <Input id={id} type="number" required min={1900} max={2100} value={input.year} onChange={e => update("year", Number(e.target.value))} />}</Field></div>
    <div className="recognition-form-row"><Field title="Phạm vi">{id => <NativeSelect id={id} value={input.scope} onChange={e => update("scope", e.target.value as HonorInput["scope"])}><option value="SCHOOL">Cấp trường</option><option value="NATIONAL">Quốc gia</option><option value="INTERNATIONAL">Quốc tế</option><option value="OTHER">Khác</option></NativeSelect>}</Field><Field title="Trạng thái" hint="Bản nháp chưa hiển thị công khai. Chọn Công khai và Lưu và công bố khi album sẵn sàng.">{id => <NativeSelect id={id} value={input.status} onChange={e => update("status", e.target.value as HonorInput["status"])}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Công khai</option></NativeSelect>}</Field></div>
    <Field title="Lời ghi nhớ" hint="Vài dòng ngắn cho album, không cần một bài viết dài.">{id => <Textarea id={id} rows={3} maxLength={10000} value={input.description} onChange={e => update("description", e.target.value)} />}</Field>
    <div className="recognition-participant-editor"><h3 className="font-semibold">Những người được vinh danh</h3><ul className="recognition-file-list">{input.participants.map((person, index) => <li key={index} className="recognition-record__heading"><span>{person.fullName}{person.award ? ` — ${person.award}` : ""}{person.userId ? " (tài khoản)" : ""}</span><Button type="button" variant="outline" size="sm" aria-label={`Bỏ ${person.fullName} khỏi danh sách`} onClick={() => update("participants", input.participants.filter((_, i) => i !== index))}>Bỏ khỏi danh sách</Button></li>)}</ul>
      <Field title="Cách thêm người">{id => <NativeSelect id={id} value={linkAccount ? "account" : "manual"} onChange={e => setLinkAccount(e.target.value === "account")}><option value="manual">Nhập tên</option><option value="account">Liên kết tài khoản</option></NativeSelect>}</Field>
      {linkAccount ? <UserPicker selected={participantId} studentOnly onChange={(id, name) => { setParticipantId(id); setParticipantName(name); }} /> : <Field title="Họ tên" hint="Dùng tên nhập tay cho người chưa có tài khoản hoặc thành viên lịch sử.">{id => <Input id={id} maxLength={200} value={manualName} onChange={e => setManualName(e.target.value)} />}</Field>}
      <Field title="Giải thưởng hoặc đóng góp">{id => <Input id={id} maxLength={100} value={participantAward} onChange={e => setParticipantAward(e.target.value)} />}</Field><div><Button type="button" variant="outline" onClick={addParticipant}>Thêm vào danh sách</Button></div>
    </div>
    {saved && !!saved.photos.length && <div className="recognition-photo-grid">{saved.photos.map(photo => <div key={photo.id}><div className="recognition-photo"><HonorImage honor={saved} photoId={photo.id} alt={photo.originalName} management /></div><p className="recognition-hint mt-2">{photo.originalName}</p><Button type="button" size="sm" variant="outline" className="mt-2" aria-label={`Xóa ảnh ${photo.originalName}`} onClick={() => removePhoto.mutate(photo.id)}>Xóa ảnh</Button></div>)}</div>}
    <Field title="Ảnh kỷ niệm" hint="Album tối đa 10 ảnh JPEG, PNG hoặc WebP. Mỗi ảnh tối đa 5 MB; mỗi lần tải tối đa 15 MB.">{id => <input key={fileKey} id={id} className="recognition-file-input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => { const next = Array.from(e.target.files ?? []); setFiles(next); setError(next.length ? validateRecognitionFiles(next, true) ?? "" : ""); }} />}</Field>
    <ul className="recognition-file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}</li>)}</ul>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {mutation.isError && <p role="alert" className="text-destructive">{parseApiError(mutation.error).detail || "Chưa lưu được album. Nội dung và bản nháp đã lưu vẫn giữ để thử lại."} {parseApiError(mutation.error).status === 409 && "Album đã thay đổi. Giữ lại nội dung cần thiết, đóng và mở lại album để đối chiếu trước khi lưu."}</p>}
    <p className="recognition-hint">Vinh danh lưu kỷ niệm và không cộng điểm xếp hạng.</p><div className="recognition-actions"><Button type="submit" loading={mutation.isPending}>{input.status === "PUBLISHED" ? "Lưu và công bố" : "Lưu bản nháp"}</Button><Button type="button" variant="outline" onClick={onCancel}>Đóng</Button></div>
  </fieldset></form>;
}
