import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiError } from "@/lib/api-error";
import { toast } from "sonner";
import { recognitionService as service } from "./service";
import { CATEGORIES, AWARDS, PARTICIPATION, estimatePoints } from "./scoring";
import type { Evidence, Honor, Participant, RecognitionPage } from "./types";

export function QueryFeedback({ pending, error, empty, retry, children }: { pending: boolean; error: boolean; empty?: boolean; retry: () => void; children: ReactNode }) {
  if (pending) return <div className="recognition-feedback" role="status">Đang tải thông tin…</div>;
  if (error) return <div className="recognition-feedback" role="alert"><p>Chưa tải được thông tin. Kiểm tra kết nối và thử lại.</p><Button variant="outline" onClick={retry}>Thử lại</Button></div>;
  if (empty) return <p className="recognition-feedback" role="status">Chưa có nội dung phù hợp với lựa chọn này.</p>;
  return children;
}
export function Field({ title, children, hint }: { title: string; children: (id: string) => ReactNode; hint?: string }) {
  const id = useId();
  return <div className="recognition-field"><Label htmlFor={id}>{title}</Label>{children(id)}{hint && <p className="recognition-hint">{hint}</p>}</div>;
}
export function Checkbox({ title, checked, onChange, disabled }: { title: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <label className="recognition-checkbox"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} /><span>{title}</span></label>;
}
export function Pager({ page, value, onChange }: { page: number; value?: RecognitionPage<unknown>; onChange: (page: number) => void }) {
  if (!value || value.totalPages < 2) return null;
  return <nav className="recognition-pager" aria-label="Phân trang"><Button variant="outline" disabled={page === 0} onClick={() => onChange(page - 1)}>Trước</Button><span>Trang {page + 1} / {value.totalPages}</span><Button variant="outline" disabled={page + 1 >= value.totalPages} onClick={() => onChange(page + 1)}>Sau</Button></nav>;
}
export function YearField({ value, onChange, allTime = false }: { value: string; onChange: (value: string) => void; allTime?: boolean }) {
  return <Field title={allTime ? "Khoảng thời gian" : "Năm"}>{id => <select id={id} className="recognition-select" value={value} onChange={e => onChange(e.target.value)}><option value="">{allTime ? "Tất cả thời gian" : "Tất cả năm"}</option>{Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => new Date().getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}</select>}</Field>;
}
export function Participants({ items }: { items: Participant[] }) {
  return <ul className="recognition-participants">{items.map((person, index) => <li key={`${person.userId ?? person.fullName}-${index}`}><span>{person.userId ? <Link to={`/achievements/${person.userId}`}>{person.fullName}</Link> : person.fullName}</span>{person.award && <span className="recognition-hint">{person.award}</span>}</li>)}</ul>;
}
export function HonorImage({ honor, photoId, alt, management = false, interactive = true }: { honor: Honor; photoId: string; alt: string; management?: boolean; interactive?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const photo = useQuery({ queryKey: ["recognition", "photo", honor.id, photoId, management], queryFn: () => service.photo(honor.id, photoId, management), staleTime: 5 * 60_000, retry: 1, enabled: visible });
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); if (!photo.data) { setUrl(""); return; } const next = URL.createObjectURL(photo.data); setUrl(next); return () => URL.revokeObjectURL(next); }, [photo.data]);
  return <div ref={container} className="recognition-image">{url && !failed ? <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} /> : <div className="recognition-image-feedback" role="status">{photo.isError || failed ? interactive ? <Button variant="outline" onClick={() => void photo.refetch()}>Thử tải ảnh lại</Button> : "Chưa tải được ảnh. Mở ảnh để thử lại." : "Đang tải ảnh…"}</div>}</div>;
}
export function EvidenceDownload({ achievementId, attachment }: { achievementId: string; attachment: Evidence }) {
  const [pending, setPending] = useState(false);
  async function download() {
    setPending(true);
    try { const blob = await service.evidence(achievementId, attachment.id); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = attachment.originalName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    catch (error) { toast.error(parseApiError(error).detail || "Chưa tải được minh chứng. Hãy thử lại."); }
    finally { setPending(false); }
  }
  return <Button size="sm" variant="outline" onClick={() => void download()} disabled={pending}>{pending ? "Đang tải…" : `Tải ${attachment.originalName}`}</Button>;
}
export function ScoringRules() {
  return <details className="recognition-rules"><summary>Cách tính điểm thành tích</summary><div className="recognition-table-scroll"><table><caption>Điểm được cộng cho mỗi hồ sơ đã duyệt. Điểm giải và tham gia cộng riêng khi được xác nhận.</caption><thead><tr><th scope="col">Hoạt động</th>{Object.entries(AWARDS).filter(([key]) => key !== "NONE").map(([key, label]) => <th key={key} scope="col">{label}</th>)}<th scope="col">Tham gia</th></tr></thead><tbody>{Object.entries(CATEGORIES).map(([key, label]) => <tr key={key}><th scope="row">{label}</th>{(["FIRST", "SECOND", "THIRD", "CONSOLATION"] as const).map(award => <td key={award}>{estimatePoints(key as keyof typeof CATEGORIES, award, false)}</td>)}<td>{PARTICIPATION[key as keyof typeof CATEGORIES] ?? "—"}</td></tr>)}</tbody></table></div><p>Kỷ niệm vinh danh không cộng điểm. Hồ sơ công khai chỉ hiển thị thành tích công khai; bảng xếp hạng cộng các thành tích đã duyệt của người đã chọn tham gia.</p></details>;
}
export function UserPicker({ selected, onChange, studentOnly = false }: { selected: string; onChange: (id: string, name: string) => void; studentOnly?: boolean }) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; label: string } | null>(null);
  const users = useQuery({ queryKey: ["recognition", "user-picker", search], queryFn: async () => {
    const { adminUsersService } = await import("@/features/admin/services/admin-users.service");
    return (await adminUsersService.search({ search, page: 0, size: 20 })).data;
  } });
  return <div className="recognition-user-picker"><Field title="Tìm tài khoản" hint="Tìm theo tên, email hoặc username; sau đó chọn tài khoản.">{id => <Input id={id} value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên hoặc email" />}</Field><QueryFeedback pending={users.isPending} error={users.isError} retry={() => void users.refetch()}><Field title="Tài khoản">{id => <select id={id} className="recognition-select" value={selected} onChange={e => { const user = users.data?.content.find(u => u.id === e.target.value); setSelectedUser(user ? { id: user.id, label: `${user.fullName} (${user.username})` } : null); onChange(e.target.value, user?.fullName ?? ""); }}><option value="">Chọn tài khoản</option>{selectedUser?.id === selected && !users.data?.content.some(user => user.id === selected) && <option value={selectedUser.id}>{selectedUser.label}</option>}{users.data?.content.filter(user => !studentOnly || (user.role === "STUDENT" && user.status === "ACTIVE")).map(user => <option key={user.id} value={user.id}>{user.fullName} ({user.username})</option>)}</select>}</Field></QueryFeedback></div>;
}
