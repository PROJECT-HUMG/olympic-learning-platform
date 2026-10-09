// Actual routes with intercepted synthetic data; never uses live auth/API/OTP.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.ADOPTION_WEB_URL ?? 'http://127.0.0.1:3118';
const baseline = process.env.ADOPTION_BASELINE === '1';
const feedbackOnly = process.env.ADOPTION_FEEDBACK_ONLY === '1';
const dir = await mkdtemp(join(tmpdir(), 'ui-adoption-render-'));
const paths = ['src/components/ui/image-lightbox.tsx', 'src/components/ui/empty-state.tsx',
  'src/features/recognition/public-pages.tsx', 'src/features/documents/components/document-list.tsx',
  'src/features/post/components/news-list.tsx', 'src/components/ui/dialog.tsx', 'src/components/ui/list-feedback.tsx'];
const hashes = async () => Object.fromEntries(await Promise.all(paths.map(async p =>
  [p, await readFile(new URL('../' + p, import.meta.url)).then(b => createHash('sha256').update(b).digest('hex')).catch(e => { if (e.code === 'ENOENT') return null; throw e; })])));
const candidateStart = await hashes(), checks = [], screenshots = [], requests = [], errors = [];
let mode = 'empty', socket, call, js;
const page = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 };
const post = { id: 'synthetic-post', slug: 'synthetic-lightbox', title: 'Synthetic · Ảnh minh họa học tập',
  summary: 'Synthetic local fixture — no production content.', type: 'NEWS', status: 'PUBLISHED',
  thumbnailUrl: '/synthetic-adoption.svg', author: null, pinned: false, expiredAt: null, viewCount: 0,
  createdAt: '2026-10-09T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z', publishedAt: '2026-10-09T00:00:00Z',
  content: Array.from({ length: 15 }, (_, i) => `<p>Synthetic · Nội dung minh họa ${i + 1} để kiểm tra cuộn trang.</p>`).join('') };
