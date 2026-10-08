// Actual login route; all API/Cloudflare requests intercepted with synthetic fixtures.
// Run from apps/web: node tests/login-turnstile-browser-check.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const evidence = await mkdtemp(join(tmpdir(), "olympic-login-turnstile-"));
const checks = [], screenshots = [];
const chromePath = process.env.CHROME_PATH ?? "/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const fixtureScript = `
window.fixtureWidgets = [];
window.fixtureRemoved = 0;
window.turnstile = {
  render(container, options) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = 'Synthetic verification';
    button.onclick = () => options.callback('synthetic-token-' + window.fixtureWidgets.length);
    container.appendChild(button);
    window.fixtureWidgets.push({options, button});
    return String(window.fixtureWidgets.length - 1);
  },
  remove(id) { window.fixtureWidgets[Number(id)].button.remove(); window.fixtureRemoved++; },
  reset() {}
};`;

async function run(enabled, port) {
  const web = `http://127.0.0.1:${port}`, requests = [], exceptions = [];
  let hold, release, scriptFailure = false, scriptRequests = 0, responseStatus = 401;
  const user = { id: "00000000-0000-0000-0000-000000000001", username: "synthetic-student",
    email: "student@example.invalid", fullName: "Synthetic student", role: "STUDENT", status: "ACTIVE", avatarUrl: null };
  const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    env: { ...process.env, VITE_API_BASE_URL: "/api/v1", VITE_TURNSTILE_ENABLED: String(enabled), VITE_TURNSTILE_SITE_KEY: "synthetic-public-key" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const profile = join(evidence, `profile-${port}`);
  const chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"]);
  let socket, failure;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("Chrome startup timeout")), 15000);
      chrome.stderr.on("data", data => { const match = String(data).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
      chrome.once("error", reject);
    });
    for (let i = 0; ; i++) {
      try { if ((await fetch(web)).ok) break; } catch { /* owned Vite is starting */ }
      if (i > 100) throw Error("Vite startup timeout");
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: "PUT" })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => { socket.onopen = resolve; });
    let serial = 0;
    const pending = new Map();
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
    });
    const reply = (event, status, body, type = "application/json") => call("Fetch.fulfillRequest", {
      requestId: event.requestId, responseCode: status,
      responseHeaders: [{ name: "Content-Type", value: type }],
      body: Buffer.from(type === "application/json" ? JSON.stringify(body) : body).toString("base64"),
    });
    const intercept = async event => {
      const url = new URL(event.request.url), path = url.pathname;
      if (url.hostname === "challenges.cloudflare.com") {
        scriptRequests++;
        if (scriptFailure) { scriptFailure = false; return call("Fetch.failRequest", { requestId: event.requestId, errorReason: "Failed" }); }
        return reply(event, 200, fixtureScript, "application/javascript");
      }
      if (path === "/api/v1/auth/login") {
        const input = JSON.parse(event.request.postData);
        // Record only synthetic identifier/token, never a password.
        requests.push({ identifier: input.identifier, token: input.turnstileToken });
        if (hold) await new Promise(resolve => { release = resolve; });
        return reply(event, responseStatus, responseStatus === 200
          ? { accessToken: "synthetic-access", tokenType: "Bearer", expiresIn: 900, user }
          : { status: responseStatus, messageKey: responseStatus === 409 ? "error.auth.emailNotVerified" : responseStatus === 503
            ? "error.auth.turnstileUnavailable" : "error.auth.invalidCredentials", detail: `Synthetic ${responseStatus}` });
      }
      if (path === "/api/v1/auth/refresh" || path === "/api/v1/users/me") return reply(event, 401, { status: 401 });
      if (path.startsWith("/api/")) return reply(event, 200, { subjects: [], years: [], types: [] });
      if (url.origin === web && !/\.(mp4|webm)$/.test(path)) return call("Fetch.continueRequest", { requestId: event.requestId });
      return reply(event, 404, {});
    };
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) { const item = pending.get(message.id); pending.delete(message.id); if (message.error) item?.reject(Error(message.error.message)); else item?.resolve(message.result); }
      else if (message.method === "Fetch.requestPaused") intercept(message.params).catch(error => exceptions.push(error.message));
      else if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
    };
    const js = async expression => {
      const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const wait = async expression => {
      for (let i = 0; i < 300; i++) { if (await js(expression)) return; await new Promise(resolve => setTimeout(resolve, 50)); }
      throw Error(`Timeout: ${expression}`);
    };
    const set = (id, value) => js(`(()=>{const field=document.getElementById(${JSON.stringify(id)});field.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,${JSON.stringify(value)});field.dispatchEvent(new Event('input',{bubbles:true}))})()`);
    const submit = () => js("document.querySelector('button[type=submit]').click()");
    const solve = async () => { await js("window.fixtureWidgets.at(-1).button.click()"); await wait("!document.querySelector('button[type=submit]').disabled"); };
    const unchanged = async () => {
      assert.ok(await js("document.getElementById('login-password')===window.originalPassword"));
      assert.equal(await js("document.getElementById('login-identifier').value"), "synthetic-student");
      assert.equal(await js("document.getElementById('login-password').value"), "synthetic-password");
    };
    const screenshot = async name => {
      await new Promise(resolve => setTimeout(resolve, 250));
      const path = join(evidence, `${name}.png`);
      await writeFile(path, Buffer.from((await call("Page.captureScreenshot", { captureBeyondViewport: false })).data, "base64"));
      const geometry = await js("({width:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.className})");
      assert.ok(geometry.scrollWidth <= geometry.clientWidth);
      screenshots.push({ path, ...geometry });
    };
    await call("Page.enable"); await call("Runtime.enable");
    await call("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
    await call("Emulation.setDeviceMetricsOverride", { width: 320, height: 640, deviceScaleFactor: 1, mobile: false });
    await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
    await call("Page.navigate", { url: web + "/login" });
    await wait("!!document.getElementById('login-password')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')");
    await js("void(window.originalPassword=document.getElementById('login-password'))");
    await set("login-identifier", "synthetic-student"); await set("login-password", "synthetic-password");
    if (enabled) {
      await wait("window.fixtureWidgets?.length>0");
      assert.equal(await js("window.fixtureWidgets.at(-1).options.action"), "login");
      assert.ok(await js("document.querySelector('button[type=submit]').disabled"));
      await screenshot("login-token-gated-320-light");
      await solve(); hold = true; await submit(); await wait("document.querySelector('button[type=submit]').getAttribute('aria-busy')==='true'");
      assert.ok(release); assert.equal(requests.length, 1); await submit(); assert.equal(requests.length, 1);
      hold = false; release(); await wait("window.fixtureWidgets.length===2&&document.querySelector('button[type=submit]').disabled"); await unchanged();
      assert.equal(requests[0].token, "synthetic-token-1");
      checks.push("Enabled login action/token; pending button blocks duplicate click; wrong credentials reset token without replacing inputs");
      await solve(); await js("document.getElementById('login-password').focus();window.fixtureWidgets.at(-1).options['expired-callback']()");
      await wait("document.querySelector('button[type=submit]').disabled");
      assert.ok(await js("document.activeElement===window.originalPassword"));
      await unchanged(); await screenshot("login-expired-320-light");
      await js("[...document.querySelectorAll('button')].find(button=>button.textContent==='Xác minh lại').click()");
      await wait("window.fixtureWidgets.length===3"); await solve();
      responseStatus = 503; await submit(); await wait("window.fixtureWidgets.length===4&&document.querySelector('button[type=submit]').disabled"); await unchanged();
      checks.push("Expiry keeps focus/draft; retry mounts fresh challenge; provider outage retains inputs and resets spent token");
      responseStatus = 409; await solve(); await submit(); await wait("!!document.querySelector('a[href=\"/register?resume=1\"]')");
      await wait("window.fixtureWidgets.length===5"); await unchanged();
      checks.push("Email-not-verified guidance/resume link remains; failed login never sets session");
      assert.equal(await js("import('/src/stores/use-auth-store.ts').then(module=>module.useAuthStore.getState().accessToken)"), null);
      await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
      await screenshot("login-retry-1440-dark");
      responseStatus = 200; await solve(); await submit(); await wait("location.pathname==='/dashboard'");
      assert.equal(await js("import('/src/stores/use-auth-store.ts').then(module=>module.useAuthStore.getState().accessToken)"), "synthetic-access");
      const cached = await js("Promise.all([import('/src/lib/query-client.ts'),import('/src/lib/auth-session.ts')]).then(([q,a])=>q.queryClient.getQueryData(a.QUERY_KEY_CURRENT_USER))");
      assert.equal(cached.id, user.id);
      checks.push("Fresh-token successful retry preserves identity cache/token and normal role redirect");
      // New document forces fresh script loading; fail and retry without external network.
      scriptFailure = true; await call("Page.navigate", { url: web + "/login" });
      await wait("document.querySelector('[role=alert]')?.textContent.includes('Không tải được xác minh')");
      assert.ok(await js("document.querySelector('button[type=submit]').disabled"));
      await js("[...document.querySelectorAll('button')].find(button=>button.textContent==='Xác minh lại').click()");
      await wait("window.fixtureWidgets?.length>0"); await solve();
      checks.push("Widget script failure fails closed and explicit retry recovers");
    } else {
      assert.equal(scriptRequests, 0); assert.ok(await js("!document.querySelector('button[type=submit]').disabled"));
      responseStatus = 200; await submit(); await wait("location.pathname==='/dashboard'");
      assert.equal(requests.length, 1); assert.equal(requests[0].token, undefined);
      checks.push("Disabled mode loads no widget, omits token and keeps password login usable");
    }
    assert.deepEqual(exceptions, []);
    return { enabled, requests, scriptRequests, exceptions };
  } catch (error) { failure = error.stack; throw error; }
  finally {
    await writeFile(join(evidence, `${enabled ? 'enabled' : 'disabled'}.json`), JSON.stringify({ enabled, requests, scriptRequests, exceptions, failure }, null, 2));
    socket?.close();
    const stop = async process => { if (process.exitCode !== null) return; const exited = new Promise(resolve => process.once("exit", resolve)); process.kill("SIGTERM"); await exited; };
    await Promise.all([stop(chrome), stop(vite)]);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

let failure;
try { await run(true, 3118); await run(false, 3119); }
catch (error) { failure = error.stack; process.exitCode = 1; }
finally {
  await writeFile(join(evidence, "results.json"), JSON.stringify({ checks, screenshots, failure,
    limits: "Synthetic intercepted API/widget; no live credentials, Cloudflare verification, cookies, physical mobile or assistive-technology proof; no dedicated reduced-motion check.",
    cleanup: "Owned Chrome/Vite processes exited and profiles removed" }, null, 2));
  console.log(JSON.stringify({ evidence, checks, screenshots: screenshots.length, failure }));
}
