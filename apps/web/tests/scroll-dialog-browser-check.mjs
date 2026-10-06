// Current mounted UI with synthetic APIs. External requests are blocked.
// Does not prove production authorization, persistence or physical-device input.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.SCROLL_WEB_URL ?? 'http://127.0.0.1:3000';
const dir = await mkdtemp(join(tmpdir(), 'scroll-dialog-'));
const paths = ['src/index.css', 'src/components/ui/dialog.tsx', 'src/components/ui/alert-dialog.tsx',
  'src/components/ui/rich-text-editor.tsx', 'src/features/post/components/post-form.tsx',
  'src/features/post/components/post-management-feature.tsx', 'src/features/daily/ui/use-daily-confirm.tsx',
  'tests/native-prompts.test.ts', 'tests/scroll-dialog-browser-check.mjs'];
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async path =>
  [path, createHash('sha256').update(await readFile(new URL('../' + path, import.meta.url))).digest('hex')])));
const candidateStart = await manifest();
const checks = [], errors = [], requests = [], nativeDialogs = [];
let role = 'ADMIN', theme = 'light', deleting = false;
const uid = '00000000-0000-0000-0000-000000000001';
const post = { id: uid, title: 'Bài viết kiểm tra liên kết', slug: 'link-fixture', summary: 'Synthetic local fixture',
  type: 'BLOG', status: 'DRAFT', thumbnailUrl: null, publishedAt: null, expiredAt: null, pinned: false,
  author: null, viewCount: 0, updatedAt: '2026-10-05T00:00:00Z', createdAt: '2026-10-05T00:00:00Z',
  content: '<p>Selected study text remains here.</p>' + Array.from({length: 40}, (_, n) => `<p>Scroll context ${n + 1}: đọc và chỉnh sửa nội dung bài viết.</p>`).join('') };
