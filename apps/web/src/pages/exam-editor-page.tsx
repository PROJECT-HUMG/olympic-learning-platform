import { useParams } from "react-router-dom";
import { ExamEditor } from "@/features/exams/components/exam-editor";
export function ExamEditorPage({ listPath, papersPath }: { listPath: string; papersPath: string }) {
  const { examId } = useParams();
  return <ExamEditor examId={examId} listPath={listPath} papersPath={papersPath} />;
}
