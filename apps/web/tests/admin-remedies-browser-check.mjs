// Actual routes, synthetic intercepted API/widget only; no production content or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.VISUAL_WEB_URL??'http://127.0.0.1:3137',baseline=process.env.VISUAL_BASELINE==='1';
const dir=await mkdtemp(join(tmpdir(),`admin-remedies-${baseline?'before':'after'}-`));
const observations=[];const checks=[],screenshots=[],requests=[],errors=[],networkFailures=[];
let failureContext=null;
let role='ADMIN',socket,call,js;
const uid='00000000-0000-0000-0000-000000000001';
let account=uid;
const user=()=>({id:account,username:'synthetic',fullName:'Synthetic administrator',email:'fixture@example.invalid',role,status:'ACTIVE',avatarUrl:null});
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
  const picture='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#00387b"/></svg>';
  const fulfill=async e=>{
    const u=new URL(e.request.url),path=u.pathname,method=e.request.method;
    if(path==='/broken-thumbnail.svg')return reply(e,403,{});
    if(path==='/private-evidence.svg')return reply(e,200,picture,'image/svg+xml');
    if(!path.startsWith('/api/'))return u.origin===web?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
    requests.push({path,method,query:u.search,account,body:e.request.postData});
    if(method!=='GET'&&method!=='OPTIONS'&&!path.endsWith('/auth/refresh')){
      if(holdMutation)await new Promise(resolve=>heldMutations.push(resolve));
      if(path==='/api/v1/assessment-imports')return reply(e,200,importStatus());
      if(mutationStatus===200&&path.endsWith('/approve'))reviewStatus='APPROVED';
      if(mutationStatus===200&&path.endsWith('/reject'))reviewStatus='REJECTED';
      return reply(e,mutationStatus,mutationStatus===200?draft():{status:mutationStatus,title:'Synthetic failure',detail:'Synthetic failure; try again'});
    }
    if(holdQuery&&path.includes(holdQuery))await new Promise(resolve=>heldQueries.push(resolve));
    if(path.endsWith('/users/me'))return reply(e,200,user());
    if(path.endsWith('/auth/refresh'))return reply(e,200,{accessToken:'synthetic'});
    if(path==='/api/v1/assessment-imports/'+job)return reply(e,jobStatus,jobStatus===200?importStatus():{status:jobStatus,title:'Synthetic denied',detail:'Synthetic unavailable'});
    if(path==='/api/v1/assessment-imports/'+job+'/drafts')return reply(e,draftsStatus,draftsStatus===200?[draft()]:{status:draftsStatus,title:'Synthetic unavailable',detail:'Synthetic unavailable'});
    if(path.endsWith('/documents/metadata'))return reply(e,metaError?503:200,metaError?{status:503,title:'Synthetic metadata failure',detail:'Synthetic metadata failure'}:metadata);
    if(path.endsWith('/topics'))return reply(e,topicError?503:200,topicError?{status:503,title:'Synthetic topic failure'}:[{id:'topic-1',name:'Đạo hàm',subjectId:'subject-1'}]);
    if(path.endsWith('/documents'))return reply(e,200,{...emptyPage,totalPages:3,totalElements:22,content:docs()});
    if(path.endsWith('/posts/management'))return reply(e,200,{...emptyPage,totalPages:3,totalElements:22,content:posts()});
    if(path.endsWith('/status-counts'))return reply(e,200,{draft:1,published:0,expired:0,archived:1});
    if(path.endsWith('/admin/users/permissions'))return reply(e,200,[{id:'MANAGE_POSTS',description:'Synthetic permission'}]);
    if(path.endsWith('/admin/users'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:2,content:[1,2].map(i=>({...user(),id:uid.slice(0,-1)+i,fullName:'Synthetic administrator '+i,email:'administrator-'+i+'@example.invalid',createdAt:'2026-10-01T00:00:00Z',permissions:['MANAGE_POSTS','MANAGE_DOCUMENTS','MANAGE_QUESTIONS']}))});
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
  const resize=(width,height=720)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const nav=async path=>{
    const old=await js('window.probeDocument');
    await call('Page.navigate',{url:web+path});
    await wait(`window.probeDocument!==${JSON.stringify(old)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);
  };
  const shot=async name=>{await delay(200);const geometry=await js(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.className,account:document.getElementById('login-identifier')?.getBoundingClientRect().toJSON(),password:document.getElementById('login-password')?.getBoundingClientRect().toJSON(),forgot:document.querySelector('a[href="/forgot-password"]')?.getBoundingClientRect().toJSON()})`);if(!baseline)assert.ok(geometry.scrollWidth<=geometry.width,'overflow '+name);const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push({path,geometry});};
  const theme=value=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(value)}))`);
  const clickText=async text=>js(`(()=>{const scope=document.querySelector('[role=alertdialog]')??[...document.querySelectorAll('[role=dialog]')].at(-1)??document;const b=[...scope.querySelectorAll('button,a[data-slot="button"]')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('missing '+${JSON.stringify(text)});b.focus();b.click()})()`);
  const fill=async(selector,value)=>{ await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('missing input');e.focus();Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`); await delay(100); };
  const dialog=()=>wait(`!!document.querySelector('.creation-dialog')`);


  const invalidate=key=>js(`import('/src/lib/query-client.ts').then(m=>{m.queryClient.setDefaultOptions({queries:{retry:false,refetchOnWindowFocus:false}});void m.queryClient.invalidateQueries({queryKey:${JSON.stringify(key)}})})`);
  const releaseQueries=()=>{holdQuery='';heldQueries.splice(0).forEach(r=>r());};
  const releaseMutations=()=>{holdMutation=false;heldMutations.splice(0).forEach(r=>r());};
  const visible=selector=>js(`!![...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length)`);
  const select=async(index,value)=>{await js(`(()=>{const e=document.querySelectorAll('main select')[${index}];e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await delay(100);};
  if(process.env.ADMIN_EDITORS_ONLY!=='1') {
  for(const [width,height,t] of process.env.ADMIN_LIFECYCLE_ONLY==='1'?[]:[[320,568,'light'],[390,844,'dark'],[820,900,'light'],[1440,900,'dark']]){
    await resize(width,height);
    for(const [route,selector] of (process.env.ADMIN_LAYOUT_ONLY==='1'?[['/admin/documents','main a[href^="/documents/"]']]:[['/admin/users','main button'],['/admin/documents','main a[href^="/documents/"]'],['/admin/posts','main .content-card'],['/admin/categories','main tbody button'],['/admin/questions','main .content-card'],['/admin/recognition','main .recognition-record']])){
      await nav(route);await theme(t);await wait(`document.querySelector(${JSON.stringify(selector)})`);await delay(200);await shot(route.replaceAll('/','-')+'-'+width+'-'+t);
      observations.push(await js(`({route:location.pathname,width:innerWidth,search:document.querySelector('main input')?.getBoundingClientRect().toJSON(),documentTitles:[...document.querySelectorAll('main a[href^="/documents/"]')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()})),mobileUsers:[...document.querySelectorAll('main ul li')].map(e=>({text:e.textContent,action:e.querySelector('button')?.getBoundingClientRect().toJSON()}))})`));
      if(route==='/admin/users'&&width<768){
        assert.equal(await visible('main tbody button'),false);
        assert.equal(await js(`document.querySelectorAll('main ul li').length`),2);
        assert.ok(await js(`Array.from(document.querySelectorAll('main ul li')).every(li=>li.textContent.includes('@example.invalid')&&li.querySelector('button').getBoundingClientRect().height>=44&&li.querySelector('button').getAttribute('aria-label').includes(li.querySelector('p').textContent))`));
      }
      if(route==='/admin/posts'){
        await wait(`Array.from(document.querySelectorAll('main .content-card .sr-only')).some(e=>e.textContent.includes('Không tải được'))`);
        assert.equal(await js(`document.querySelector('main').textContent.includes('Hết hiệu lực')&&Array.from(document.querySelectorAll('main .content-card')).some(e=>e.textContent.includes('Hết hiệu lực'))`),false);
      }
      if(route==='/admin/documents')assert.ok(await js(`Array.from(document.querySelectorAll('main a[href^="/documents/"]')).every(e=>getComputedStyle(e).whiteSpace==='normal'&&e.scrollWidth<=e.clientWidth+1)`));
      if(route==='/admin/recognition')assert.equal(await js(`document.querySelectorAll('main .recognition-tabs button[aria-current=page]').length`),1);
    }
    checks.push((process.env.ADMIN_LAYOUT_ONLY==='1'?'Documents compact-filter layout: ':'Six populated admin families: ')+width+' '+t+(process.env.ADMIN_LAYOUT_ONLY==='1'?'; no page overflow and readable document suffixes':'; no page overflow, mobile identity/action context, readable document suffixes, post fallback/status, active Recognition navigation'));
  }
  if(process.env.ADMIN_LAYOUT_ONLY!=='1') {
  await resize(320,568);await nav('/admin/users');await wait(`document.querySelector('main ul li button')`);await js(`document.querySelector('main ul li button').focus()`);await key('Enter');await wait(`document.querySelector('[role=dialog]')`);assert.ok(await js(`document.querySelector('[role=dialog]').textContent.includes('administrator-1@example.invalid')`));await shot('users-permissions-320');await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);assert.ok(await js(`document.activeElement.getAttribute('aria-label')?.includes('administrator-1')`));checks.push('Users mobile keyboard opens correct identity, Escape returns focus; no grants/revocations');
  if(process.env.ADMIN_RECOVERY_ONLY!=='1') {
  for(const [route,label] of [['/admin/posts','Xóa bài viết'],['/admin/documents','Xóa tài liệu'],['/admin/categories','Xóa']]){
    await nav(route);await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Xóa')`);await clickText('Xóa');await wait(`document.querySelector('[role=alertdialog]')`);const target=await js(`document.querySelector('[role=alertdialog]').textContent`);
    holdMutation=true;mutationStatus=503;await clickText(label);await wait(`Array.from(document.querySelectorAll('[role=alertdialog] button')).some(b=>b.disabled)`);
    await key('Escape');await delay(100);assert.ok(await visible('[role=alertdialog]'));await call('Input.dispatchMouseEvent',{type:'mousePressed',x:2,y:2,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:2,y:2,button:'left',clickCount:1});assert.ok(await visible('[role=alertdialog]'));
    releaseMutations();await wait(`document.querySelector('[role=alertdialog] [role=alert]')`);assert.ok((await js(`document.querySelector('[role=alertdialog]').textContent`)).includes(target.split('không?')[0].split('Xác nhận')[1]?.trim()||'Xác nhận'));await shot('delete-failure-'+route.replaceAll('/','-'));
    mutationStatus=200;await clickText(label);await wait(`!document.querySelector('[role=alertdialog]')`);mutationStatus=503;
    checks.push(route+' delete: pending Escape/backdrop blocked,503 target/error retained, explicit successful retry closes');
  }
  await nav('/admin/posts?page=3&context=keep');await wait(`document.querySelector('main select')`);await select(0,'EXPIRED');await wait(`new URLSearchParams(location.search).get('status')==='EXPIRED'&&!new URLSearchParams(location.search).has('page')`);await delay(250);assert.ok(requests.some(r=>r.path.endsWith('/posts/management')&&new URLSearchParams(r.query).get('expired')==='true'&&new URLSearchParams(r.query).get('status')==='PUBLISHED'&&new URLSearchParams(r.query).get('page')==='0'));
  await fill('main input','limits');await delay(550);assert.ok(requests.some(r=>r.path.endsWith('/posts/management')&&new URLSearchParams(r.query).get('keyword')==='limits'));await clickText('Xóa bộ lọc');await wait(`location.search==='?context=keep'`);
  await nav('/admin/documents?page=3&context=keep');await wait(`document.querySelectorAll('main select').length===2`);await select(0,'subject-1');await select(1,'category-1');await delay(300);assert.ok(requests.some(r=>r.path.endsWith('/documents')&&new URLSearchParams(r.query).get('subjectId')==='subject-1'&&new URLSearchParams(r.query).get('categoryId')==='category-1'&&new URLSearchParams(r.query).get('page')==='0'));await js(`history.back()`);await wait(`!new URLSearchParams(location.search).has('categoryId')`);assert.equal(await js(`document.querySelectorAll('main select')[0].value`),'subject-1');await clickText('Xóa bộ lọc');await wait(`location.search==='?context=keep'`);checks.push('Post expiry + Documents subject/kind filters reset page; keyword500ms debounce retained; browser Back restores selection, Reset keeps unrelated context');
  }
  if(process.env.ADMIN_IMPORT_ONLY!=='1') {
  metaError=true;await nav('/admin/questions');await invalidate(['documents']);await wait(`document.querySelector('main [role=alert]')`);assert.ok(await js(`document.querySelector('main select').disabled`));await shot('bank-metadata-error-320');holdQuery='documents/metadata';await clickText('Thử lại môn học');await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Thử lại môn học'&&b.disabled)||Array.from(document.querySelectorAll('main [role=status]')).some(e=>e.textContent.includes('Đang tải môn học'))`);metaError=false;releaseQueries();await wait(`!document.querySelector('main [role=alert]')`);checks.push('Question Bank metadata error/retry gates options independently of question results');
  await nav('/admin/recognition');await wait(`document.querySelector('main .recognition-record')`);honorsError=true;await invalidate(['recognition','admin-honors']);await wait(`document.querySelector('main [role=alert]')`);holdQuery='recognition/honors';await clickText('Thử lại');await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Thử lại'&&b.disabled)`);await shot('recognition-cached-retry-320');honorsError=false;releaseQueries();await wait(`!document.querySelector('main [role=alert]')`);
  await nav('/admin/exams');await wait(`document.querySelector('main h1')`);examError=true;await invalidate(['exams','drafts']);await wait(`document.querySelector('main [role=alert]')`);holdQuery='exams';await clickText('Thử lại');await wait(`document.querySelector('main [role=alert] button')?.disabled`);examError=false;releaseQueries();await wait(`!document.querySelector('main [role=alert]')`);checks.push('Cached Recognition and Exam retry remains disabled throughout fetch');
  }

  await call('Page.addScriptToEvaluateOnNewDocument',{source:"window.probeRejections=[];window.addEventListener('unhandledrejection',e=>{window.probeRejections.push(String(e.reason));e.preventDefault()})"});
  await nav('/admin/questions/import?importId=invalid');await wait(`document.querySelector('main [role=alert]')`);const before=requests.filter(r=>r.path.includes('/assessment-imports')).length;await delay(200);assert.equal(requests.filter(r=>r.path.includes('/assessment-imports')).length,before);await clickText('Bỏ mã phiên không hợp lệ');await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Nhập đề từ PDF')`);await clickText('Nhập đề từ PDF');await dialog();
  await js(`(()=>{const e=document.getElementById('assessment-pdf'),d=new DataTransfer();d.items.add(new File(['synthetic only'],'probe.pdf',{type:'application/pdf'}));e.files=d.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await clickText('Bắt đầu phân tích');await wait(`document.querySelector('main textarea')`);assert.equal(await js(`new URLSearchParams(location.search).get('importId')`),job);
  await fill('main textarea','Synthetic correction retained');await clickText('Lưu');await wait(`document.querySelector('main fieldset [role=alert]')`);assert.equal(await js(`document.querySelector('main textarea').value`),'Synthetic correction retained');assert.equal(await js(`document.activeElement.getAttribute('role')`),'alert');await shot('import-save-error-320');
  holdMutation=true;await clickText('Từ chối');await wait(`document.querySelector('main fieldset').disabled`);assert.ok(await js(`Array.from(document.querySelectorAll('main fieldset button')).filter(b=>['Lưu','Duyệt','Từ chối'].includes(b.textContent.trim())).every(b=>b.disabled)`));assert.ok(await js(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()==='Xuất bản ngân hàng câu hỏi').disabled`));releaseMutations();await wait(`document.querySelector('main fieldset [role=alert]')`);assert.equal(await js(`document.querySelector('main textarea').value`),'Synthetic correction retained');await shot('import-reject-error-320');checks.push('Import save/reject503: inline focused error, retained corrections; sibling and publish pending gates');
  jobStatus=503;await invalidate(['assessment-imports',job,'status']);await wait(`Array.from(document.querySelectorAll('main [role=alert]')).some(e=>e.textContent.includes('trạng thái'))`);assert.equal(await visible('main img[src="/private-evidence.svg"]'),false);assert.equal(await js(`document.querySelector('main textarea').value`),'Synthetic correction retained');jobStatus=200;await clickText('Thử tải lại');await wait(`document.querySelector('main img[src="/private-evidence.svg"]')`);checks.push('Transient job refresh503 retains correction text but hides protected media and blocks actions until revalidated');
  metaError=true;await invalidate(['documents']);await wait(`Array.from(document.querySelectorAll('main fieldset [role=alert]')).some(e=>e.textContent.includes('Chưa tải được môn học'))`);assert.equal(await js(`document.querySelector('main textarea').value`),'Synthetic correction retained');metaError=false;await clickText('Thử lại môn học');await wait(`!Array.from(document.querySelectorAll('main fieldset [role=alert]')).some(e=>e.textContent.includes('Chưa tải được môn học')||e.textContent.includes('Chưa tải được chủ đề'))`);topicError=true;await invalidate(['assessment-topics']);await wait(`Array.from(document.querySelectorAll('main fieldset [role=alert]')).some(e=>e.textContent.includes('Chưa tải được chủ đề'))`);topicError=false;await clickText('Thử lại chủ đề');await wait(`!Array.from(document.querySelectorAll('main fieldset [role=alert]')).some(e=>e.textContent.includes('Chưa tải được môn học')||e.textContent.includes('Chưa tải được chủ đề'))`);checks.push('Import subject/topic failures retry without replacing row draft');
  mutationStatus=200;const first=requests.length;await clickText('Duyệt');await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Xuất bản ngân hàng câu hỏi'&&!b.disabled)`);const writes=requests.slice(first).filter(r=>r.method!=='GET');assert.equal(writes[0].method,'PATCH');assert.ok(writes[1].path.endsWith('/approve'));checks.push('Approve still saves correction first; eligible publish enabled only after refreshed approved rows');
  const creates=requests.filter(r=>r.path==='/api/v1/assessment-imports'&&r.method==='POST').length;await call('Page.reload');await wait(`document.querySelector('main textarea')`);assert.equal(requests.filter(r=>r.path==='/api/v1/assessment-imports'&&r.method==='POST').length,creates);assert.ok(requests.filter(r=>r.path==='/api/v1/assessment-imports/'+job).length>=2);checks.push('Reload uses UUID URL to revalidate existing job without creating/uploading another');
  await fill('main textarea','Same-user refresh draft');holdQuery='assessment-imports';await js(`import('/src/stores/use-auth-store.ts').then(m=>m.useAuthStore.getState().setAccessToken('synthetic-renewed'))`);await delay(100);assert.equal(await visible('main img[src="/private-evidence.svg"]'),false);assert.equal(await js(`document.querySelector('main textarea').value`),'Same-user refresh draft');releaseQueries();await wait(`document.querySelector('main img[src="/private-evidence.svg"]')`);assert.equal(await js(`document.querySelector('main textarea').value`),'Same-user refresh draft');checks.push('Token revision revalidates media/actions while preserving same-account correction fields');
  jobStatus=503;await js(`import('/src/stores/use-auth-store.ts').then(m=>m.useAuthStore.getState().setAccessToken('synthetic-renewed-again'))`);await wait(`document.querySelector('main [role=alert]')`);assert.equal(await js(`document.querySelector('main textarea')?.value`),'Same-user refresh draft');assert.equal(await visible('main img[src="/private-evidence.svg"]'),false);jobStatus=200;await clickText('Thử tải lại');await wait(`document.querySelector('main img[src="/private-evidence.svg"]')`);checks.push('Failed token revalidation503 also retains corrections without protected media');
  for(const status of [403,404,410]){jobStatus=status;await invalidate(['assessment-imports',job,'status']);await wait(`document.querySelector('main [role=alert]')&&!document.querySelector('main textarea')`);assert.equal(await visible('main img[src="/private-evidence.svg"]'),false);await shot('import-access-'+status+'-320');jobStatus=200;await clickText('Thử tải lại');await wait(`document.querySelector('main textarea')`);}checks.push('403/404/410 remove cached private rows/media, explicit retry revalidates');
  draftsStatus=403;await invalidate(['assessment-imports',job,'drafts']);await wait(`document.querySelector('main [role=alert]')&&!document.querySelector('main textarea')`);draftsStatus=200;await clickText('Thử tải lại');await wait(`document.querySelector('main textarea')`);checks.push('Independent draft-access denial removes private review/media');
  account='00000000-0000-0000-0000-000000000002';holdQuery='assessment-imports';await invalidate(['auth','currentUser']);await wait(`!document.querySelector('main textarea')`);assert.equal(await visible('main img[src="/private-evidence.svg"]'),false);releaseQueries();await wait(`document.querySelector('main textarea')`);assert.notEqual(await js(`document.querySelector('main textarea').value`),'Same-user refresh draft');checks.push('Account switch discards prior-account local corrections/media and requires separate authorized job fetch');
  for(const [width,height,t] of [[390,844,'dark'],[820,900,'light'],[1440,900,'dark']]){await resize(width,height);await theme(t);await shot('import-review-'+width+'-'+t);}
  assert.equal(await js(`window.probeRejections?.length??0`),0);
  await js(`import('/src/lib/query-client.ts').then(async m=>{const auth=await import('/src/lib/auth-session.ts'),store=await import('/src/stores/use-auth-store.ts');auth.expireAuthSession(m.queryClient,()=>store.useAuthStore.getState().clearAuth())})`);await wait(`!document.querySelector('main textarea')`);assert.equal(await visible('main img[src="/private-evidence.svg"]'),false);checks.push('Existing auth expiry owner removes protected review/media');
  role='STUDENT';const staffCalls=requests.filter(r=>r.path.includes('/assessment-imports')).length;await nav('/admin/questions/import?importId='+job);await delay(500);assert.equal(requests.filter(r=>r.path.includes('/assessment-imports')).length,staffCalls);assert.equal(await visible('main img[src="/private-evidence.svg"]'),false);checks.push('Student route guard makes no job/evidence request');role='ADMIN';account=uid;
  }
  }
  if(process.env.ADMIN_LAYOUT_ONLY!=='1') {
  await resize(320,568);
  for(const [route,selector,subject,topic] of [['/admin/questions/new','#manual-title','#manual-subject','#manual-topic'],['/admin/exams/new','#exam-title','#exam-subject',null],['/admin/questions/legacy','#edit-content','#edit-subject','#edit-topic']]){
    metaError=false;topicError=false;await nav(route);
    if(route.endsWith('/legacy')){await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Chỉnh sửa')`);await clickText('Chỉnh sửa');}
    await wait(`document.querySelector(${JSON.stringify(selector)})`);await fill(selector,'Synthetic editor correction retained');
    if(route.endsWith('/questions/new')){await js(`(()=>{const e=document.querySelector('#manual-subject');e.value='subject-1';e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await wait(`document.querySelector('#manual-topic')?.options.length>1`);}
    metaError=true;await invalidate(['documents']);await wait(`Array.from(document.querySelectorAll('[role=alert]')).some(e=>e.textContent.includes('Chưa tải được môn học'))`);assert.equal(await js(`document.querySelector(${JSON.stringify(selector)}).value`),'Synthetic editor correction retained');assert.ok(await js(`document.querySelector(${JSON.stringify(subject)}).disabled`));
    metaError=false;await clickText('Thử lại môn học');await wait(`!Array.from(document.querySelectorAll('[role=alert]')).some(e=>e.textContent.includes('Chưa tải được môn học'))`);
    if(topic){topicError=true;await invalidate(['topics']);await wait(`Array.from(document.querySelectorAll('[role=alert]')).some(e=>e.textContent.includes('Chưa tải được chủ đề'))`);assert.ok(await js(`document.querySelector(${JSON.stringify(topic)}).disabled`));topicError=false;await clickText('Thử lại chủ đề');await wait(`!Array.from(document.querySelectorAll('[role=alert]')).some(e=>e.textContent.includes('Chưa tải được chủ đề'))`);}
    assert.equal(await js(`document.querySelector(${JSON.stringify(selector)}).value`),'Synthetic editor correction retained');await shot('editor-options-'+route.replaceAll('/','-')+'-320');checks.push(route+' subject/topic metadata recovery preserves local corrections and keeps retry outside form submission');
  }
  }
  assert.deepEqual(errors,[]);
} catch(e){errors.push(e.stack);if(js)failureContext=await js(`({url:location.href,heading:document.querySelector('main h1')?.textContent,buttons:Array.from(document.querySelectorAll('main button')).map(b=>({text:b.textContent,disabled:b.disabled})),cards:Array.from(document.querySelectorAll('main .content-card')).map(c=>c.textContent.slice(0,300))})`).catch(()=>null);process.exitCode=1;if(call)await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));}
finally{await writeFile(join(dir,'results.json'),JSON.stringify({observations,baseline,checks,screenshots,requests,errors,networkFailures,failureContext,limits:'Synthetic Chromium only; no live authorization/Cloudflare/OTP/persistence,physical mobile or screen-reader proof'},null,2));socket?.close();chrome.kill('SIGTERM');await new Promise(resolve=>{if(chrome.exitCode!==null)resolve();else{chrome.once('exit',resolve);setTimeout(resolve,3000)}});await rm(join(dir,'profile'),{recursive:true,force:true,maxRetries:5,retryDelay:100});console.log(JSON.stringify({dir,checks,screenshots:screenshots.length,errors}));}
