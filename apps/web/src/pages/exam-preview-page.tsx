import { useParams } from "react-router-dom";
import { ExamPreview } from "@/features/exams/components/exam-read";
export function ExamPreviewPage({ listPath }: { listPath: string }) {
  const { examId = "" } = useParams();
  return <ExamPreview examId={examId} listPath={listPath} />;
}
