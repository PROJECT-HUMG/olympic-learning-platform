// Routed product checks with synthetic API/clipboard, plus an explicitly isolated callback fixture.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck } from './browser/session.mjs';
const options = browserOptions('uploads');
const dir = await evidenceDirectory(options);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=', 'base64');
const paths = { broken: join(dir, 'anh-khong-doc-duoc.png'), png: join(dir, 'minh-chung.png'), pdf: join(dir, 'minh-chung-co-ten-dai-de-kiem-tra-doc-tren-man-hinh-hep.pdf'), bad: join(dir, 'khong-ho-tro.txt'), large: join(dir, 'qua-5-MB.pdf') };
await Promise.all(Object.entries(paths).map(([key, path]) => writeFile(path, key === 'png' ? png : key === 'broken' ? 'Not a decodable image' : key === 'large' ? Buffer.alloc(5 * 1024 * 1024 + 1) : key === 'pdf' ? '%PDF-1.4\nSynthetic evidence only' : 'Synthetic rejected file')));
const uid = '00000000-0000-0000-0000-000000000101', roomId = '00000000-0000-0000-0000-000000000010';
const user = { id: uid, fullName: 'Người học thử nghiệm', username: 'fixture', role: 'STUDENT', status: 'ACTIVE', email: 'fixture@example.invalid' };
const checks = [], screenshots = [], requests = [], errors = [], motion = [];
let phase = 'startup';
const checkpoint = async value => { phase = value; await writeFile(join(dir, 'phase.txt'), value); console.log('Upload check: ' + value); };
let session, call, js, hold = false, status = 503;
const held = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  session = await startBrowserCheck({ options, dir });
  ({ call, js } = session);
  const reply = (event, code, body, type = 'application/json') => call('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: code, responseHeaders: [{ name: 'Content-Type', value: type }], body: Buffer.from(type === 'application/json' ? JSON.stringify(body) : body).toString('base64') });
  session.onRequest(async event => {
    const url = new URL(event.request.url), path = url.pathname, method = event.request.method;
    if (url.origin === session.web && !path.startsWith('/api/')) return call('Fetch.continueRequest', { requestId: event.requestId });
    if (!path.startsWith('/api/')) return reply(event, 404, '', 'text/plain');
    requests.push({ path, method, body: method === 'POST' ? event.request.postData : undefined });
    if (path.endsWith('/users/me')) return reply(event, 200, user);
    if (path.endsWith('/auth/refresh')) return reply(event, 200, { accessToken: 'synthetic-only' });
    if (path.endsWith('/recognition/preferences/me')) return reply(event, 200, { rankingOptIn: false });
    if (path.endsWith('/recognition/achievements/me')) return reply(event, 200, []);
    if (method === 'POST' && path.endsWith('/recognition/achievements')) {
      if (hold) await new Promise(resolve => held.push(resolve));
      return reply(event, status, status === 200 ? {} : { detail: 'Chưa gửi được. Minh chứng và bản nhập vẫn được giữ.' });
    }
    if (path.endsWith('/study-rooms/' + roomId)) return reply(event, 200, {
      id: roomId, name: 'Cùng ôn Toán', ownerId: uid, ownerName: user.fullName, focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15,
      requestPolicy: 'OPEN', minimumStudyMinutes: 0, activeMembers: 0, closed: false, phase: 'FOCUS', serverNow: new Date().toISOString(),
      phaseEndsAt: new Date(Date.now() + 1200000).toISOString(), sessionNumber: 1, rhythmVersion: 1, me: null, members: [], tracks: [],
      playback: { videoId: 'synthetic', title: 'Fixture only', startedAt: new Date().toISOString(), version: 0, isDefault: true },
    });
    assert.equal(method, 'GET', 'No unexpected mutation or provider action: ' + path);
    return reply(event, 200, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
  });
  session.onEvent(event => { if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.exception?.description ?? event.params.exceptionDetails.text); });
  await call('Runtime.enable'); await call('Page.enable', { enableFileChooserOpenedEvent: true }); await call('Network.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await call('Emulation.setFocusEmulationEnabled', { enabled: true });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__blobAlive = new Set();window.__previewErrors=0;
    window.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&event.target.src.startsWith('blob:'))window.__previewErrors++;},true);
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = value => { const url = create(value); window.__blobAlive.add(url); return url; };
    URL.revokeObjectURL = url => { window.__blobAlive.delete(url); revoke(url); };
    window.__copyCalls = 0; window.__copyMode = 'hold';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: value => {
      window.__copyCalls++; window.__copied = value;
      return window.__copyMode === 'reject' ? Promise.reject(new DOMException('Synthetic denial','NotAllowedError')) : window.__copyMode === 'resolve' ? Promise.resolve() : new Promise(resolve => { window.__copyResolve = resolve; });
    } } });
  ` });
  const wait = async expression => { for (let n = 0; n < 500; n++) { if (await js(`Boolean(${expression})`)) return; await delay(30); } throw Error('Timeout: ' + expression); };
  const resize = async (width, height = 844) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const media = async (theme, reduce = false) => call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
  const nav = async route => { await call('Page.navigate', { url: session.web + route }); await wait('!!document.querySelector("h1") && !document.querySelector("#startup-loader") && !document.querySelector("#root").inert'); };
  const clickText = async text => js(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click()})()`);
  const key = async (key, code) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key, windowsVirtualKeyCode: code, ...(key === 'Enter' ? { text: '\r' } : {}) }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: code }); };
  const select = async (files, selector = '[data-file-selection] input[type=file]') => { const doc = await call('DOM.getDocument'); const node = await call('DOM.querySelector', { nodeId: doc.root.nodeId, selector }); assert.ok(node.nodeId, selector); await call('DOM.setFileInputFiles', { nodeId: node.nodeId, files }); };
  const fillTitle = async text => js(`(()=>{const e=document.querySelector('.creation-dialog input[maxlength="200"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(text)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const shot = async name => { assert.ok(await js('document.documentElement.scrollWidth <= innerWidth + 1'), 'No horizontal page overflow'); const path = join(dir, name + '.png'); await writeFile(path, Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); screenshots.push(path); };
  const touch = async selector => { await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest'})`); const r = await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),h:r.height}})()`); assert.ok(r.hit); assert.ok(r.h >= 44); await call('Emulation.setTouchEmulationEnabled', { enabled: true }); await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] }); await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };

  if (!options.section || options.section === 'evidence') {
  await checkpoint('routed editor arrival');
  await resize(390); await media('dark'); await nav('/profile/achievements'); await clickText('Gửi thành tích'); await wait('!!document.querySelector("[data-file-selection]")');
  await checkpoint('native chooser and selection');
  await fillTitle('Thành tích kiểm thử tải minh chứng');
  const choosers = []; session.onEvent(e => { if (e.method === 'Page.fileChooserOpened') choosers.push(e.params); });
  await call('Page.setInterceptFileChooserDialog', { enabled: true });
  await js('document.querySelector("[data-file-selection] button").focus()'); await key('Enter', 13); await wait('document.activeElement.tagName === "BUTTON"');
  for (let n = 0; n < 100 && !choosers.length; n++) await delay(20);
  assert.equal(choosers.length, 1, 'Enter opens actual native chooser');
  await select([paths.pdf, paths.png]); await wait('document.querySelectorAll("[data-file-selection] li").length === 2');
  await wait('document.querySelector("[data-file-selection] li img")?.naturalWidth > 0');
  assert.equal(await js('document.querySelectorAll("[data-file-selection] li img").length'), 1, 'Raster preview only; PDF is a file badge');
  assert.equal(requests.filter(r => r.method === 'POST' && r.path.includes('/recognition')).length, 0);
  await select([paths.bad]); await wait('document.querySelector("[data-file-selection] [role=alert]")?.textContent.includes("JPEG")');
  assert.equal(await js('document.querySelectorAll("[data-file-selection] li").length'), 2);
  await select([paths.large]); await wait('document.querySelector("[data-file-selection] [role=alert]")?.textContent.includes("5 MB")');
  await select([paths.pdf, paths.png]); await wait('document.querySelector("[data-file-selection] [role=alert]")?.textContent.includes("3 file")');
  await touch('[data-file-selection] li button'); await wait('document.querySelectorAll("[data-file-selection] li").length === 1');
  assert.ok(await js('document.activeElement.textContent.includes("tệp minh chứng")'));
  // Paste adds actual File objects through the same owner validation, without starting a request.
  await js(`(()=>{const data=new DataTransfer();data.items.add(new File(['%PDF-1.4'],'them.pdf',{type:'application/pdf'}));document.querySelector('[data-file-selection] button').dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));})()`);
  await wait('document.querySelectorAll("[data-file-selection] li").length === 2');
  await js('document.querySelector("[data-file-selection]").scrollIntoView({block:"center"})'); await shot('evidence-selected-390-dark');
  await checkpoint('atomic submit failure and retry');
  hold = true; await clickText('Gửi để duyệt'); await wait('document.querySelector(".creation-dialog fieldset").disabled');
  await delay(2200); assert.ok(await js('!!document.querySelector(".creation-dialog") && document.querySelector(".creation-dialog fieldset").disabled'));
  assert.ok(await js('![...document.querySelectorAll("[data-file-selection] li")].some(e=>e.textContent.includes("Đã tải lên"))'));
  const post = requests.find(r => r.method === 'POST' && r.path.endsWith('/recognition/achievements'));
  assert.ok(post); assert.equal((post.body?.match(/name="evidence"/g) ?? []).length, 2, 'Atomic two-file evidence association'); assert.ok(post.body.includes('Thành tích kiểm thử tải minh chứng'));
  await key('Escape', 27); assert.ok(await js('!!document.querySelector(".creation-dialog") && !document.querySelector("[role=alertdialog]")'));
  await shot('evidence-real-request-pending-390-dark');
  hold = false; held.splice(0).forEach(resolve => resolve()); await wait('!!document.querySelector(".creation-dialog form > fieldset > [role=alert]")');
  assert.equal(await js('document.querySelectorAll("[data-file-selection] li").length'), 2); assert.equal(await js(`document.querySelector('.creation-dialog input[maxlength="200"]').value`), 'Thành tích kiểm thử tải minh chứng');
  await shot('evidence-http-error-retained-390-dark'); status = 200; await clickText('Gửi để duyệt'); await wait('!document.querySelector(".creation-dialog")');
  await wait('window.__blobAlive.size === 0');
  checks.push('Actual routed editor: native Enter chooser, raster/PDF distinction, MIME/size/count and paste validation, touch remove/refocus, no selection request, atomic multipart two-file association, >2s pending, busy Escape,503 retained files/draft, explicit200 retry closes, previews cleaned.');
  for (const [width, theme] of [[320, 'light'], [1280, 'light'], [1280, 'dark']]) {
    await resize(width, 900); await media(theme, true); await nav('/profile/achievements'); await clickText('Gửi thành tích'); await wait('!!document.querySelector("[data-file-selection]")'); await select([paths.pdf, paths.png]);
    await js('document.querySelector("[data-file-selection]").scrollIntoView({block:"center"})'); await delay(200); await shot(`evidence-selected-${width}-${theme}`);
    assert.ok(await js('[...document.querySelectorAll("[data-file-selection] li")].every(e=>getComputedStyle(e).opacity==="1")'));
    if(width===320){await select([paths.broken]);await wait('window.__previewErrors>0');assert.ok(await js('document.querySelector("[data-file-selection] li:last-child").textContent.includes("PNG")'));await shot('evidence-broken-preview-fallback-320-light');}
    await key('Escape', 27); await wait('!!document.querySelector("[role=alertdialog]")'); await clickText('Bỏ thay đổi'); await wait('!document.querySelector(".creation-dialog")'); await wait('window.__blobAlive.size === 0');
  }

  }
  if (!options.section || options.section === 'callback') {
  await checkpoint('callback upload fixture');
  // The callback specimen is not a routed product upload or backend proof.
  await resize(390); await media('light'); await nav('/tests/fixtures/registry-components.html');
  await select([paths.pdf], '#upload-specimen input[type=file]'); await wait('document.querySelector("#upload-specimen li")?.textContent.includes("Đang gửi")');
  await clickText('Progress 60'); await wait('document.querySelector("#upload-specimen li")?.textContent.includes("60%")'); assert.equal(await js('document.querySelector("#registry-state").dataset.success'), '0');
  await clickText('Complete transfer'); await wait('document.querySelector("#registry-state").dataset.success === "1"'); await wait('document.querySelector("#upload-specimen li")?.textContent.includes("Đã tải lên")');
  await js('document.querySelector("#upload-specimen li button").click()'); await wait('!document.querySelector("#upload-specimen li")');
  await clickText('Fail next transfer'); await select([paths.pdf], '#upload-specimen input[type=file]'); await wait('document.querySelector("#upload-specimen li")?.textContent.includes("Synthetic transfer failed")');
  await js(`document.querySelector('#upload-specimen button[aria-label^="Thử gửi lại"]').click()`); await wait('document.querySelector("#upload-specimen li")?.textContent.includes("Đang gửi")');
  await clickText('Complete transfer'); await wait('document.querySelector("#registry-state").dataset.success === "2"');
  await js('document.querySelector("#upload-specimen li button").click()'); await wait('!document.querySelector("#upload-specimen li")');
  await select([paths.pdf], '#upload-specimen input[type=file]'); await wait('document.querySelector("#upload-specimen li")?.textContent.includes("Đang gửi")');
  await js('document.querySelector("#upload-specimen li button").click()'); await wait('document.querySelector("#registry-state").dataset.aborted === "1"'); await clickText('Complete transfer');
  assert.equal(await js('document.querySelector("#registry-state").dataset.success'), '2');
  await select([paths.pdf], '#upload-specimen input[type=file]'); await wait('document.querySelector("#upload-specimen li")?.textContent.includes("Đang gửi")');
  await clickText('Toggle upload'); await wait('document.querySelector("#registry-state").dataset.aborted === "2"'); await clickText('Complete transfer');
  assert.equal(await js('document.querySelector("#registry-state").dataset.success'), '2'); checks.push('Isolated real-callback mode: actual60 progress, resolve-only success, rejection retains file/retry, remove/unmount abort, late completion never reports success. No simulated upload.');

  }
  if (!options.section || options.section === 'room') {
  await checkpoint('routed room clipboard and motion');
  await resize(390); await media('dark'); await nav('/study-rooms/' + roomId); await wait('!!document.querySelector(".room-topline [data-status]")');
  const button = '.room-topline [data-status]';
  await js(`(()=>{
    window.__burstProof=[];window.__burstCount=0;
    const observer=new MutationObserver(()=>{
      const canvas=document.querySelector('.room-topline canvas');
      if(!canvas||window.__seenBurst===canvas)return;
      window.__seenBurst=canvas;window.__burstCount++;
      let last=0,frames=0;
      const sample=()=>{
        if(!canvas.isConnected||frames>=2)return;
        const context=canvas.getContext('2d');
        if(context&&canvas.width&&canvas.height){
          const bytes=context.getImageData(0,0,canvas.width,canvas.height).data;
          const alpha=bytes.reduce((sum,v,i)=>i%4===3?sum+v:sum,0);
          if(alpha>0&&performance.now()-last>=60){last=performance.now();frames++;window.__burstProof.push({width:canvas.width,height:canvas.height,alpha,time:last,png:canvas.toDataURL()});}
        }
        requestAnimationFrame(sample);
      };requestAnimationFrame(sample);
    });observer.observe(document.querySelector('.room-topline'),{childList:true,subtree:true});
  })()`);
  await js(`document.querySelector('${button}').focus()`); await key('Enter', 13); await wait(`document.querySelector('${button}').dataset.status === 'pending'`);
  assert.ok(await js(`document.querySelector('${button}').getAttribute('aria-disabled') === 'true' && document.querySelector('${button}').getAttribute('aria-busy') === 'true'`));
  await js(`document.querySelector('${button}').click()`); assert.equal(await js('window.__copyCalls'), 1); assert.equal(await js('document.querySelectorAll(".room-topline canvas").length'), 0);
  await shot('room-copy-pending-390-dark'); await js('window.__copyResolve()'); await wait(`document.querySelector('${button}').dataset.status === 'success'`);
  assert.equal(await js('window.__copied'), session.web + '/study-rooms/' + roomId);
  await shot('room-copy-success-390-dark');
  await wait('window.__burstProof.length === 2');
  const samples=await js('window.__burstProof');
  for(const [index,frame] of samples.entries()){
    const path=join(dir,`room-particle-frame-${index+1}.png`);await writeFile(path,Buffer.from(frame.png.split(',')[1],'base64'));screenshots.push(path);
    const {png:_png,...data}=frame;motion.push(data);
  }
  assert.ok(motion[0].alpha>0&&motion[1].alpha>0);assert.notEqual(motion[0].alpha,motion[1].alpha,'Particle burst actually advances');
  await wait('!document.querySelector(".room-topline canvas")'); await js('window.__copyMode="reject"'); await js(`document.querySelector('${button}').click()`); await wait(`document.querySelector('${button}').dataset.status === 'error'`);
  await wait('!!document.querySelector(".study-room-copy input")'); assert.equal(await js('document.querySelector(".study-room-copy input").value'), session.web + '/study-rooms/' + roomId); assert.equal(await js('document.querySelectorAll(".room-topline canvas").length'), 0);
  await wait(`!document.querySelector('[data-sonner-toast][data-type="success"]')`);
  await shot('room-copy-denied-manual-fallback-390-dark');
  await media('light', true); await resize(320); await nav('/study-rooms/' + roomId); await wait('!!document.querySelector(".room-topline [data-status]")'); await js('window.__copyMode="resolve"'); await touch(button); await wait(`document.querySelector('${button}').dataset.status === 'success'`);
  await delay(80); assert.equal(await js('document.querySelectorAll(".room-topline canvas").length'), 0); assert.equal(await js('document.activeElement.dataset.status'), 'success'); await shot('room-copy-reduced-320-light');
  checks.push('Actual routed room-copy: keyboard/Enter real promise, duplicate pending clicks blocked, no early burst, eight-chip450ms motion after clipboard resolution, denied clipboard retains manual-copy fallback/no success, touch/static reduced-motion success and focus at320px. Clipboard is synthetic; no OS clipboard changed.');
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(session.requestFailures, []);
  const report = { evidence: dir, checks, screenshots, motion, requestSummary: requests.map(({ method, path }) => ({ method, path })), limits: ['Synthetic API/clipboard and fixture callbacks; no live authorization, persistence/storage/provider or OS clipboard proof.', 'Chromium/system fonts only, no physical-device/AT/WebKit or production performance proof.'] };
  await writeFile(join(dir, 'results.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ evidence: dir, checks, screenshots: screenshots.length }));
} catch (error) {
  await writeFile(join(dir, 'failure.txt'), String(error.stack ?? error)); await writeFile(join(dir, 'diagnostics.json'), JSON.stringify({phase, requests:requests.map(({path,method})=>({path,method})),errors,requestFailures:session?.requestFailures},null,2)); if (call) await writeFile(join(dir, 'failure.png'), Buffer.from((await call('Page.captureScreenshot').catch(() => ({ data: '' }))).data, 'base64')); console.error('Evidence: ' + dir); throw error;
} finally { hold = false; held.splice(0).forEach(resolve => resolve()); await session?.cleanup(); }
