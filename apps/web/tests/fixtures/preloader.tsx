// Owned synthetic lifecycle fixture. The host uses the actual index.html loader.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";
import { startStartupPreloader, trackStartupTask } from "@/app/startup-preloader";
import { PageLoading } from "@/components/ui/page-loading";
import "@/index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
let resolveRequest: (value: string) => void;
let rejectRequest: (error: Error) => void;
let request: Promise<string>;
function newRequest() { request = new Promise<string>((resolve, reject) => { resolveRequest = resolve; rejectRequest = reject; }); }
newRequest();
const task = trackStartupTask();
const root = createRoot(document.getElementById("root")!);
const api = {
  finishTask: () => task.finish(), resolve: () => resolveRequest("Dữ liệu thử nghiệm đã sẵn sàng"),
  reject: () => rejectRequest(new Error("Lỗi thử nghiệm. Có thể thử lại.")),
  unmount: () => root.unmount(), showRoute: (_value: boolean) => {}, setups: 0,
  tweens: (element: Element) => gsap.getTweensOf(element).length,
};
Object.assign(window, { preloaderProof: api });
function Content() {
  const data = useQuery({ queryKey: ["owned-preloader-proof"], queryFn: () => request });
  const [route, setRoute] = useState(false);
  api.showRoute = setRoute;
  useEffect(() => { api.setups++; return startStartupPreloader(queryClient); }, []);
  return <main id="public-main" tabIndex={-1} className="page-shell">
    <h1>Kiểm tra loading bằng dữ liệu giả lập</h1>
    {data.isError ? <div role="alert"><p>{data.error.message}</p><button onClick={() => { newRequest(); void data.refetch(); }}>Thử lại dữ liệu</button></div>
      : <p role="status">{data.data ?? "Đang tải dữ liệu thử nghiệm…"}</p>}
    <button id="ready-action">Thao tác trên trang</button>
    {route && <PageLoading />}
  </main>;
}
root.render(<StrictMode><QueryClientProvider client={queryClient}><Content /></QueryClientProvider></StrictMode>);
