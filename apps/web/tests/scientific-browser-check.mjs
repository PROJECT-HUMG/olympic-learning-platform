// Component-only fixture. Run Vite on 4308 first; no API or external requests are needed.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const evidence = process.env.SCIENTIFIC_EVIDENCE_DIR || "/tmp/scientific-component-evidence";
await mkdir(evidence, { recursive: true });
const chrome = spawn(process.env.CHROMIUM_PATH || "/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${evidence}/profile`, "about:blank"]);
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(Error("Chromium launch timeout")), 15000);
    chrome.stderr.on("data", data => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    chrome.on("error", reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => { socket.onopen = resolve; });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Page.navigate", { url: "http://127.0.0.1:4308/tests/fixtures/scientific.html" });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = await evaluate(`!!document.querySelector('textarea')`); } catch { /* Navigation replaces the execution context. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw Error("Fixture timeout");
  const results = [];
  for (const width of [320, 1440]) for (const theme of ["light", "dark"]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.documentElement.classList.toggle('dark',${theme === "dark"})`);
    const state = await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,images:document.querySelectorAll('img').length,math:document.querySelectorAll('.katex').length,failure:!!document.querySelector('.scientific-unsupported')})`);
    if (state.overflow || state.images !== 2 || !state.failure) throw Error(JSON.stringify(state));
    results.push({ width, theme, ...state });
    const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    await writeFile(`${evidence}/${theme}-${width}.png`, Buffer.from(shot.data, "base64"));
  }
  await evaluate(`(()=>{const el=[...document.querySelectorAll('textarea')].find(x=>x.value.includes('frac'));Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'x^2');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`(async()=>{for(let i=0;i<100;i++){if(!document.querySelector('.scientific-unsupported')&&document.querySelectorAll('.katex').length>=2)return;await new Promise(r=>setTimeout(r,20));}throw Error('Preview recovery failed')})()`);
  await evaluate(`(()=>{const input=document.querySelector('input[type=file]');const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array([1,2,3])],'fixture.png',{type:'image/png'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await evaluate(`(async()=>{for(let i=0;i<100;i++){if(document.body.innerText.includes('Fixture upload failure'))return;await new Promise(r=>setTimeout(r,20));}throw Error('Upload failure not surfaced')})()`);
  const preserved = await evaluate(`JSON.parse(document.querySelector('[data-testid=source]').textContent).find(x=>x.kind==='figure_group').figures[0].assetId==='first'`);
  if (!preserved) throw Error("Failed upload replaced persisted asset");
  await writeFile(`${evidence}/results.json`, JSON.stringify({ results, recovery: true, uploadFailurePreservedAsset: preserved, errors, scope: "Component fixture only; not API save/reopen or exam evidence" }, null, 2));
  if (errors.length) throw Error(JSON.stringify(errors));
  console.log(JSON.stringify({ matrix: results.length, recovery: true, evidence }));
} finally { socket?.close(); chrome.kill("SIGTERM"); }
