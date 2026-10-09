// Owned Vite + Chromium. All API/external traffic intercepted; synthetic data only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const baseline = process.argv.includes('--baseline');
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = await mkdtemp(join(tmpdir(), baseline ? 'three-cluster-before-' : 'three-cluster-after-'));
// envDir:false prevents loading any app/operator env; no API proxy is configured.
const server = await createServer({ root, configFile: false, envDir: false, plugins: [react(), tailwindcss()], resolve: { alias: { '@': resolve(root, 'src') } }, server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const web = `http://127.0.0.1:${server.httpServer.address().port}`;
const chrome = spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, call, js, chooserCount = 0, held, holdList = false, holdUpload = false, failList = true, failUpload = false;
const checks = [], requests = [], errors = [], presentations = [];
const uid = '00000000-0000-0000-0000-000000000001';
const listPaths = ['/documents', '/posts/management', '/questions'];
try {
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium startup timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolveEndpoint(m[1]); } });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolveOpen => { socket.onopen = resolveOpen; });
  let serial = 0;
  const pending = new Map();
  call = (method, params = {}) => new Promise((resolveCall, reject) => { const id = ++serial; pending.set(id, { resolve: resolveCall, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const respond = (e, status, body) => call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: web }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  const fulfill = async e => {
    const u = new URL(e.request.url);
    if (!u.pathname.startsWith('/api/v1/')) {
      if (u.pathname === '/synthetic-image.svg') return call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/svg+xml' }], body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="steelblue"/></svg>').toString('base64') });
      return u.origin === web ? call('Fetch.continueRequest', { requestId: e.requestId }) : call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 404 });
    }
    const path = u.pathname.slice(7);
    requests.push({ path, method: e.request.method, query: u.search });
    if (e.request.method === 'OPTIONS') return respond(e, 200, {});
    if (path === '/users/me') return respond(e, 200, { id: uid, username: 'fixture', fullName: 'Synthetic admin', email: 'fixture@example.test', role: 'ADMIN', status: 'ACTIVE' });
    if (path === '/documents/metadata') return respond(e, 200, { categories: [], subjects: [], tags: [] });
    if (path === '/posts/management/status-counts') return respond(e, 200, { draft: 0, published: 0, expired: 0, archived: 0 });
    if (path === '/storage/upload') {
      if (holdUpload) { held = e; return; }
      return respond(e, failUpload ? 503 : 200, failUpload ? { detail: 'Synthetic upload failure' } : { id: uid, url: '/synthetic-image.svg' });
    }
    if (listPaths.includes(path)) {
      if (holdList) { held = e; return; }
      return respond(e, failList ? 503 : 200, failList ? { detail: 'Synthetic list failure' } : { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
    }
    return respond(e, 404, {});
  };
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(e => errors.push(e.message));
    else if (m.method === 'Page.fileChooserOpened') chooserCount++;
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value; };
  const wait = async expression => { for (let n = 0; n < 150; n++) { if (await js(expression)) return; await new Promise(r => setTimeout(r, 100)); } throw Error('Timed out: ' + expression); };
  const click = selector => js(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const key = async (key, code, n) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: n, text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: n }); };
  const shot = async name => writeFile(join(dir, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64'));
  const navigate = async screen => { await call('Page.navigate', { url: `${web}/tests/fixtures/ui-three-cluster.html?screen=${screen}` }); await wait("document.querySelector('main h1')?.textContent.includes('Synthetic')"); };
  const setFile = async (selector, type, size = 3) => js(`(()=>{const d=new DataTransfer();d.items.add(new File([new Uint8Array(${size})],'synthetic.${type==='text/plain'?'txt':'png'}',{type:${JSON.stringify(type)}}));const i=document.querySelector(${JSON.stringify(selector)});i.files=d.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  const uploadCount = () => requests.filter(r => r.path === '/storage/upload' && r.method === 'POST').length;
  await call('Page.enable', { enableFileChooserOpenedEvent: true }); await call('Runtime.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await call('Page.setInterceptFileChooserDialog', { enabled: true });
  for (const [width, height, dark] of [[1440, 900, false], [320, 568, true], [768, 900, false]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
    await navigate('upload'); await wait("!!document.querySelector('#editor [title=\"Chèn Hình Ảnh\"]')");
    if (dark) await js("document.documentElement.classList.add('dark')");
    await shot(`pickers-${width}`);
    if (baseline) {
      assert.equal(await js("!!document.querySelector('#thumbnail button')"), false);
      await click('#editor [title="Chèn Hình Ảnh"]'); await wait("!!document.querySelector('[role=dialog] input[type=file]')");
      assert.equal(await js("[...document.querySelectorAll('[role=dialog] button')].some(e=>e.textContent.includes('Nhấn để chọn ảnh'))"), false);
      await shot(`image-dialog-${width}`);
      checks.push(`${width}: baseline both pick targets are click-only divs, no native keyboard owner`);
    } else {
      for (const picker of ['thumbnail', 'editor']) {
        const button = picker === 'thumbnail' ? '#thumbnail button' : '[role=dialog] button[aria-label="Chọn ảnh chèn vào bài viết"]';
        const input = picker === 'thumbnail' ? '#thumbnail input[type=file]' : '[role=dialog] input[type=file]';
        if (picker === 'editor') { await click('#editor [title="Chèn Hình Ảnh"]'); await wait("!!document.querySelector('[role=dialog] input[type=file]')"); }
        for (const k of [['Enter', 'Enter', 13], [' ', 'Space', 32]]) {
          const before = chooserCount;
          await js(`document.querySelector(${JSON.stringify(button)}).focus()`); await key(...k);
          await wait(`document.querySelector(${JSON.stringify(button)})===document.activeElement`);
          for (let n = 0; n < 30 && chooserCount === before; n++) await new Promise(r => setTimeout(r, 50));
          assert.equal(chooserCount, before + 1, `${picker} ${k[1]} opens file chooser`);
        }
        await shot(`${picker}-keyboard-${width}`);
        const initial = uploadCount();
        await setFile(input, 'text/plain'); await wait("document.body.textContent.includes('Định dạng không hợp lệ')");
        assert.equal(uploadCount(), initial); assert.equal(await js(`document.querySelector(${JSON.stringify(input)}).value`), '');
        await setFile(input, 'image/png', 5 * 1024 * 1024 + 1); await wait("document.body.textContent.includes('Tệp quá lớn')");
        assert.equal(uploadCount(), initial); assert.equal(await js(`document.querySelector(${JSON.stringify(input)}).value`), '');
        failUpload = true; await setFile(input, 'image/png'); await wait("document.body.textContent.includes('Tải lên thất bại')");
        await wait(`!document.querySelector(${JSON.stringify(button)}).disabled`);
        assert.equal(uploadCount(), initial + 1);
        if (picker === 'editor') assert.equal(await js("!!document.querySelector('[role=dialog]')"), true);
        const retryChooser = chooserCount;
        await js(`document.querySelector(${JSON.stringify(button)}).focus()`); await key('Enter', 'Enter', 13);
        for (let n = 0; n < 30 && chooserCount === retryChooser; n++) await new Promise(r => setTimeout(r, 50));
        assert.equal(chooserCount, retryChooser + 1, 'failed picker remains keyboard-retryable');
        failUpload = false; holdUpload = true; held = undefined;
        await setFile(input, 'image/png'); await wait(`document.querySelector(${JSON.stringify(button)}).disabled`);
        assert.equal(picker === 'thumbnail' ? await js("document.querySelector('#image-id').textContent") : await js("document.querySelector('#editor-html').textContent.includes('<img')"), picker === 'thumbnail' ? '' : false);
        await click(button); await setFile(input, 'image/png');
        assert.equal(uploadCount(), initial + 2, 'pending upload refuses another request');
        await shot(`${picker}-pending-${width}`);
        assert.ok(held); await respond(held, 200, { id: uid, url: '/synthetic-image.svg' }); holdUpload = false;
        if (picker === 'thumbnail') {
          await wait(`document.querySelector('#image-id').textContent==='${uid}'`);
          await js("document.querySelector('#thumbnail button').focus()");
          await wait("getComputedStyle(document.querySelector('#thumbnail button').parentElement).opacity==='1'");
          assert.equal(await js("document.querySelector('#thumbnail [aria-label=\"Xóa ảnh đại diện bài viết\"]').getBoundingClientRect().height"), 44);
          await shot(`thumbnail-complete-${width}`);
          await click('#thumbnail [aria-label="Xóa ảnh đại diện bài viết"]'); await wait("document.querySelector('#image-id').textContent===''");
        } else {
          await wait("!document.querySelector('[role=dialog]')"); await wait("document.querySelector('#editor-html').textContent.includes('/synthetic-image.svg')");
          assert.ok(await js("document.querySelector('#editor-html').textContent.includes('Synthetic editor draft')"));
          assert.equal(await js("document.querySelector('#image-id').textContent"), '');
          await js("document.querySelector('#editor [title=\"Chèn Hình Ảnh\"]').focus()");
          await key('Enter', 'Enter', 13); await wait("!!document.querySelector('[role=dialog]')");
          await key('Tab', 'Tab', 9);
          assert.equal(await js("!!document.activeElement.closest('[role=dialog]')"), true);
          await key('Escape', 'Escape', 27); await wait("!document.querySelector('[role=dialog]')");
          assert.equal(await js("document.activeElement?.title"), 'Chèn Hình Ảnh');
        }
        checks.push(`${width} ${picker}: native Enter/Space; MIME/size prevent request; same-file failed retry; pending gate; ${picker === 'thumbnail' ? 'asset ID + preview/remove' : 'URL insert + draft retained + close'}`);
      }
      assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'), true);
    }
    if (!baseline) {
      await navigate('owners');
      if (dark) await js("document.documentElement.classList.add('dark')");
      await wait("!!document.querySelector('#reflection')");
      await js("window.reflectionNode=document.querySelector('#reflection');reflectionNode.focus()");
      await call('Input.insertText', { text: '  Bản nháp ngày học — chưa nộp  ' });
      await wait("document.querySelector('#reflection-value').textContent.includes('Bản nháp')");
      assert.equal(await js("document.activeElement===reflectionNode && document.querySelector('#reflection')===reflectionNode"), true);
      assert.equal(await js("reflectionNode.maxLength===4000 && reflectionNode.labels[0].textContent==='Nhìn lại ngày học'"), true);
      for (const row of ['document', 'post']) {
        const buttons = await js(`Array.from(document.querySelectorAll('#${row}-row button')).map(b=>({height:b.getBoundingClientRect().height,text:b.textContent.trim()}))`);
        assert.deepEqual(buttons.map(b => b.height), [44, 44]);
        await js(`document.querySelector('#${row}-row button').focus()`);
        await key('Enter', 'Enter', 13);
        assert.equal(await js("document.querySelector('#owner-event').textContent"), `edit:${row === 'document' ? 'doc' : 'post'}`);
        await js(`document.querySelectorAll('#${row}-row button')[1].focus()`);
        await key(' ', 'Space', 32);
        assert.equal(await js("document.querySelector('#owner-event').textContent"), `delete:${row === 'document' ? 'doc' : 'post'}`);
      }
      await click('#inline-retry');
      assert.equal(await js("document.querySelector('#inline-retry').disabled"), true);
      assert.equal(await js("document.querySelector('#owner-event').textContent"), 'retry');
      assert.equal(await js("Array.from(document.querySelectorAll('p')).some(p=>p.textContent.includes('11')&&p.textContent.includes('20')&&p.textContent.includes('25'))"), true);
      await js("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='3').click()");
      assert.equal(await js("Array.from(document.querySelectorAll('p')).some(p=>p.textContent.includes('21')&&p.textContent.includes('25'))"), true);
      await click('#confirm-trigger');
      await wait("!!document.querySelector('[role=alertdialog]')");
      const solid = await js("(()=>{const b=document.querySelector('[data-slot=alert-dialog-action]');return {variant:b.dataset.variant,bg:getComputedStyle(b).backgroundColor,fg:getComputedStyle(b).color}})()");
      assert.equal(solid.variant, 'destructive-solid');
      assert.notEqual(solid.bg, 'rgba(0, 0, 0, 0)');
      assert.notEqual(solid.bg, solid.fg);
      await key('Escape', 'Escape', 27);
      await wait("!document.querySelector('[role=alertdialog]')");
      assert.equal(await js("document.activeElement.id"), 'confirm-trigger');
      assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'), true);
      await shot(`shared-owners-${width}`);
      checks.push(`${width}: associated reflection/maxLength/draft/node/focus; both management keyboard callbacks and44px targets; inline retry disabled; last-page range; shared solid confirmation Escape/focus`);
    }
    for (const [screen, path, message] of [['documents', '/documents', 'Không thể tải danh sách tài liệu.'], ['posts', '/posts/management', 'Không thể tải danh sách bài viết.'], ['questions', '/questions', 'Không thể tải ngân hàng câu hỏi.']]) {
      holdList = true; held = undefined; failList = true; await navigate(screen);
      if (dark) await js("document.documentElement.classList.add('dark')");
      for (let n = 0; n < 100 && !held; n++) await new Promise(r => setTimeout(r, 50));
      assert.ok(held); assert.equal(await js("!!document.querySelector('[role=alert]')"), false, 'loading precedes error');
      await respond(held, 503, { detail: 'Synthetic list failure' }); holdList = false;
      await wait(`document.querySelector('[role=alert]')?.textContent.includes(${JSON.stringify(message)})`);
      const presentation = await js("(()=>{const a=document.querySelector('[role=alert]'),b=a.querySelector('button');return {panel:a.className,message:a.querySelector('p').className,buttonHeight:b.getBoundingClientRect().height}})()");
      presentations.push({ screen, width, ...presentation });
      assert.equal(presentation.buttonHeight, 44);
      assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'), true);
      await shot(`${screen}-error-${width}`);
      const start = requests.filter(r => r.path === path).length;
      const route = await js("document.querySelector('#route').textContent");
      holdList = true; held = undefined; await click('[role=alert] button');
      await wait("!document.querySelector('[role=alert]') || document.querySelector('[role=alert] button')?.disabled");
      if (await js("!!document.querySelector('[role=alert] button')")) await click('[role=alert] button');
      assert.equal(requests.filter(r => r.path === path).length, start + 1);
      assert.equal(await js("document.querySelector('#route').textContent"), route);
      assert.equal(await js("!document.querySelector('[role=alert]') || document.querySelector('[role=alert] button').disabled"), true);
      assert.ok(held); await respond(held, 200, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }); holdList = false;
      await wait("!document.querySelector('[role=alert]')");
      assert.equal(await js("document.querySelector('#route').textContent"), route);
      await click('#background-refetch');
      await wait(`document.querySelector('[role=alert]')?.textContent.includes(${JSON.stringify(message)})`);
      holdList = true; held = undefined;
      const cachedStart = requests.filter(r => r.path === path).length;
      await click('[role=alert] button'); await wait("document.querySelector('[role=alert] button')?.disabled");
      await click('[role=alert] button');
      assert.equal(requests.filter(r => r.path === path).length, cachedStart + 1);
      assert.ok(held); await respond(held, 200, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }); holdList = false;
      await wait("!document.querySelector('[role=alert]')");
      checks.push(`${width} ${screen}: loading/error precedence, compact 44px retry, pending cached-error retry disabled, single feature callback, success recovers without changing URL filters`);
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(join(dir, 'results.json'), JSON.stringify({ baseline, checks, presentations, requests, errors, limits: 'Synthetic Chromium only; all external/API requests intercepted; no real storage, backend, account, physical-device or whole-app proof.' }, null, 2));
  console.log(JSON.stringify({ dir, checks: checks.length, errors: errors.length }));
} catch (e) {
  await writeFile(join(dir, 'failure.json'), JSON.stringify({ message: e.stack, checks, requests, errors }, null, 2));
  if (call) await writeFile(join(dir, 'failure.png'), Buffer.from((await call('Page.captureScreenshot')).data, 'base64')).catch(() => {});
  console.error(dir, e); process.exitCode = 1;
} finally {
  socket?.close(); chrome.kill('SIGTERM');
  await new Promise(resolveExit => { if (chrome.exitCode !== null) resolveExit(); else chrome.once('exit', resolveExit); });
  await server.close(); await rm(join(dir, 'profile'), { recursive: true, force: true });
}
