import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { InternalAxiosRequestConfig } from "axios";
import { apiClient } from "../../src/lib/axios.ts";
import { expireAuthSession } from "../../src/lib/auth-session.ts";
import { QUERY_KEY_CURRENT_USER } from "../../src/features/auth/hooks/use-current-user.ts";
import { useAuthStore } from "../../src/stores/use-auth-store.ts";
import { collectFigureAssetIds, viewerFigureGroups } from "../../src/features/questions/components/figure-resolution.ts";
import { usePrivateFigureResolver } from "../../src/features/questions/components/figure-resolution.tsx";
import { ManualQuestionViewer } from "../../src/features/questions/components/manual-question-viewer.tsx";
import type { QuestionPart, ScientificBlock, ScientificExplanation } from "../../src/features/questions/types/scientific-content.ts";

const ASSET = "11111111-1111-4111-8111-111111111111";
const SOLUTION = "22222222-2222-4222-8222-222222222222";
const Q = "33333333-3333-4333-8333-333333333333";
const Q_INFLIGHT = "44444444-4444-4444-8444-444444444444";
const Q_RETRY = "66666666-6666-4666-8666-666666666666";
const Q_MOUNT = "77777777-7777-4777-8777-777777777777";
const USER_A = "user-a";
const USER_B = "user-b";
const TOKEN_A = "Bearer token-a";
const TOKEN_B = "Bearer token-b";
const stem: ScientificBlock[] = [{ id: "stem", kind: "figure_group", layout: "full_width", figures: [{ assetId: ASSET, alt: "stem-alt", caption: "" }] }];
const parts: QuestionPart[] = [{ id: "p", responseType: "WRITTEN", prompt: [{ id: "prompt", kind: "text", source: "Tính." }], options: [] }];
const explanation: ScientificExplanation = { parts: [{ partId: "p", solution: [{ id: "sol", kind: "figure_group", layout: "full_width", figures: [{ assetId: SOLUTION, alt: "solution-secret", caption: "" }] }], rubric: "secret-rubric" }] };
const visibleIds = collectFigureAssetIds(viewerFigureGroups({ showAnswer: false, stem, parts, explanation }));
const calls: { url: string; token: string }[] = [];
const created: string[] = [];
const revoked: string[] = [];
const figureWaiters: Array<() => void> = [];
const meWaiters: Array<() => void> = [];
let holdFigures = false;
let holdMe = false;
let failLeft = 0;
let failQuestion = "";
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } } });
function bearer(config: InternalAxiosRequestConfig): string {
  const headers = config.headers as { get?: (name: string) => unknown; Authorization?: unknown };
  const value = headers.get?.("Authorization") ?? headers.Authorization;
  return typeof value === "string" ? value : "";
}
function account(token: string): string { return token === TOKEN_B ? USER_B : USER_A; }
function profile(id: string) { return { id, email: `${id}@example.com`, username: id, fullName: id, avatarUrl: "", role: "LECTURER" as const, status: "ACTIVE" as const }; }
function releaseFigures() { holdFigures = false; for (const release of figureWaiters.splice(0)) release(); }
function releaseMe() { holdMe = false; for (const release of meWaiters.splice(0)) release(); }
apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
  const url = config.url ?? "";
  const token = bearer(config);
  calls.push({ url, token });
  if (url.includes("/users/me")) {
    if (holdMe) await new Promise<void>((resolve) => { meWaiters.push(resolve); });
    return { data: profile(account(token)), status: 200, statusText: "OK", headers: {}, config };
  }
  if (url.includes("/figures/")) {
    if (failLeft > 0 && failQuestion.length > 0 && url.includes(failQuestion)) {
      failLeft -= 1;
      return Promise.reject({ response: { status: 500, data: {}, config }, config });
    }
    if (holdFigures) await new Promise<void>((resolve) => { figureWaiters.push(resolve); });
    return { data: new Blob([token + url], { type: "image/png" }), status: 200, statusText: "OK", headers: {}, config };
  }
  return { data: {}, status: 404, statusText: "missing", headers: {}, config };
};
const realCreate = URL.createObjectURL.bind(URL);
const realRevoke = URL.revokeObjectURL.bind(URL);
URL.createObjectURL = (blob: Blob) => { const url = realCreate(blob); created.push(url); return url; };
URL.revokeObjectURL = (url: string) => { revoked.push(url); realRevoke(url); };
function figureCalls(questionId: string, token?: string) {
  return calls.filter((call) => call.url.includes(`/questions/${questionId}/figures/`) && (token == null || call.token === token));
}
function imageSrc(label = "primary") { return document.querySelector(`[data-testid=${label}] img`)?.getAttribute("src") ?? ""; }
let setControl: (update: (value: { questionId: string; second: boolean }) => { questionId: string; second: boolean }) => void = () => {};
function Probe({ questionId, label }: { questionId: string; label: string }) {
  const figures = usePrivateFigureResolver(questionId, visibleIds);
  return <div data-testid={label}><ManualQuestionViewer stem={stem} parts={parts} explanation={explanation} showAnswer={false} resolveFigure={figures.resolveFigure} figures={figures.figures} onRetry={figures.retry} /></div>;
}
function Harness() {
  const [control, setState] = useState({ questionId: Q, second: false });
  setControl = setState;
  return <StrictMode><QueryClientProvider client={client}><Probe questionId={control.questionId} label="primary" />{control.second ? <Probe questionId={control.questionId} label="secondary" /> : null}</QueryClientProvider></StrictMode>;
}
function publish(value: unknown) {
  const node = document.querySelector("[data-testid=figure-report]");
  if (node) node.textContent = JSON.stringify(value);
}
async function waitFor(ready: () => boolean, message: string) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (ready()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw Error(`${message}; src=${imageSrc()}; figures=${calls.filter((call) => call.url.includes("/figures/")).length}`);
}
const root = document.getElementById("root");
if (root && root.dataset.figureRun !== "1") {
  root.dataset.figureRun = "1";
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAccessToken("token-a");
  client.setQueryData(QUERY_KEY_CURRENT_USER, profile(USER_A));
  createRoot(root).render(<Harness />);
  void run();
}
async function run() {
  const failures: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) failures.push(message); };
  try {
    await waitFor(() => imageSrc().startsWith("blob:"), "settled");
    const settled = imageSrc();
    holdFigures = true;
    setControl((value) => ({ ...value, questionId: Q_INFLIGHT }));
    await waitFor(() => figureCalls(Q_INFLIGHT, TOKEN_A).length >= 1, "held A");
    await waitFor(() => imageSrc() === "", "question transition");
    check(revoked.includes(settled), "old url remains after question commit");
    holdMe = true;
    useAuthStore.getState().setAccessToken("token-b");
    await waitFor(() => useAuthStore.getState().accessToken === "token-b" && imageSrc() === "", "account transition");
    await new Promise((resolve) => setTimeout(resolve, 100));
    const cached = client.getQueryData(QUERY_KEY_CURRENT_USER) as { id?: string } | null;
    check(cached?.id === USER_A, "profile still A while token B is live");
    check(figureCalls(Q_INFLIGHT, TOKEN_B).length === 0, "figure fetch before correspondence");
    check(imageSrc() === "" && revoked.includes(settled), "old url present on transition commit");
    releaseMe();
    await waitFor(() => figureCalls(Q_INFLIGHT, TOKEN_B).length >= 1, "held B");
    check(figureCalls(Q_INFLIGHT, TOKEN_A).length >= 1 && figureCalls(Q_INFLIGHT, TOKEN_B).length >= 1, "both held requests");
    check(imageSrc() === "", "url published before release");
    releaseFigures();
    await waitFor(() => imageSrc().startsWith("blob:"), "released blob");
    const released = imageSrc();
    check(released !== settled && !revoked.includes(released), "released url");
    failLeft = 1;
    failQuestion = Q_RETRY;
    setControl((value) => ({ ...value, questionId: Q_RETRY }));
    await waitFor(() => document.querySelector("[data-testid=primary] button") != null, "retry button");
    const beforeRetry = figureCalls(Q_RETRY).length;
    document.querySelector<HTMLButtonElement>("[data-testid=primary] button")?.click();
    await waitFor(() => imageSrc().startsWith("blob:"), "retry blob");
    check(figureCalls(Q_RETRY).length > beforeRetry, "retry request");
    const previous = imageSrc();
    const beforeMount = figureCalls(Q_MOUNT).length;
    setControl((value) => ({ ...value, questionId: Q_MOUNT, second: false }));
    await waitFor(() => figureCalls(Q_MOUNT).length > beforeMount && imageSrc().startsWith("blob:") && imageSrc() !== previous, "first mount request");
    const afterFirst = figureCalls(Q_MOUNT).length;
    const live = imageSrc();
    check(afterFirst > beforeMount && !revoked.includes(live), "first mount request");
    setControl((value) => ({ ...value, second: true }));
    await waitFor(() => imageSrc("secondary").startsWith("blob:") && imageSrc("secondary") !== live, "second mount");
    const secondary = imageSrc("secondary");
    check(figureCalls(Q_MOUNT).length - afterFirst <= 1, "second mount refetch");
    check(imageSrc() === live && !revoked.includes(live), "second mount kept the primary url");
    setControl((value) => ({ ...value, second: false }));
    await waitFor(() => document.querySelector("[data-testid=secondary]") == null, "sibling unmounted");
    check(revoked.includes(secondary) && secondary !== live, "sibling cleanup revoked its own url");
    check(imageSrc() === live && !revoked.includes(live), "sibling unmount revoked the live url");
    const logoutUrl = imageSrc();
    const logoutCalls = calls.filter((call) => call.url.includes("/figures/")).length;
    useAuthStore.getState().clearAuth();
    await waitFor(() => imageSrc() === "", "logout");
    await new Promise((resolve) => setTimeout(resolve, 80));
    const afterLogout = client.getQueryData(QUERY_KEY_CURRENT_USER) as { id?: string } | null;
    check(afterLogout?.id === USER_B, "logout kept the cached profile");
    check(revoked.includes(logoutUrl), "logout revoke");
    check(calls.filter((call) => call.url.includes("/figures/")).length === logoutCalls, "logout fetch");
    useAuthStore.getState().setAccessToken("token-a");
    await waitFor(() => imageSrc().startsWith("blob:"), "restore");
    const expiryUrl = imageSrc();
    expireAuthSession(client, () => useAuthStore.getState().clearAuth());
    await waitFor(() => imageSrc() === "", "expiry");
    check(revoked.includes(expiryUrl), "expiry revoke");
    check(client.getQueryData(QUERY_KEY_CURRENT_USER) == null, "expiry cleared the profile");
    check(calls.every((call) => !call.url.includes(SOLUTION)), "solution fetch");
    check(!document.body.innerText.includes("secret-rubric") && !document.body.innerText.includes("solution-secret"), "hidden solution text");
    check(created.includes(live) && live.startsWith("blob:"), "strict mode live url");
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  publish({ ok: failures.length === 0, failures });
}
