// Actual routes with intercepted synthetic data; never uses live auth/API/OTP.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.MOBILE_HEADER_WEB_URL ?? 'http://127.0.0.1:3118';
const baseline = process.env.MOBILE_HEADER_BASELINE === '1';
const feedbackOnly = true;
const dir = await mkdtemp(join(tmpdir(), 'ui-mobile-header-render-'));
const paths = ['src/components/ui/page-layout.css', 'src/components/ui/page-header.tsx',
  'src/features/daily/ui/study-notebook.css', 'src/features/post/components/news-detail-feature.tsx',
  'src/pages/document-detail-page.tsx', 'src/layouts/welcome-layout.css',
  'src/layouts/navigation.css', 'src/features/home/components/home-hero-section.css'];
const hashes = async () => Object.fromEntries(await Promise.all(paths.map(async p =>
  [p, await readFile(new URL('../' + p, import.meta.url)).then(b => createHash('sha256').update(b).digest('hex')).catch(e => { if (e.code === 'ENOENT') return null; throw e; })])));
const candidateStart = await hashes(), checks = [], screenshots = [], requests = [], errors = [];
let mode = 'empty', anonymous = false, socket, call, js;
const page = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 };
const post = { id: 'synthetic-post', slug: 'synthetic-lightbox', title: 'Synthetic · Ảnh minh họa học tập',
  summary: 'Synthetic local fixture — no production content.', type: 'NEWS', status: 'PUBLISHED',
  thumbnailUrl: '/synthetic-adoption.svg', author: null, pinned: false, expiredAt: null, viewCount: 0,
  createdAt: '2026-10-09T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z', publishedAt: '2026-10-09T00:00:00Z',
  content: Array.from({ length: 15 }, (_, i) => `<p>Synthetic · Nội dung minh họa ${i + 1} để kiểm tra cuộn trang.</p>`).join('') };
const chrome = spawn(process.env.MOBILE_HEADER_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
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
    if (path.endsWith('/users/me') && feedbackOnly && !anonymous) return reply(e, 200, {
      id: 'synthetic-ui-only', username: 'synthetic-ui', fullName: 'Synthetic · Người kiểm tra',
      email: 'synthetic@example.test', role: 'ADMIN', status: 'ACTIVE', avatarUrl: null,
    });
    if (path.endsWith('/users/me') || path.endsWith('/auth/refresh')) return reply(e, 401, { status: 401 });
    if (path.endsWith('/groups') || path.endsWith('/groups/invitations')) return reply(e, 200, []);
    if (path.endsWith('/documents/synthetic-reader')) return reply(e, 200, { id:'synthetic-document',slug:'synthetic-reader',title:'Synthetic · Phương pháp giải các bài toán Olympic sinh viên và hướng dẫn ôn tập',category:{id:'c',name:'Tài liệu ôn tập'},subject:{id:'s',name:'Giải tích'},tags:[],owner:{id:'synthetic-other',fullName:'Synthetic · Giảng viên',username:'synthetic',role:'LECTURER',avatarUrl:null},createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T00:00:00Z',viewCount:0,downloadUrl:null,description:'Synthetic · Tài liệu minh họa.',fileSize:1024,downloadCount:0 });
    if (path.endsWith('/documents/metadata')) return reply(e, 200, { subjects: [{id:'synthetic-subject',name:'Synthetic · Giải tích',code:'SYN'}], categories: [], tags: [] });
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
  const key = async (k, shift = false) => {
    const n = { Enter: 13, Escape: 27, Tab: 9, ' ': 32 }[k] ?? 0;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, modifiers: shift ? 1 : 0, windowsVirtualKeyCode: n, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, modifiers: shift ? 1 : 0, windowsVirtualKeyCode: n });
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

  const routes = [
    ['subjects','/subjects','.page-heading'],
    ['honors','/honors','.page-heading'],
    ['news','/news','.page-heading'],
    ['management','/admin/documents','.page-heading'],
    ['exam','/admin/exams/new','.page-heading'],
    ['daily-groups','/daily/groups','.page-heading'],
    ['news-reader','/news/synthetic-lightbox','main header'],
    ['document-reader','/documents/synthetic-reader','main h1'],
    ['auth','/login','.auth-heading'],
    ['home','/','.home-hero'],
  ].filter(([family]) => process.env.MOBILE_HEADER_READERS_ONLY !== '1' || family.endsWith('reader'));
  const viewports = process.env.MOBILE_HEADER_SHORT_ONLY === '1' ? [[320,360,'dark']] : [[1440,900,'light'],[820,900,'dark'],[320,640,'light'],[320,360,'dark']];
  for (const [width, height, theme] of viewports) {
    await nav('/about');
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width===320});
    await js(`localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:'${theme}'},version:0}))`);
    for (const [family,path,selector] of routes) {
      anonymous = family === 'auth';
      await nav(path); await wait(`!!document.querySelector(${JSON.stringify(selector)})`);
      await delay(700);
      const geometry = await js(`(()=>{
        const h=document.querySelector('main h1,.auth-heading,#home-hero-title');
        const header=h?.closest('.page-heading,main header,.home-hero__content')??h;
        const desc=header?.querySelector('.page-heading__description,.auth-description');
        const shell=document.querySelector('.page-shell');
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
        const actions=[...(header?.querySelectorAll('.page-heading__actions button,.page-heading__actions a')??[])].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent.trim(),...rect(e)}));
        return {family:${JSON.stringify(family)},path:location.pathname,width:innerWidth,height:innerHeight,theme:document.documentElement.className,
          title:h?{text:h.textContent.trim(),...rect(h),size:getComputedStyle(h).fontSize}:null,
          header:header?rect(header):null,description:desc?{text:desc.textContent.trim(),height:desc.getBoundingClientRect().height,lineHeight:getComputedStyle(desc).lineHeight}:null,
          shellGap:shell?getComputedStyle(shell).gap:null,actions,
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};
      })()`);
      assert.equal(geometry.overflow,false,'overflow '+family);
      for(const action of geometry.actions) assert.ok(action.height>=44,'header target '+family+' '+action.text);
      assert.ok(geometry.title,'heading '+family);
      if(!baseline&&width===320&&family!=='home') assert.equal(geometry.title.size,'24px','mobile title '+family);
      if(family==='exam') {
        await js("(()=>{const e=document.querySelector('#exam-title');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Synthetic · Bản nháp được giữ');e.dispatchEvent(new Event('input',{bubbles:true}));void(window.draftElement=e)})()");
        await call('Emulation.setDeviceMetricsOverride',{width:width===320?360:width-20,height,deviceScaleFactor:1,mobile:width===320});
        await delay(100);
        assert.ok(await js("document.querySelector('#exam-title')===window.draftElement&&window.draftElement.value==='Synthetic · Bản nháp được giữ'&&document.activeElement===window.draftElement"));
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width===320});
        checks.push({width,theme,examResizePreservesDraftFocus:true});
      }
      if(family==='honors') {
        await js("document.querySelector('.page-heading__actions a').focus()");
        assert.ok(await js("document.activeElement.matches('.page-heading__actions a')"));
        await key('Enter'); await wait("location.pathname==='/rankings'");
        checks.push({width,theme,headerKeyboardLinkActivation:true});
        await nav(path); await wait("!!document.querySelector('.page-heading')");
      }
      await shot(`${baseline?'before':'after'}-${width}x${height}-${theme}-${family}`);
      checks.push(geometry);
    }
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
