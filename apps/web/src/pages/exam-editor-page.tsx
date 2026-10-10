import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CreationDialog, type CreationState } from "@/components/ui/creation-dialog";
import { getListReturnPath } from "@/lib/list-navigation";
import { ExamEditor } from "@/features/exams/components/exam-editor";
export function ExamEditorPage({ listPath, papersPath }: { listPath: string; papersPath: string }) {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<CreationState>({ dirty: false, busy: false });
  const back = getListReturnPath(location.state?.from, listPath);
  if (examId) return <ExamEditor examId={examId} listPath={listPath} papersPath={papersPath} />;
  return <CreationDialog returnFocusSelector={`main a[href="${listPath}/new"], main h1`} open onOpenChange={open => { if (!open) navigate(back); }} title="Tạo đề" description="Lưu bản nháp; xuất bản phiên bản là thao tác riêng sau khi đủ điều kiện." {...state}>{close => <ExamEditor listPath={listPath} papersPath={papersPath} onStateChange={setState} onClose={close} />}</CreationDialog>;
}
