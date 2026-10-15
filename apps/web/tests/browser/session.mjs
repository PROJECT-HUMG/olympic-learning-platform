import { spawn } from 'node:child_process';
import { createServer as createHttpServer } from 'node:http';
import { constants } from 'node:fs';
import { access, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { checks, usage } from './checks.mjs';

export const webRoot = fileURLToPath(new URL('../..', import.meta.url));

export function browserOptions(name, args = process.argv.slice(2)) {
  const options = { help: { type: 'boolean' }, browser: { type: 'string' }, output: { type: 'string' },
    'timeout-ms': { type: 'string' }, 'no-sandbox': { type: 'boolean' } };
  for (const [key, type] of Object.entries(checks[name].options)) options[key] = { type: Array.isArray(type) ? 'string' : type };
  const { values } = parseArgs({ args, options, strict: true, allowPositionals: false });
  if (values.help) { console.log(usage(name)); process.exit(0); }
  const timeout = Number(values['timeout-ms'] ?? 30000);
  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 300000) throw Error('--timeout-ms must be an integer from 100 to 300000');
  for (const [key, choices] of Object.entries(checks[name].options)) {
    if (Array.isArray(choices) && values[key] !== undefined && !choices.includes(values[key])) throw Error(`--${key} must be ${choices.join('|')}`);
  }
  if (values['visual-only'] && values['interactions-only']) throw Error('Choose visual-only or interactions-only, not both');
  if (values.before && (values['interactions-only'] || values['evidence-only'])) throw Error('--before supports visual comparison only');
  if (values['forgot-only'] && values.section !== 'turnstile') throw Error('--forgot-only requires --section=turnstile');
  return { ...values, name, timeout };
}

export async function evidenceDirectory(options) {
  if (!options.output) return mkdtemp(join(tmpdir(), `humg-browser-${options.name}-`));
  const dir = resolve(options.output);
  // Refuse existing paths: never overwrite operator files or old evidence.
  await mkdir(dir, { mode: 0o700 });
  return dir;
}

async function executable(path) {
  try { await access(path, constants.X_OK); return path; } catch { return null; }
}

export async function findBrowser(explicit) {
  if (explicit) {
    const path = resolve(explicit);
    if (!await executable(path)) throw Error(`Browser is not executable: ${path}`);
    return path;
  }
  for (const dir of (process.env.PATH ?? '').split(':').filter(Boolean)) {
    for (const name of ['chromium', 'chromium-browser', 'google-chrome']) {
      const path = await executable(join(dir, name));
      if (path) return path;
    }
  }
  // Reuse already installed Playwright Chromium binaries; no Playwright dependency/download.
  const cache = join(homedir(), '.cache/ms-playwright');
  const entries = await readdir(cache).catch(() => []);
  for (const entry of entries.filter(name => /^chromium-\d+$/.test(name)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))) {
    for (const suffix of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const path = await executable(join(cache, entry, suffix));
      if (path) return path;
    }
  }
  throw Error('No installed Chromium found; pass --browser /absolute/path/to/chrome. No browser was downloaded.');
}

function bounded(promise, timeout, label) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(`${label} timed out after ${timeout}ms`)), timeout); })]).finally(() => clearTimeout(timer));
}

async function stopBrowser(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null || !child.pid) return;
  const exit = new Promise(resolve => child.once('exit', resolve));
  // Chromium owns subprocesses. Its dedicated group excludes the caller/operator.
  const kill = signal => {
    try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  };
  kill('SIGTERM');
  const timer = setTimeout(() => kill('SIGKILL'), 1500);
  try { await bounded(exit, 5000, 'Owned Chromium exit'); } finally { clearTimeout(timer); }
}