const chrome = spawn(process.env.ADOPTION_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium startup timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => { socket.onopen = resolve; });
  let serial = 0;
  const pending = new Map();
  call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const reply = (e, status, body, contentType = 'application/json') => call('Fetch.fulfillRequest', {
    requestId: e.requestId, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: contentType }, { name: 'Access-Control-Allow-Origin', value: web },
      { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }],
    body: Buffer.from(contentType === 'application/json' ? JSON.stringify(body) : body).toString('base64'),
  });
  const fulfill = e => {
    const u = new URL(e.request.url), path = u.pathname, method = e.request.method;
    if (path === '/synthetic-adoption.svg') return reply(e, 200,
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#00387b"/><text x="80" y="225" fill="white" font-size="36">Synthetic local image</text></svg>', 'image/svg+xml');
    if (!path.startsWith('/api/v1/')) return u.origin === web && !/\.(mp4|webm)$/.test(path)
      ? call('Fetch.continueRequest', { requestId: e.requestId }) : reply(e, 404, {});
    requests.push({ path, method, query: u.search });
    if (method === 'OPTIONS') return reply(e, 200, {});
    // The focused presentation pass uses a stable synthetic identity so initial
    // anonymous expiry/cache clearing does not race the first public query.
    if (path.endsWith('/users/me') && feedbackOnly) return reply(e, 200, {
      id: 'synthetic-ui-only', username: 'synthetic-ui', fullName: 'Synthetic · Người kiểm tra',
      email: 'synthetic@example.test', role: 'STUDENT', status: 'ACTIVE', avatarUrl: null,
    });
    if (path.endsWith('/users/me') || path.endsWith('/auth/refresh')) return reply(e, 401, { status: 401 });
    if (path.endsWith('/documents/metadata')) return reply(e, 200, { subjects: [], categories: [], tags: [] });
    if (path.endsWith('/posts/slug/synthetic-lightbox')) return reply(e, 200, post);
    if (path.endsWith('/recognition/honors')) return reply(e, 200, page);
    if (mode === 'error' && (path.endsWith('/documents') || path.endsWith('/posts'))) return reply(e, 503, { status: 503, detail: 'Synthetic unavailable' });
    return reply(e, 200, page);
  };
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(e => errors.push(e.message));
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  js = async expression => {
    const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value;
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { for (let i = 0; i < 200; i++) { if (await js(expression)) return; await delay(50); } throw Error('Timeout: ' + expression); };
  const key = async k => {
    const n = { Enter: 13, Escape: 27, Tab: 9, ' ': 32 }[k] ?? 0;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: n, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: n });
  };
  await call('Runtime.enable'); await call('Page.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: 'window.adoptionDocument=crypto.randomUUID()' });
  const nav = async path => {
    const previous = await js('window.adoptionDocument'); await call('Page.navigate', { url: web + path });
    await wait(`window.adoptionDocument!==${JSON.stringify(previous)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);
  };
  const shot = async name => {
    if (/-(documents|news)-(empty|error)$/.test(name)) await js("document.querySelector('main [role=alert],main [role=status]')?.scrollIntoView({block:'center'})");
    await delay(250);
    const geometry = await js('({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,theme:document.documentElement.className})');
    if (!baseline) assert.ok(geometry.scrollWidth <= geometry.width, 'Page overflow ' + name);
    const path = join(dir, name + '.png'); await writeFile(path, Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64'));
    screenshots.push({ path, geometry });
  };
  const clickText = async text => js(`(()=>{const e=[...document.querySelectorAll('button')].find(b=>b.getClientRects().length&&b.textContent.trim()===${JSON.stringify(text)});if(!e||e.disabled)throw Error('Missing button');e.focus();e.click()})()`);
  const photoTrigger = `document.querySelector('img[src="/synthetic-adoption.svg"]')?.closest('button,[role="button"]')`;
  for (const [width, height, theme] of [[1440, 900, 'light'], [820, 900, 'dark'], [320, 640, 'light'], [320, 360, 'dark']]) {
    await nav('/about');
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width === 320 });
    await js(`localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:'${theme}'},version:0}))`);
    const prefix = `${baseline ? 'before' : 'after'}-${width}x${height}-${theme}`;
    if (!feedbackOnly) {
    mode = 'empty'; await nav('/honors?year=2026&subject=original&page=2');
    await wait("!!document.querySelector('form.recognition-filters input')");
    const count = requests.filter(r => r.path.endsWith('/recognition/honors')).length;
    await js("(()=>{const e=document.querySelector('form.recognition-filters input');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'  Synthetic · Giải tích  ');e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await delay(200); assert.equal(requests.filter(r => r.path.endsWith('/recognition/honors')).length, count, 'Typing must not apply');
    await key('Enter'); await wait("new URLSearchParams(location.search).get('subject')==='Synthetic · Giải tích'");
    assert.equal(await js("new URLSearchParams(location.search).get('page')"), null);
    assert.equal(await js("new URLSearchParams(location.search).get('year')"), '2026');
    await shot(prefix + '-honors-search'); checks.push({ width, theme, honorsExplicitSubmit: true });
    }
    for (const path of ['/documents', '/news?type=NEWS&q=synthetic']) {
      mode = 'empty'; await nav(path); await wait(path.startsWith('/documents') ? "document.body.textContent.includes('Không tìm thấy tài liệu nào')" : "document.body.textContent.includes('Chưa tìm thấy bài viết phù hợp')");
      await shot(prefix + (path.startsWith('/documents') ? '-documents-empty' : '-news-empty'));
      if (path.startsWith('/news')) { await clickText('Xem tất cả bài viết'); await wait("location.search===''"); }
      mode = 'error'; await nav(path); await wait(path.startsWith('/documents') ? "document.body.textContent.includes('Đã xảy ra lỗi khi tải dữ liệu')" : "document.body.textContent.includes('Chưa tải được bảng tin')");
      await shot(prefix + (path.startsWith('/documents') ? '-documents-error' : '-news-error'));
      const before = requests.length; mode = 'empty'; await clickText(path.startsWith('/documents') ? 'Thử lại' : 'Thử lại bảng tin');
      await wait(path.startsWith('/documents') ? "document.body.textContent.includes('Không tìm thấy tài liệu nào')" : "document.body.textContent.includes('Chưa tìm thấy bài viết phù hợp')");
      const retried = requests.slice(before).filter(r => r.path.endsWith(path.startsWith('/documents') ? '/documents' : '/posts'));
      assert.equal(retried.length, 1); assert.equal(retried[0].method, 'GET');
      if (path.startsWith('/news')) assert.equal(await js("new URLSearchParams(location.search).get('q')"), 'synthetic');
      checks.push({ width, theme, path, explicitRetry: true, filterPreserved: true });
    }
    if (!feedbackOnly) {
    await nav('/news/synthetic-lightbox'); await wait(`!!(${photoTrigger})`);
    await js(`(${photoTrigger}).scrollIntoView({block:'center'});(${photoTrigger}).focus();void(window.photoOpener=${photoTrigger})`);
    await shot(prefix + '-lightbox-closed'); await key('Enter');
    await wait("document.querySelectorAll('img[src=\"/synthetic-adoption.svg\"]').length===2");
    await shot(prefix + '-lightbox-open');
    const initialFocus = await js("document.activeElement?.getAttribute('aria-label')");
    await key('Tab'); await key('Tab');
    const trapped = await js("!!document.querySelector('[role=dialog]')?.contains(document.activeElement)");
    await key('Escape'); await wait("document.querySelectorAll('img[src=\"/synthetic-adoption.svg\"]').length===1");
    await delay(200); const restored = await js('document.activeElement===window.photoOpener');
    checks.push({ width, theme, lightboxInitialFocus: initialFocus, focusTrapped: trapped, escapeRestored: restored });
    if (!baseline) {
      assert.ok(trapped); assert.ok(restored); assert.equal(initialFocus, 'Đóng ảnh');
      await key(' '); await wait("!!document.querySelector('[role=dialog]')");
      await js("document.querySelector('[role=dialog] img').click()"); assert.ok(await js("!!document.querySelector('[role=dialog]')"));
      await js("document.querySelector('[aria-label=\"Đóng ảnh\"]').click()"); await wait('document.activeElement===window.photoOpener');
      await key('Enter'); await wait("!!document.querySelector('[role=dialog]')");
      await js("document.querySelector('[role=dialog]').click()"); await wait('document.activeElement===window.photoOpener');
      assert.ok(await js("!document.body.hasAttribute('data-scroll-locked')&&document.body.style.overflow!== 'hidden'"));
      checks.push({ width, theme, spaceOpen: true, imageClickStaysOpen: true, closeButtonAndBackdropRestore: true, scrollUnlock: true });
    }
    }
  }
  // A closed lightbox must not undo an unrelated existing inline scroll lock.
  if (!feedbackOnly) {
  await js("document.body.style.overflow='hidden'"); await nav('/news/synthetic-lightbox');
  // Navigation creates a new document; set the lock while already mounted instead.
  await wait(`!!(${photoTrigger})`); await js("document.body.style.overflow='hidden'");
  await js(`(${photoTrigger}).focus()`); await key('Enter'); await wait("document.querySelectorAll('img[src=\"/synthetic-adoption.svg\"]').length===2");
  await key('Escape'); await wait("document.querySelectorAll('img[src=\"/synthetic-adoption.svg\"]').length===1"); await new Promise(r => setTimeout(r, 200));
  const priorLockPreserved = await js("document.body.style.overflow==='hidden'");
  checks.push({ priorInlineScrollLockPreserved: priorLockPreserved }); if (!baseline) assert.ok(priorLockPreserved);
  await js("document.body.style.overflow=''");
  }
  assert.deepEqual(errors, []);
  const candidateEnd = await hashes(); assert.deepEqual(candidateStart, candidateEnd);
  await writeFile(join(dir, 'results.json'), JSON.stringify({ baseline, candidateStart, candidateEnd, checks, screenshots, requests, errors,
    limits: 'Synthetic intercepted fixtures; headless Chromium; no live backend/auth, physical mobile keyboard, AT or dedicated reduced-motion validation.' }, null, 2));
  console.log(JSON.stringify({ dir, checks: checks.length, screenshots: screenshots.length }));
} catch (error) {
  await writeFile(join(dir, 'failure.json'), JSON.stringify({ message: error.message, checks, requests, errors, candidateStart }, null, 2));
  if (call) await writeFile(join(dir, 'failure.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')).catch(() => {});
  console.error(dir, error); process.exitCode = 1;
} finally {
  socket?.close(); chrome.kill('SIGTERM');
  await new Promise(resolve => { if (chrome.exitCode !== null) resolve(); else { chrome.once('exit', resolve); setTimeout(resolve, 3000); } });
  await rm(join(dir, 'profile'), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
