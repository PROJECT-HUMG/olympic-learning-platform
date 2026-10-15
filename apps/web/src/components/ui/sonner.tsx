import { isValidElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { toast, useSonner, type Action, type ToastT, type ToasterProps } from "sonner";
import { CheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon, XIcon } from "lucide-react";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { SwipeToast, type SwipeToastCloseReason } from "@/components/react-bits/swipe-toast";
import { cn } from "@/lib/utils";
import "./sonner.css";

const defaultIcons = {
  success: <CheckIcon aria-hidden="true" />, info: <InfoIcon aria-hidden="true" />,
  warning: <TriangleAlertIcon aria-hidden="true" />, error: <OctagonXIcon aria-hidden="true" />,
  loading: <Loader2Icon aria-hidden="true" className="animate-spin motion-reduce:animate-none" />,
};
const isAction = (value: ToastT["action"]): value is Action => Boolean(value && typeof value === "object" && "label" in value && "onClick" in value);
const render = (value: ToastT["title"]): ReactNode => typeof value === "function" ? value() : value;
const cssOffset = (offset: ToasterProps["offset"], side: "top" | "right" | "bottom" | "left") => {
  const value = typeof offset === "object" ? offset[side] : offset;
  return typeof value === "number" ? `${value}px` : value || "max(1rem, env(safe-area-inset-" + side + "))";
};

// One Sonner public store, one SwipeToast renderer/lifetime owner. Existing callers stay unchanged.
const Toaster = ({ className, toastOptions, duration = 4000, position = "bottom-right", closeButton = false,
  containerAriaLabel = "Thông báo", icons, id, hotkey = ["altKey", "KeyT"], style, offset, mobileOffset, dir }: ToasterProps) => {
  const theme = useResolvedTheme();
  const { toasts } = useSonner();
  const previous = useRef<ToastT[]>([]);
  const reasons = useRef(new Map<string | number, SwipeToastCloseReason | "action">());
  const section = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const active = toasts.filter(item => item.toasterId === id);
  const close = (item: ToastT, reason: SwipeToastCloseReason | "action") => {
    reasons.current.set(item.id, reason);
    if (section.current?.contains(document.activeElement)) returnFocus.current?.focus({ preventScroll: true });
    toast.dismiss(item.id);
  };
  useEffect(() => {
    for (const item of previous.current) if (!active.some(next => next.id === item.id)) {
      const reason = reasons.current.get(item.id); reasons.current.delete(item.id);
      if (reason === "timeout") item.onAutoClose?.(item);
      else if (reason !== "action") item.onDismiss?.(item);
    }
    previous.current = active;
  }, [active]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const modifiers = new Set(["altKey", "ctrlKey", "shiftKey", "metaKey"]);
      if (hotkey.every(part => modifiers.has(part) ? event[part as "altKey"] : event.code === part)) {
        const target = section.current?.querySelector<HTMLElement>("[data-sonner-toast]");
        if (target) { event.preventDefault(); returnFocus.current = document.activeElement as HTMLElement; target.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [hotkey]);
  const positions = [...new Set([position, ...active.map(item => item.position || position)])];
  return <section ref={section} aria-label={containerAriaLabel} tabIndex={-1} data-swipe-toast-owner="" dir={dir}
    onFocusCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) returnFocus.current = event.relatedTarget as HTMLElement | null; }}>
    {positions.map(place => {
      const [vertical, horizontal] = place.split("-");
      return <ol key={place} aria-label={containerAriaLabel} data-sonner-toaster="" data-theme={theme} data-y-position={vertical} data-x-position={horizontal}
        className={cn("toaster group olympic-toaster", className)} style={{ ...style, "--width": "356px", "--toast-top": cssOffset(offset, "top"), "--toast-bottom": cssOffset(offset, "bottom"), "--toast-left": cssOffset(offset, "left"), "--toast-right": cssOffset(offset, "right"), "--toast-mobile-top": cssOffset(mobileOffset, "top"), "--toast-mobile-bottom": cssOffset(mobileOffset, "bottom"), "--toast-mobile-left": cssOffset(mobileOffset, "left"), "--toast-mobile-right": cssOffset(mobileOffset, "right") } as CSSProperties}>
        <AnimatePresence initial={false}>
          {active.filter(item => (item.position || position) === place).map((item, index) => {
            const type = item.type || "normal", loading = type === "loading", dismissible = item.dismissible !== false && !loading;
            const merged = { ...toastOptions?.classNames, ...item.classNames };
            const icon = item.icon === null ? null : item.icon || icons?.[type as keyof typeof icons] || defaultIcons[type as keyof typeof defaultIcons];
            const button = (value: ToastT["action"], cancel: boolean) => isValidElement(value) ? value : isAction(value) ? <button type="button" data-button="" data-action={cancel ? undefined : ""} data-cancel={cancel ? "" : undefined}
              className={cancel ? merged.cancelButton : merged.actionButton} style={cancel ? item.cancelButtonStyle || toastOptions?.cancelButtonStyle : item.actionButtonStyle || toastOptions?.actionButtonStyle}
              onClick={event => { if (cancel && !dismissible) return; value.onClick(event); if (cancel || !event.defaultPrevented) close(item, "action"); }}>{value.label}</button> : null;
            return <SwipeToast key={item.id} restartKey={item} duration={loading ? Infinity : item.duration ?? toastOptions?.duration ?? duration} dismissible={dismissible} onClose={reason => close(item, reason)}
              role={type === "error" ? "alert" : "status"} aria-live={type === "error" ? "assertive" : "polite"} aria-atomic="true" tabIndex={0}
              data-sonner-toast="" data-front={index === 0} data-type={type} data-styled={!(item.unstyled ?? toastOptions?.unstyled)} data-testid={item.testId}
              className={cn("toast olympic-toast", toastOptions?.className, item.className, merged.toast, merged[type as keyof typeof merged])}
              style={{ ...toastOptions?.style, ...item.style }}>
              {(item.closeButton ?? toastOptions?.closeButton ?? closeButton) && !item.jsx && !loading && <button type="button" data-close-button="" aria-label={toastOptions?.closeButtonAriaLabel || "Đóng thông báo"} disabled={!dismissible}
                className={merged.closeButton} onClick={() => close(item, "close")}>{icons?.close || <XIcon aria-hidden="true" />}</button>}
              {!item.jsx && icon && <div data-icon="" className={merged.icon}>{icon}</div>}
              <div data-content="" className={merged.content}><div data-title="" className={merged.title}>{item.jsx || render(item.title)}</div>
                {item.description && <div data-description="" className={cn(toastOptions?.descriptionClassName, item.descriptionClassName, merged.description)}>{render(item.description)}</div>}</div>
              {button(item.cancel, true)}{button(item.action, false)}
            </SwipeToast>;
          })}
        </AnimatePresence>
      </ol>;
    })}
  </section>;
};
export { Toaster };
