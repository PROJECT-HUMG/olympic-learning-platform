// Synthetic real-owner fixture. No network, credentials or product mutations.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useThemeStore } from "@/stores/use-theme-store";
import "@/index.css";
const events: string[] = [];
let resolvePromise: (value: string) => void;
const api = {
  events, toast,
  success: () => toast.success("Đã lưu thành tích", { id: "success", duration: Infinity }),
  error: () => toast.error("Chưa gửi được minh chứng. Hãy thử lại.", { id: "error", description: "Thông báo kiểm thử tổng hợp", duration: Infinity }),
  short: (duration = 500) => toast("Hết thời gian", { id: "short", duration, onDismiss: () => events.push("short-dismiss"), onAutoClose: () => events.push("short-timeout") }),
  action: () => toast("Cần xác nhận", { id: "action", duration: Infinity, action: { label: "Thử lại", onClick: event => { events.push("action"); event.preventDefault(); } }, cancel: { label: "Hủy", onClick: () => events.push("cancel") }, onDismiss: () => events.push("action-dismiss") }),
  loading: () => toast.loading("Đang gửi", { id: "load", duration: 100 }),
  done: () => toast.success("Đã hoàn tất", { id: "load", duration: 350, onAutoClose: () => events.push("load-timeout") }),
  locked: () => toast.error("Không thể bỏ qua", { id: "locked", duration: Infinity, dismissible: false }),
  custom: () => toast.custom(() => <button onClick={() => { events.push("custom"); toast.dismiss("custom"); }}>Nội dung riêng</button>, { id: "custom", duration: Infinity }),
  promise: () => toast.promise(new Promise<string>(resolve => { resolvePromise = resolve; }), { id: "promise", loading: "Đang xử lý thật", success: value => value, error: "Thất bại", duration: 500 }),
  resolve: () => resolvePromise("Xử lý hoàn tất"),
  theme: (theme: "light" | "dark") => { document.documentElement.classList.toggle("dark", theme === "dark"); useThemeStore.getState().setTheme(theme); },
};
Object.assign(window, { swipeFixture: api });
export function Fixture() {
  const [mounted, setMounted] = useState(true);
  Object.assign(api, { mount: setMounted });
  return <main style={{ minHeight: "100dvh", padding: "24px", background: "var(--background)", color: "var(--foreground)" }}>
    <h1>Kiểm tra thông báo</h1><p>Giao diện tổng hợp, không phải dữ liệu thật.</p><button id="return-focus" style={{ marginTop: 24, minHeight: 44 }} onClick={api.error}>Hiện lỗi</button>
    {mounted && <Toaster richColors position="top-right" closeButton />}
  </main>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Fixture /></StrictMode>);
