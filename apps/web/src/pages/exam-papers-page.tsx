import { ExamPaperList } from "@/features/exams/components/exam-read";
export function ExamPapersPage({ papersPath }: { papersPath: string }) {
  return <ExamPaperList papersPath={papersPath} />;
}
