// Synthetic local UI checks. API/auth fixtures are not live data or backend authorization proof.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.UI_WEB_URL ?? 'http://127.0.0.1:3107';
const dir = await mkdtemp(join(tmpdir(), 'ui-consolidation-'));
const repository = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const changed = execFileSync('git', ['diff', '--name-only'], { cwd: repository, encoding: 'utf8' }).trim().split('\n');
const added = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: repository, encoding: 'utf8' }).trim().split('\n');
const paths = [...new Set([...changed, ...added])].filter(p => p.startsWith('apps/web/') && /\.(tsx?|css|mjs|html)$/.test(p));
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async p => [p, createHash('sha256').update(await readFile(new URL('../../../' + p, import.meta.url))).digest('hex')])));
const candidateStart = await manifest();
const checks = [], errors = [], requests = [];
let metadataFailure = false, role = 'ADMIN', holdDelete = false, heldDelete, deleted = false;
let holdUpload = false, heldUpload;
const uid = '00000000-0000-0000-0000-000000000001';
const meta = { categories: [{ id: uid, name: 'Synthetic category', code: 'FIXTURE', description: '' }], subjects: [{ id: uid, name: 'Synthetic subject', code: 'FIXTURE', description: '' }], tags: [{ id: uid, name: 'Synthetic tag', description: '' }] };
const honor = { id: uid, title: 'Synthetic honor', subject: 'Synthetic subject', year: 2026, scope: 'SCHOOL', status: 'DRAFT', description: '', participants: [], photos: [], version: 0, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' };
const chrome = spawn(process.env.UI_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, call, js;
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
  const fulfill = async e => {
    const url = new URL(e.request.url), method = e.request.method;
    if (!url.pathname.startsWith('/api/v1/')) return url.origin === new URL(web).origin && !/\.(mp4|webm)$/.test(url.pathname)
      ? call('Fetch.continueRequest', { requestId: e.requestId }) : call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 404 });
    const path = url.pathname.slice(7);
    requests.push({ path, method, query: url.search, body: e.request.postData });
    let body = {}, status = 200;
    if (method === 'OPTIONS') body = {};
    else if (path === '/users/me') { if (!role) status = 401; else body = { id: uid, username: 'fixture', fullName: 'Synthetic fixture', email: 'fixture@example.test', role, status: 'ACTIVE', avatarUrl: null }; }
    else if (path === '/auth/refresh') { if (!role) status = 401; else body = { accessToken: 'synthetic-ui-only' }; }
    else if (path === '/documents/metadata') { status = metadataFailure ? 503 : 200; body = metadataFailure ? { detail: 'Synthetic metadata failure' } : meta; }
    else if (path === '/storage/upload' && method === 'POST') {
      if (holdUpload) { heldUpload = e; return; }
      body = { id: uid, url: '/synthetic-fixture.pdf' };
    }
    else if (path === '/documents' || path === '/posts') body = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    else if (path === '/admin/recognition/honors/' + uid && method === 'DELETE') {
      if (holdDelete) { heldDelete = e; return; }
      deleted = true; status = 204;
    }
    else if (path === '/admin/recognition/honors' || path === '/recognition/honors') body = { content: deleted ? [] : [honor], totalElements: 36, totalPages: 3, number: Number(url.searchParams.get('page') ?? 0), size: 12 };
    else if (path === '/recognition/rankings') body = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 };
    return call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: web }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' }],
      body: Buffer.from(JSON.stringify(body)).toString('base64') });
  };
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(error => errors.push(error.message));
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
  const wait = async expression => { for (let n = 0; n < 150; n++) { if (await js(expression)) return; await new Promise(r => setTimeout(r,100)); } throw Error('Timed out: ' + expression); };
  const click = async (selector, text) => js(`(()=>{const es=[...document.querySelectorAll(${JSON.stringify(selector)})],e=${text ? `es.find(e=>e.textContent.trim()===${JSON.stringify(text)})` : 'es[0]'};if(!e)throw Error('Missing click target');e.click()})()`);
  const key = async (key, code, number) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: number }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: number }); };
  const navigate = async path => {
    const previous = await js('window.consolidationDocumentId');
    await call('Page.navigate', { url: web + path });
    await wait(`window.consolidationDocumentId!==${JSON.stringify(previous)}&&document.readyState==='complete'&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);
  };
  const shot = async name => { await js('new Promise(r=>setTimeout(r,150))'); await writeFile(join(dir, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); };
  const viewport = (width, height) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const fillDocument = async () => {
    await js(`(()=>{const input=document.querySelector('#document input[name=title]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Synthetic document');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);
    for (const label of ['Phân loại', 'Môn học', 'Thẻ phân loại']) {
      await js(`(()=>{const label=[...document.querySelectorAll('#document label')].find(e=>e.textContent.includes(${JSON.stringify(label)}));document.getElementById(label.htmlFor).click()})()`);
      await wait("!!document.querySelector('[role=option]')");
      await click('[role=option]');
      await wait("!document.querySelector('[role=listbox]')");
    }
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `window.consolidationDocumentId=crypto.randomUUID();localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:'light'},version:0}));` });
  for (const [width, height, dark] of [[1440,900,false],[390,844,true]]) {
    await viewport(width,height); await navigate('/tests/fixtures/ui-consolidation.html'); await wait("!!document.querySelector('#pending-button')");
    await js(`document.documentElement.classList.toggle('dark',${dark})`);
    assert.equal(await js("document.querySelector('#pending-button').disabled"), true);
    assert.equal(await js("document.querySelector('#pending-button').getAttribute('aria-busy')"), 'true');
    await click('#pending-button'); assert.equal(await js("document.querySelector('#clicks').textContent"), '0');
    await click('#toggle-loading'); await wait("!document.querySelector('#pending-button').disabled"); await click('#pending-button'); await wait("document.querySelector('#clicks').textContent==='1'");
    await click('#toggle-disabled'); await wait("document.querySelector('#pending-button').disabled"); await click('#pending-button'); assert.equal(await js("document.querySelector('#clicks').textContent"), '1');
    checks.push(`${width}: loading overrides disabled=false, explicit disabled blocks clicks, action label retained`);
    assert.equal(await js("[...document.querySelectorAll('#paging button')].every(b=>b.type==='button')"), true);
    await click('#compact-pager button','Sau'); await wait("document.querySelector('#page').textContent==='2'");
    await click('#full-pager [aria-label="Trang sau"]'); await wait("document.querySelector('#page').textContent==='3'");
    assert.equal(await js("document.querySelector('#submits').textContent"), '0');
    checks.push(`${width}: both pager variants update page without parent form submission`);
    const sizes = await js("Object.fromEntries(['standard-input','standard-select','compact-select','native','native-sm'].map(id=>[id,document.getElementById(id).getBoundingClientRect().height]))");
    assert.equal(sizes['standard-input'],44); assert.equal(sizes['standard-select'],44); assert.equal(sizes.native,44); assert.equal(sizes['compact-select'],32); assert.equal(sizes['native-sm'],36);
    assert.equal(await js("document.querySelector('#floating').closest('.lbi-box').getBoundingClientRect().height"),52);
    await js("document.querySelector('#native').value='b';document.querySelector('#native').dispatchEvent(new Event('change',{bubbles:true}))"); await wait("document.querySelector('#native-value').textContent==='b'");
    await js("document.querySelector('#standard-select').focus()"); await key('Enter','Enter',13);
    await wait("document.activeElement?.getAttribute('role')==='option'");
    await key('ArrowDown','ArrowDown',40); await wait("document.activeElement?.textContent==='Beta'");
    await key('Enter','Enter',13); await wait("document.querySelector('#select-value').textContent==='b'");
    await js("document.querySelector('[role=combobox][type=text]').focus()");
    await wait("document.querySelector('[role=combobox][type=text]').getAttribute('aria-expanded')==='true'");
    await key('ArrowDown','ArrowDown',40); await key('Enter','Enter',13); await wait("document.querySelector('#combo-value').textContent==='a'");
    await wait("document.querySelector('[role=combobox][type=text]').getAttribute('aria-expanded')==='false'");
    assert.ok(Number.parseFloat(await js("getComputedStyle(document.querySelector('[role=combobox][type=text]')).borderTopLeftRadius"))>100);
    const overflow = await js("[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>innerWidth+1||b.left < -1)}).map(e=>({tag:e.tagName,id:e.id,class:e.className,right:e.getBoundingClientRect().right,text:e.textContent.slice(0,90)}))");
    await writeFile(join(dir,`overflow-${width}.json`),JSON.stringify(overflow,null,2));
    assert.equal(await js("document.documentElement.scrollWidth<=innerWidth"), true);
    checks.push(`${width}: standard/compact sizes, 52px notch, native change, Radix/Combobox keyboard selection, rounded visible input, no horizontal overflow`);
    assert.equal(await js("document.querySelector('#figures').textContent.includes('Ready must be hidden')"),false);
    assert.equal(await js("document.querySelectorAll('#figures [role=alert]').length"),1);
    await click('#figures button'); await wait("document.querySelector('#retried').textContent==='failed'");
    assert.equal(await js("document.querySelector('#student-view').textContent.includes('Đáp án đúng')||document.querySelector('#student-view').textContent.includes('PRIVATE')"),false);
    checks.push(`${width}: one error notice, retry targets failed asset, ready hidden, student answer/solution hidden`);
    await shot(`controls-${width}-${dark?'dark':'light'}`);
    await js("document.querySelector('#feature-selects').scrollIntoView();document.querySelector('#fixture-policy').focus()");
    assert.equal(await js("document.querySelector('#fixture-policy').getBoundingClientRect().height"),44);
    assert.equal(await js("getComputedStyle(document.querySelector('#fixture-policy')).outlineStyle"),'none');
    await js("document.querySelector('#fixture-policy').value='HOST_ONLY';document.querySelector('#fixture-policy').dispatchEvent(new Event('change',{bubbles:true}))"); await wait("document.querySelector('#room-policy').textContent==='HOST_ONLY'");
    await js("(()=>{const s=document.querySelector('.scientific-field select');s.value='full_width';s.dispatchEvent(new Event('change',{bubbles:true}))})()");
    await wait("document.querySelector('#figure-layout').textContent.includes('full_width')");
    assert.equal(await js("document.querySelector('.scientific-field select').getBoundingClientRect().height"),44);
    assert.equal(await js("document.documentElement.scrollWidth<=innerWidth"), true);
    await shot(`feature-selects-${width}-${dark?'dark':'light'}`);
    await js("document.querySelector('.scientific-field select').scrollIntoView({block:'center'});document.querySelector('.scientific-field select').focus()");
    await shot(`scientific-select-${width}-${dark?'dark':'light'}`);
    checks.push(`${width}: room policy and scientific figure layout preserve native events, shared 44px sizing and bounded width without competing room outline`);
    await js("document.querySelector('#document').scrollIntoView();document.querySelector('#document form').requestSubmit()");
    await wait("document.querySelectorAll('#document [aria-invalid=true]').length>=3");
    const fields = await js("[...document.querySelectorAll('#document [aria-invalid=true]')].map(e=>({label:[...document.querySelectorAll('label')].some(l=>l.htmlFor===e.id),messages:(e.getAttribute('aria-describedby')||'').split(' ').filter(id=>document.getElementById(id)?.textContent.trim()).length}))");
    assert.ok(fields.every(f=>f.label&&f.messages>0),JSON.stringify(fields)); assert.equal(await js("document.querySelector('#saved').textContent"),'0');
    await shot(`document-errors-${width}-${dark?'dark':'light'}`);
    checks.push(`${width}: document title/category/subject invalid fields labelled and associated with messages, invalid submit prevented`);
    await fillDocument();
    await js("document.querySelector('#document form').requestSubmit()"); await wait("document.querySelector('#saved').textContent==='1'");
    assert.deepEqual(JSON.parse(await js("document.querySelector('#payload').textContent")), { title: 'Synthetic document', description: '', categoryId: uid, subjectId: uid, tagIds: [uid] });
    await js("(()=>{const i=document.querySelector('#document textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(i,'x'.repeat(5001));i.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await js("document.querySelector('#document form').requestSubmit()");
    await wait("document.querySelector('#document textarea').getAttribute('aria-invalid')==='true'");
    assert.ok(await js("document.querySelector('#document textarea').getAttribute('aria-describedby').split(' ').some(id=>document.getElementById(id)?.textContent.trim())"));
    assert.equal(await js("document.querySelector('#saved').textContent"), '1');
    await js("(()=>{const i=document.querySelector('#document textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}))})()");
    checks.push(`${width}: overlong description produces an associated validation error and prevents submission`);
    await click('#save-pending'); await wait("!!document.querySelector('#document [type=submit][aria-busy=true]')");
    assert.equal(await js("[...document.querySelectorAll('#document form button')].filter(e=>e.type==='submit'||e.textContent==='Hủy bỏ').every(e=>e.disabled)"), true);
    await click('#save-pending'); await click('#document form button','Hủy bỏ'); await wait("document.querySelector('#cancelled').textContent==='1'");
    checks.push(`${width}: valid edit payload and tag array preserved; pending save disables submit/cancel; cancel remains available afterward`);
    if (width === 390) {
      await click('#create-mode'); await wait("!!document.querySelector('#document input[type=file]')");
      await fillDocument();
      assert.equal(await js("document.querySelector('#document button[type=submit]').disabled"), true);
      await js("document.querySelector('#document form').requestSubmit()");
      await wait("document.querySelector('#document').textContent.includes('Vui lòng tải lên tệp tài liệu')");
      assert.equal(await js("document.querySelector('#saved').textContent"), '1');
      holdUpload=true;
      await js("(()=>{const d=new DataTransfer();d.items.add(new File(['%PDF synthetic fixture'],'synthetic.pdf',{type:'application/pdf'}));const i=document.querySelector('#document input[type=file]');i.files=d.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()");
      await wait("document.querySelector('#document .upl-name')?.textContent==='synthetic.pdf'");
      await wait("[...document.querySelectorAll('#document form button')].find(e=>e.textContent==='Hủy bỏ')?.disabled");
      assert.equal(await js("document.querySelector('#document button[type=submit]').disabled"), true);
      assert.ok(heldUpload);
      await call('Fetch.fulfillRequest',{requestId:heldUpload.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:web},{name:'Access-Control-Allow-Credentials',value:'true'}],body:Buffer.from(JSON.stringify({id:uid,url:'/synthetic-fixture.pdf'})).toString('base64')});
      await wait("!document.querySelector('#document button[type=submit]').disabled");
      await js("document.querySelector('#document form').requestSubmit()"); await wait("document.querySelector('#saved').textContent==='2'");
      assert.equal(JSON.parse(await js("document.querySelector('#payload').textContent")).fileId, uid);
      await click('#document [aria-label="Xóa tệp"]'); await wait("document.querySelector('#document button[type=submit]').disabled");
      checks.push('390: create requires completed upload, pending upload blocks submit/cancel, uploaded file ID preserved, clear restores upload gate');
    }
  }
  role='ADMIN'; metadataFailure=true; await viewport(390,844); await navigate('/admin/categories');
  await wait("!![...document.querySelectorAll('[role=alert]')].find(e=>e.textContent.includes('Thử lại'))");
  assert.equal(await js("document.body.textContent.includes('Không có dữ liệu')"),false); await shot('categories-failure-mobile');
  metadataFailure=false; await click('[role=alert] button'); await wait("document.body.textContent.includes('Synthetic category')");
  checks.push('category initial failure distinct from empty; explicit retry recovers active route');
  await navigate('/admin/recognition?page=2'); await wait("document.body.textContent.includes('Synthetic honor')");
  const requestStart=requests.length; await click('.recognition-pager button','Sau'); await wait("location.search.includes('page=3')");
  await wait("document.querySelector('.recognition-pager')?.textContent.includes('3 / 3')");
  assert.ok(requests.slice(requestStart).some(r=>r.path==='/admin/recognition/honors'&&new URLSearchParams(r.query).get('page')==='2'));
  checks.push('recognition shared pager preserves URL one-based/API zero-based conversion');
  await click('.recognition-record button','Xóa'); await wait("!!document.querySelector('[data-slot=dialog-content]')");
  assert.equal(await js("[...document.querySelectorAll('[data-slot=dialog-content] button')].find(e=>e.textContent.trim()==='Xóa vinh danh').dataset.variant"),'destructive');
  holdDelete=true; await click('[data-slot=dialog-content] button','Xóa vinh danh'); await wait('!!document.querySelector("[data-slot=dialog-content] [aria-busy=true]")');
  await key('Escape','Escape',27); assert.equal(await js("!!document.querySelector('[data-slot=dialog-content]')"),true);
  await shot('honor-delete-pending'); assert.ok(heldDelete);
  deleted=true; await call('Fetch.fulfillRequest',{requestId:heldDelete.requestId,responseCode:204,responseHeaders:[{name:'Access-Control-Allow-Origin',value:web},{name:'Access-Control-Allow-Credentials',value:'true'}]});
  await wait("!document.querySelector('[data-slot=dialog-content]')");
  checks.push('honor delete destructive, disabled while pending, Escape preserves pending dialog, success closes');
  await navigate('/admin/documents');
  await wait("document.body.textContent.includes('Chưa có tài liệu nào')");
  assert.ok(await js("[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('Chưa có tài liệu nào'))"));
  await js("document.documentElement.classList.add('dark')");
  await shot('management-documents-empty-mobile-dark');
  const searchStart = requests.length, priorSearch = await js('location.search');
  await js("(()=>{const i=document.querySelector('[aria-label=\"Tìm kiếm tài liệu\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'synthetic-search');i.dispatchEvent(new Event('input',{bubbles:true}))})()");
  for (let attempt=0;attempt<100&&!requests.slice(searchStart).some(r=>r.path==='/documents'&&new URLSearchParams(r.query).get('keyword')==='synthetic-search');attempt++) await new Promise(resolve=>setTimeout(resolve,100));
  assert.ok(requests.slice(searchStart).some(r=>r.path==='/documents'&&new URLSearchParams(r.query).get('keyword')==='synthetic-search'));
  assert.equal(await js('location.search'), priorSearch);
  checks.push('mounted document management reuses labelled search and status empty card; existing local debounced API search preserved without adding URL state');
  role='STUDENT'; metadataFailure=false; await navigate('/admin/categories'); await wait("document.body.textContent.includes('không có quyền')||document.body.textContent.includes('Không có quyền')||!location.pathname.startsWith('/admin')");
  assert.equal(await js("document.body.textContent.includes('Danh mục hệ thống')"),false);
  checks.push('synthetic student cannot mount category administration via existing role guard');
  assert.deepEqual(errors,[]); const candidateEnd=await manifest(); assert.deepEqual(candidateStart,candidateEnd);
  await writeFile(join(dir,'results.json'),JSON.stringify({candidateStart,candidateEnd,checks,requests,errors,limits:'Synthetic local auth/API; external requests blocked; Chromium desktop/mobile emulation only; no live backend authorization, persistence or physical device proof.'},null,2));
  console.log(JSON.stringify({dir,checks:checks.length,errors:errors.length}));
} catch(error) {
  await writeFile(join(dir,'failure.json'),JSON.stringify({message:error.message,checks,requests,errors,candidateStart},null,2));
  if(call) await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64')).catch(()=>{});
  console.error(dir,error); process.exitCode=1;
} finally { socket?.close(); chrome.kill('SIGTERM'); }
