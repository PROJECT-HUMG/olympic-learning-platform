// Local rendered shell evidence only: synthetic auth/API, no backend or external effects.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.NAV_WEB_URL ?? 'http://127.0.0.1:3000';
const phase = process.env.NAV_PHASE ?? 'after';
const dir = await mkdtemp(join(tmpdir(), `navigation-${phase}-`));
const paths = [
  'src/layouts/dashboard-layout.tsx', 'src/layouts/public-layout.tsx',
  'src/layouts/navigation.ts', 'src/layouts/navigation.css', 'src/layouts/public-layout.css',
  'src/layouts/components/public-header.tsx', 'src/layouts/components/public-header.css',
  'src/layouts/components/navigation-groups.tsx', 'src/layouts/components/public-display-settings.tsx',
  'src/features/auth/components/user-dropdown.tsx', 'src/features/home/hooks/use-home-motion.ts',
  'src/router/routes.tsx', 'src/router/guards/role-guard.tsx', 'src/router/guards/protected-route.tsx',
  'src/layouts/components/navigation-drawer.tsx', 'tests/navigation-browser-check.mjs', 'tests/navigation.test.ts',
  'src/features/home/components/home-motion-toggle.tsx', 'src/stores/use-home-motion-store.ts',
];
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async p => {
  try { return [p, createHash('sha256').update(await readFile(new URL(`../${p}`, import.meta.url))).digest('hex')]; }
  catch (e) { if (e.code === 'ENOENT') return [p, null]; throw e; }
})));
const candidateStart = await manifest();
let role = null, acceptDialog = false;
const requests = [], errors = [], checks = [];
const uid = '00000000-0000-0000-0000-000000000001';
const plan = { id: uid, ownerId: uid, planDate: '2026-10-05', firstSubmittedAt: null, onTime: false,
  createdAt: '2026-10-05T00:00:00Z', updatedAt: '2026-10-05T00:00:00Z',
  reviewReasons: '', reviewWentWell: '', reviewTomorrow: '', version: 0, totalCount: 1, completedCount: 0,
  mustTotal: 1, mustCompleted: 0, tasks: [{ id: uid, title: 'Ôn tập chuyên đề', priority: 'MUST', status: 'TODO', position: 0 }] };
