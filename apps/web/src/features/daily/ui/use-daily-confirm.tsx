import { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/** A feature-local, cancellable confirmation; never leaves a pending promise on unmount. */
export function useDailyConfirm() {
  const [question, setQuestion] = useState<string | null>(null);
  const resolve = useRef<((accepted: boolean) => void) | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [labels, setLabels] = useState({ title: "Xác nhận thay đổi", action: "Xác nhận", destructive: false });
  useEffect(() => () => { resolve.current?.(false); }, []);
  function finish(accepted: boolean) {
    const pending = resolve.current;
    resolve.current = null;
    setQuestion(null);
    pending?.(accepted);
  }
  function confirm(message: string, options?: { title: string; action: string; destructive?: boolean; returnFocus?: HTMLElement | null }): Promise<boolean> {
    resolve.current?.(false);
    opener.current = options?.returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setLabels({ title: options?.title ?? "Xác nhận thay đổi", action: options?.action ?? "Xác nhận", destructive: options?.destructive ?? false });
    setQuestion(message);
    return new Promise<boolean>(done => { resolve.current = done; });
  }
  const confirmation = <AlertDialog open={question !== null} onOpenChange={open => { if (!open) finish(false); }}>
    <AlertDialogContent className="daily-confirm" onCloseAutoFocus={event => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); }}>
      <AlertDialogHeader><AlertDialogTitle>{labels.title}</AlertDialogTitle><AlertDialogDescription>{question}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel onClick={() => finish(false)}>Giữ nguyên</AlertDialogCancel><AlertDialogAction className={labels.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined} onClick={() => finish(true)}>{labels.action}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
  return { confirm, confirmation };
}
