import { useRef, useState, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./alert-dialog";
import "./creation-dialog.css";

export interface CreationState { dirty: boolean; busy: boolean }

/** Presentation and close lifecycle only. Form owners retain validation and persistence. */
export function CreationDialog({ open, onOpenChange, title, description, dirty = false, busy = false, className, returnFocusSelector, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  className?: string;
  returnFocusSelector?: string;
  dirty?: boolean;
  busy?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const confirmReturn = useRef<HTMLElement | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  function close() {
    if (busy) return;
    if (dirty) { confirmReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setConfirmClose(true); }
    else onOpenChange(false);
  }
  return <>
    <Dialog open={open} onOpenChange={next => { if (!next) close(); else onOpenChange(true); }}>
      <DialogContent className={["creation-dialog",className].filter(Boolean).join(" ")} showCloseButton={false}
        onOpenAutoFocus={event => { event.preventDefault(); opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; titleRef.current?.focus(); }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (returnFocusSelector) {
            // Routed creation can unmount before the destination's lazy page mounts.
            const focus = () => {
              const target = returnFocusSelector.split(",").map(selector => document.querySelector<HTMLElement>(selector.trim())).find(Boolean);
              if (!target) return false;
              if (target.matches("h1,h2")) target.tabIndex = -1;
              target.focus();
              return true;
            };
            requestAnimationFrame(() => {
              if (focus()) return;
              const observer = new MutationObserver(() => { if (focus()) { observer.disconnect(); clearTimeout(timeout); } });
              const timeout = setTimeout(() => observer.disconnect(), 5000);
              observer.observe(document.body, { childList: true, subtree: true });
            });
          }
          else if (opener.current?.isConnected) opener.current.focus();
        }}>

        <DialogHeader className="creation-dialog__header">
          <div><DialogTitle ref={titleRef} tabIndex={-1}>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></div>
          <Button type="button" variant="outline" disabled={busy} onClick={close}>Đóng</Button>
        </DialogHeader>
        <div className="creation-dialog__body">{children(close)}</div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={open && confirmClose} onOpenChange={setConfirmClose}>
      <AlertDialogContent onCloseAutoFocus={event => { event.preventDefault(); if (confirmReturn.current?.isConnected) confirmReturn.current.focus(); }}>
        <AlertDialogHeader><AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle><AlertDialogDescription>Nội dung trong biểu mẫu chưa được lưu. Tiếp tục chỉnh sửa để giữ lại, hoặc đóng và bỏ thay đổi này.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel><AlertDialogAction variant="destructive-solid" disabled={busy} onClick={() => { setConfirmClose(false); onOpenChange(false); }}>Bỏ thay đổi</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
