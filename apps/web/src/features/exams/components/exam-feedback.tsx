import { Button } from "@/components/ui/button";

export function ExamLoading({ label }: { label: string }) {
  return <p className="text-sm" role="status">{label}</p>;
}

export function ExamProblem({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return <div className="space-y-3" role="alert"><p>{message}</p><Button type="button" variant="outline" loading={retrying} onClick={onRetry}>Thử lại</Button></div>;
}
