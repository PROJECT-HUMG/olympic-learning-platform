// Actual routes, synthetic intercepted API/widget only; no production content or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.VISUAL_WEB_URL??'http://127.0.0.1:3137',baseline=process.env.VISUAL_BASELINE==='1',scoped=process.env.VISUAL_SCOPED_COMMIT==='1';
const dir=await mkdtemp(join(tmpdir(),`mobile-modal-fixes-${baseline?'before':'after'}-`));
const observations=[];const checks=[],screenshots=[],requests=[],errors=[],networkFailures=[];
let failureContext=null;
let role='ADMIN',socket,call,js;
const uid='00000000-0000-0000-0000-000000000001';
let account=uid;
const user=()=>({id:account,username:'synthetic',fullName:'Synthetic administrator',email:'account'+ 'x'.repeat(80)+'@example.invalid',role,status:'ACTIVE',avatarUrl:null});
const chrome = spawn(process.env.ADOPTION_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
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
  const emptyPage={content:[],totalPages:0,totalElements:0,number:0,size:10};
  const metadata={subjects:[{id:'subject-1',name:'Giải tích',code:'MATH'}],categories:[{id:'category-1',name:'Giáo trình',code:'BOOK'}],tags:[{id:'tag-1',name:'Ôn tập',code:'REVIEW'}]};
  const job='00000000-0000-4000-8000-000000000099';
  let jobStatus=200, draftsStatus=200, mutationStatus=503, heldMutations=[], holdMutation=false;
  let metaError=false, topicError=false, honorsError=false, examError=false, holdQuery='', heldQueries=[];
  let reviewStatus='NEEDS_REVIEW';
  const draft=()=>({id:'draft-1',ordinal:1,status:reviewStatus,content:{text:'Synthetic extracted question',subjectId:'subject-1',topicId:'topic-1'},answer:{text:'Synthetic answer'},confidence:.8,warnings:[],sourcePage:1,sourcePageUrl:'/private-evidence.svg',assets:[]});
  const importStatus=()=>({id:job,status:'REVIEW_REQUIRED',phase:'REVIEW_REQUIRED',progress:100,totalPages:1,processedPages:1,draftCount:1,warningCount:0,createdAt:'2026-10-10T00:00:00Z',updatedAt:'2026-10-10T00:00:00Z'});
  const docs=()=>['phần giới hạn','phần tích phân'].map((suffix,i)=>({id:'doc-'+i,slug:'synthetic-doc-'+i,title:'Giáo trình Giải tích dành cho ôn luyện Olympic — '+suffix,description:'Synthetic only',category:metadata.categories[0],subject:metadata.subjects[0],tags:[],owner:user(),createdAt:'2026-10-10T00:00:00Z',viewCount:12,downloadCount:3,thumbnailUrl:null}));
  const posts=()=>['DRAFT','ARCHIVED'].map((status,i)=>({id:'post-'+i,slug:'synthetic-post-'+i,title:'Synthetic announcement awaiting editorial review '+i,summary:'Synthetic only',type:'NEWS',status,thumbnailUrl:'/broken-thumbnail.svg',author:null,pinned:false,expiredAt:'2020-10-01T00:00:00Z',viewCount:0,publishedAt:null,updatedAt:'2026-10-10T00:00:00Z',content:'<p>Synthetic</p>'}));
  let longNames=true;
  const record=()=>({id:'synthetic-record',userId:uid,fullName:'Synthetic reviewer context',title:'Thành tích '+ 'R'.repeat(180),description:'Synthetic only',category:'OLYMPIC_NATIONAL',award:'THIRD',includeParticipation:true,achievedDate:'2026-10-09',publicVisible:true,status:'PENDING',awardPoints:8,participationPoints:6,totalPoints:14,version:1,evidence:Array.from({length:3},(_,i)=>({id:'image-'+i,originalName:longNames?'Minh-chung-'+('image'.repeat(12))+'.png':'synthetic.png',contentType:'image/png',size:100}))});
  const picture='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#00387b"/></svg>';
  const fulfill=async e=>{
    const u=new URL(e.request.url),path=u.pathname,method=e.request.method;
    if(path==='/broken-thumbnail.svg')return reply(e,403,{});
    if(path==='/synthetic.svg')return reply(e,200,picture,'image/svg+xml');
    if(path==='/private-evidence.svg')return reply(e,200,picture,'image/svg+xml');
    if(!path.startsWith('/api/'))return u.origin===web?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
    requests.push({path,method,query:u.search,account,body:e.request.postData});
    if(method!=='GET'&&method!=='OPTIONS'&&!path.endsWith('/auth/refresh')){
      if(holdMutation)await new Promise(resolve=>heldMutations.push(resolve));
      if(path==='/api/v1/assessment-imports')return reply(e,200,importStatus());
      if(mutationStatus===200&&path.endsWith('/approve'))reviewStatus='APPROVED';
      if(mutationStatus===200&&path.endsWith('/reject'))reviewStatus='REJECTED';
      return reply(e,mutationStatus,mutationStatus===200?(path.includes('/storage/')?{id:'00000000-0000-4000-8000-000000000055',url:'/synthetic.svg'}:path==='/api/v1/groups'?{id:'00000000-0000-4000-8000-000000000088',name:'Synthetic group',ownerId:uid}:draft()):{status:mutationStatus,title:'Synthetic failure',detail:'Synthetic failure; try again'});
    }
    if(holdQuery&&path.includes(holdQuery))await new Promise(resolve=>heldQueries.push(resolve));
    if(path.endsWith('/admin/recognition/achievements'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:1,content:[record()]});
    if(path.includes('/achievements/')&&path.includes('/evidence/'))return reply(e,200,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'),'image/png');
    if(path.endsWith('/documents/synthetic-doc-0'))return reply(e,200,{...docs()[0],fileSize:2048,downloadUrl:null});
    if(path.endsWith('/posts/slug/synthetic-news'))return reply(e,200,{...posts()[0],title:'Synthetic mobile reading',status:'PUBLISHED',createdAt:'2026-10-10T00:00:00Z',publishedAt:'2026-10-10T00:00:00Z',expiredAt:null,content:'<p>Synthetic only</p><img src="/synthetic.svg" alt="Synthetic local landscape" />',thumbnailUrl:'/synthetic.svg'});
    if(path.endsWith('/groups')||path.includes('/daily-groups')||path.includes('/invitations'))return reply(e,200,[]);
    if(path.endsWith('/users/me'))return reply(e,200,user());
    if(path.endsWith('/auth/refresh'))return reply(e,200,{accessToken:'synthetic'});
    if(path==='/api/v1/assessment-imports/'+job)return reply(e,jobStatus,jobStatus===200?importStatus():{status:jobStatus,title:'Synthetic denied',detail:'Synthetic unavailable'});
    if(path==='/api/v1/assessment-imports/'+job+'/drafts')return reply(e,draftsStatus,draftsStatus===200?[draft()]:{status:draftsStatus,title:'Synthetic unavailable',detail:'Synthetic unavailable'});
    if(path.endsWith('/documents/metadata'))return reply(e,metaError?503:200,metaError?{status:503,title:'Synthetic metadata failure',detail:'Synthetic metadata failure'}:metadata);
    if(path.endsWith('/topics'))return reply(e,topicError?503:200,topicError?{status:503,title:'Synthetic topic failure'}:[{id:'topic-1',name:'Đạo hàm',subjectId:'subject-1'}]);
    if(path.endsWith('/documents'))return reply(e,200,{...emptyPage,totalPages:3,totalElements:22,content:docs()});
    if(path.endsWith('/posts/management'))return reply(e,200,{...emptyPage,totalPages:3,totalElements:22,content:posts()});
    if(path.endsWith('/status-counts'))return reply(e,200,{draft:1,published:0,expired:0,archived:1});
    if(path.endsWith('/admin/users/permissions'))return reply(e,200,Array.from({length:12},(_,i)=>({id:'MANAGE_POSTS_'+i,description:'Cho phép quản lý nội dung học tập, kiểm tra và điều phối cập nhật. '.repeat(3)})));
    if(path.endsWith('/admin/users'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:2,content:[1,2].map(i=>({...user(),id:uid.slice(0,-1)+i,fullName:'Synthetic administrator '+i,email:'administrator-'+i+'x'.repeat(80)+'@example.invalid',createdAt:'2026-10-01T00:00:00Z',permissions:['MANAGE_POSTS','MANAGE_DOCUMENTS','MANAGE_QUESTIONS']}))});
    if(path.endsWith('/questions/legacy'))return reply(e,200,{id:'legacy',subjectId:'subject-1',subjectName:'Giải tích',topicId:'topic-1',topicName:'Đạo hàm',status:'DRAFT',type:'ESSAY',content:{text:'Synthetic legacy question'},answer:{text:'Synthetic answer'},explanation:{text:'Synthetic explanation'},assets:[],createdById:uid,version:1});
    if(path.endsWith('/questions'))return reply(e,200,{...emptyPage,page:0,totalPages:1,totalElements:1,content:[{id:'question-1',subjectName:'Giải tích',topicName:'Đạo hàm',status:'DRAFT',createdById:uid,content:{schemaVersion:1,title:'Synthetic question',structure:'SINGLE',stem:[],parts:[]},version:1}]});
    if(path.endsWith('/recognition/honors'))return reply(e,honorsError?503:200,honorsError?{status:503,title:'Synthetic honors failure'}:{...emptyPage,totalPages:1,totalElements:1,content:[{id:'synthetic-album',title:'Synthetic album',subject:'Toán',year:2026,description:'Synthetic only',scope:'SCHOOL',status:'DRAFT',participants:[],photos:[],version:1}]});
    if(path.endsWith('/exams')||path.endsWith('/exams/drafts'))return reply(e,examError?503:200,examError?{status:503,title:'Synthetic exams failure'}:[]);
    if(path.endsWith('/exams/papers'))return reply(e,200,[]);
    if(path.endsWith('/study-rooms'))return reply(e,200,[]);
    return reply(e,200,emptyPage);
  };
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(e => errors.push(e.message));
    else if (m.method === 'Network.loadingFailed') networkFailures.push(m.params);
    else if (m.method === 'Network.responseReceived'&&m.params.response.status>=400) networkFailures.push({url:m.params.response.url,status:m.params.response.status});
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);

  };
  js = async expression => {
    const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text); return r.result.value;
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { for (let i = 0; i < 600; i++) { if (await js(`Boolean(${expression})`)) return; await delay(50); } throw Error('Timeout: ' + expression); };
  const key = async k => {
    const n = { Enter: 13, Escape: 27, Tab: 9, ' ': 32, ArrowLeft:37, ArrowUp:38, ArrowRight:39, ArrowDown:40 }[k] ?? 0;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: n, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: n });
  };
  await call('Runtime.enable');await call('Network.enable');await call('Page.enable');await call('Page.bringToFront');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.probeDocument=String(Date.now())+Math.random()'});
  const resize=async(width,height=720)=>{await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await delay(200);};
  const nav=async path=>{
    const old=await js('window.probeDocument');
    await call('Page.navigate',{url:web+path});
    await wait(`window.probeDocument!==${JSON.stringify(old)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);
  };
  const shot=async name=>{await delay(200);const geometry=await js(`(()=>{const rect=e=>e?.getBoundingClientRect().toJSON();const modal=[...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]')].at(-1);return {width:innerWidth,height:innerHeight,viewport:{width:visualViewport.width,height:visualViewport.height,offsetTop:visualViewport.offsetTop},pageScroll:scrollY,bodyOverflow:getComputedStyle(document.body).overflow,theme:document.documentElement.className,frame:rect(modal),frameClient:modal&&[modal.clientWidth,modal.clientHeight],frameScroll:modal&&[modal.scrollWidth,modal.scrollHeight,modal.scrollTop],header:rect(modal?.querySelector('[data-slot=dialog-header]')),body:rect(modal?.querySelector('.creation-dialog__body')),bodyScroll:modal?.querySelector('.creation-dialog__body')&&[modal.querySelector('.creation-dialog__body').clientHeight,modal.querySelector('.creation-dialog__body').scrollHeight,modal.querySelector('.creation-dialog__body').scrollTop],focus:{text:document.activeElement?.textContent?.slice(0,70),rect:rect(document.activeElement),inside:modal?.contains(document.activeElement)},controls:[...(modal?.querySelectorAll('button,input,textarea,select')??[])].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent?.trim().slice(0,60),label:e.getAttribute('aria-label'),type:e.type,rect:rect(e),disabled:e.disabled})),titleOverflow:modal?.querySelector('[data-slot=dialog-title]')&&[modal.querySelector('[data-slot=dialog-title]').clientWidth,modal.querySelector('[data-slot=dialog-title]').scrollWidth]}})()`);const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push({path,geometry});};
  const theme=value=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(value)}))`);
  const clickText=async text=>js(`(()=>{const scope=document.querySelector('[role=alertdialog]')??[...document.querySelectorAll('[role=dialog]')].at(-1)??document;const b=[...scope.querySelectorAll('button,a[data-slot="button"]')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('missing '+${JSON.stringify(text)});b.focus();b.click()})()`);
  const fill=async(selector,value)=>{ await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('missing input');e.focus();Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`); await delay(100); };
  const dialog=()=>wait(`!!document.querySelector('.creation-dialog')`);




  const endScroll=()=>js(`(()=>{const d=[...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]')].at(-1),b=d.querySelector('.creation-dialog__body')??d;b.scrollTop=b.scrollHeight;})()`);
  const frameFits=async label=>{
    const g=await js(`(()=>{const d=[...document.querySelectorAll('[role=dialog],dialog[open]')].at(-1);return {client:d.clientWidth,scroll:d.scrollWidth,width:d.getBoundingClientRect().width}})()`);
    observations.push({label,...g}); if(!baseline)assert.ok(g.scroll<=g.client+1,`${label}: overflow ${g.scroll}/${g.client}`);
  };
  const pointer=async selector=>{
    const point=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;return {x,y,hit:e.contains(document.elementFromPoint(x,y)),height:r.height}})()`);
    assert.ok(point.hit&&point.y>0,`Pointer blocked: ${selector}`);
    await call('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});
  };
  const matrix=baseline?[[320,280,'dark']]:process.env.VISUAL_REMAINING==='1'?[[768,1024,'light'],[1280,800,'dark']]:[[320,568,'light'],[390,844,'dark'],[320,280,'dark'],[667,320,'light'],[844,390,'dark'],[768,1024,'light'],[1280,800,'dark']];
  for(const [w,h,t] of matrix){
    await resize(w,h);await nav('/admin/users');await theme(t);
    await wait(`document.querySelector('main button[aria-label*="administrator-1"]')`);
    await js(`(()=>{const b=[...document.querySelectorAll('main button[aria-label*="administrator-1"]')].find(e=>e.getClientRects().length);b.focus();b.click()})()`);
    await wait(`document.querySelector('[role=dialog]')`);await shot(`permissions-${w}x${h}-${t}`);await frameFits('permissions '+w+'x'+h);
    assert.ok(await js(`document.querySelector('[data-slot=dialog-description]').textContent.includes('@example.invalid')`));
    await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);
    await wait(`document.activeElement.getAttribute('aria-label')?.includes('administrator-1')`);
    await nav('/admin/recognition?tab=reviews');await wait(`document.querySelector('.recognition-record,.achievement-presentation__record')`);
    await clickText('Không duyệt');await wait(`document.querySelector('.recognition-review-dialog')`);
    await fill('.recognition-review-dialog textarea','Synthetic review context '.repeat(25));
    await shot(`review-${w}x${h}-${t}`);await frameFits('review '+w+'x'+h);
    await key('Escape');await wait(`!document.querySelector('.recognition-review-dialog')`);
    await wait(`document.querySelector('.evidence-photo')`);
    await js(`document.querySelector('.evidence-photo').focus();document.activeElement.click()`);
    await wait(`document.querySelector('.evidence-viewer img')`);
    await shot(`viewer-context-${w}x${h}-${t}`);await frameFits('viewer '+w+'x'+h);
    await endScroll();await shot(`viewer-controls-${w}x${h}-${t}`);
    const viewer=await js(`(()=>{const d=document.querySelector('.evidence-viewer'),b=[...d.querySelectorAll('button')].find(e=>e.textContent.trim()==='Phóng to');b.focus();const r=b.getBoundingClientRect(),header=d.querySelector('[data-slot=dialog-header]').getBoundingClientRect(),close=d.querySelector('.evidence-gallery-close').getBoundingClientRect();return {focus:r.toJSON(),header:header.toJSON(),close:close.toJSON(),hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),description:d.querySelector('[data-slot=dialog-description]').textContent,download:d.querySelector('button[aria-label^="Tải tệp"]')?.getAttribute('aria-label')}})()`);
    observations.push({label:'focus-zoom '+w+'x'+h,...viewer});
    if(!baseline){assert.ok(viewer.hit,'Zoom obscured');assert.ok(viewer.focus.y>=viewer.header.bottom-1);assert.ok(viewer.close.x>=16&&viewer.close.right<=w-16);assert.ok(viewer.download.includes('imageimage'));}
    await shot(`viewer-focus-${w}x${h}-${t}`);await clickText('Phóng to');await wait(`document.querySelector('.evidence-gallery-view--zoomed')`);
    await key('Escape');await wait(`!document.querySelector('.evidence-viewer')`);assert.ok(await js(`document.activeElement.classList.contains('evidence-photo')`));
    checks.push(`Long permission/review text, viewer controls/zoom/Escape/focus ${w}x${h} ${t}`);
  }
  // Native group creation keeps its own lifecycle and restores the previous inline style.
  await resize(320,280);await nav('/daily/groups');await theme('dark');
  await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes('Tạo nhóm mới'))`);
  await js(`document.body.style.overflow='auto';const spacer=document.createElement('div');spacer.style.height='1200px';spacer.dataset.probeSpacer='';document.querySelector('main').append(spacer);window.scrollTo(0,120)`);
  await clickText('Tạo nhóm mới');await wait(`document.querySelector('dialog[open]')`);await fill('#group-name','Synthetic retained group');await endScroll();await shot('native-group-actions-320x280-dark');
  const native=await js(`({overflow:document.body.style.overflow,buttons:[...document.querySelector('dialog[open]').querySelectorAll('button')].map(e=>e.getBoundingClientRect().height),before:scrollY})`);
  await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:2,y:120,deltaX:0,deltaY:200});await delay(250);
  native.after=await js('scrollY');observations.push({label:'native group wheel and targets',...native});
  if(!baseline){assert.equal(native.overflow,'hidden');assert.equal(native.before,native.after);assert.ok(native.buttons.every(h=>h>=44));assert.ok(await js(`[...document.querySelector('dialog[open]').querySelectorAll('button')].every(e=>e.getBoundingClientRect().width>=44)`));}
  await key('Escape');await wait(`!document.querySelector('dialog[open]')`);await delay(50);assert.equal(await js(`document.body.style.overflow`),'auto');assert.equal(await js(`document.activeElement.textContent.trim()`),'Tạo nhóm mới');
  await clickText('Tạo nhóm mới');await wait(`document.querySelector('dialog[open]')`);assert.equal(await js(`document.querySelector('#group-name').value`),'Synthetic retained group');
  await js(`document.querySelector('dialog[open] form').requestSubmit()`);await wait(scoped?`document.querySelector('.study-notebook > p.study-context[role=status]')?.textContent.length>0&&!document.querySelector('#group-name').disabled`:`document.querySelector('dialog[open] [role=alert]').textContent.length>0`);await shot('native-group-error-320x280');
  assert.equal(await js(`document.querySelector('#group-name').value`),'Synthetic retained group');
  await endScroll();await clickText('Hủy');await wait(`!document.querySelector('dialog[open]')`);await delay(50);assert.equal(await js(`document.body.style.overflow`),'auto');
  if(!baseline){
    await clickText('Tạo nhóm mới');await wait(`document.querySelector('dialog[open]')`);await js(`document.querySelector('dialog[open]').scrollTop=0`);await pointer('dialog[open] button[aria-label="Đóng tạo nhóm"]');await wait(`!document.querySelector('dialog[open]')`);await delay(50);assert.equal(await js(`document.body.style.overflow`),'auto');
    await clickText('Tạo nhóm mới');await wait(`document.querySelector('dialog[open]')`);
    await js(`document.querySelector('a[href="/daily"]')?.click()`);await wait(`!document.querySelector('dialog[open]')`);await delay(50);assert.equal(await js(`document.body.style.overflow`),'auto');
    checks.push('Native group44px + outside wheel lock + Escape/Cancel/Close/unmount restoration + failure draft');
  }
  // Nested actual Post editor: scroll to pointer Cancel, pending guard, retry and exact focus return.
  await resize(320,280);await nav('/admin/posts');await theme('light');
  await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Tạo bài viết mới')`);await clickText('Tạo bài viết mới');await dialog();await wait(`document.querySelector('.tiptap')`);
  const openImage=async()=>{await js(`document.querySelector('button[aria-label="Chèn hình ảnh"]').focus();document.activeElement.click()`);await wait(`document.querySelectorAll('[role=dialog]').length===2`);};
  await openImage();await shot('nested-image-top-320x280-light');await endScroll();await shot('nested-image-bottom-320x280-light');
  const picker=await js(`(()=>{const d=[...document.querySelectorAll('[role=dialog]')].at(-1),b=[...d.querySelectorAll('button')].find(e=>e.textContent.trim()==='Hủy'),c=d.querySelector('button[aria-label="Đóng hộp thoại"]');return {cancel:!!b,cancelRect:b?.getBoundingClientRect().toJSON(),close:c?.getBoundingClientRect().toJSON(),scroll:d.scrollTop}})()`);observations.push({label:'nested picker pointer exit',...picker});
  if(!baseline){assert.ok(picker.cancel);await pointer('[role=dialog]:not(.creation-dialog) [data-slot=dialog-footer] button');await wait(`document.querySelectorAll('[role=dialog]').length===1`);assert.equal(await js(`document.activeElement.getAttribute('aria-label')`),'Chèn hình ảnh');await openImage();}
  await key('Escape');await wait(`document.querySelectorAll('[role=dialog]').length===1`);assert.equal(await js(`document.activeElement.getAttribute('aria-label')`),'Chèn hình ảnh');
  if(!baseline){
    await fill('.creation-dialog input[name="title"]','Retained post draft');await openImage();
    const selectFile=()=>js(`(()=>{const e=document.querySelector('[role=dialog]:not(.creation-dialog) input[type=file]');const dt=new DataTransfer();dt.items.add(new File(['synthetic'],'synthetic.png',{type:'image/png'}));e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    holdMutation=true;await selectFile();await wait(`document.querySelector('[aria-label="Chọn ảnh chèn vào bài viết"]').disabled`);
    assert.equal(await js(`document.querySelector('[role=dialog]:not(.creation-dialog) [data-slot=dialog-footer] button').disabled`),true);
    await key('Escape');assert.equal(await js(`document.querySelectorAll('[role=dialog]').length`),2);
    await wait(`document.querySelector('[aria-label="Chọn ảnh chèn vào bài viết"]').disabled`);holdMutation=false;heldMutations.splice(0).forEach(r=>r());
    await wait(`!document.querySelector('[aria-label="Chọn ảnh chèn vào bài viết"]').disabled`);assert.equal(await js(`document.querySelector('.creation-dialog input[name="title"]').value`),'Retained post draft');
    mutationStatus=200;await selectFile();await wait(`document.querySelectorAll('[role=dialog]').length===1`);await wait(`document.querySelector('.tiptap img')`);assert.ok(await js(`document.querySelector('.tiptap img').getAttribute('src').includes('synthetic.svg')`));
    await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');await wait(`!document.querySelector('[role=alertdialog]')`);assert.equal(await js(`document.querySelector('.creation-dialog input[name="title"]').value`),'Retained post draft');
    checks.push('Nested picker pointer Cancel/Escape focus + pending upload guards + failure/retry URL completion + parent dirty retention');
    await resize(390,844);await theme('dark');await openImage();await shot('nested-image-390x844-dark');await key('Escape');await wait(`document.querySelectorAll('[role=dialog]').length===1`);
    // Viewport shrink with focused input simulates the controllable portion of keyboard constraints.
    await openImage();await clickText('Đường dẫn URL');await fill('[role=dialog]:not(.creation-dialog) input:not([type=file])','https://example.invalid/synthetic.png');await resize(390,280);await endScroll();await shot('nested-image-focused-shrink-390x280');await pointer('[role=dialog]:not(.creation-dialog) [data-slot=dialog-footer] button');await wait(`document.querySelectorAll('[role=dialog]').length===1`);
    checks.push('Focused URL viewport shrink retains draft and pointer Cancel');
  }
} catch(e){errors.push(e.stack);if(js)failureContext=await js(`({url:location.href,body:document.body.textContent.slice(0,5000)})`).catch(()=>null);process.exitCode=1;if(call)await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));}
finally{await writeFile(join(dir,'results.json'),JSON.stringify({observations,checks,screenshots,requests,errors,networkFailures,failureContext,baseline,limits:'Actual source/route owners + synthetic intercepted API; no live mutation. Mobile emulation/resize is not physical IME/iOS/notch/screen-reader proof.'},null,2));socket?.close();chrome.kill('SIGTERM');await new Promise(resolve=>{if(chrome.exitCode!==null)resolve();else{chrome.once('exit',resolve);setTimeout(resolve,3000)}});await rm(join(dir,'profile'),{recursive:true,force:true,maxRetries:5,retryDelay:100});console.log(JSON.stringify({dir,checks,screenshots:screenshots.length,errors}));}
