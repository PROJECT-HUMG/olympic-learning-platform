import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { recognitionService as service } from "./service";
import { useRecognitionMutation } from "./hooks";
import { CATEGORIES, AWARDS, STATUS_LABELS } from "./scoring";
import { Checkbox, EvidenceDownload, QueryFeedback, ScoringRules } from "./components";
import { AchievementEditor } from "./achievement-editor";
import type { Achievement } from "./types";
import "./recognition.css";

export function AchievementRecord({ record, children, evidence = false }: { record: Achievement; children?: React.ReactNode; evidence?: boolean }) {
  return <article className="recognition-record"><div className="recognition-record__heading"><div><h3>{record.title}</h3><p className="recognition-hint">{record.fullName} · {new Date(record.achievedDate + "T00:00:00").toLocaleDateString("vi-VN")}</p></div><span className="recognition-status" data-status={record.status}>{STATUS_LABELS[record.status]}</span></div>
    <p>{CATEGORIES[record.category]} · {AWARDS[record.award]}</p>{record.description && <p>{record.description}</p>}
    <p className="recognition-hint">{record.awardPoints} điểm giải + {record.participationPoints} điểm tham gia = {record.totalPoints} điểm{record.status !== "APPROVED" ? " dự kiến, chưa được tính" : " đã ghi nhận"} · {record.publicVisible ? "Công khai" : "Riêng tư"}</p>
    {record.reviewNote && <p className="recognition-note">Ghi chú duyệt: {record.reviewNote}</p>}
    {evidence && !!record.evidence?.length && <div className="recognition-actions">{record.evidence.map(file => <EvidenceDownload key={file.id} achievementId={record.id} attachment={file} />)}</div>}{children}
  </article>;
}
export function MyAchievementsPage() {
  const mine = useQuery({ queryKey: ["recognition", "mine"], queryFn: service.mine });
  const settings = useQuery({ queryKey: ["recognition", "settings"], queryFn: service.settings });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Achievement | undefined>();
  const saveSettings = useRecognitionMutation(service.saveSettings, "Đã cập nhật lựa chọn xếp hạng.");
  const visibility = useRecognitionMutation(({ id, value }: { id: string; value: boolean }) => service.visibility(id, value), "Đã cập nhật quyền xem thành tích.");
  return <div className="page-shell recognition-page"><PageHeader title="Thành tích của tôi" description="Gửi minh chứng, theo dõi xét duyệt và chọn cách công khai thành tích." actions={<Button asChild variant="outline"><Link to="/profile">Về hồ sơ</Link></Button>} />
    <PageSection title="Bảng xếp hạng" description="Bạn tự chọn tham gia. Điểm xếp hạng gồm cả thành tích riêng tư đã duyệt; minh chứng luôn được giữ riêng."><QueryFeedback pending={settings.isPending} error={settings.isError} retry={() => void settings.refetch()}><Checkbox title="Tham gia bảng xếp hạng công khai" checked={settings.data?.rankingOptIn ?? false} disabled={saveSettings.isPending} onChange={value => saveSettings.mutate(value)} /><div className="recognition-links"><Link to="/rankings">Xem bảng xếp hạng</Link></div></QueryFeedback></PageSection>
    <PageSection title={editing ? "Bổ sung và gửi lại thành tích" : "Gửi thành tích mới"} actions={!creating && !editing && <Button onClick={() => setCreating(true)}>Thêm thành tích</Button>}>
      {creating || editing ? <AchievementEditor key={editing?.id ?? "new"} record={editing} onDone={() => { setCreating(false); setEditing(undefined); }} onCancel={() => { setCreating(false); setEditing(undefined); }} /> : <p className="recognition-hint">Olympic và nghiên cứu khoa học có thể được ghi nhận điểm giải và điểm tham gia riêng.</p>}
    </PageSection>
    <PageSection title="Lịch sử thành tích"><QueryFeedback pending={mine.isPending} error={mine.isError} empty={!mine.data?.length} retry={() => void mine.refetch()}>{mine.data?.map(record => <AchievementRecord key={record.id} record={record} evidence><div className="recognition-actions"><Button variant="outline" size="sm" disabled={visibility.isPending} onClick={() => visibility.mutate({ id: record.id, value: !record.publicVisible })}>{record.publicVisible ? "Đặt riêng tư" : "Đặt công khai"}</Button>{record.status !== "APPROVED" && <Button variant="outline" size="sm" onClick={() => { setCreating(false); setEditing(record); window.scrollTo({ top: 0, behavior: "instant" }); }}>Bổ sung và gửi lại</Button>}</div></AchievementRecord>)}</QueryFeedback></PageSection><ScoringRules />
  </div>;
}