// Vite/browser/CDP are the only shared layer. Fixtures, routes and assertions stay in each runner.
export async function startBrowserCheck({ dir, options, snapshots = new Map(), turnstile = false }) {
  let host, http, chrome, socket, closing, serial = 0, browserLog = '';
  const pending = new Map(), listeners = new Set();
  const abortedRequests = new Set(), frameVersions = new Map(), requestFailures = [], cancelledRequests = [];
  const runtime = await mkdtemp(join(dir, '.runtime-'));
  const record = { check: options.name, status: 'starting', runtime, browser: null, pid: null, web: null };
  const save = () => writeFile(join(dir, 'lifecycle.json'), JSON.stringify(record, null, 2));
  const rejectPending = error => { for (const p of pending.values()) p.reject(error); pending.clear(); };
  const signalHandlers = new Map();
  const cleanup = () => closing ??= (async () => {
    rejectPending(Error('Browser check closed'));
    socket?.close();
    const failures = [];
    try { await stopBrowser(chrome); } catch (error) { failures.push(error); }
    try { await host?.close(); } catch (error) { failures.push(error); }
    if (http?.listening) {
      http.closeAllConnections();
      await new Promise((resolve, reject) => http.close(error => error ? reject(error) : resolve())).catch(error => failures.push(error));
    }
    try { await rm(runtime, { recursive: true, force: true }); } catch (error) { failures.push(error); }
    for (const [signal, handler] of signalHandlers) process.off(signal, handler);
    record.status = failures.length ? 'cleanup-failed' : 'closed';
    await save();
    if (failures.length) throw new AggregateError(failures, 'Browser check cleanup failed');
  })();
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    const handler = () => { record.receivedSignal = signal; void cleanup().then(() => process.exit(code), error => { console.error(error); process.exit(1); }); };
    signalHandlers.set(signal, handler); process.once(signal, handler);
  }
  const ensureOpen = () => { if (closing) throw Error('Browser check interrupted'); };
  try {
    record.browser = await findBrowser(options.browser); ensureOpen();
    http = createHttpServer((request, response) => host.middlewares(request, response));
    host = await createServer({ root: webRoot, configFile: false, envDir: false, envPrefix: [], cacheDir: join(runtime, 'vite-cache'),
      define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api/v1'),
        'import.meta.env.VITE_TURNSTILE_ENABLED': JSON.stringify(turnstile ? 'true' : 'false'),
        'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify(turnstile ? 'assessment-public-placeholder' : '') },
      resolve: { alias: { '@': join(webRoot, 'src') } },
      plugins: [{ name: 'owned-source-comparison', enforce: 'pre', load(id) { return snapshots.get(id.split('?')[0]); } }, react(), tailwind()],
      // Do not hot-reload already observed pages during assertions.
      server: { middlewareMode: true, ws: { server: http }, watch: null },
    });
    // Node owns the ephemeral loopback listener; Vite 8 treats config port:0 as its default port.
    ensureOpen();
    await new Promise((resolve, reject) => { http.once('error', reject); http.listen(0, '127.0.0.1', resolve); });
    ensureOpen();
    record.web = `http://127.0.0.1:${http.address().port}`;
    // Fontconfig also needs a writable cache when the child has no ambient HOME.
    const cache = join(runtime, 'cache'), config = join(runtime, 'config');
    await mkdir(cache, { mode: 0o700 }); await mkdir(config, { mode: 0o700 });
    chrome = spawn(record.browser, ['--headless', ...(options['no-sandbox'] ? ['--no-sandbox'] : []),
      '--disable-background-timer-throttling', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--password-store=basic',
      '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${join(runtime, 'profile')}`, 'about:blank'],
    { detached: true, env: { PATH: process.env.PATH, LANG: process.env.LANG ?? 'C.UTF-8', GSETTINGS_BACKEND: 'memory', XDG_RUNTIME_DIR: runtime,
      XDG_CACHE_HOME: cache, XDG_CONFIG_HOME: config }, stdio: ['ignore', 'ignore', 'pipe'] });
    record.pid = chrome.pid ?? null;
    const starting = bounded(new Promise((resolve, reject) => {
      chrome.stderr.on('data', data => { browserLog = (browserLog + data).slice(-8192); const match = browserLog.match(/DevTools listening on (ws:\/\/\S+)/); if (match) resolve(match[1]); });
      chrome.once('error', reject);
      chrome.once('exit', (code, signal) => { const error = Error(`Owned Chromium exited (${code ?? signal}); check sandbox support or explicit --no-sandbox in a trusted local environment`); reject(error); rejectPending(error); });
    }), options.timeout, 'Chromium startup');
    const [endpoint] = await Promise.all([starting, save()]);
    ensureOpen();
    const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT', signal: AbortSignal.timeout(options.timeout) })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await bounded(new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', () => reject(Error('CDP connection failed')), { once: true }); }), options.timeout, 'CDP connect');
    ensureOpen();
    socket.addEventListener('close', () => rejectPending(Error('CDP socket closed')));
    socket.addEventListener('error', () => rejectPending(Error('CDP socket failed')));
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Network.loadingFailed' && message.params.canceled) abortedRequests.add(message.params.requestId);
      const frame = message.method === 'Page.frameNavigated' ? message.params.frame.id : message.method === 'Page.frameDetached' ? message.params.frameId : null;
      if (frame) frameVersions.set(frame, (frameVersions.get(frame) ?? 0) + 1);
      if (message.id) {
        const p = pending.get(message.id); pending.delete(message.id);
        if (message.error) p?.reject(Error(message.error.message)); else p?.resolve(message.result);
      } else for (const listener of listeners) listener(message);
    });
    const call = (method, params = {}) => {
      if (closing || socket.readyState !== WebSocket.OPEN) return Promise.reject(Error('CDP is not open'));
      const id = ++serial;
      return bounded(new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }), options.timeout, method).finally(() => pending.delete(id));
    };
    const js = async expression => {
      const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: Math.min(20000, options.timeout) });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      return result.result.value;
    };
    record.version = (await call('Browser.getVersion')).product;
    record.status = 'ready'; await save();
    const onRequest = handler => listeners.add(message => {
      if (message.method !== 'Fetch.requestPaused') return;
      const event = message.params;
      const frameVersion = frameVersions.get(event.frameId);
      void Promise.resolve().then(() => handler(event)).catch(error => {
        const detail = { path: new URL(event.request.url).pathname, method: event.request.method, error: error.message };
        // A navigation can abort a paused request before its asynchronous fixture replies.
        // Keep diagnostics; require matching network cancellation or frame replacement.
        // A duplicate reply in the same live frame is still a failure.
        if (/Invalid InterceptionId/.test(error.message) && (abortedRequests.has(event.networkId) || frameVersions.get(event.frameId) !== frameVersion)) cancelledRequests.push(detail);
        else requestFailures.push(detail);
      });
    });
    return { web: record.web, call, js, onEvent: listener => listeners.add(listener), onRequest, requestFailures, cancelledRequests, cleanup };
  } catch (error) {
    record.startupError = error.message;
    record.startupStderr = browserLog;
    await cleanup();
    throw error;
  }
}
