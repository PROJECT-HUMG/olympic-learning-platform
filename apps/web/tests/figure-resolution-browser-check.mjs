// Local fixture. Start Vite on 4308 first. The adapter serves /users/me and figure blobs; no API server.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const evidence = process.env.FIGURE_EVIDENCE_DIR || "/tmp/figure-resolution-evidence";
await mkdir(evidence, { recursive: true });
const chrome = spawn(process.env.CHROMIUM_PATH || "/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${evidence}/profile`, "about:blank"]);
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(Error("Chromium launch timeout")), 15000);
    chrome.stderr.on("data", (data) => { output += data; const match = output.match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    chrome.on("error", reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => { socket.onopen = resolve; });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request.reject(Error(JSON.stringify(message.error))); else request.resolve(message.result); }
    else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Page.navigate", { url: process.env.FIGURE_FIXTURE_URL || "http://127.0.0.1:4308/tests/fixtures/figure-resolution.html" });
  let report = "";
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try { report = await evaluate(`document.querySelector('[data-testid=figure-report]')?.textContent || ""`); } catch { /* Navigation replaces the execution context. */ }
    if (report.includes('"ok":true') || report.includes('"ok":false')) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!report.includes('"ok":')) throw Error("Fixture timeout");
  const parsed = JSON.parse(report);
  await writeFile(`${evidence}/results.json`, JSON.stringify({ report: parsed, errors, scope: "Component fixture only; not API save/reopen" }, null, 2));
  if (errors.length || parsed.ok !== true) throw Error(report);
  console.log(JSON.stringify({ ok: true, evidence }));
} finally { socket?.close(); chrome.kill("SIGTERM"); }
