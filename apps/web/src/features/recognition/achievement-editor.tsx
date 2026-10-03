import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, AWARDS, PARTICIPATION, estimatePoints } from "./scoring";
import { Checkbox, Field, UserPicker } from "./components";
import { recognitionService as service } from "./service";
import { useRecognitionMutation } from "./hooks";
import type { Achievement, AchievementInput, Award, Category } from "./types";
import { validateRecognitionFiles } from "./validation";

export function AchievementEditor({ record, admin = false, onDone, onCancel }: { record?: Achievement; admin?: boolean; onDone?: () => void; onCancel?: () => void }) {
  const localDate = new Date();
  const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
  const [input, setInput] = useState<AchievementInput>(() => record ? {
    title: record.title, description: record.description ?? "", category: record.category, award: record.award,
    includeParticipation: record.includeParticipation, achievedDate: record.achievedDate, publicVisible: record.publicVisible,
  } : { title: "", description: "", category: "OLYMPIC_SCHOOL", award: "FIRST", includeParticipation: false, achievedDate: today, publicVisible: false });
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const mutation = useRecognitionMutation(() => service.submit(input, files, admin ? userId : undefined, record?.id), "Đã gửi thành tích để duyệt.", () => { onDone?.(); });
  const points = estimatePoints(input.category, input.award, input.includeParticipation);
  const update = <K extends keyof AchievementInput>(key: K, value: AchievementInput[K]) => setInput(previous => ({ ...previous, [key]: value }));
  function submit() {
    const fileError = validateRecognitionFiles(files);
    if (fileError) { setError(fileError); return; }
    if (!input.title.trim() || !input.achievedDate || input.achievedDate > today || input.achievedDate < "1900-01-01") { setError("Nhập tên thành tích và ngày đạt hợp lệ, không nằm trong tương lai."); return; }
    if (admin && !userId) { setError("Chọn tài khoản nhận thành tích."); return; }
    if (points <= 0) { setError("Chọn giải thưởng hoặc hoạt động có điểm tham gia."); return; }
    setError(""); mutation.mutate(undefined);
  }
  return <form className="recognition-form" onSubmit={e => { e.preventDefault(); submit(); }}>
    <fieldset disabled={mutation.isPending} className="recognition-form">
      {admin && <UserPicker selected={userId} studentOnly onChange={id => setUserId(id)} />}
      <Field title="Tên thành tích">{id => <Input id={id} value={input.title} required maxLength={200} onChange={e => update("title", e.target.value)} placeholder="Tên kỳ thi hoặc đề tài" />}</Field>
      <div className="recognition-form-row"><Field title="Loại hoạt động">{id => <select id={id} className="recognition-select" value={input.category} onChange={e => {
        const category = e.target.value as Category;
        setInput(previous => ({ ...previous, category, includeParticipation: PARTICIPATION[category] ? previous.includeParticipation : false, award: !PARTICIPATION[category] && previous.award === "NONE" ? "FIRST" : previous.award }));
      }}>{Object.entries(CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>}</Field>
      <Field title="Giải thưởng">{id => <select id={id} className="recognition-select" value={input.award} onChange={e => { const award = e.target.value as Award; setInput(previous => ({ ...previous, award, includeParticipation: award === "NONE" ? true : previous.includeParticipation })); }}>{Object.entries(AWARDS).filter(([key]) => key !== "NONE" || !!PARTICIPATION[input.category]).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>}</Field></div>
      {!!PARTICIPATION[input.category] && <Checkbox title={`Ghi nhận tham gia (+${PARTICIPATION[input.category]} điểm, cộng thêm điểm giải nếu có)`} checked={input.includeParticipation} disabled={input.award === "NONE"} onChange={value => update("includeParticipation", value)} />}
      <Field title="Ngày đạt thành tích">{id => <Input id={id} type="date" required min="1900-01-01" max={today} value={input.achievedDate} onChange={e => update("achievedDate", e.target.value)} />}</Field>
      <Field title="Thông tin thêm" hint="Mô tả ngắn nội dung hoặc vai trò của bạn để người duyệt đối chiếu minh chứng.">{id => <Textarea id={id} value={input.description} maxLength={2000} onChange={e => update("description", e.target.value)} rows={3} />}</Field>
      <Field title={record ? "Minh chứng thay thế" : "Minh chứng"} hint="1–3 file JPEG, PNG, WebP hoặc PDF; mỗi file tối đa 5 MB. Chỉ bạn và quản trị viên được tải minh chứng.">{id => <input id={id} type="file" className="recognition-file-input" multiple accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={e => { const next = Array.from(e.target.files ?? []); setFiles(next); setError(next.length ? validateRecognitionFiles(next) ?? "" : ""); }} />}</Field>
      <ul className="recognition-file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</li>)}</ul>
      <Checkbox title="Công khai thành tích sau khi được duyệt" checked={input.publicVisible} onChange={value => update("publicVisible", value)} />
      <p className="recognition-hint">Dự kiến {points} điểm sau khi được duyệt. Gửi hồ sơ chưa làm tăng điểm xếp hạng.</p>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="recognition-actions"><Button type="submit" loading={mutation.isPending}>Gửi để duyệt</Button>{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>}</div>
    </fieldset>
  </form>;
}
