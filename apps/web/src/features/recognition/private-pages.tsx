import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { publicProfilePath } from "@/features/user/lib/public-identity";
import { parseApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CreationDialog, type CreationState } from "@/components/ui/creation-dialog";
import { recognitionService as service } from "./service";
import { useRecognitionMutation } from "./hooks";
import { CATEGORIES, AWARDS, STATUS_LABELS } from "./scoring";
import { Checkbox, QueryFeedback, ScoringRules } from "./components";
import { AchievementEvidence } from "./achievement-evidence";
import { AchievementEditor } from "./achievement-editor";
import type { Achievement } from "./types";
import "./recognition.css";
import "./individual-recognition.css";

export function AchievementRecord({ record, children, evidence = false, showOwner = true }: { record: Achievement; children?: React.ReactNode; evidence?: boolean; showOwner?: boolean }) {
  return <article className="recognition-record"><div className="recognition-record__heading"><div><h3 tabIndex={-1}>{record.title}</h3><p className="recognition-hint">{showOwner && `${record.fullName} · `}{new Date(record.achievedDate + "T00:00:00").toLocaleDateString("vi-VN")}</p></div><span className="recognition-status" data-status={record.status}>{STATUS_LABELS[record.status]}</span></div>
    <p>{CATEGORIES[record.category]} · {AWARDS[record.award]}</p>{record.description && <p>{record.description}</p>}
    <p className="recognition-hint">{record.awardPoints} điểm giải + {record.participationPoints} điểm tham gia = {record.totalPoints} điểm{record.status === "APPROVED" ? " đã ghi nhận" : record.status === "PENDING" ? " dự kiến, chưa được tính" : " không được tính"} · {record.publicVisible ? record.status === "APPROVED" ? "Công khai" : "Công khai sau khi được duyệt" : "Riêng tư"}</p>
    {record.reviewNote && <p className="recognition-note">Ghi chú duyệt: {record.reviewNote}</p>}
    {evidence && !!record.evidence?.length && <AchievementEvidence record={record} />}{children}
  </article>;
}
export function MyAchievementsPage() {
  const current = useCurrentUser();
  const mine = useQuery({ queryKey: ["recognition", "mine"], queryFn: service.mine });
  const settings = useQuery({ queryKey: ["recognition", "settings"], queryFn: service.settings });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Achievement | undefined>();
  const [achievementState, setAchievementState] = useState<CreationState>({ dirty: false, busy: false });
  const saveSettings = useRecognitionMutation(service.saveSettings, "Đã cập nhật lựa chọn xếp hạng.");
  const visibility = useRecognitionMutation(({ id, value }: { id: string; value: boolean }) => service.visibility(id, value), "Đã cập nhật quyền xem thành tích.");
  const ownProfile = !current.isError && !current.isFetching ? current.data : undefined;
  const openCreate = () => { setEditing(undefined); setCreating(true); };
  const closeEditor = () => { setCreating(false); setEditing(undefined); setAchievementState({ dirty: false, busy: false }); };
  return <div className="page-shell recognition-page recognition-personal">
    <PageHeader title="Thành tích của tôi" description="Gửi minh chứng và theo dõi kết quả xét duyệt của bạn."
      actions={<div className="recognition-actions"><Button onClick={openCreate}>Gửi thành tích</Button>{ownProfile && <Button asChild variant="outline"><Link to={publicProfilePath(ownProfile.id)} state={{ from: "/profile/achievements" }}>Xem hồ sơ của tôi</Link></Button>}</div>} />
    <nav className="recognition-links" aria-label="Điều hướng thành tích cá nhân"><Button asChild variant="ghost"><Link to="/profile">Về tài khoản</Link></Button></nav>
    <section className="recognition-personal__history" aria-labelledby="my-achievements-heading">
      <div className="recognition-personal__section-heading"><h2 id="my-achievements-heading">Hồ sơ đã gửi</h2><p className="recognition-hint" role="status">{mine.isFetching ? "Đang cập nhật…" : mine.isError ? "" : `${mine.data?.length ?? 0} hồ sơ`}</p></div>
      <QueryFeedback pending={mine.isPending} error={mine.isError} retrying={mine.isFetching} retry={() => void mine.refetch()} pendingText="Đang tải thành tích của bạn…" errorText="Chưa tải được hồ sơ đã gửi. Hãy thử lại.">
        {!mine.data?.length ? <div className="recognition-person__empty" role="status"><h3>Bạn chưa gửi thành tích nào</h3><p>Gửi thông tin và minh chứng. Kết quả xét duyệt sẽ xuất hiện tại đây.</p></div> : <div className="recognition-personal__records">{mine.data.map(record => <AchievementRecord key={record.id} record={record} showOwner={false} evidence={mine.isSuccess && !mine.isFetching}>
          <div className="recognition-actions"><Button variant="outline" size="sm" disabled={visibility.isPending} loading={visibility.isPending && visibility.variables?.id === record.id} onClick={() => visibility.mutate({ id: record.id, value: !record.publicVisible })}>{record.publicVisible ? "Đặt riêng tư" : "Đặt công khai"}</Button>{record.status !== "APPROVED" && <Button variant="outline" size="sm" onClick={() => { setCreating(false); setEditing(record); }}>Bổ sung và gửi lại</Button>}</div>
          {visibility.isError && visibility.variables?.id === record.id && <p role="alert" className="text-sm text-destructive">{parseApiError(visibility.error).detail || "Chưa đổi được quyền xem. Lựa chọn hiện tại vẫn được giữ."}</p>}
        </AchievementRecord>)}</div>}
      </QueryFeedback>
    </section>
    <details className="recognition-personal__preferences">
      <summary>Hiển thị và xếp hạng<span className="recognition-hint">{settings.isPending ? "Đang tải…" : settings.isError ? "Chưa tải được lựa chọn" : settings.data?.rankingOptIn ? "Đã tham gia xếp hạng" : "Chưa tham gia xếp hạng"}</span></summary>
      <div className="recognition-personal__preferences-body"><p className="recognition-hint">Bạn có thể đặt từng thành tích ở chế độ công khai hoặc riêng tư. Minh chứng chỉ bạn và quản trị viên được xem.</p>
        <QueryFeedback pending={settings.isPending} error={settings.isError} retrying={settings.isFetching} retry={() => void settings.refetch()} errorText="Chưa tải được lựa chọn xếp hạng. Hãy thử lại.">
          <Checkbox title="Tham gia bảng xếp hạng công khai" checked={settings.data?.rankingOptIn ?? false} disabled={saveSettings.isPending || settings.isFetching} onChange={value => saveSettings.mutate(value)} />
          <p className="recognition-hint">Bạn tự chọn tham gia. Tổng xếp hạng gồm cả thành tích riêng tư đã duyệt; không công khai minh chứng.</p>
          {saveSettings.isError && <p role="alert" className="text-sm text-destructive">{parseApiError(saveSettings.error).detail || "Chưa lưu được lựa chọn. Hãy thử lại."}</p>}
          <Button asChild variant="outline"><Link to="/rankings">Xem bảng xếp hạng</Link></Button>
        </QueryFeedback>
      </div>
    </details>
    <ScoringRules />
    <CreationDialog open={creating || Boolean(editing)} onOpenChange={open => { if (!open) closeEditor(); }}
      title={editing ? "Bổ sung và gửi lại thành tích" : "Gửi thành tích"}
      description={editing ? "Cập nhật thông tin và chọn lại minh chứng để gửi lại xét duyệt." : "Nhập thông tin và đính kèm minh chứng. Điểm chỉ được ghi nhận sau khi duyệt."}
      dirty={achievementState.dirty} busy={achievementState.busy}>
      {close => <AchievementEditor key={editing?.id ?? "new"} record={editing} onDone={closeEditor} onCancel={close} onStateChange={setAchievementState} />}
    </CreationDialog>
  </div>;
}
