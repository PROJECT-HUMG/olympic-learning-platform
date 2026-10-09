import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Presentation only: each editor retains its edit/sync/session ownership. */
export function DailyReflectionField({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
}) {
  return <div className="study-review-field space-y-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} maxLength={4000} onChange={(event) => onChange(event.target.value)} /></div>;
}
