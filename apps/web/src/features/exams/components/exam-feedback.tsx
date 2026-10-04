import { Button } from "@/components/ui/button";

export function ExamLoading({ label }: { label: string }) {
  return <p className="text-sm" role="status">{label}</p>;
}

export function ExamProblem({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="space-y-3" role="alert"><p>{message}</p><Button type="button" variant="outline" onClick={onRetry}>Thử lại</Button></div>;
}
