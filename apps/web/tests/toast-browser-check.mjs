// Actual App/Toaster and Sonner singleton; explicitly synthetic messages/API responses.
// No live backend or external requests. Run against a locally owned Vite server.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const web = process.env.TOAST_WEB_URL ?? "http://127.0.0.1:3111";
const baseline = process.env.TOAST_BASELINE === "1";
const dir = await mkdtemp(join(tmpdir(), "ui-toast-"));
const paths = ["src/components/ui/sonner.tsx", "src/components/ui/sonner.css", "src/App.tsx", "src/index.css", "tests/toast-browser-check.mjs"];
const hashes = async () => Object.fromEntries(await Promise.all(paths.map(async path => {
  try { return [path, createHash("sha256").update(await readFile(path)).digest("hex")]; }
  catch (error) { if (error.code === "ENOENT") return [path, null]; throw error; }
})));
const startHashes = await hashes();
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const observations = [], checks = [], errors = [], requests = [];
const longToken = "synthetic_document_" + "chuyende".repeat(18) + ".pdf";
const message = "Synthetic · Không thể tải tài liệu. Kiểm tra kết nối rồi thử lại với tệp " + longToken;
const description = "Synthetic · Thông tin giải thích dài giúp đối chiếu cách ngắt dòng và đọc thông báo khi thao tác chưa hoàn tất. ".repeat(2);
const chrome = spawn(process.env.TOAST_CHROME_PATH ?? "/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
  ["--headless", "--no-sandbox", "--remote-debugging-port=0", `--user-data-dir=${dir}/profile`, "about:blank"]);
