import { useParams } from "react-router-dom";
import { ExamPaperRead } from "@/features/exams/components/exam-read";
export function ExamPaperPage({ papersPath }: { papersPath: string }) {
  const { paperId = "" } = useParams();
  return <ExamPaperRead paperId={paperId} papersPath={papersPath} />;
}
