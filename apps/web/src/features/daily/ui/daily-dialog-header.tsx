import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogHeader } from "@/components/ui/dialog";

/** Sticky identity/close row inside short, scrollable feature dialogs. */
export function DailyDialogHeader({ children, busy = false }: { children: ReactNode; busy?: boolean }) {
  return <DialogHeader className="daily-dialog-header">
    {children}
    <DialogClose asChild><Button type="button" variant="ghost" size="icon" className="daily-dialog-close" disabled={busy} aria-label="Đóng hộp thoại"><X aria-hidden="true" size={18} /></Button></DialogClose>
  </DialogHeader>;
}