let socket, failure;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Chromium startup timeout")), 15000);
    chrome.stderr.on("data", b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on("error", reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => { socket.onopen = resolve; });
  const pending = new Map(); let serial = 0;
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    else if (m.method === "Fetch.requestPaused") {
      const e = m.params, url = new URL(e.request.url);
      if (url.origin === new URL(web).origin && !url.pathname.startsWith("/api/") && !url.pathname.endsWith(".mp4")) {
        call("Fetch.continueRequest", { requestId: e.requestId }).catch(error => errors.push(error.message));
      } else {
        requests.push({ path: url.pathname, method: e.request.method });
        const login = url.pathname === "/api/v1/auth/login";
        const body = login ? { title: "Synthetic unavailable", status: 503, detail: message } : { status: 401 };
        const preflight = e.request.method === "OPTIONS";
        call("Fetch.fulfillRequest", { requestId: e.requestId, responseCode: preflight ? 204 : login ? 503 : 401,
          responseHeaders: [{ name: "Content-Type", value: "application/json" },
            { name: "Access-Control-Allow-Origin", value: new URL(web).origin },
            { name: "Access-Control-Allow-Credentials", value: "true" },
            { name: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
            { name: "Access-Control-Allow-Headers", value: "content-type, authorization" }],
          body: preflight ? "" : Buffer.from(JSON.stringify(body)).toString("base64") }).catch(error => errors.push(error.message));
      }
    }
  };
  const js = async expression => {
    const r = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const wait = async expression => {
    for (let n = 0; n < 150; n++) { if (await js(expression)) return; await new Promise(r => setTimeout(r, 100)); }
    throw Error("Timeout: " + expression);
  };
  const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
  const key = async (key, extra = {}) => {
    await call("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, ...extra, ...(key === "Enter" ? { text: "\r" } : {}) });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, ...extra });
  };
  await call("Page.enable"); await call("Runtime.enable"); await call("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "light" }] });
  await call("Page.navigate", { url: web + "/login" });
  await wait("!!document.querySelector('#login-identifier') && !document.querySelector('#startup-loader')");
  const connectToast = () => js(`(async()=>{const source=await(await fetch('/src/components/ui/sonner.tsx')).text(); const path=source.match(/from ["']([^"']*sonner[.]js[^"']*)["']/)?.[1]; if(!path)throw Error('Missing Vite Sonner module'); window.fixtureToast=(await import(path)).toast; window.fixtureAction=0; window.fixtureCancel=0; window.fixtureDismiss=0;})()`);
  await connectToast();
  let requestedViewport;
  const observe = async name => {
    await new Promise(r => setTimeout(r, 500));
    const data = await js(`(()=>{const bounds=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,color:s.color,background:s.backgroundColor,font:s.fontFamily,animation:s.animationName,outline:s.outlineStyle,outlineWidth:s.outlineWidth,outlineColor:s.outlineColor}};
      const t=[...document.querySelectorAll('[data-sonner-toast]')].find(e=>e.dataset.front==='true'); const v=visualViewport;
      return {rootTheme:document.documentElement.className,sonnerTheme:document.querySelector('[data-sonner-toaster]')?.dataset.sonnerTheme,layout:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},visual:{width:v.width,height:v.height,scale:v.scale},toast:bounds(t),content:bounds(t?.querySelector('[data-content]')),icon:bounds(t?.querySelector('[data-icon]')),iconChild:bounds(t?.querySelector('[data-icon]')?.firstElementChild),title:bounds(t?.querySelector('[data-title]')),description:bounds(t?.querySelector('[data-description]')),close:bounds(t?.querySelector('[data-close-button]')),buttons:[...t?.querySelectorAll('[data-button]')??[]].map(e=>({label:e.textContent,...bounds(e)})),text:t?.textContent,live:document.querySelector('section[aria-live]')?.getAttribute('aria-live'),name:document.querySelector('section[aria-live]')?.getAttribute('aria-label'),closeName:t?.querySelector('[data-close-button]')?.getAttribute('aria-label')};})()`);
    const shot = Buffer.from((await call("Page.captureScreenshot", { format: "png" })).data, "base64");
    data.name = name; data.requestedViewport = requestedViewport;
    data.screenshot = { width: shot.readUInt32BE(16), height: shot.readUInt32BE(20), path: join(dir, name + ".png") };
    await writeFile(data.screenshot.path, shot); observations.push(data); return data;
  };
  const clear = async () => { await js("fixtureToast.dismiss()"); await wait("!document.querySelector('[data-sonner-toast]')"); };
  for (const width of [320, 1280]) for (const theme of ["light", "dark"]) {
    requestedViewport = { width, height: width === 320 ? 640 : 800, deviceScaleFactor: 1, mobile: width === 320 };
    await call("Emulation.setDeviceMetricsOverride", requestedViewport);
    await js(`(async()=>{(await import('/src/stores/use-theme-store.ts')).useThemeStore.getState().setTheme(${JSON.stringify(theme)})})()`);
    for (const state of ["success", "error", "loading"]) {
      await clear();
      await js(`fixtureToast.${state}(${JSON.stringify(state === "success" ? "Đã lưu bản nháp." : message)}, {id:'fixture-state',duration:Infinity,description:${JSON.stringify(description)}})`);
      await wait("!!document.querySelector('[data-sonner-toast][data-mounted=true]')");
      const o = await observe(`${width}-${theme}-${state}`);
      check(o.live === "polite", `${o.name}: live region retained`);
      if (!baseline) {
        check(o.sonnerTheme === theme, `${o.name}: explicit theme matches app with OS light`);
        check(o.layout.width === width && o.screenshot.width === width && o.visual.width === width && o.visual.scale === 1, `${o.name}: actual viewport/PNG match request`);
        check(o.toast.x >= 0 && o.toast.right <= width && o.toast.scrollWidth <= o.toast.clientWidth, `${o.name}: toast fits viewport without internal overflow`);
        check(o.content.scrollWidth <= o.content.clientWidth && o.iconChild.right <= o.content.x, `${o.name}: wrapping and icon/text separation`);
        if (state !== "loading") {
          check(o.close.width >= 44 && o.close.height >= 44 && o.closeName === "Đóng thông báo", `${o.name}: named44px close target`);
          check(o.close.background === "rgba(0, 0, 0, 0)", `${o.name}: neutral close surface in both themes`);
        }
        else check(!o.close && await js("getComputedStyle(document.querySelector('[data-icon] svg')).animationName==='none'"), `${o.name}: loading remains non-dismissable and reduced-motion quiet`);
      }
    }
    await clear();
    await js(`fixtureToast.error(${JSON.stringify(message)}, {id:'fixture-action',duration:Infinity,description:${JSON.stringify(description)},action:{label:'Thử lại tải tài liệu',onClick:e=>{fixtureAction++;e.preventDefault()}},cancel:{label:'Để sau',onClick:()=>fixtureCancel++},onDismiss:()=>fixtureDismiss++})`);
    const o = await observe(`${width}-${theme}-actions`);
    if (!baseline) check(o.buttons.every(b => b.x >= o.toast.x && b.right <= o.toast.right && b.y >= 0 && b.bottom <= o.visual.height && b.width >= 44 && b.height >= 44 && b.scrollWidth <= b.clientWidth), `${o.name}: action/cancel fit viewport and wrap with44px targets`);
    if (!baseline) check(await js("(()=>{const b=document.querySelector('[data-cancel]'),p=document.createElement('span');p.style.background='var(--muted)';b.append(p);const matches=getComputedStyle(b).backgroundColor===getComputedStyle(p).backgroundColor;p.remove();return matches})()"), `${o.name}: cancel uses app muted surface`);
  }
  // Keyboard action/cancel, preventDefault, ID update, promise lifecycle, timeout pause and focus return.
  await js("document.querySelector('[data-action]').focus()"); await key("Enter");
  check(await js("fixtureAction===1 && !!document.querySelector('[data-action]')"), "keyboard action fires once and preventDefault retains toast");
  await js("document.querySelector('[data-cancel]').focus()"); await key("Enter");
  await wait("!document.querySelector('[data-sonner-toast]')"); check(await js("fixtureCancel===1"), "keyboard cancel fires once and dismisses");
  await js("fixtureToast.loading('Synthetic · Đang lưu', {id:'same-id'}); fixtureToast.success('Synthetic · Đã lưu', {id:'same-id',duration:Infinity})");
  await wait("document.querySelector('[data-sonner-toast]')?.dataset.type==='success'");
  check(await js("document.querySelectorAll('[data-sonner-toast]').length===1"), "same ID updates rather than duplicates");
  await clear();
  await js("fixtureToast.promise(new Promise(resolve=>window.fixtureResolve=resolve),{loading:'Synthetic · Đang xử lý',success:'Synthetic · Hoàn tất',error:'Synthetic · Thất bại',duration:Infinity})");
  await wait("document.querySelector('[data-sonner-toast]')?.dataset.type==='loading'"); await js("fixtureResolve('ok')");
  await wait("document.querySelector('[data-sonner-toast]')?.dataset.type==='success'"); check(true, "promise loading transitions to success");
  await clear();
  await js("fixtureToast.promise(new Promise((_,reject)=>window.fixtureReject=reject),{loading:'Synthetic · Đang xử lý',success:'Synthetic · Hoàn tất',error:'Synthetic · Thất bại',duration:Infinity})");
  await wait("document.querySelector('[data-sonner-toast]')?.dataset.type==='loading'"); await js("fixtureReject(Error('synthetic failure'))");
  await wait("document.querySelector('[data-sonner-toast]')?.dataset.type==='error'"); check(true, "promise loading transitions to error");
  await clear();
  // Isolate focus navigation from the deliberately programmatic action/promise probes.
  await call("Page.navigate", { url: web + "/login" });
  await wait("!!document.querySelector('#login-identifier') && !document.querySelector('#startup-loader')");
  await connectToast();
  await js("fixtureDismiss=0; document.querySelector('#login-identifier').focus(); fixtureToast.success('Synthetic · Focus',{duration:Infinity,onDismiss:()=>fixtureDismiss++})");
  await wait("!!document.querySelector('[data-close-button]')"); await key("t", { code: "KeyT", modifiers: 1 });
  check(await js("document.activeElement?.matches('[data-sonner-toaster]')"), "Sonner Alt+T hotkey reaches toast region");
  for (let n = 0; n < 5 && !(await js("document.activeElement?.matches('[data-close-button]')")); n++) await key("Tab");
  check(await js("document.activeElement?.matches('[data-close-button]')"), "Tab reaches close button");
  const focus = await observe("keyboard-close-focus");
  if (!baseline) check(focus.close.outline !== "none" && parseFloat(focus.close.outlineWidth) >= 2, "close button has visible keyboard focus ring");
  await key("Tab");
  check(await js("document.activeElement?.id==='login-identifier'"), "leaving toast region returns focus to previous input");
  await key("t", { code: "KeyT", modifiers: 1 });
  for (let n = 0; n < 5 && !(await js("document.activeElement?.matches('[data-close-button]')")); n++) await key("Tab");
  await key("Enter"); await wait("!document.querySelector('[data-sonner-toast]')");
  const closeResult = await js("({dismissCount:fixtureDismiss,activeId:document.activeElement?.id,activeTag:document.activeElement?.tagName})");
  check(closeResult.dismissCount === 1, "keyboard close dismiss callback fires once: " + JSON.stringify(closeResult));
  await js("fixtureToast.success('Synthetic · Timer',{duration:500,onAutoClose:()=>window.fixtureAutoClosed=true})");
  await wait("!!document.querySelector('[data-sonner-toast]')");
  await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 500 });
  await wait("!document.querySelector('[data-sonner-toast]')"); check(await js("fixtureAutoClosed===true"), "auto-dismiss lifecycle retained");
  // Actual LoginForm consumer and error parsing; rejected synthetic request never authenticates.
  requestedViewport = { width: 320, height: 640, deviceScaleFactor: 1, mobile: true }; await call("Emulation.setDeviceMetricsOverride", requestedViewport);
  for (const [selector, value] of [["#login-identifier", "synthetic-user"], ["#login-password", "synthetic-password"]]) {
    await js(`document.querySelector(${JSON.stringify(selector)}).focus()`); await call("Input.insertText", { text: value });
  }
  await js("document.querySelector('form button[type=submit]').click()"); await wait("!!document.querySelector('[data-sonner-toast][data-type=error]')");
  const login = await observe("320-dark-login-error");
  check(login.text === message && requests.filter(r=>r.path==='/api/v1/auth/login' && r.method==='POST').length===1, "real LoginForm shows truthful parsed message for one rejected synthetic request");
  check(await js("location.pathname==='/login'"), "rejected login does not enter authorized shell");
  if (!baseline) check(login.toast.right <= 320 && login.content.scrollWidth <= login.content.clientWidth, "real LoginForm long error fits320px");
  check(errors.length === 0, "no runtime exceptions");
  check(JSON.stringify(startHashes) === JSON.stringify(await hashes()), "source unchanged during browser run");
} catch (error) { failure = error.stack; }
finally {
  await writeFile(join(dir, "results.json"), JSON.stringify({ baseline, head, hashes: startHashes, environment: "Synthetic APIs/messages; actual mounted App/Sonner; headless Chromium CDP; no live backend/external requests", observations, checks, errors, requests, failure }, null, 2));
  socket?.close();
  const exited = new Promise(resolve => chrome.once("exit", resolve)); chrome.kill("SIGTERM"); await exited;
  await rm(join(dir, "profile"), { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  console.log(JSON.stringify({ artifact: join(dir, "results.json"), observations: observations.length, checks: checks.length, failure }));
}
if (failure) process.exitCode = 1;
