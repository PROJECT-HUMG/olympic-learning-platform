import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getPageNumber } from "@/lib/list-navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { recognitionService as service } from "./service";
import { useRecognitionMutation } from "./hooks";
import { Field, Pager, QueryFeedback, ScoringRules } from "./components";
import { HonorEditor } from "./honor-editor";
import { AchievementEditor } from "./achievement-editor";
import { AchievementRecord } from "./private-pages";
import type { Achievement, Honor } from "./types";
import "./recognition.css";

export function AdminRecognitionPage() {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab") ?? "honors";
  const tab = ["honors", "reviews", "submit"].includes(requestedTab) ? requestedTab : "honors";
  const requestedStatus = params.get("status") ?? "PENDING";
  const status = ["PENDING", "APPROVED", "REJECTED", "REVOKED"].includes(requestedStatus) ? requestedStatus : "PENDING";
  const page = getPageNumber(params.get("page")) - 1;
  const change = (key: string, value: string) => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); if (key !== "page") next.delete("page"); return next; });
  const honors = useQuery({ queryKey: ["recognition", "admin-honors", page], queryFn: () => service.honors({ page, size: 12 }, true), enabled: tab === "honors" });
  const reviews = useQuery({ queryKey: ["recognition", "reviews", status, page], queryFn: () => service.reviews({ status: status || undefined, page, size: 20 }), enabled: tab === "reviews" });
  const [editing, setEditing] = useState<Honor | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleteHonor, setDeleteHonor] = useState<Honor | null>(null);
  const [review, setReview] = useState<{ record: Achievement; status: "APPROVED" | "REJECTED" | "REVOKED" } | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const remove = useRecognitionMutation(service.deleteHonor, "Đã xóa vinh danh.", () => setDeleteHonor(null));
  const reviewMutation = useRecognitionMutation(() => service.review(review!.record, review!.status, note.trim()), "Đã cập nhật kết quả xét duyệt.", () => { setReview(null); setNote(""); });
  const labels = { APPROVED: "Duyệt thành tích", REJECTED: "Không duyệt thành tích", REVOKED: "Thu hồi thành tích" };
  function openReview(record: Achievement, next: "APPROVED" | "REJECTED" | "REVOKED") { setReview({ record, status: next }); setNote(""); setNoteError(""); }
  return <div className="page-shell recognition-page"><PageHeader title="Vinh danh và thành tích" description="Lưu kỷ niệm của nhà trường và xét duyệt điểm thành tích từ minh chứng." />
    <nav className="recognition-tabs" aria-label="Quản lý vinh danh"><Button variant={tab === "honors" ? "default" : "outline"} onClick={() => change("tab", "honors")}>Album vinh danh</Button><Button variant={tab === "reviews" ? "default" : "outline"} onClick={() => change("tab", "reviews")}>Xét duyệt thành tích</Button><Button variant={tab === "submit" ? "default" : "outline"} onClick={() => change("tab", "submit")}>Gửi thay sinh viên</Button></nav>
    {tab === "honors" && <>
      <PageSection title={editing ? "Chỉnh vinh danh" : "Album vinh danh"} actions={!creating && !editing && <Button onClick={() => setCreating(true)}>Tạo vinh danh</Button>}>
        {(creating || editing) && <div className="recognition-editor-panel"><HonorEditor key={editing?.id ?? "new"} honor={editing} onDone={() => { setEditing(undefined); setCreating(false); }} onCancel={() => { setEditing(undefined); setCreating(false); }} /></div>}
        <QueryFeedback pending={honors.isPending} error={honors.isError} empty={!honors.data?.content.length} retry={() => void honors.refetch()}>{honors.data?.content.map(honor => <article key={honor.id} className="recognition-record"><div className="recognition-record__heading"><div><h3>{honor.title}</h3><p className="recognition-hint">{honor.subject} · {honor.year} · {honor.photos.length} ảnh</p></div><span className="recognition-status">{honor.status === "PUBLISHED" ? "Công khai" : "Bản nháp"}</span></div><div className="recognition-actions"><Button variant="outline" size="sm" onClick={() => { setCreating(false); setEditing(honor); }}>Chỉnh sửa</Button><Button variant="outline" size="sm" onClick={() => setDeleteHonor(honor)}>Xóa</Button></div></article>)}<Pager page={page} value={honors.data} onChange={value => change("page", String(value + 1))} /></QueryFeedback>
      </PageSection>
    </>}
    {tab === "reviews" && <><div className="recognition-filters"><Field title="Trạng thái">{id => <select id={id} className="recognition-select" value={status} onChange={e => change("status", e.target.value)}><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Không được duyệt</option><option value="REVOKED">Đã thu hồi</option></select>}</Field></div>
      <QueryFeedback pending={reviews.isPending} error={reviews.isError} empty={!reviews.data?.content.length} retry={() => void reviews.refetch()}>{reviews.data?.content.map(record => <AchievementRecord key={record.id} record={record} evidence><div className="recognition-actions">{record.status === "PENDING" && <><Button size="sm" onClick={() => openReview(record, "APPROVED")}>Duyệt</Button><Button size="sm" variant="outline" onClick={() => openReview(record, "REJECTED")}>Không duyệt</Button></>}{record.status === "APPROVED" && <Button size="sm" variant="outline" onClick={() => openReview(record, "REVOKED")}>Thu hồi</Button>}</div></AchievementRecord>)}<Pager page={page} value={reviews.data} onChange={value => change("page", String(value + 1))} /></QueryFeedback>
    </>}
    {tab === "submit" && <PageSection title="Gửi thành tích thay sinh viên" description="Chọn tài khoản, đính kèm minh chứng và gửi vào hàng chờ xét duyệt."><AchievementEditor admin onDone={() => change("tab", "reviews")} /></PageSection>}
    <ScoringRules />
    <Dialog open={!!deleteHonor} onOpenChange={open => { if (!open && !remove.isPending) setDeleteHonor(null); }}><DialogContent><DialogTitle>Xóa vinh danh?</DialogTitle><DialogDescription>Album “{deleteHonor?.title}” và ảnh kỷ niệm sẽ bị xóa. Thao tác này không thay đổi điểm thành tích.</DialogDescription><DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setDeleteHonor(null)}>Hủy</Button><Button disabled={remove.isPending} onClick={() => deleteHonor && remove.mutate(deleteHonor.id)}>Xóa vinh danh</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!review} onOpenChange={open => { if (!open && !reviewMutation.isPending) { setReview(null); setNote(""); } }}><DialogContent className="recognition-review-dialog"><DialogTitle>{review ? labels[review.status] : "Xét duyệt thành tích"}</DialogTitle><DialogDescription>{review?.record.title} — {review?.record.fullName}. {review?.status === "REVOKED" ? "Điểm của thành tích này sẽ được gỡ khỏi bảng xếp hạng." : "Đối chiếu minh chứng trước khi xác nhận."}</DialogDescription><form className="recognition-form" onSubmit={e => { e.preventDefault(); if (review?.status !== "APPROVED" && !note.trim()) { setNoteError("Nhập lý do để người gửi hiểu kết quả xét duyệt."); return; } setNoteError(""); reviewMutation.mutate(undefined); }}><Field title={review?.status === "APPROVED" ? "Ghi chú (không bắt buộc)" : "Lý do"}>{id => <Textarea id={id} value={note} maxLength={2000} required={review?.status !== "APPROVED"} disabled={reviewMutation.isPending} onChange={e => setNote(e.target.value)} />}</Field>{noteError && <p role="alert" className="text-destructive">{noteError}</p>}<div className="recognition-actions"><Button type="submit" loading={reviewMutation.isPending}>Xác nhận</Button><Button type="button" variant="outline" disabled={reviewMutation.isPending} onClick={() => setReview(null)}>Hủy</Button></div></form></DialogContent></Dialog>
  </div>;
}