const chrome = spawn(process.env.SCROLL_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, call, js;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium startup timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) {clearTimeout(timer); resolve(m[1]);} });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, {method:'PUT'})).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => {socket.onopen = resolve;});
  let serial = 0;
  const pending = new Map();
  call = (method, params = {}) => new Promise((resolve, reject) => {const id = ++serial; pending.set(id, {resolve,reject}); socket.send(JSON.stringify({id,method,params}));});
  async function fulfill(e) {
    const url = new URL(e.request.url), method = e.request.method;
    if (!url.pathname.startsWith('/api/v1/')) return url.origin === new URL(web).origin && !/\.(mp4|webm)$/.test(url.pathname)
      ? call('Fetch.continueRequest', {requestId:e.requestId}) : call('Fetch.fulfillRequest', {requestId:e.requestId,responseCode:404});
    const path = url.pathname.slice(7);
    requests.push({path,method});
    let body = {}, status = 200;
    if (method === 'OPTIONS') body={};
    else if (path === '/users/me') { if (!role) status = 401; else body = {id:uid,username:'fixture',fullName:'Local UI fixture',email:'fixture@example.test',role,status:'ACTIVE',avatarUrl:null}; }
    else if (path === '/auth/refresh') {if (!role) status=401;else body={accessToken:'synthetic-scroll'};}
    else if (path === '/posts/management/status-counts') body={draft:deleting?0:1,published:0,expired:0,archived:0};
    else if (path === '/posts/management') body={content:deleting?[]:[post],totalElements:deleting?0:1,totalPages:1,number:0,size:10};
    else if (path === '/posts/' + uid && method === 'DELETE') {deleting=true;status=204;}
    else if (path === '/posts/' + uid) body=post;
    else if (path === '/documents/metadata') body={subjects:[],categories:[],tags:[]};
    else if (path === '/posts' || path === '/documents') body={content:[],totalElements:0,totalPages:0,number:0,size:20};
    return call('Fetch.fulfillRequest', {requestId:e.requestId,responseCode:status,
      responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:web},{name:'Access-Control-Allow-Credentials',value:'true'},
        {name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,DELETE,OPTIONS'}],
      body:Buffer.from(JSON.stringify(body)).toString('base64')});
  }
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.method === 'Fetch.requestPaused') void fulfill(m.params).catch(e=>{if(!e.message.includes('Invalid InterceptionId'))errors.push(e.message);});
    if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails));
    if (m.method === 'Page.javascriptDialogOpening') {nativeDialogs.push(m.params.type);void call('Page.handleJavaScriptDialog',{accept:false});}
    if (m.id) {const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);}
  };
  js = async expression => {const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait = async expression => {for(let n=0;n<180;n++){if(await js(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout: '+expression);};
  const key = async (key, code, virtual, modifiers=0) => {await call('Input.dispatchKeyEvent',{type:key==='Enter'?'keyDown':'rawKeyDown',key,code,windowsVirtualKeyCode:virtual,modifiers,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtual,modifiers});};
  const click = async (selector, text) => js(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>${text ? `b.textContent.trim()===${JSON.stringify(text)}&&` : ''}b.getClientRects().length);if(!b)throw Error('Missing button');b.focus();b.click()})()`);
  const navigate = async path => {const previous=await js('window.scrollDocumentId');await call('Page.navigate',{url:web+path});await wait(`window.scrollDocumentId!==${JSON.stringify(previous)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);};
  const viewport = (width,height) => call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
  const shot = async name => {await js('new Promise(r=>setTimeout(r,250))');await writeFile(join(dir,name+'.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));};
  const bounded = async selector => {const b=await js(`(()=>{const d=document.querySelector(${JSON.stringify(selector)}),b=d.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:innerWidth,h:innerHeight}})()`);assert.ok(b.x>=0&&b.y>=0&&b.right<=b.w+1&&b.bottom<=b.h+1,JSON.stringify(b));};
  const setInput = async value => {await js(`(()=>{const i=[...document.querySelectorAll('[data-slot=dialog-content] input')].at(-1);i.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,${JSON.stringify(value)});i.dispatchEvent(new Event('input',{bubbles:true}))})()`);await js('new Promise(r=>setTimeout(r,50))');};
  const openLink = async () => {await click('[aria-label="Chèn liên kết"]');await wait("!![...document.querySelectorAll('[data-slot=dialog-title]')].find(d=>d.textContent==='Chèn liên kết')");await wait("document.activeElement.matches('input')");};
  const closeLink = async () => {await key('Escape','Escape',27);await wait("!document.querySelector('[aria-label=\"Chèn liên kết\"][aria-expanded=true]')");await wait("document.activeElement.getAttribute('aria-label')==='Chèn liên kết'");};
  const activeLink = "[...document.querySelectorAll('[data-slot=dialog-content]')].at(-1)";
  await call('Page.enable');await call('Runtime.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.scrollDocumentId=crypto.randomUUID();localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:'light'},version:0}));`});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  for (const [width,height,mode] of [[1440,900,'light'],[768,1024,'light'],[390,844,'dark'],[320,360,'light']]) {
    theme=mode;role='ADMIN';await viewport(width,height);await navigate('/admin/posts');
    await js(`document.documentElement.classList.toggle('dark',${theme==='dark'})`);
    await click('button','Sửa');await wait("!!document.querySelector('.tiptap')");
    const outer="document.querySelector('[data-slot=dialog-content]')";
    const scroll=await js(`(()=>{const d=${outer},e=document.querySelector('.tiptap');return {page:getComputedStyle(document.documentElement).scrollbarColor,dialog:getComputedStyle(d).scrollbarColor,panel:getComputedStyle(e).scrollbarColor,range:e.scrollHeight>e.clientHeight}})()`);
    assert.ok(scroll.range);assert.notEqual(scroll.dialog,'auto');assert.equal(scroll.dialog,scroll.panel);checks.push(`${width} ${mode}: themed page/dialog/editor native scrollbars`);
    await js(`(()=>{const e=document.querySelector('.tiptap');e.scrollIntoView({block:'center'});e.scrollTop=0})()`);
    const point=await js("(()=>{const b=document.querySelector('.tiptap').getBoundingClientRect();return{x:b.x+20,y:Math.max(30,Math.min(innerHeight-30,b.y+50))}})()");
    // Wheel behavior is checked when the editor has a visible hit area; short
    // screens additionally use keyboard and the outer native scroller below.
    if(height>400){await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:point.x,y:point.y,deltaX:0,deltaY:300});await wait("document.querySelector('.tiptap').scrollTop>0");checks.push(`${width}: editor wheel scroll preserved`);}
    if(width===390){
      await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
      await js("document.querySelector('.tiptap').scrollTop=0");
      const p=await js("(()=>{const b=document.querySelector('.tiptap').getBoundingClientRect();return {x:b.x+40,y:Math.max(160,Math.min(innerHeight-60,b.y+200))}})()");
      await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});
      for(let n=1;n<=5;n++){await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y-n*25}]});await new Promise(r=>setTimeout(r,30));}
      await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await wait("document.querySelector('.tiptap').scrollTop>0");
      await call('Emulation.setTouchEmulationEnabled',{enabled:false});checks.push('390: synthetic touch swipe preserves native panel scrolling');
    }
    await js(`(()=>{const d=${outer};d.scrollTop=0;d.focus()})()`);await key('PageDown','PageDown',34);
    await wait(`${outer}.scrollTop>0`);checks.push(`${width}: dialog keyboard scroll preserved`);
    await js("(()=>{const e=document.querySelector('.tiptap');e.focus();e.scrollTop=0;const t=e.querySelector('p').firstChild;const r=document.createRange();r.setStart(t,0);r.setEnd(t,8);const s=getSelection();s.removeAllRanges();s.addRange(r);e.dispatchEvent(new Event('selectionchange',{bubbles:true}));document.dispatchEvent(new Event('selectionchange'))})()");
    await js('new Promise(r=>setTimeout(r,150))');
    await openLink();await bounded('[data-slot=dialog-content]:last-of-type');
    assert.notEqual(await js(`getComputedStyle(${activeLink}).animationName`),'none');
    await shot(`link-${width}x${height}-${mode}`);
    assert.ok(await js(`${activeLink}.contains(document.activeElement)`));
    for(let n=0;n<6;n++)await key('Tab','Tab',9);
    assert.ok(await js(`${activeLink}.contains(document.activeElement)`));
    const original=await js("document.querySelector('.tiptap').innerHTML");
    await setInput('javascript:alert(1)');await key('Enter','Enter',13);await wait("!!document.querySelector('[aria-invalid=true]')");
    assert.equal(await js("document.querySelector('.tiptap').innerHTML"),original);
    await key('Escape','Escape',27);
    assert.ok(await js("!!document.querySelector('[data-slot=dialog-content][data-state=closed]')"),'closing animation retains outgoing content');
    await wait("document.activeElement.getAttribute('aria-label')==='Chèn liên kết'");assert.equal(await js("document.querySelector('.tiptap').innerHTML"),original);
    checks.push(`${width}: focus trap, unsafe URI error, Escape cancel and toolbar focus return`);
    await openLink();await setInput('https://example.test/reference');await key('Enter','Enter',13);
    await wait("!!document.querySelector('.tiptap a[href=\"https://example.test/reference\"]')");
    assert.equal(await js("document.querySelector('.tiptap a').textContent"),'Selected');
    assert.ok(await js("!!document.querySelector('.tiptap')"));
    assert.equal(requests.filter(r=>['POST','PUT'].includes(r.method)&&r.path.startsWith('/posts')).length,0);
    checks.push(`${width}: selected text linked; no parent PostForm submission`);
    await wait("document.activeElement.getAttribute('aria-label')==='Chèn liên kết'");
    await openLink();assert.equal(await js("[...document.querySelectorAll('[data-slot=dialog-content] input')].at(-1).value"),'https://example.test/reference');
    await js(`(()=>{const d=${activeLink};const b=[...d.querySelectorAll('button')].find(b=>b.textContent.trim()==='Hủy');b.focus();b.click()})()`);await wait("document.activeElement.getAttribute('aria-label')==='Chèn liên kết'");
    await key('Escape','Escape',27);await wait("!document.querySelector('[data-slot=dialog-content]')");
    await click('button','Xóa');await wait("!!document.querySelector('[data-slot=alert-dialog-content]')");
    await bounded('[data-slot=alert-dialog-content]');await shot(`confirmation-${width}x${height}-${mode}`);
    assert.equal(await js("getComputedStyle(document.querySelector('[data-slot=alert-dialog-action]')).backgroundColor"), mode==='dark'?'rgb(255, 147, 147)':'rgb(197, 55, 55)');
    assert.equal(await js("document.activeElement.getAttribute('data-slot')"),'alert-dialog-cancel');
    await key('Escape','Escape',27);await wait("!document.querySelector('[data-slot=alert-dialog-content]')");
    assert.equal(requests.filter(r=>r.method==='DELETE').length,0);
    checks.push(`${width}: destructive alert bounded, cancel-focused, Escape sends no DELETE`);
  }
  await viewport(390,844);await click('button','Sửa');await wait("!!document.querySelector('.tiptap')");
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await openLink();assert.equal(await js(`getComputedStyle(${activeLink}).animationName`),'none');
  assert.equal(await js("getComputedStyle([...document.querySelectorAll('[data-slot=dialog-overlay]')].at(-1)).animationName"),'none');
  await closeLink();await key('Escape','Escape',27);await wait("!document.querySelector('[data-slot=dialog-content]')");
  await click('button','Xóa');await wait("!!document.querySelector('[data-slot=alert-dialog-content]')");
  assert.equal(await js("getComputedStyle(document.querySelector('[data-slot=alert-dialog-content]')).animationName"),'none');
  await click('[data-slot=alert-dialog-content] button','Xóa bài viết');await wait("!document.querySelector('[data-slot=alert-dialog-content]')");
  assert.equal(requests.filter(r=>r.method==='DELETE').length,1);checks.push('OS reduced motion suppresses dialog/overlay/alert animations; explicit delete dispatches once');
  await call('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'}]});
  assert.equal(await js('getComputedStyle(document.documentElement).scrollbarColor'),'auto');checks.push('forced-colors uses UA scrollbar colors');
  await call('Emulation.setEmulatedMedia',{features:[]});
  role=null;await navigate('/about');await viewport(320,360);await click('[aria-label="Mở menu điều hướng"]');await wait("!!document.querySelector('.navigation-drawer__body')");
  const drawer=await js("(()=>{const e=document.querySelector('.navigation-drawer__body');e.focus();e.scrollTop=e.scrollHeight;return {scroll:e.scrollTop>0,color:getComputedStyle(e).scrollbarColor}})()");
  assert.ok(drawer.scroll);assert.notEqual(drawer.color,'auto');await shot('public-drawer-320x360');checks.push('short public drawer retains themed native scrolling');
  await key('Escape','Escape',27);await wait("!document.querySelector('[data-slot=sheet-content]')");
  await js('window.scrollTo(0,0)');await key('PageDown','PageDown',34);await wait('scrollY>0');checks.push('page keyboard scrolling remains native');
  assert.deepEqual(nativeDialogs,[]);assert.deepEqual(errors,[]);
  const candidateEnd=await manifest();assert.deepEqual(candidateStart,candidateEnd);
  await writeFile(join(dir,'results.json'),JSON.stringify({candidateStart,candidateEnd,checks,requests,errors,nativeDialogs,limits:'Synthetic auth/API only; external traffic blocked; Chromium only.'},null,2));
  console.log(JSON.stringify({dir,checks:checks.length,errors:errors.length}));
} catch(error) {
  await writeFile(join(dir,'failure.json'),JSON.stringify({message:error.message,checks,requests,errors,nativeDialogs,candidateStart},null,2));
  if(call)await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64')).catch(()=>{});
  console.error(dir,error);process.exitCode=1;
} finally {socket?.close();chrome.kill('SIGTERM');}