const chrome = spawn(process.env.NAV_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, call, js;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => { socket.onopen = r; });
  let serial = 0;
  const pending = new Map();
  call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  async function fulfill(e) {
    const u = new URL(e.request.url);
    if (!u.pathname.startsWith('/api/v1/')) {
      return u.origin === new URL(web).origin && !/\.(mp4|webm)$/.test(u.pathname)
        ? call('Fetch.continueRequest', { requestId: e.requestId })
        : call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 404 });
    }
    const path = u.pathname.slice(7), method = e.request.method;
    requests.push({ role, path, method });
    let body = {}, status = 200;
    if (method === 'OPTIONS') body = {};
    else if (path === '/users/me') { body = role ? { id: uid, username: 'navigation-fixture', fullName: 'Nguyễn Minh Anh', email: 'fixture@example.test', role, status: 'ACTIVE', avatarUrl: null } : {}; if (!role) status = 401; }
    else if (path === '/auth/refresh') { body = { accessToken: 'synthetic-navigation' }; if (!role) status = 401; }
    else if (path === '/auth/logout') { role = null; }
    else if (path === '/daily/plans') body = { ...plan, planDate: u.searchParams.get('date') };
    else if (path === '/daily/plans/dates' || path === '/groups' || path === '/groups/invitations') body = [];
    else if (path === '/documents/metadata') body = { subjects: [], categories: [], tags: [] };
    else if (path === '/posts' || path === '/documents') body = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    await call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: web }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  }
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Fetch.requestPaused') void fulfill(m.params).catch(e => { if (!e.message.includes('Invalid InterceptionId')) errors.push(e.message); });
    if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails));
    if (m.method === 'Page.javascriptDialogOpening') void call('Page.handleJavaScriptDialog', { accept: acceptDialog });
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(Error(JSON.stringify(m.error))); else p.resolve(m.result); }
  };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const wait = async e => { for (let n = 0; n < 180; n++) { if (await js(e)) return; await new Promise(r => setTimeout(r, 100)); } throw Error(`Timeout: ${e}`); };
  const viewport = (width, height = 900) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  const key = async (key, code, virtual, shift = false) => { await call('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: virtual, nativeVirtualKeyCode: virtual, modifiers: shift ? 8 : 0 }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtual }); };
  const navigate = async path => { await call('Page.navigate', { url: web + path }); await wait("!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')"); };
  const shot = async name => { await js('new Promise(r=>setTimeout(r,450))'); await writeFile(join(dir, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); };
  const fit = async name => { assert.ok(await js('document.documentElement.scrollWidth<=innerWidth'), `${name}: overflow`); checks.push(`${name}: no horizontal overflow`); };
  const openMenu = async () => { await js("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Mở menu điều hướng'&&b.getBoundingClientRect().width>0);b.focus();b.click()})()"); await wait("!!document.querySelector('[data-slot=sheet-content]')"); };
  const closeMenu = async () => { await key('Escape', 'Escape', 27); await wait("!document.querySelector('[data-slot=sheet-content]')"); };
  await call('Page.enable'); await call('Runtime.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:'light'},version:0}));` });
  for (const width of [1440, 1024, 768, 390]) {
    role = null; await viewport(width); await navigate('/about'); await fit(`public-${width}`); await shot(`public-${width}-light`);
    if (width < 1280) { await openMenu(); await shot(`public-menu-${width}-light`); await closeMenu(); }
  }
  role = null; await viewport(320, 360); await navigate('/'); await openMenu();
  if (phase === 'after') {
    assert.ok(await js("getComputedStyle(document.querySelector('[data-slot=sheet-content]')).animationName==='navigation-drawer-in'"));
    await writeFile(join(dir, 'drawer-opening.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64'));
    checks.push('expressive drawer reveal is mounted and interactive immediately');
  }
  await fit('public-menu-short'); await shot('public-menu-320x360');
  if (phase === 'after') {
    assert.equal(await js("document.querySelectorAll('[aria-label=\"Nền động\"]').length + [...document.querySelectorAll('label')].filter(e=>e.textContent.includes('Nền động')).length"), 0);
    assert.equal(await js("document.querySelectorAll('[data-slot=sheet-content] [role=switch]').length"), 1);
    await js("document.querySelector('[data-slot=sheet-content] [role=switch]').click()"); await wait("document.documentElement.classList.contains('dark')");
    const positions = await js("(()=>{const d=document.querySelector('[data-slot=sheet-content]'),b=d.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:innerHeight}})()"); assert.ok(positions.top >= 0 && positions.bottom <= positions.height);
    await js("document.querySelector('[data-slot=sheet-content] [role=switch]').click()");
    checks.push('visible motion controls absent; theme switch preserved; short drawer bounded');
    await key('Tab', 'Tab', 9, true); assert.ok(await js("!!document.activeElement.closest('[data-slot=sheet-content]')"));
    await key('Tab', 'Tab', 9); assert.ok(await js("!!document.activeElement.closest('[data-slot=sheet-content]')"));
  }
  await closeMenu();
  if (phase === 'after') { assert.equal(await js("document.activeElement.getAttribute('aria-label')"), 'Mở menu điều hướng'); checks.push('Escape focus return and keyboard focus stays in drawer'); }
  for (const r of ['STUDENT', 'LECTURER', 'ADMIN']) {
    role = r; const dashboard = r === 'STUDENT' ? '/dashboard' : `/${r.toLowerCase()}/dashboard`;
    for (const width of [1440, 1024, 390]) {
      await viewport(width); await navigate(dashboard); await wait("!!document.querySelector('.dashboard-shortcuts')"); await fit(`${r}-${width}`); await shot(`${r.toLowerCase()}-${width}-light`);
      if (width < 1024 || (phase === 'after' && width === 1024)) { await openMenu(); await shot(`${r.toLowerCase()}-menu-${width}`);
        if (phase === 'after') {
          const links = await js("[...document.querySelectorAll('[data-slot=sheet-content] a')].map(a=>a.getAttribute('href'))");
          assert.ok(links.includes('/daily') && links.includes('/daily/groups'));
          assert.equal(links.some(h=>h.startsWith('/admin/')), r === 'ADMIN');
          assert.equal(links.some(h=>h.startsWith('/lecturer/')), r === 'LECTURER');
        }
        await closeMenu();
        if (phase === 'after') assert.equal(await js("document.activeElement.getAttribute('aria-label')"), 'Mở menu điều hướng');
      }
      await js("document.documentElement.classList.add('dark')"); await shot(`${r.toLowerCase()}-${width}-dark`); await js("document.documentElement.classList.remove('dark')");
    }
    if (phase === 'after') checks.push(`${r}: role-aware drawer visibility and actual opener focus return`);
    await viewport(1440); await navigate('/about'); await shot(`${r.toLowerCase()}-public-1440`);
    await viewport(768); await fit(`${r}-public-768`); await shot(`${r.toLowerCase()}-public-768`); await openMenu(); await shot(`${r.toLowerCase()}-public-menu-768`); await closeMenu();
  }
  if (phase === 'after') {
    role = 'STUDENT'; await viewport(1440); await navigate('/daily?date=2026-10-05'); await wait("!!document.querySelector('.study-task')"); await shot('daily-shell-desktop');
    assert.equal(await js("document.querySelectorAll('.workspace-sidebar a[aria-current=page]').length"), 1);
    await js("document.querySelector('[aria-label=\"Thu gọn menu\"]').click()"); await wait("document.querySelector('.workspace-sidebar').getBoundingClientRect().width<100"); await shot('student-collapsed-desktop');
    assert.equal(await js("document.activeElement.getAttribute('aria-label')"), 'Mở rộng menu');
    for (const width of [767, 768, 1199, 1200]) { await viewport(width); await js('new Promise(r=>setTimeout(r,450))'); await fit(`breakpoint-${width}`); }
    await viewport(1024); await shot('daily-shell-tablet');
    await viewport(320, 360); await shot('daily-shell-short'); await openMenu(); await shot('student-menu-short'); await closeMenu();
    await viewport(390, 844);
    assert.ok(await js("[...document.querySelectorAll('.shell-menu-trigger__label')].some(e=>e.textContent==='Menu'&&getComputedStyle(e).display!=='none')"));
    checks.push('visible mobile Menu label retained');
    await js("[...document.querySelectorAll('button')].find(b=>b.textContent==='Nhìn lại ngày').click()");await wait("!!document.querySelector('#daily-tomorrow')");
    await js("(()=>{const e=document.querySelector('#daily-tomorrow');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Keep this draft');e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await key('Escape','Escape',27);await wait("!document.querySelector('.daily-reflection-dialog')");
    await openMenu(); await js("document.querySelector('[data-slot=sheet-content] a[href=\"/documents\"]').click()");
    await wait("!document.querySelector('[data-slot=sheet-content]')"); assert.equal(await js('location.pathname'), '/daily');
    await js("[...document.querySelectorAll('button')].find(b=>b.textContent==='Nhìn lại ngày').click()");await wait("!!document.querySelector('#daily-tomorrow')");
    assert.equal(await js("document.querySelector('#daily-tomorrow').value"), 'Keep this draft');await key('Escape','Escape',27);await wait("!document.querySelector('.daily-reflection-dialog')");
    checks.push('drawer navigation honors existing Daily draft blocker');
    await navigate('/dashboard');
    await js("document.querySelector('[aria-label=\"Mở menu tài khoản\"]').focus()"); await key('Enter', 'Enter', 13); await wait("!!document.querySelector('[role=menu]')"); await shot('account-menu-mobile'); await key('Escape', 'Escape', 27); await wait("!document.querySelector('[role=menu]')"); assert.equal(await js("document.activeElement.getAttribute('aria-label')"), 'Mở menu tài khoản');
    await key('Enter', 'Enter', 13); await wait("!!document.querySelector('[role=menu]')"); await js("[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.includes('Đăng xuất')).click()"); await wait("location.pathname==='/login'"); await shot('login-shell-mobile'); checks.push('keyboard account menu focus return; synthetic logout retains existing endpoint/login flow');
    role = 'STUDENT'; await viewport(1024, 600); await navigate('/admin/dashboard'); await wait("location.pathname==='/dashboard'"); checks.push('student staff-route denial remains in existing role guard');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await openMenu(); assert.equal(await js("getComputedStyle(document.querySelector('[data-slot=sheet-content]')).animationName"), 'none'); await shot('tablet-reduced-motion'); await closeMenu();
    role = null; await navigate('/'); assert.equal(await js("document.querySelector('.home-hero').dataset.motion"), 'false'); checks.push('OS reduced motion disables shell animation and home motion without visible toggle');
    await shot('home-reduced-motion-tablet');
    await viewport(1440); await navigate('/about'); await js("document.documentElement.classList.add('dark')"); await shot('public-desktop-dark');
    await viewport(390, 844); await shot('public-mobile-dark');
  }
  assert.deepEqual(await manifest(), candidateStart, 'Candidate changed during browser checks'); assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(JSON.stringify({ dir, phase, checks: checks.length, errors: errors.length }));
} catch (e) {
  if (call && js) {
    await writeFile(join(dir, 'failure.png'), Buffer.from((await call('Page.captureScreenshot')).data, 'base64'));
    await writeFile(join(dir, 'failure.txt'), String(e) + '\n' + await js('document.body.innerText'));
  }
  throw e;
} finally {
  await writeFile(join(dir, 'results.json'), JSON.stringify({ phase, checks, errors, requests, candidateStart, candidateEnd: await manifest(), limits: 'Local Chromium, synthetic API/auth; external assets blocked. Not backend authorization/persistence or physical-device proof.' }, null, 2));
  socket?.close(); chrome.kill('SIGTERM'); console.log(`Evidence: ${dir}`);
}
