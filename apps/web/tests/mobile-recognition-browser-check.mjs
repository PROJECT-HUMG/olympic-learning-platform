// Actual routes, synthetic intercepted API/widget only; no production content or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.MOBILE_WEB_URL??'http://127.0.0.1:3126',baseline=process.env.MOBILE_BASELINE==='1';
const dir=await mkdtemp(join(tmpdir(),`mobile-four-${baseline?'before':'after'}-`));
const checks=[],screenshots=[],requests=[],errors=[];
let mode='many',role='STUDENT',socket,call,js,publicationStatus=200,holdPublication=false,releasePublication;
let holdMine=false,releaseMine,holdReview=false,releaseReview,recordOwner='00000000-0000-0000-0000-000000000001';
const reviewRequests=[];
const navbarOnly=process.env.MOBILE_CHECK_SCOPE==='navbar';
const privacyOnly=process.env.MOBILE_CHECK_SCOPE==='privacy';
const publicationOnly=process.env.MOBILE_CHECK_SCOPE==='publication';
let album={id:'synthetic-album',title:'Synthetic album',subject:'Toán',year:2026,description:'Local only',scope:'SCHOOL',status:'DRAFT',participants:[{fullName:'Synthetic participant'}],photos:[],version:1};
const publicationRequests=[];
const uid='00000000-0000-0000-0000-000000000001';
const user=()=>({id:uid,username:'synthetic',fullName:'Synthetic fixture',email:'fixture@example.invalid',role,status:'ACTIVE',avatarUrl:null});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const records=()=>[{id:'synthetic-record',userId:recordOwner,fullName:'Synthetic fixture',title:'Synthetic · Thành tích học tập',description:'Local fixture only',category:'OLYMPIC_NATIONAL',award:'THIRD',includeParticipation:true,achievedDate:'2026-10-09',publicVisible:true,status:'PENDING',awardPoints:8,participationPoints:6,totalPoints:14,version:1,evidence:mode==='zero'?[]:[...Array.from({length:mode==='one'?1:3},(_,i)=>({id:'image-'+i,originalName:'synthetic-'+i+'.png',contentType:'image/png',size:png.length})),...(mode==='one'?[]:[{id:'pdf',originalName:'synthetic-report.pdf',contentType:'application/pdf',size:123}])]}];
const fixtureScript=`window.widgets=[];window.turnstile={render(c,o){const box=document.createElement('div');box.textContent='Synthetic Turnstile';box.style='width:100%;min-height:65px;border:1px solid gray';c.append(box);window.widgets.push({options:o,box});return ''+(window.widgets.length-1)},remove(id){window.widgets[+id].box.remove()},reset(){}};`;
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
  const fulfill = async e => {
 const u=new URL(e.request.url),path=u.pathname;
 if(u.hostname==='challenges.cloudflare.com')return reply(e,200,fixtureScript,'application/javascript');
 if(!path.startsWith('/api/'))return u.origin===web&&!/\.(mp4|webm)$/.test(path)?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
 requests.push({path,role,mode});
 if(path.endsWith('/users/me'))return role?reply(e,200,user()):reply(e,401,{status:401});
 if(path.endsWith('/auth/refresh'))return role?reply(e,200,{accessToken:'synthetic'}):reply(e,401,{status:401});
 if(path.includes('/evidence/'))return mode==='error'?reply(e,403,{status:403,detail:'Synthetic denied'}):reply(e,200,png,'image/png');
 if(path.endsWith('/admin/recognition/honors'))return reply(e,200,{content:[album],totalPages:1,totalElements:1,number:0,size:12});
 if(path.endsWith('/admin/recognition/honors/synthetic-album')&&e.request.method==='PUT'){
  const input=JSON.parse(e.request.postData);publicationRequests.push(input);
  if(holdPublication)await new Promise(resolve=>releasePublication=resolve);
  if(publicationStatus!==200)return reply(e,publicationStatus,{status:publicationStatus,detail:'Synthetic publication failed'});
  album={...album,...input,version:album.version+1};return reply(e,200,album);
 }
 if(path.endsWith('/achievements/me')){if(holdMine)await new Promise(resolve=>releaseMine=resolve);return mode==='metadata-error'?reply(e,503,{status:503}):reply(e,200,records());}
 if(path.endsWith('/review')){const input=JSON.parse(e.request.postData);reviewRequests.push(input);if(holdReview)await new Promise(resolve=>releaseReview=resolve);return reply(e,200,{...records()[0],status:input.status});}
 if(path.endsWith('/preferences/me'))return reply(e,200,{rankingOptIn:false});
 if(path.endsWith('/admin/recognition/achievements'))return reply(e,200,{content:records(),totalPages:1,totalElements:1,number:0,size:20});
 if(path.includes('/profiles/'))return reply(e,200,{userId:uid,fullName:'Synthetic',username:'synthetic',publicPoints:0,rankingOptIn:false,achievements:records()});
 return reply(e,200,{subjects:[],categories:[],tags:[],content:[],totalPages:0,totalElements:0});
  };
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(e => errors.push(e.message));
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  js = async expression => {
    const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value;
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { for (let i = 0; i < 200; i++) { if (await js(`Boolean(${expression})`)) return; await delay(50); } throw Error('Timeout: ' + expression); };
  const key = async k => {
    const n = { Enter: 13, Escape: 27, Tab: 9, ' ': 32 }[k] ?? 0;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: n, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: n });
  };
  await call('Runtime.enable');await call('Page.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.probeDocument=crypto.randomUUID()'});
  const resize=(width,height=720)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const nav=async path=>{const old=await js('window.probeDocument');await call('Page.navigate',{url:web+path});await wait(`window.probeDocument!==${JSON.stringify(old)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);};
  const shot=async name=>{await delay(200);const geometry=await js(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.className,account:document.getElementById('login-identifier')?.getBoundingClientRect().toJSON(),password:document.getElementById('login-password')?.getBoundingClientRect().toJSON(),forgot:document.querySelector('a[href="/forgot-password"]')?.getBoundingClientRect().toJSON()})`);assert.ok(geometry.scrollWidth<=geometry.width,'overflow '+name);const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push({path,geometry});};
  const click=selector=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('missing selector');e.focus();e.click()})()`);
  const theme=value=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(value)}))`);
  for(const width of publicationOnly||privacyOnly||navbarOnly?[]:[320,390,768,1440]){
    role=null;await resize(width,width===320?568:900);await nav('/login');await wait('!!document.getElementById("login-password")&&window.widgets?.length>0');await theme(width===390||width===1440?'dark':'light');await shot('login-'+width);
    if(!baseline&&width<768){const g=screenshots.at(-1).geometry;assert.ok(g.password.y-g.account.bottom<=30);assert.ok(g.forgot.y>=g.password.bottom);assert.ok(g.forgot.height>=44);}
    role='STUDENT';await nav('/documents');await shot('public-navbar-'+width);
    if(!baseline&&width<768){assert.equal(await js(`getComputedStyle(document.querySelector('.shell-brand__name')).display`),'none');assert.equal(await js(`document.querySelectorAll('.public-header [aria-label="Đổi giao diện"]').length`),1);}
    mode='many';await nav('/profile/achievements');await wait(`document.querySelector('.recognition-record')`);await js(`document.querySelector('.recognition-record').scrollIntoView({block:'center'})`);await shot('recognition-'+width);await click(width>=1200?'.workspace-discovery':'[aria-label="Mở menu điều hướng"]');await wait(`document.querySelector('[role=dialog]')`);await shot('drawer-'+width);
    if(!baseline&&width<768)assert.equal(await js(`document.querySelector('[role=dialog]').textContent.includes('Giao diện tối')`),false);
    await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);
  }
  if(!baseline&&!publicationOnly&&!privacyOnly&&!navbarOnly){
    await resize(320,568);role='STUDENT';mode='many';await nav('/profile/achievements');await wait(`document.querySelector('.evidence-photo')`);await js(`document.querySelector('.evidence-photo').scrollIntoView({block:'center'})`);await wait(`document.querySelector('.evidence-previews img')`);assert.equal(await js(`document.querySelectorAll('.evidence-photo').length`),2);assert.equal(await js(`document.querySelector('.evidence-photo__more').textContent`),'+1');
    await js(`window.opener=document.querySelectorAll('.evidence-photo')[1];window.opener.focus()`);await key(' ');await wait(`document.querySelector('.evidence-viewer img')`);await shot('gallery-320');assert.equal(await js(`document.activeElement.getAttribute('data-slot')`),'dialog-title');await js(`[...document.querySelectorAll('.evidence-viewer button')].find(b=>b.textContent==='Phóng to').click()`);assert.ok(await js(`Boolean(document.querySelector('.evidence-gallery-view--zoomed'))`));await js(`[...document.querySelectorAll('.evidence-viewer button')].find(b=>b.textContent==='Thu nhỏ').click()`);await key('Tab');assert.equal(await js(`!!document.activeElement.closest('[role=dialog]')`),true);await click('.evidence-gallery-index button:last-child');assert.equal(await js(`document.querySelectorAll('.evidence-viewer img').length`),0);await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);assert.equal(await js('document.activeElement===window.opener'),true);await js('window.opener.focus()');await key('Enter');await wait(`document.querySelector('[role=dialog]')`);await click('.evidence-viewer [aria-label="Đóng hộp thoại"]');await wait(`!document.querySelector('[role=dialog]')`);assert.equal(await js('document.activeElement===window.opener'),true);checks.push('Two previews/+1; native Enter/Space; modal focus/Tab/PDF/Escape/Close return');
    for(const value of ['zero','one','error']){mode=value;await nav('/profile/achievements');await wait(`document.querySelector('.recognition-record')`);await delay(600);if(value==='zero')assert.equal(await js(`document.querySelectorAll('.evidence-photo').length`),0);if(value==='one')assert.equal(await js(`document.querySelectorAll('.evidence-photo').length`),1);if(value==='error'){await click('.evidence-photo');await wait(`document.querySelector('.evidence-viewer .evidence-image-failure')`);mode='many';await click('.evidence-viewer button[data-retry-image]');await wait(`document.querySelector('.evidence-viewer img')`);await key('Escape');}await shot('recognition-'+value+'-320');}checks.push('0/1/many; PDF retained; image403/retry');
    const before=requests.filter(r=>r.path.includes('/evidence/')).length;await nav('/achievements/'+uid);await wait(`document.querySelector('h1')?.textContent.includes('Thành tích')`);await delay(300);assert.equal(requests.filter(r=>r.path.includes('/evidence/')).length,before);checks.push('Public profile never fetches evidence');
    await nav('/profile/achievements');await wait(`document.querySelector('.evidence-photo')`);await js(`document.querySelector('.evidence-photo').scrollIntoView({block:'center'})`);await wait(`document.querySelector('.evidence-previews img')`);await js(`Promise.all([import('/src/lib/query-client.ts'),import('/src/lib/auth-session.ts'),import('/src/stores/use-auth-store.ts')]).then(([q,a,s])=>a.expireAuthSession(q.queryClient,s.useAuthStore.getState().clearAuth))`);await wait(`location.pathname==='/login'`);assert.equal(await js(`document.querySelectorAll('.evidence-photo,img[src^="blob:"]').length`),0);checks.push('Expiry unmounts private previews');
    role='ADMIN';mode='many';await nav('/admin/recognition?tab=reviews');await wait(`document.querySelector('.evidence-photo')`);await shot('admin-evidence-320');checks.push('Same owner in admin review');
    await nav('/documents');await js(`document.querySelector('.public-header [aria-label="Đổi giao diện"]').focus()`);await key('Enter');const saved=await js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().theme)`);await nav('/documents');assert.equal(await js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().theme)`),saved);checks.push('Theme keyboard/persistence');
    role=null;await nav('/login');await wait('window.widgets?.length>0');await js(`window.widgets.at(-1).options.callback('synthetic-token')`);await wait(`!document.querySelector('button[type=submit]').disabled`);await click('button[type=submit]');await wait(`document.getElementById('login-password').getAttribute('aria-invalid')==='true'`);await shot('login-errors-320');assert.ok(await js(`Boolean(document.getElementById('login-identifier-error')&&document.getElementById('login-password-error'))`));checks.push('Inline login errors retained');
  }
  if(navbarOnly){
    role=null;for(const width of [320,390]){await resize(width,568);await nav('/documents');await shot('anonymous-navbar-'+width);const targets=await js(`[...document.querySelectorAll('.public-header a,.public-header button')].filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label')??e.textContent.trim(),...e.getBoundingClientRect().toJSON()}))`);const viewportWidth=await js('document.documentElement.clientWidth');for(const t of targets){assert.ok(t.height>=44,JSON.stringify(t));assert.ok(t.x>=0&&t.right<=viewportWidth,JSON.stringify(t));}const sorted=targets.toSorted((a,b)=>a.x-b.x);for(let i=1;i<sorted.length;i++)assert.ok(sorted[i].x-sorted[i-1].right>=7.5,'overlapping/adjacent navbar targets '+JSON.stringify(sorted));await click('.public-header [aria-label="Mở menu điều hướng"]');await wait(`document.querySelector('[role=dialog]')`);assert.equal(await js(`document.querySelector('[role=dialog]').textContent.includes('Giao diện tối')`),false);await key('Escape');checks.push('Anonymous navbar '+width+' all controls44px/in viewport;drawer theme removed');}
  }
  if(privacyOnly){
    role='STUDENT';await resize(375,667);await nav('/profile/achievements');await wait(`document.querySelector('.evidence-photo')`);await js(`document.querySelector('.evidence-photo').scrollIntoView({block:'center'})`);await wait(`document.querySelector('.evidence-photo img')`);await click('.evidence-photo');await wait(`document.querySelector('.evidence-viewer img')`);
    holdMine=true;await js(`import('/src/lib/query-client.ts').then(q=>{void q.queryClient.invalidateQueries({queryKey:['recognition','mine']});return true})`);await wait(`!document.querySelector('.evidence-photo')&&!document.querySelector('.evidence-viewer')`);assert.equal(await js(`document.activeElement.tagName`),'H3');holdMine=false;releaseMine();await wait(`document.querySelector('.evidence-photo')`);checks.push('Private metadata revalidation unmounts byte previews/viewer and returns to record heading');
    mode='metadata-error';await js(`import('/src/lib/query-client.ts').then(q=>{void q.queryClient.invalidateQueries({queryKey:['recognition','mine']});return true})`);await wait(`document.querySelector('.recognition-feedback[role=alert]')`);assert.equal(await js(`document.querySelectorAll('.evidence-photo,.evidence-viewer').length`),0);checks.push('Failed private revalidation never remounts cached bytes');
    mode='many';recordOwner='00000000-0000-0000-0000-000000000099';const count=requests.filter(r=>r.path.includes('/evidence/')).length;await nav('/profile/achievements');await wait(`document.querySelector('.recognition-record')`);await delay(200);assert.equal(requests.filter(r=>r.path.includes('/evidence/')).length,count);assert.equal(await js(`document.querySelectorAll('.evidence-photo').length`),0);checks.push('Different non-admin identity cannot mount/fetch evidence');
    role='ADMIN';recordOwner=uid;await nav('/admin/recognition?tab=reviews');await wait(`document.querySelector('.evidence-photo')`);await js(`document.querySelector('.evidence-photo').scrollIntoView({block:'center'})`);await click('.evidence-photo');await wait(`document.querySelector('.evidence-viewer img')`);await shot('admin-viewer-375');await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);
    const textClick=async text=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('missing button');b.click()})()`);
    await textClick('Không duyệt');await wait(`document.querySelector('.recognition-review-dialog textarea')`);await click('.recognition-review-dialog button[type=submit]');assert.equal(reviewRequests.length,0);await js(`(()=>{const t=document.querySelector('.recognition-review-dialog textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,'Synthetic review reason');t.dispatchEvent(new Event('input',{bubbles:true}))})()`);holdReview=true;await click('.recognition-review-dialog button[type=submit]');await wait(`document.querySelector('.recognition-review-dialog button[type=submit]').disabled`);await click('.recognition-review-dialog button[type=submit]');assert.equal(reviewRequests.length,1);assert.equal(reviewRequests[0].status,'REJECTED');assert.equal(reviewRequests[0].expectedVersion,1);holdReview=false;releaseReview();await wait(`!document.querySelector('.recognition-review-dialog')`);checks.push('Reviewer preview followed by rejection:required reason,version,pending/duplicate guard and completion unchanged');
    await textClick('Duyệt');await wait(`document.querySelector('.recognition-review-dialog')`);await click('.recognition-review-dialog button[type=submit]');await wait(`!document.querySelector('.recognition-review-dialog')`);assert.equal(reviewRequests.at(-1).status,'APPROVED');checks.push('Explicit approval remains separate from preview');
  }
  if(publicationOnly){
    role='ADMIN';await resize(320,568);await nav('/admin/recognition');await wait(`document.querySelector('.recognition-record')`);
    const textClick=async text=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('missing text button');b.focus();b.click()})()`);
    if(baseline){assert.equal(await js(`document.body.textContent.includes('Công bố album')`),false);await shot('album-before-320');}
    else {
      await textClick('Công bố album');await wait(`document.querySelector('.recognition-editor-panel')`);assert.equal(await js(`document.querySelector('select:has(option[value=PUBLISHED])').value`),'PUBLISHED');await shot('publish-editor-320');
      publicationStatus=503;await textClick('Lưu và công bố');await wait(`document.querySelector('.recognition-editor-panel [role=alert]')`);assert.equal(publicationRequests.length,1);assert.equal(publicationRequests[0].status,'PUBLISHED');assert.equal(publicationRequests[0].expectedVersion,1);assert.equal(await js(`document.querySelector('.recognition-editor-panel input').value`),'Synthetic album');assert.equal(album.status,'DRAFT');await shot('publish-failure-320');
      publicationStatus=200;holdPublication=true;await textClick('Lưu và công bố');await wait(`document.querySelector('.recognition-editor-panel fieldset').disabled`);await textClick('Lưu và công bố');assert.equal(publicationRequests.length,2);holdPublication=false;releasePublication();await wait(`!document.querySelector('.recognition-editor-panel')&&document.querySelector('.recognition-status')?.textContent==='Công khai'`);assert.equal(album.status,'PUBLISHED');await shot('published-320');checks.push('Explicit publish intent/version;503 retains draft/input;pending duplicate blocked;successful retry publishes');
      album={...album,status:'DRAFT',participants:[]};await nav('/admin/recognition');await wait(`document.querySelector('.recognition-record')`);await textClick('Công bố album');await textClick('Lưu và công bố');await wait(`document.querySelector('.recognition-editor-panel [role=alert]')?.textContent.includes('ít nhất một')`);assert.equal(publicationRequests.length,2);checks.push('Existing participant eligibility validation prevents request');
      await textClick('Đóng');await textClick('Tạo vinh danh');await wait(`document.querySelector('.recognition-editor-panel')`);assert.equal(await js(`document.querySelector('select:has(option[value=PUBLISHED])').value`),'DRAFT');checks.push('Create remains draft by default');
      role='STUDENT';await nav('/admin/recognition');await wait(`!document.querySelector('.recognition-editor-panel')&&location.pathname!=='/admin/recognition'`);assert.equal(publicationRequests.length,2);checks.push('Non-admin route guard prevents publication UI');
    }
  }
  assert.deepEqual(errors,[]);
} catch(e){errors.push(e.stack);process.exitCode=1;}
finally{await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,requests,publicationRequests,reviewRequests,errors,limits:'Synthetic Chromium only; no live authorization/Cloudflare/login/OTP, physical mobile or screen-reader proof'},null,2));socket?.close();chrome.kill('SIGTERM');await new Promise(resolve=>chrome.once('exit',resolve));await rm(join(dir,'profile'),{recursive:true,force:true,maxRetries:5,retryDelay:100});console.log(JSON.stringify({dir,checks,screenshots:screenshots.length,errors}));}
