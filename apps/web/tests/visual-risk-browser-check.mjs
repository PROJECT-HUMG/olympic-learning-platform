// Mounted application routes with explicitly synthetic stress data; all APIs intercepted.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.VISUAL_WEB_URL ?? 'http://127.0.0.1:3109';
const reviewOnly = process.env.VISUAL_REVIEW_ONLY === '1';
const dir = await mkdtemp(join(tmpdir(), 'ui-visual-'));
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'apps/web/src', 'apps/web/tests'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async p => [p, createHash('sha256').update(await readFile(join(process.env.VISUAL_SOURCE_SNAPSHOT && p.startsWith('apps/web/src/') ? process.env.VISUAL_SOURCE_SNAPSHOT : root, p))).digest('hex')])));
const candidateStart = await manifest();
const uid = '00000000-0000-0000-0000-000000000001';
const subjectName = 'Synthetic · Toán học ứng dụng, xác suất thống kê và phương pháp nghiên cứu khoa học';
const categoryName = 'Synthetic · Tài liệu tham khảo và đề cương ôn tập chuyên ngành năm học 2026–2027';
const title = 'Synthetic · Tuyển tập bài tập chuyên đề phương pháp nghiên cứu và ứng dụng trong kỳ thi Olympic sinh viên năm học 2026–2027 — tài liệu đối chiếu và hướng dẫn dành cho nhóm học tập';
let role = 'ADMIN', documentState = 'ready', holdSave = false, heldSave, holdDocumentSave = false, heldDocumentSave;
const user = () => ({ id: uid, username: 'synthetic-account', fullName: 'Synthetic Nguyễn Hoàng Minh Anh', email: 'synthetic.long.account.name.for.layout@example.test', role, status: 'ACTIVE', avatarUrl: null });
const doc = { id: uid, slug: 'synthetic-long-document', title, description: 'Synthetic: phần mô tả dài giúp kiểm tra thẻ tài liệu với tên môn học và loại tài liệu thực tế. '.repeat(5),
  category: { id: uid, name: categoryName, code: 'FIXTURE' }, subject: { id: uid, name: subjectName, code: 'FIXTURE' }, tags: [], owner: user(),
  thumbnailUrl: null, createdAt: '2026-10-01T00:00:00Z', viewCount: 12345, downloadCount: 9999 };
