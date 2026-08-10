import { useState } from "react";
import { Check, Image as ImageIcon, Save, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AssessmentQuestionDraft } from "../types/assessment-import.types";
import { useAssessmentTopics, useDraftReviewAction, useUpdateAssessmentDraft } from "../hooks/use-assessment-import";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";

function readText(value: Record<string, unknown>) {
  const text = value.text ?? value.value ?? value.question;
  return typeof text === "string" ? text : JSON.stringify(value, null, 2);
}

export function AssessmentDraftList({ drafts, importId }: { drafts: AssessmentQuestionDraft[]; importId: string }) {
  return (
    <section className="space-y-4" aria-labelledby="draft-review-title">
      <div>
        <h2 id="draft-review-title" className="text-lg font-semibold">Kiểm duyệt câu hỏi</h2>
        <p className="text-sm text-muted-foreground">Hãy kiểm tra lại công thức, đáp án và hình trước khi đưa vào ngân hàng câu hỏi.</p>
      </div>
      {drafts.map((draft) => <AssessmentDraftCard key={draft.id} draft={draft} importId={importId} />)}
    </section>
  );
}

function AssessmentDraftCard({ draft, importId }: { draft: AssessmentQuestionDraft; importId: string }) {
  const [text, setText] = useState(readText(draft.content));
  const [confidence, setConfidence] = useState(String(Math.round((draft.confidence ?? 0) * 100)));
  const updateDraft = useUpdateAssessmentDraft(importId);
  const review = useDraftReviewAction(importId);
  const metadata = useDocumentMetadata();
  const [subjectId, setSubjectId] = useState(typeof draft.content.subjectId === "string" ? draft.content.subjectId : "");
  const [topicId, setTopicId] = useState(typeof draft.content.topicId === "string" ? draft.content.topicId : "");
  const topics = useAssessmentTopics(subjectId);
  const save = async () => {
    await updateDraft.mutateAsync({
      draftId: draft.id,
      data: { content: { ...draft.content, text, subjectId, topicId }, confidence: Math.min(100, Math.max(0, Number(confidence))) / 100 },
    });
  };
  const approve = async () => {
    await save();
    await review.approve.mutateAsync(draft.id);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border/70 p-4 sm:p-5">
        <CardTitle className="text-base">Câu {draft.ordinal}</CardTitle>
        <span className="text-xs text-muted-foreground">Trang {draft.sourcePage ?? "?"} · confidence {confidence}%</span>
      </CardHeader>
      <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-3">
          <Textarea value={text} onChange={(event) => { setText(event.target.value); }} rows={5} aria-label={`Nội dung câu ${draft.ordinal}`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">Môn
              <select className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(""); }}>
                <option value="">Chọn môn</option>{metadata.data?.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">Chủ đề
              <select className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground" value={topicId} onChange={(event) => { setTopicId(event.target.value); }} disabled={!subjectId}>
                <option value="">Chọn chủ đề</option>{topics.data?.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground" htmlFor={`confidence-${draft.id}`}>Độ tin cậy</label>
            <Input id={`confidence-${draft.id}`} className="w-24" value={confidence} onChange={(event) => { setConfidence(event.target.value); }} inputMode="numeric" />
            <Button size="sm" loading={updateDraft.isPending} onClick={() => void save()}><Save className="size-4" />Lưu</Button>
            <Button size="sm" variant="outline" loading={review.approve.isPending || updateDraft.isPending} disabled={draft.status === "APPROVED" || updateDraft.isPending || !subjectId || !topicId} onClick={() => void approve()}><ThumbsUp className="size-4" />Duyệt</Button>
            <Button size="sm" variant="ghost" loading={review.reject.isPending} disabled={draft.status === "REJECTED"} onClick={() => void review.reject.mutateAsync(draft.id)}><ThumbsDown className="size-4" />Từ chối</Button>
          </div>
          {draft.warnings.length > 0 && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">{draft.warnings.join(" · ")}</p>}
        </div>
        <div className="space-y-3">
          {draft.sourcePageUrl && <figure className="overflow-hidden rounded-xl border border-border bg-muted/20"><img src={draft.sourcePageUrl} alt={`Trang gốc của câu ${draft.ordinal}`} className="max-h-72 w-full object-contain" /><figcaption className="px-3 py-2 text-xs text-muted-foreground">Trang gốc để đối chiếu</figcaption></figure>}
          {draft.assets.length === 0 ? <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">Không có hình minh họa</div> : draft.assets.map((asset) => <figure key={asset.id} className="overflow-hidden rounded-xl border border-border bg-muted/20"><img src={asset.url} alt={asset.altText ?? `Hình của câu ${draft.ordinal}`} className="max-h-56 w-full object-contain" /><figcaption className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground"><ImageIcon className="size-3.5" />{asset.role}</figcaption></figure>)}
          {draft.status === "APPROVED" && <span className="flex items-center gap-1 text-xs text-emerald-600"><Check className="size-3.5" />Đã duyệt</span>}
          {draft.status === "REJECTED" && <span className="text-xs text-destructive">Đã từ chối</span>}
        </div>
      </CardContent>
    </Card>
  );
}
