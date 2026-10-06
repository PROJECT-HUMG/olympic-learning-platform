import { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/** A feature-local, cancellable confirmation; never leaves a pending promise on unmount. */
export function useDailyConfirm() {
  const [question, setQuestion] = useState<string | null>(null);
  const resolve = useRef<((accepted: boolean) => void) | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => () => { resolve.current?.(false); }, []);
  function finish(accepted: boolean) {
    const pending = resolve.current;
    resolve.current = null;
    setQuestion(null);
    pending?.(accepted);
  }
  function confirm(message: string): Promise<boolean> {
    resolve.current?.(false);
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuestion(message);
    return new Promise<boolean>(done => { resolve.current = done; });
  }
  const confirmation = <AlertDialog open={question !== null} onOpenChange={open => { if (!open) finish(false); }}>
    <AlertDialogContent className="daily-confirm" onCloseAutoFocus={event => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); }}>
      <AlertDialogHeader><AlertDialogTitle>Xác nhận thay đổi</AlertDialogTitle><AlertDialogDescription>{question}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel onClick={() => finish(false)}>Giữ nguyên</AlertDialogCancel><AlertDialogAction onClick={() => finish(true)}>Xác nhận</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
  return { confirm, confirmation };
}