const honor = { id: uid, title, subject: subjectName, year: 2026, description: 'Synthetic ghi nhớ. '.repeat(20), scope: 'NATIONAL', status: 'DRAFT',
  participants: [{ fullName: 'Synthetic Nguyễn Hoàng Minh Anh — nhóm nghiên cứu ứng dụng khoa học và toán học', award: 'Giải nghiên cứu khoa học cấp quốc gia' }], photos: [], version: 1,
  createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' };
const importStatus = { id: uid, status: 'REVIEW_REQUIRED', phase: 'REVIEW_REQUIRED', progress: 100, totalPages: 10, processedPages: 10, draftCount: 1, warningCount: 1 };
const draft = { id: uid, ordinal: 12, status: 'NEEDS_REVIEW', content: { text: 'Synthetic: Hãy chứng minh tính chất của biểu thức và đối chiếu từng điều kiện của bài toán. '.repeat(8), subjectId: uid, topicId: uid },
  answer: {}, confidence: 0.82, warnings: ['Synthetic: Cần đối chiếu công thức dài và ký hiệu ở trang gốc trước khi duyệt.'], sourcePage: 10, sourcePageUrl: null, assets: [] };
const page = content => ({ content, totalElements: content.length, totalPages: content.length ? 1 : 0, number: 0, size: 20 });
const observations = [], errors = [], requests = [], checks = [];
const pdf = join(dir, 'synthetic.pdf'); await writeFile(pdf, '%PDF-1.4\nSynthetic test bytes only\n%%EOF');
const chrome = spawn(process.env.VISUAL_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, call, js;
let requestedViewport;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium startup timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise(resolve => { socket.onopen = resolve; });
  const pending = new Map(); let serial = 0;
  call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const reply = (e, status, body) => call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  const fulfill = async e => {
    const url = new URL(e.request.url), method = e.request.method;
    if (!url.pathname.startsWith('/api/v1/')) return url.origin === new URL(web).origin && !/\.(mp4|webm)$/.test(url.pathname)
      ? call('Fetch.continueRequest', { requestId: e.requestId }) : reply(e, 404, {});
    const path = url.pathname.slice(7); requests.push({ path, method, body: e.request.postData });
    if (path === '/users/me') return reply(e, role ? 200 : 401, role ? user() : { status: 401 });
    if (path === '/auth/refresh') return reply(e, role ? 200 : 401, role ? { accessToken: 'synthetic-only' } : { status: 401 });
    if (path === '/documents/metadata') return reply(e, 200, { categories: [doc.category], subjects: [doc.subject], tags: [] });
    if (path === '/topics') return reply(e, 200, [{ id: uid, subjectId: uid, name: subjectName }]);
    if (path === '/documents') return reply(e, documentState === 'error' ? 503 : 200, documentState === 'error' ? { status: 503 } : page(documentState === 'empty' ? [] : [doc]));
    if (path.startsWith('/documents/') && method === 'PUT') {
      if (holdDocumentSave) { heldDocumentSave = e; return; } return reply(e, 200, doc);
    }
    if (path.startsWith('/posts')) return reply(e, 200, page([]));
    if (path === '/admin/recognition/honors') return reply(e, 200, page([honor]));
    if (path === '/admin/recognition/achievements') return reply(e, 200, page([]));
    if (path === '/assessment-imports' && method === 'POST') return reply(e, 200, importStatus);
    if (path === `/assessment-imports/${uid}`) return reply(e, 200, importStatus);
    if (path === `/assessment-imports/${uid}/drafts`) return reply(e, 200, [draft]);
    if (path.startsWith(`/assessment-imports/${uid}/drafts/`) && method === 'PATCH') {
      if (holdSave) { heldSave = e; return; } return reply(e, 200, draft);
    }
    if (path.startsWith('/questions')) return reply(e, 200, page([]));
    return reply(e, 404, { status: 404 });
  };
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(e => { if (!e.message.includes('Invalid InterceptionId')) errors.push(e.message); });
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
  const wait = async expression => { for (let n = 0; n < 250; n++) { if (await js(expression)) return; await new Promise(r => setTimeout(r, 100)); } throw Error('Timeout: ' + expression); };
  const click = async (selector, text = '') => js(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Missing enabled target '+${JSON.stringify(selector + text)});b.focus();b.click()})()`);
  const key = async key => { const code = ({ Enter: 13, Escape: 27, Tab: 9, ArrowDown: 40 })[key]; await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code, ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code }); };
  const reach = async (selector, text = '') => {
    const matches = `document.activeElement?.matches(${JSON.stringify(selector)})${text ? `&&document.activeElement.textContent.trim()===${JSON.stringify(text)}` : ''}`;
    for (let n = 0; n < 40 && !(await js(matches)); n++) await key('Tab');
    assert.ok(await js(matches), 'Keyboard Tab reach: ' + selector + text);
    await js("document.activeElement.scrollIntoView({block:'center'})");
    const b = await js("(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),v=visualViewport;return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,vw:v.width,vh:v.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()");
    assert.ok(b.x >= 0 && b.right <= b.vw+1 && b.y >= 0 && b.bottom <= b.vh+1 && b.hit, 'Visible keyboard control: '+JSON.stringify(b));
    checks.push('Tab reaches visible ' + selector + text);
  };
  const viewport = (width, height) => { requestedViewport = { width, height, deviceScaleFactor: 1, mobile: width < 768 }; return call('Emulation.setDeviceMetricsOverride', requestedViewport); };
  const navigate = async (route, theme) => {
    await js(`localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:${JSON.stringify(theme)}},version:0}))`);
    const previous = await js('window.visualDocumentId');
    await call('Page.navigate', { url: web + route });
    await wait(`window.visualDocumentId!==${JSON.stringify(previous)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);
  };
  const observe = async (name, selector) => {
    if (selector) await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);
    await js('new Promise(r=>setTimeout(r,450))');
    const metrics = await call('Page.getLayoutMetrics');
    const measured = await js(`(()=>{const w=innerWidth;const rect=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};return {width:w,height:innerHeight,clientWidth:document.documentElement.clientWidth,viewportMeta:document.querySelector('meta[name=viewport]')?.content,visualViewport:{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale,offsetLeft:visualViewport.offsetLeft,offsetTop:visualViewport.offsetTop},mobileMedia:matchMedia('(max-width:767px)').matches,regions:[...document.querySelectorAll('[role=dialog],[data-slot=select-content]')].map(e=>({slot:e.dataset.slot,rect:rect(e),clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,gridColumns:getComputedStyle(e).gridTemplateColumns})),controls:[...document.querySelectorAll('main button,section[aria-labelledby=draft-review-title] input,section[aria-labelledby=draft-review-title] select,section[aria-labelledby=draft-review-title] textarea,[role=dialog] button,[role=dialog] input,[role=dialog] textarea')].filter(e=>e.getClientRects().length).map(e=>({tag:e.tagName,label:e.getAttribute('aria-label')||e.textContent?.slice(0,90)||e.id,disabled:e.disabled,rect:rect(e)})),scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.classList.contains('dark')?'dark':'light',offenders:[...document.querySelectorAll('main *,[role=dialog] *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>w+1&&r.left>=0}).slice(0,15).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,85),rect:{x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}}))}})()`);
    const png = Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64');
    await writeFile(join(dir, name + '.png'), png);
    const screenshot = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
    observations.push({ name, requestedViewport: { ...requestedViewport }, screenshot, metrics, ...measured });
    if (!reviewOnly) {
      assert.equal(screenshot.width, requestedViewport.width); assert.equal(screenshot.height, requestedViewport.height);
      assert.ok(Math.abs(measured.visualViewport.scale - 1) < 0.01, name + ': automatic scaling ' + measured.visualViewport.scale);
      assert.ok(metrics.cssLayoutViewport.clientWidth <= requestedViewport.width + 1, name + ': CDP expanded layout viewport');
      assert.ok(measured.width <= requestedViewport.width + 1, name + ': expanded viewport ' + measured.width);
      for (const region of measured.regions) assert.ok(region.scrollWidth <= region.clientWidth + 1, name + ': local horizontal overflow ' + JSON.stringify(region));
      if (name.startsWith('assessment')) {
        const controls = await js("[...document.querySelectorAll('section[aria-labelledby=draft-review-title] button,section[aria-labelledby=draft-review-title] input,section[aria-labelledby=draft-review-title] select,section[aria-labelledby=draft-review-title] textarea')].map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent.slice(0,30),left:r.left,right:r.right,width:r.width}})");
        assert.ok(controls.every(r=>r.width>0&&r.left>=0&&r.right<=requestedViewport.width+1), name+': clipped draft controls '+JSON.stringify(controls));
      }
      assert.ok(measured.scrollWidth <= requestedViewport.width + 1, name + ': page overflow ' + JSON.stringify(measured));
    }
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('DOM.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: 'window.visualDocumentId=crypto.randomUUID()' });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await call('Page.navigate', { url: web + '/about' });
  await wait('!!document.querySelector("header")&&!document.querySelector("#startup-loader")');

  for (const [width, height, theme] of [[320, 640, 'light'], [390, 844, 'dark'], [768, 900, 'light'], [1440, 1000, 'dark']]) {
    role = 'ADMIN'; await viewport(width, height); await navigate('/admin/questions/import', theme);
    await wait('!!document.querySelector("#assessment-pdf")');
    const dom = await call('DOM.getDocument'); const input = await call('DOM.querySelector', { nodeId: dom.root.nodeId, selector: '#assessment-pdf' });
    await call('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [pdf] }); await click('button', 'Bắt đầu phân tích');
    await wait('!!document.querySelector("textarea")');
    await observe(`assessment-${width}-${theme}`, 'section[aria-labelledby=draft-review-title]');
    if (width === 320 && !reviewOnly) {
      await reach('button', 'Lưu');
      await observe('assessment-actions-320-light');
      const actionBounds = await js("[...document.querySelectorAll('section[aria-labelledby=draft-review-title] button')].map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent.trim(),x:r.x,y:r.y,right:r.right,bottom:r.bottom}})");
      assert.ok(actionBounds.every(r=>r.x>=0&&r.right<=320&&r.y>=63&&r.bottom<=640), 'All review actions visible: '+JSON.stringify(actionBounds));
      const count = requests.length; holdSave = true; await key('Enter');
      await wait("!!document.querySelector('button[aria-busy=true]')"); assert.ok(heldSave);
      assert.equal(await js("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Duyệt').disabled"), true);
      assert.equal(await js("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Xuất bản ngân hàng')).disabled"), true);
      await observe('assessment-save-pending-320');
      holdSave = false; await reply(heldSave, 200, draft); heldSave = undefined;
      await wait("!document.querySelector('button[aria-busy=true]')");
      assert.equal(requests.slice(count).filter(r=>r.method==='PATCH').length, 1);
      checks.push('assessment keyboard Save remains one PATCH, pending disables approve/publish, labels/selects and warning stay usable');
    }
    await navigate('/admin/documents', theme); await wait("document.body.textContent.includes('Tuyển tập bài tập')");
    await observe(`documents-${width}-${theme}`);
    if (!reviewOnly && width === 320) { await reach('button', 'Sửa'); await key('Enter'); }
    else await click('button', 'Sửa');
    await wait('!!document.querySelector("[role=dialog]")');
    await observe(`document-edit-${width}-${theme}`, '[role=dialog]');
    if (!reviewOnly && width === 320) await reach('[data-slot=select-trigger]');
    else await js("document.querySelector('[data-slot=select-trigger]').focus()");
    await key('Enter');
    await wait('!!document.querySelector("[role=listbox]")');
    await observe(`document-category-${width}-${theme}`);
    await key(!reviewOnly && width === 320 ? 'Enter' : 'Escape'); await wait('!document.querySelector("[role=listbox]")');
    if (!reviewOnly && width === 320) assert.equal(await js("document.querySelector('[data-slot=select-trigger]').textContent.trim()"), categoryName);
    if (!reviewOnly && width === 320) {
      await reach('button', 'Lưu thay đổi');
      const count = requests.length; holdDocumentSave = true; await key('Enter');
      await wait("!!document.querySelector('[role=dialog] button[aria-busy=true]')"); assert.ok(heldDocumentSave);
      assert.equal(await js("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.trim()==='Hủy bỏ').disabled"), true);
      await observe('document-save-pending-320-light', '[role=dialog]');
      const puts = requests.slice(count).filter(r=>r.method==='PUT'); assert.equal(puts.length, 1);
      assert.deepEqual(JSON.parse(puts[0].body), { title: doc.title, description: doc.description, categoryId: uid, subjectId: uid, tagIds: [] });
      holdDocumentSave = false; await reply(heldDocumentSave, 200, doc); heldDocumentSave = undefined;
      await wait('!document.querySelector("[role=dialog]")');
      await reach('button', 'Sửa'); await key('Enter'); await wait('!!document.querySelector("[role=dialog]")');
      await reach('[data-slot=dialog-close]'); await key('Enter'); await wait('!document.querySelector("[role=dialog]")');
      assert.equal(requests.slice(count).filter(r=>r.method==='PUT').length, 1);
      checks.push('320 document keyboard edit/select/save/close: one PUT with unchanged metadata payload, pending Cancel disabled, close has no mutation');
    } else { await key('Escape'); await wait('!document.querySelector("[role=dialog]")'); }
    await navigate('/admin/recognition', theme); await wait("document.body.textContent.includes('Tuyển tập bài tập')");
    await click('button', 'Chỉnh sửa'); await wait('!!document.querySelector(".recognition-participant-editor")');
    await observe(`recognition-${width}-${theme}`, '.recognition-participant-editor');
    await navigate('/admin/questions/new', theme); await wait('!!document.querySelector("#manual-question-form")');
    await observe(`question-author-${width}-${theme}`, '#manual-question-form');
    await navigate('/profile', theme); await wait('!!document.querySelector("#profile-fullname")');
    await observe(`profile-${width}-${theme}`);
  }
  await viewport(320, 360); role = 'ADMIN'; await navigate('/admin/documents', 'dark');
  await wait("document.body.textContent.includes('Tuyển tập bài tập')");
  if (!reviewOnly) { await reach('button', 'Sửa'); await key('Enter'); } else await click('button', 'Sửa');
  await wait('!!document.querySelector("[role=dialog]")'); await observe('document-edit-320x360-dark', '[role=dialog]');
  if (!reviewOnly) { await reach('button', 'Lưu thay đổi'); await observe('document-save-visible-320x360-dark'); await reach('[data-slot=dialog-close]'); await key('Enter'); }
  else await key('Escape');
  await wait('!document.querySelector("[role=dialog]")');
  await viewport(320, 360); role = 'ADMIN'; await navigate('/admin/recognition', 'dark');
  await wait("document.body.textContent.includes('Tuyển tập bài tập')"); await click('button', 'Xóa'); await wait('!!document.querySelector("[role=dialog]")');
  await observe('recognition-delete-320x360-dark', '[role=dialog]');
  const bounds = await js("(()=>{const r=document.querySelector('[role=dialog]').getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}})()");
  assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.right <= 321 && bounds.bottom <= 361);
  await key('Escape'); await wait('!document.querySelector("[role=dialog]")'); assert.equal(requests.filter(r=>r.method==='DELETE').length, 0);
  await js("document.querySelector('[aria-label=\"Mở menu điều hướng\"]').click()"); await wait('!!document.querySelector(".navigation-drawer__body")');
  await observe('admin-drawer-320x360-dark');
  await js("const d=document.querySelector('.navigation-drawer__body');d.scrollTop=d.scrollHeight");
  assert.ok(await js("document.querySelector('.navigation-drawer__body').scrollTop>0"));
  await key('Escape'); await wait('!document.querySelector("[data-slot=sheet-content]")');
  checks.push('short destructive dialog and staff drawer bounded/scrollable; Escape sends no DELETE');
  for (const nextRole of ['STUDENT', null]) {
    role = nextRole; await navigate('/about', 'light');
    await js("document.querySelector('[aria-label=\"Mở menu điều hướng\"]').click()"); await wait('!!document.querySelector(".navigation-drawer__body")');
    await observe(`drawer-${nextRole ?? 'guest'}-320x360`);
    assert.equal(await js("[...document.querySelectorAll('.navigation-drawer__body a')].some(a=>a.getAttribute('href').startsWith('/admin/'))"), false);
    await key('Escape'); await wait('!document.querySelector("[data-slot=sheet-content]")');
  }
  checks.push('student and guest drawers retain role-dependent links without staff destinations');
  role = 'ADMIN'; await viewport(320, 640); documentState = 'empty'; await navigate('/admin/documents', 'dark');
  await wait("document.body.textContent.includes('Chưa có tài liệu nào')"); await observe('documents-empty-320-dark');
  documentState = 'error'; await navigate('/admin/documents', 'light'); await wait("document.body.textContent.includes('Không thể tải danh sách')");
  await observe('documents-error-320-light'); documentState = 'ready'; await click('button', 'Thử lại'); await wait("document.body.textContent.includes('Tuyển tập bài tập')");
  checks.push('management empty/error/retry rendered at320; recovery retains actual list action paths');
  assert.deepEqual(errors, []); const candidateEnd = await manifest(); assert.deepEqual(candidateStart, candidateEnd);
  await writeFile(join(dir, 'results.json'), JSON.stringify({ reviewOnly, servedSourceSnapshot: process.env.VISUAL_SOURCE_SNAPSHOT ?? root, candidateStart, candidateEnd, observations, checks, requests, errors,
    limits: 'Synthetic local APIs/PDF, existing actual app routes/shells/forms. Chromium with emulated viewports/reduced motion. No live backend/storage/data, spoken assistive technology, physical keyboard or cross-browser proof.' }, null, 2));
  console.log(JSON.stringify({ dir, observations: observations.length, overflow: observations.filter(o=>o.scrollWidth>o.width+1).map(o=>o.name), checks: checks.length }));
} catch (error) {
  await writeFile(join(dir, 'failure.json'), JSON.stringify({ message: error.message, observations, checks, requests, errors, candidateStart }, null, 2));
  if (call) await writeFile(join(dir, 'failure.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')).catch(()=>{});
  console.error(dir, error); process.exitCode = 1;
} finally {
  socket?.close(); const stopped = new Promise(resolve => chrome.once('exit', resolve)); chrome.kill('SIGTERM');
  await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, 3000))]);
  await rm(join(dir, 'profile'), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
