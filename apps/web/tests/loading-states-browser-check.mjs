// Synthetic, intercepted APIs only. Exercises mounted components/guards; no live data.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.LOADING_WEB_URL ?? 'http://127.0.0.1:3108';
const dir = await mkdtemp(join(tmpdir(), 'ui-loading-'));
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const tracked = execFileSync('git', ['ls-files', 'apps/web/src', 'apps/web/tests'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const added = execFileSync('git', ['ls-files', '--others', '--exclude-standard', 'apps/web/src', 'apps/web/tests'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const paths = [...new Set([...tracked, ...added])].filter(Boolean);
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async p => [p, createHash('sha256').update(await readFile(join(root, p))).digest('hex')])));
const candidateStart = await manifest();
const checks = [], errors = [], requests = [], accessibility = [];
const uid = '00000000-0000-0000-0000-000000000001';
const userA = { id: uid, username: 'fixture-a', fullName: 'Synthetic account A', email: 'a@example.test', role: 'ADMIN', status: 'ACTIVE', avatarUrl: null };
const userB = { ...userA, id: '00000000-0000-0000-0000-000000000002', fullName: 'Synthetic account B', username: 'fixture-b', email: 'b@example.test' };
let user = userA, userError = 0, holdUser = false, statusError = false, draftsError = false;
let holdStatus = false, holdDrafts = false, questionPending = false, docPending = false, postPending = false, bankPending = false;
let jobStatus = 'REVIEW_REQUIRED', draftStatus = 'NEEDS_REVIEW', held = {};
const statusBody = () => ({ id: uid, status: jobStatus, phase: jobStatus, progress: jobStatus === 'FAILED' ? 40 : 100,
  totalPages: 1, processedPages: 1, draftCount: 1, warningCount: 0, lastError: jobStatus === 'FAILED' ? 'Synthetic processing failure' : null,
  createdAt: '2026-10-07T00:00:00Z', updatedAt: '2026-10-07T00:00:00Z' });
const draftBody = () => [{ id: uid, ordinal: 1, status: draftStatus, content: { text: 'Synthetic extracted question', subjectId: uid, topicId: uid },
  answer: {}, confidence: 0.8, warnings: [], sourcePage: 1, sourcePageUrl: null, assets: [] }];
const pdf = join(dir, 'synthetic-loading.pdf');
await writeFile(pdf, '%PDF-1.4\nSynthetic test bytes only\n%%EOF\n');
const chrome = spawn(process.env.LOADING_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, call, js;
const userResponses = new Set();
let completedUsers = 0;
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
  call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const reply = (e, code, body = {}) => call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: code,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: web }, { name: 'Access-Control-Allow-Credentials', value: 'true' },
      { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,OPTIONS' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  const fulfill = async e => {
    const url = new URL(e.request.url), method = e.request.method;
    if (!url.pathname.startsWith('/api/v1/')) return url.origin === new URL(web).origin && !/\.(mp4|webm)$/.test(url.pathname)
      ? call('Fetch.continueRequest', { requestId: e.requestId }) : reply(e, 404);
    const path = url.pathname.slice(7);
    requests.push({ path, method, query: url.search });
    if (method === 'OPTIONS') return reply(e, 200);
    if (path === '/users/me') {
      if (holdUser) { held.user = e; return; }
      return reply(e, userError || 200, userError ? { status: userError, detail: 'Synthetic user fetch failure' } : user);
    }
    if (path === '/auth/login') return reply(e, 200, { accessToken: 'synthetic-next-account', user: userB });
    if (path === '/auth/refresh') return reply(e, userError === 401 ? 401 : 200, userError === 401 ? { status: 401 } : { accessToken: 'synthetic-refreshed' });
    if (path === '/assessment-imports' && method === 'POST') return reply(e, 200, statusBody());
    if (path === `/assessment-imports/${uid}/retry` && method === 'POST') { jobStatus = 'REVIEW_REQUIRED'; return reply(e, 200, statusBody()); }
    if (path === `/assessment-imports/${uid}`) {
      if (holdStatus) { held.status = e; return; }
      return reply(e, statusError ? 503 : 200, statusError ? { status: 503 } : statusBody());
    }
    if (path === `/assessment-imports/${uid}/drafts`) {
      if (holdDrafts) { held.drafts = e; return; }
      return reply(e, draftsError ? 503 : 200, draftsError ? { status: 503 } : draftBody());
    }
    if (path.endsWith('/publish') && path.startsWith('/assessment-imports/')) { jobStatus = 'PUBLISHED'; return reply(e, 200, statusBody()); }
    if (path.endsWith('/approve') && path.startsWith('/assessment-imports/')) { draftStatus = 'APPROVED'; return reply(e, 200, draftBody()[0]); }
    if (path.startsWith(`/assessment-imports/${uid}/drafts/`) && method === 'PATCH') return reply(e, 200, draftBody()[0]);
    if (path === '/documents/metadata') return reply(e, 200, { categories: [], tags: [], subjects: [{ id: uid, name: 'Synthetic subject', code: 'FIXTURE' }] });
    if (path === '/topics') return reply(e, 200, [{ id: uid, subjectId: uid, name: 'Synthetic topic' }]);
    if (path.startsWith('/questions/') && questionPending) { held.question = e; return; }
    if (path === '/questions' && bankPending) { held.bank = e; return; }
    if (path === '/questions') return reply(e, 200, { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 });
    if (path.startsWith('/documents/') && docPending) { held.document = e; return; }
    if (path.startsWith('/posts/') && postPending) { held.post = e; return; }
    return reply(e, 404, { status: 404 });
  };
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Network.responseReceived' && new URL(m.params.response.url).pathname.endsWith('/users/me')) userResponses.add(m.params.requestId);
    else if (m.method === 'Network.loadingFinished' && userResponses.has(m.params.requestId)) { userResponses.delete(m.params.requestId); completedUsers++; }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(error => errors.push(error.message));
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
  const wait = async expression => { for (let n = 0; n < 200; n++) { if (await js(expression)) return; await new Promise(r => setTimeout(r, 100)); } throw Error('Timed out: ' + expression); };
  const click = async (selector, text = '') => { await js(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!b||b.disabled)throw Error('No enabled target: '+${JSON.stringify(selector + ' ' + text)});b.click()})()`); };
  const keyActivate = async selector => {
    await js(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled)throw Error('No enabled keyboard target');b.focus()})()`);
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  };
  const navigate = async route => { await call('Page.navigate', { url: web + '/tests/fixtures/loading-states.html?route=' + encodeURIComponent(route) }); await wait('!!window.loadingChecks'); };
  const viewport = (width, height) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  const shot = async name => { await writeFile(join(dir, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); };
  const choosePDF = async () => {
    await wait('!!document.querySelector("#assessment-pdf")');
    const document = await call('DOM.getDocument');
    const node = await call('DOM.querySelector', { nodeId: document.root.nodeId, selector: '#assessment-pdf' });
    await call('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [pdf] });
    await click('button', 'Bắt đầu phân tích');
  };
  const release = async (name, code, body) => { assert.ok(held[name], 'held ' + name); const e = held[name]; delete held[name]; await reply(e, code, body); };
  const pendingSemantics = async label => {
    const ax = await call('Accessibility.getFullAXTree');
    assert.ok(ax.nodes.some(n => !n.ignored && n.name?.value?.includes(label)), 'pending text in accessibility tree: ' + label);
    accessibility.push({ label, nodes: ax.nodes.filter(n => !n.ignored && (n.role?.value === 'status' || n.name?.value?.includes(label))).map(n => ({ role: n.role?.value, name: n.name?.value, properties: n.properties })) });
    assert.ok(await js(`[...document.querySelectorAll('[role=status][aria-busy=true]')].some(e=>(e.getAttribute('aria-label')||e.textContent).includes(${JSON.stringify(label)}))`));
    assert.equal(await js("[...document.querySelectorAll('[data-slot=skeleton]')].every(e=>e.getAttribute('aria-hidden')==='true'&&!e.hasAttribute('role'))"), true);
  };
  await call('Network.enable'); await call('Page.enable'); await call('Runtime.enable'); await call('DOM.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });

  for (const [width, dark] of [[1440, false], [390, true], [390, false], [1440, true], [320, true]]) {
    await viewport(width, width === 390 ? 844 : 1000); await navigate('/compositions');
    await wait('!!document.querySelector("#cards [data-slot=skeleton]")');
    await js(`document.documentElement.classList.toggle('dark',${dark})`);
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    assert.notEqual(await js("getComputedStyle(document.querySelector('#motion [data-slot=skeleton]')).animationName"), 'none');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await js("getComputedStyle(document.querySelector('#motion [data-slot=skeleton]')).animationName"), 'none');
    const geometry = await js("(()=>{const a=document.querySelector('#card-actual article'),s=document.querySelector('#card-skeleton>div');return {actualImage:a.firstElementChild.firstElementChild.getBoundingClientRect().height,skeletonImage:s.firstElementChild.getBoundingClientRect().height,footerBorder:getComputedStyle(s.lastElementChild).borderTopWidth,overflow:document.documentElement.scrollWidth>innerWidth,busy:!!document.querySelector('[aria-label=\"Đang tải danh mục\"][aria-busy=true]'),actualBackground:getComputedStyle(a).backgroundColor,skeletonBackground:getComputedStyle(s).backgroundColor}})()");
    assert.equal(geometry.actualImage, 160); assert.equal(geometry.skeletonImage, 160);
    assert.equal(geometry.footerBorder, '1px'); assert.equal(geometry.overflow, false); assert.equal(geometry.busy, true);
    assert.equal(geometry.actualBackground, geometry.skeletonBackground);
    await pendingSemantics('Đang tải danh mục'); await shot(`cards-${width}-${dark ? 'dark' : 'light'}`);
    checks.push(`${width}/${dark ? 'dark' : 'light'}: image160/footer tokens, optional-description/no-description cards, no overflow, category pending semantics, reduced-motion pulse disabled`);
  }

  await viewport(390, 844); await navigate('/admin/assessment-import');
  statusError = true; await choosePDF();
  await wait("!!document.querySelector('[role=alert] button')");
  assert.ok(await js("document.querySelector('h1')?.textContent.includes('Nhập đề')"));
  assert.equal(await js('!!document.querySelector("#assessment-pdf")'), false);
  await shot('assessment-status-error');
  const beforeStatusRetry = requests.length; statusError = false; holdStatus = true;
  await keyActivate('[role=alert] button'); await wait("!!document.querySelector('[role=status][aria-busy=true]')");
  await pendingSemantics('trạng thái');
  assert.equal(await js("!!document.querySelector('[role=alert] button:not(:disabled)')"), false);
  holdStatus = false; await release('status', 200, statusBody());
  await wait("document.querySelector('textarea')?.value==='Synthetic extracted question'");
  assert.equal(requests.slice(beforeStatusRetry).some(r => r.method === 'POST'), false);
  checks.push('initial status error: header/import identity retained; keyboard retry moves to named busy status with no repeat action; recovers without POST/re-upload/reprocess');
  assert.equal(await js("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xuất bản ngân hàng')).disabled"), true);
  await click('button', 'Duyệt');
  await wait("![...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xuất bản ngân hàng')).disabled");
  checks.push('publication stays disabled for NEEDS_REVIEW; actual save/approve actions enable only approved nonempty drafts');

  draftsError = true; await navigate('/admin/assessment-import'); await choosePDF();
  await wait("!!document.querySelector('[role=alert] button')");
  assert.ok(await js("document.body.textContent.includes('Đã hoàn tất phân tích')"));
  assert.equal(await js("!![...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xuất bản ngân hàng')&&!e.disabled)"), false);
  await shot('assessment-drafts-error');
  const beforeDraftRetry = requests.length; draftsError = false; holdDrafts = true;
  await keyActivate('[role=alert] button'); await wait("!!document.querySelector('[role=status][aria-busy=true]')");
  await pendingSemantics('câu hỏi');
  holdDrafts = false; await release('drafts', 200, draftBody());
  await wait("document.querySelector('textarea')?.value==='Synthetic extracted question'");
  assert.equal(requests.slice(beforeDraftRetry).some(r => r.method === 'POST'), false);
  checks.push('draft fetch error retains genuine progress; query retry recovers same import/drafts without job restart; no publication while unverified');
  statusError = true; await js('void window.loadingChecks.refetchAssessment()');
  await wait("!!document.querySelector('[role=alert] button')");
  assert.equal(await js("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xuất bản ngân hàng'))?.disabled??true"), true);
  statusError = false; await click('[role=alert] button'); await wait("!document.querySelector('[role=alert]')");
  checks.push('cached status refresh failure preserves content with truthful error and prevents unverified publication until recovery');

  jobStatus = 'FAILED'; await navigate('/admin/assessment-import'); await choosePDF();
  await wait("document.body.textContent.includes('Synthetic processing failure')");
  const beforeJobRetry = requests.length; await click('button', 'Thử lại file này');
  await wait("document.querySelector('textarea')?.value==='Synthetic extracted question'");
  assert.ok(requests.slice(beforeJobRetry).some(r => r.method === 'POST' && r.path.endsWith('/retry')));
  assert.equal(requests.slice(beforeJobRetry).some(r => r.method === 'POST' && r.path === '/assessment-imports'), false);
  checks.push('FAILED job restart uses distinct /retry POST and retains import identity; query retries use GET only');

  jobStatus = 'REVIEW_REQUIRED'; holdStatus = true; await navigate('/admin/assessment-import'); await choosePDF();
  await wait("!!document.querySelector('[role=status][aria-busy=true]')"); await pendingSemantics('trạng thái');
  assert.ok(await js("document.querySelector('h1')?.textContent.includes('Nhập đề')"));
  holdStatus = false; holdDrafts = true; await release('status', 200, statusBody());
  await wait("!!document.querySelector('[role=status][aria-busy=true]')"); await pendingSemantics('câu hỏi');
  assert.ok(await js("document.body.textContent.includes('Đã hoàn tất phân tích')"));
  await js("document.documentElement.classList.add('dark');document.querySelector('section[aria-busy=true]').scrollIntoView()");
  assert.equal(await js('document.documentElement.scrollWidth>innerWidth'), false);
  await shot('assessment-phase-pending-dark'); holdDrafts = false; await release('drafts', 200, draftBody());
  checks.push('assessment status and draft pending names describe actual phase; stable header/progress, no upload-shaped placeholder');

  user = userA; userError = 0; await navigate('/profile'); await wait('!!document.querySelector("#profile-fullname")');
  await js("(()=>{const i=document.querySelector('#profile-fullname');window.dirtyInput=i;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'Unsaved synthetic draft');i.dispatchEvent(new Event('input',{bubbles:true}));i.focus()})()");
  await wait("document.body.textContent.includes('Bạn có thay đổi chưa lưu')");
  userError = 503; await js('void window.loadingChecks.refetchUser()');
  await wait("!!document.querySelector('.profile-page [role=alert]')");
  assert.equal(await js("document.querySelector('#profile-fullname')===window.dirtyInput"), true);
  assert.equal(await js("document.querySelector('#profile-fullname').value"), 'Unsaved synthetic draft');
  await shot('profile-refresh-error-dirty');
  userError = 0; await click('.profile-page [role=alert] button'); await wait("!document.querySelector('.profile-page [role=alert]')");
  assert.equal(await js("document.querySelector('#profile-fullname')===window.dirtyInput"), true);
  assert.equal(await js("document.querySelector('#profile-fullname').value"), 'Unsaved synthetic draft');
  await js('window.loadingChecks.rotateToken()');
  assert.equal(await js("document.querySelector('#profile-fullname').value"), 'Unsaved synthetic draft');
  checks.push('dirty profile same DOM/value survives 503 and retry recovery plus token revision rotation');
  holdUser = true; await js('void window.loadingChecks.refetchUser()');
  for (let n = 0; n < 200 && !held.user; n++) await new Promise(r => setTimeout(r, 10));
  assert.ok(held.user, 'account A refresh held before actual login B');
  user = userB; await js('window.loadingChecks.login()');
  await wait("document.querySelector('#profile-fullname')?.value==='Synthetic account B'");
  assert.equal(await js('document.querySelector("#profile-fullname")===window.dirtyInput'), false);
  assert.equal(await js("document.body.textContent.includes('a@example.test')"), false);
  const beforeLateA = completedUsers; holdUser = false; await release('user', 200, userA);
  for (let n = 0; n < 200 && completedUsers === beforeLateA; n++) await new Promise(r => setTimeout(r, 10));
  assert.ok(completedUsers > beforeLateA, 'late A response actually completed');
  await js('new Promise(resolve => setTimeout(resolve, 0))');
  assert.equal(await js('window.loadingChecks.cachedUserId()'), userB.id);
  assert.equal(await js("document.querySelector('#profile-fullname')?.value"), 'Synthetic account B');
  checks.push('actual useAuth.login cancels held A refresh: B editor resets A draft; late successful A response completes but cannot overwrite B identity/cache');
  userError = 403; await js('void window.loadingChecks.refetchUser()'); await wait('!document.querySelector("#profile-fullname")');
  assert.equal(await js("document.body.textContent.includes('Synthetic account B')"), false);
  checks.push('403 denies cached profile controls/data rather than retaining editor');
  userError = 0; await navigate('/profile'); await wait('!!document.querySelector("#profile-fullname")');
  userError = 404; await js('void window.loadingChecks.refetchUser()'); await wait('!document.querySelector("#profile-fullname")');
  assert.equal(await js("document.body.textContent.includes('Synthetic account B')"), false);
  checks.push('404 /users/me (deleted account) hides cached editor/account actions; missing identity is not an ordinary refresh failure');
  userError = 0; await navigate('/profile'); await wait('!!document.querySelector("#profile-fullname")');
  userError = 401; await js('void window.loadingChecks.refetchUser()'); await wait('!!document.querySelector("#login-fallback")');
  assert.equal(await js('!!document.querySelector("#profile-fullname")'), false);
  assert.ok(requests.some(r => r.path === '/auth/refresh' && r.method === 'POST'));
  checks.push('401 plus rejected refresh exercises actual expireAuthSession; cached user removed and protected route redirects, no editor');

  user = userA; userError = 0; holdUser = true; await navigate('/admin/guard-secret');
  await wait("document.body.textContent.includes('Đang kiểm tra phiên đăng nhập')");
  await pendingSemantics('phiên đăng nhập'); assert.equal(await js('!!document.querySelector(".workspace-layout,#guard-secret")'), false);
  await shot('neutral-guard-pending'); holdUser = false; user = { ...userA, role: 'STUDENT' }; await release('user', 200, user);
  await wait('!!document.querySelector("#public-fallback")'); assert.equal(await js('!!document.querySelector(".workspace-layout,#guard-secret")'), false);
  checks.push('protected auth pending is neutral/labelled; actual DashboardLayout never mounts before resolution or for disallowed student');
  holdUser = true; await navigate('/role-only'); await wait("document.body.textContent.includes('Đang kiểm tra phiên đăng nhập')");
  await pendingSemantics('phiên đăng nhập'); assert.equal(await js('!!document.querySelector("#role-secret")'), false);
  holdUser = false; user = userA; await release('user', 200, user); await wait('!!document.querySelector("#role-secret")');
  checks.push('RoleGuard uses same neutral named busy region and releases children only after allowed role');

  questionPending = true; await navigate('/admin/questions/' + uid);
  await wait(`!!document.querySelector('[aria-label="Đang tải câu hỏi"]')`); await pendingSemantics('Đang tải câu hỏi');
  assert.ok(await js("!!document.querySelector('.page-shell button')&&document.querySelector('.page-shell button').textContent.includes('Quay lại')"));
  assert.equal(await js('!!document.querySelector("textarea")'), false);
  await shot('question-pending-shell'); bankPending = true; questionPending = false; await keyActivate('.page-shell button'); await release('question', 404, { status: 404 });
  await wait("!!document.querySelector('form[role=search]')");
  await wait("!!document.querySelector('[role=status][aria-busy=true]')");
  await pendingSemantics('Đang tải câu hỏi');
  assert.equal(await js("[...document.querySelectorAll('[data-slot=skeleton]')].every(e=>getComputedStyle(e).animationName==='none')"), true);
  await shot('bank-pending-reduced-motion');
  bankPending = false; await release('bank', 200, { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 });
  await wait("!document.querySelector('[role=status][aria-busy=true]')");
  checks.push('actual question-bank placeholders use shared Skeleton; named busy region, quiet blocks and reduced motion; empty response clears pending');
  checks.push('question initial pending retains safe shell/back action without editor/private content; existing bank return path works');

  docPending = true; await navigate('/documents/fixture'); await wait(`!!document.querySelector('[aria-label="Đang tải tài liệu"]')`);
  await pendingSemantics('Đang tải tài liệu'); docPending = false; await release('document', 404, { status: 404 });
  postPending = true; await navigate('/news/fixture'); await wait(`!!document.querySelector('[aria-label="Đang tải bài viết"]')`);
  await pendingSemantics('Đang tải bài viết'); postPending = false; await release('post', 404, { status: 404 });
  checks.push('document/news detail pending regions named/busy with decorative skeleton blocks quiet');

  assert.deepEqual(errors, []); const candidateEnd = await manifest(); assert.deepEqual(candidateStart, candidateEnd);
  await writeFile(join(dir, 'results.json'), JSON.stringify({ candidateStart, candidateEnd, checks, requests, errors, accessibility,
    limits: 'Synthetic intercepted APIs/PDF and fixture MemoryRouter mounting actual pages/guards/query/auth code. Chromium desktop/mobile emulation only. No live backend/storage/identity policy, CLS metric, physical devices, other engines or spoken screen-reader proof.' }, null, 2));
  console.log(JSON.stringify({ dir, checks: checks.length, errors: errors.length }));
} catch (error) {
  await writeFile(join(dir, 'failure.json'), JSON.stringify({ message: error.message, checks, requests, errors, candidateStart }, null, 2));
  if (call) await writeFile(join(dir, 'failure.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')).catch(() => {});
  console.error(dir, error); process.exitCode = 1;
} finally {
  socket?.close(); const stopped = new Promise(resolve => chrome.once('exit', resolve)); chrome.kill('SIGTERM');
  await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, 3000))]);
  await rm(join(dir, 'profile'), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
