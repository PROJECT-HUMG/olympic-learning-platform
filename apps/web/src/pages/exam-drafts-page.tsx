import { ExamDraftList } from "@/features/exams/components/exam-read";
export function ExamDraftsPage({ listPath, papersPath }: { listPath: string; papersPath: string }) {
  return <ExamDraftList listPath={listPath} papersPath={papersPath} />;
}
