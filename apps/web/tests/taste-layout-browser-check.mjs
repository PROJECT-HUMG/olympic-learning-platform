// Actual routes, synthetic intercepted API/widget only; no production content or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.TASTE_WEB_URL??'http://127.0.0.1:3151',baseline=process.env.TASTE_PHASE==='before';
const dir=await mkdtemp(join(tmpdir(),`taste-layout-${baseline?'before':'after'}-`));
const checks=[],screenshots=[],requests=[],errors=[],networkFailures=[];

let role='ADMIN',socket,call,js,count=3;
const uid='00000000-0000-0000-0000-000000000001';
let account=uid;
const user=()=>({id:account,username:'synthetic',fullName:'Synthetic administrator',email:'fixture@example.invalid',role,status:'ACTIVE',avatarUrl:null});
const chrome = spawn(process.env.ADOPTION_CHROME_PATH ?? "/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
  ['--headless', '--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium startup timeout')), 40000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on('error', reject);chrome.on('exit',code=>{clearTimeout(timer);reject(Error('Chromium exited before DevTools: '+code));});
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
      { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' },{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,PATCH,DELETE,OPTIONS'},{name:'Cache-Control',value:'no-store'}],
    body: Buffer.from(contentType === 'application/json' ? JSON.stringify(body) : body).toString('base64'),
  }).then(result=>{if(e.request.url.includes('/api/'))console.log('fixture fulfilled',e.request.method,new URL(e.request.url).pathname,status);return result});
  const emptyPage={content:[],totalPages:0,totalElements:0,number:0,size:10};
  const metadata={subjects:[{id:'subject-1',name:'Giải tích',code:'MATH'}],categories:[{id:'category-1',name:'Giáo trình',code:'BOOK'}],tags:[{id:'tag-1',name:'Ôn tập',code:'REVIEW'}]};
  let documentStatus=200,documentEmpty=false,holdDocuments=false;
  const heldDocumentRequests=[];
  const docs=()=>['phần giới hạn','phần tích phân'].map((suffix,i)=>({id:'doc-'+i,slug:'synthetic-doc-'+i,title:'Giáo trình Giải tích dành cho ôn luyện Olympic — '+suffix,description:'Synthetic only',category:metadata.categories[0],subject:metadata.subjects[0],tags:[],owner:user(),createdAt:'2026-10-10T00:00:00Z',viewCount:12,downloadCount:3,thumbnailUrl:null}));
  const posts=()=>['DRAFT','ARCHIVED'].map((status,i)=>({id:'post-'+i,slug:'synthetic-post-'+i,title:'Synthetic announcement awaiting editorial review '+i,summary:'Synthetic only',type:'NEWS',status,thumbnailUrl:'/broken-thumbnail.svg',author:null,pinned:false,expiredAt:'2020-10-01T00:00:00Z',viewCount:0,publishedAt:null,updatedAt:'2026-10-10T00:00:00Z',content:'<p>Synthetic</p>'}));
  const picture='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#00387b"/></svg>';
  const fulfill=async e=>{
    const u=new URL(e.request.url),path=u.pathname,method=e.request.method;
    if(u.hostname==='fonts.googleapis.com')return reply(e,200,'','text/css');
    if(path==='/broken-thumbnail.svg')return reply(e,403,{});
    if(path==='/private-evidence.svg')return reply(e,200,picture,'image/svg+xml');
    if(!path.startsWith('/api/'))return u.origin===web?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
    requests.push({path,method,query:u.search,origin:u.origin,account,body:e.request.postData});if(method==='OPTIONS')return reply(e,204,'','text/plain');
    if(method!=='GET'&&method!=='OPTIONS'&&!path.endsWith('/auth/refresh'))return reply(e,503,{status:503,title:'Synthetic failure',detail:'Synthetic failure; try again'});
    if(path.endsWith('/users/me'))return reply(e,role==='ANON'?401:200,user());
    if(path.endsWith('/auth/refresh'))return reply(e,role==='ANON'?401:200,{accessToken:'synthetic'});
    if(path.endsWith('/documents/metadata'))return reply(e,200,metadata);
    if(path.endsWith('/documents')){
      if(holdDocuments)await new Promise(resolve=>heldDocumentRequests.push(resolve));
      return reply(e,documentStatus,documentStatus===200?{...emptyPage,totalPages:documentEmpty?0:3,totalElements:documentEmpty?0:22,content:documentEmpty?[]:docs()}:{status:documentStatus,title:'Synthetic document failure'});
    }
    if(path.endsWith('/posts/management'))return reply(e,200,{...emptyPage,totalPages:3,totalElements:22,content:posts()});
    if(path.endsWith('/status-counts'))return reply(e,200,{draft:1,published:0,expired:0,archived:1});
    if(path.endsWith('/admin/users/permissions'))return reply(e,200,[{id:'MANAGE_POSTS',description:'Synthetic permission'}]);
    if(path.endsWith('/admin/users'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:2,content:[1,2].map(i=>({...user(),id:uid.slice(0,-1)+i,fullName:'Synthetic administrator '+i,email:'administrator-'+i+'@example.invalid',createdAt:'2026-10-01T00:00:00Z',permissions:['MANAGE_POSTS','MANAGE_DOCUMENTS','MANAGE_QUESTIONS']}))});
    if(path.endsWith('/recognition/honors')&&!path.includes('/admin/'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:count,content:Array.from({length:count},(_,i)=>({id:'album-'+i,title:i?'Album kiểm thử '+i:'Album kiểm thử '+ 'A'.repeat(40),subject:'Toán',year:2026,status:'PUBLISHED',scope:'SCHOOL',participants:Array.from({length:5},(_,n)=>({userId:uid,fullName:n?'Thành viên thử nghiệm':'Tên kiểm thử '+ 'N'.repeat(35),award:'Tham gia',avatarUrl:null,profileAvailable:true})),photos:i===2?[]:[{id:'photo-1',originalName:'synthetic.png'}]}))});
    if(path.includes('/recognition/honors/')&&path.includes('/photos/'))return reply(e,200,picture,'image/svg+xml');
    if(path.endsWith('/recognition/rankings'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:count,content:Array.from({length:count},(_,i)=>({userId:uid.slice(0,-1)+(i+1),fullName:i===1?'Tên kiểm thử '+ 'N'.repeat(55):'Thành viên thử nghiệm',username:'member',rank:i<2?1:3,totalPoints:16,approvedCount:1,avatarUrl:null}))});
    if(path.includes('/recognition/profiles/'))return reply(e,200,{userId:uid,fullName:'Thành viên thử nghiệm',username:'member',publicPoints:16,rankingOptIn:true,avatarUrl:null,achievements:[{id:'public-record',title:'Kết quả kiểm thử đã duyệt',category:'OLYMPIC_NATIONAL',award:'FIRST',status:'APPROVED',publicVisible:true,includeParticipation:true,awardPoints:10,participationPoints:6,totalPoints:16,achievedDate:'2026-09-01'}]});
    if(path.includes('/posts/slug/'))return reply(e,200,{...posts()[0],title:'Bài viết kiểm thử',status:'PUBLISHED',publishedAt:'2026-10-01T00:00:00Z',expiredAt:null,thumbnailUrl:null,author:user(),content:'<h2>Thông tin kiểm thử</h2>'+Array(18).fill('<p>Nội dung giả lập để kiểm tra chiều rộng đọc và nhịp đoạn văn.</p>').join('')});
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
  await call('Runtime.enable');await call('Network.enable');await call('Page.enable');await call('Page.bringToFront');await call('Emulation.setFocusEmulationEnabled',{enabled:true});await call('Fetch.enable',{patterns:[{urlPattern:'*/api/*'},{urlPattern:'*broken-thumbnail*'},{urlPattern:'*private-evidence*'},{urlPattern:'*fonts.googleapis.com*'}]});
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



  const pages=[['/honors','.recognition-memory','ADMIN'],['/rankings','.ranking-presentation__row','ANON'],['/documents','h1','ANON'],['/admin/dashboard','h1','ADMIN'],['/admin/documents','h1','ADMIN'],['/admin/users','[data-slot=table]','ADMIN'],['/news/news-0','h1','ADMIN']];
  if(!process.env.TASTE_INTERACTIONS_ONLY&&!process.env.TASTE_FORMS_ONLY&&!process.env.TASTE_FEEDBACK_ONLY) {
    for(const width of process.env.TASTE_SMOKE?[390]:[320,390,768,1280])for(const t of process.env.TASTE_SMOKE?['light']:['light','dark']){
      await resize(width,width<500?844:900);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:t}]});
      for(const [route,selector,r] of (process.env.TASTE_SMOKE?pages.slice(0,1):process.env.TASTE_REFINED_ONLY?pages.filter(([route])=>route==='/honors'||route==='/rankings'||route==='/news/news-0'):pages)){role=r;count=3;await nav(route);await wait('!!document.querySelector('+JSON.stringify(selector)+')');await theme(t);await shot(route.replaceAll('/','_')+'-'+width+'-'+t);}
    }
    checks.push(screenshots.length+' actual-route layout captures;responsive/light-dark dimensions in screenshots;page overflow checked after');
    await resize(390,844);role='ADMIN';
    for(const n of (process.env.TASTE_SMOKE?[]:[0,1]))for(const route of ['/honors','/rankings']){count=n;await nav(route);await wait(n?'!!document.querySelector(".user-identity")':'!!document.querySelector(".recognition-feedback")');await shot(route.slice(1)+'-count-'+n);}
    await writeFile(join(dir,'layout-results.json'),JSON.stringify({baseline,checks,screenshots,requests,errors},null,2));
  }
  if(process.env.TASTE_FORMS_ONLY){
    role='ADMIN';
    for(const width of [320,390,768,1280])for(const t of ['light','dark'])for(const [route,label] of [['/admin/documents','document'],['/admin/posts','post']]){
      await resize(width,width<500?568:900);await nav(route);await theme(t);await wait('!!document.querySelector(".page-heading__actions button")');
      await js('(()=>{const b=document.querySelector(".page-heading__actions button");b.focus();b.click()})()');await dialog();
      await fill('.creation-dialog input','Tiêu đề bản nháp kiểm thử '+ 'A'.repeat(60));
      await fill('.creation-dialog textarea','Nội dung kiểm thử đủ dài để kiểm tra bố cục và thông báo lỗi. '.repeat(10));
      await js('document.querySelector(".creation-dialog form").requestSubmit()');
      await wait('!!document.querySelector(".creation-dialog [id$=form-item-message]")');
      await shot(label+'-form-'+width+'-'+t);
      await js('document.querySelector(".creation-dialog__body").scrollTop=100000');
      await shot(label+'-actions-'+width+'-'+t);
      const geometry=await js('(()=>{const d=document.querySelector(".creation-dialog"),s=d.querySelector("button[type=submit]");return {frame:d.getBoundingClientRect().toJSON(),submit:s.getBoundingClientRect().toJSON(),draft:d.querySelector("input").value,close:d.querySelector(".creation-dialog__header button").getBoundingClientRect().toJSON()}})()');
      assert.ok(geometry.frame.x>=0&&geometry.frame.y>=0&&geometry.frame.right<=width+1&&geometry.frame.bottom<= (width<500?568:900)+1);
      assert.ok(geometry.submit.y>=geometry.frame.y&&geometry.submit.bottom<=geometry.frame.bottom+1,'reachable form actions');
      assert.ok(geometry.draft.includes('bản nháp'),'validation retained draft');
      if(width<500)assert.ok(geometry.close.height>=44&&geometry.submit.height>=44);
      await key('Escape');await wait('!!document.querySelector("[role=alertdialog]")');await clickText('Bỏ thay đổi');await wait('!document.querySelector(".creation-dialog")');
      await wait('document.activeElement===document.querySelector(".page-heading__actions button")');
    }
    checks.push('16 populated/error long-form cases × opening/actions captures;in-bounds frame,scroll-reachable submission,44px mobile controls,validation draft retained,Escape/discard/return focus');
  }
  if(process.env.TASTE_FEEDBACK_ONLY){
    role='ADMIN';
    for(const [width,t] of [[320,'dark'],[390,'light'],[768,'dark'],[1280,'light']]){
      await resize(width,720);documentStatus=200;documentEmpty=true;await nav('/documents');await theme(t);
      await wait('document.body.innerText.includes("Không tìm thấy tài liệu nào")');await js('document.querySelector("[role=status]").scrollIntoView({block:"center"})');await shot('feedback-empty-'+width+'-'+t);
      documentEmpty=false;documentStatus=503;await nav('/documents');await theme(t);await wait('!!document.querySelector("[role=alert] button")');await js('document.querySelector("[role=alert]").scrollIntoView({block:"center"})');await shot('feedback-error-'+width+'-'+t);
      documentStatus=200;holdDocuments=true;await clickText('Thử lại');await wait('!document.querySelector("[role=alert] button")&&document.body.innerText.includes("Đang tải tài liệu")');await shot('feedback-retry-'+width+'-'+t);
      holdDocuments=false;heldDocumentRequests.splice(0).forEach(resolve=>resolve());await wait('!document.querySelector("[role=alert]")&&document.body.innerText.includes("phần giới hạn")');
    }
    checks.push('Shared empty/error/retry at320/390/768/1280;retry replaces initial error with loading,successful recovery restores records');
  }
  if(!baseline&&!process.env.TASTE_FORMS_ONLY&&!process.env.TASTE_LAYOUT_ONLY&&!process.env.TASTE_FEEDBACK_ONLY){
    await resize(390,844);role='ANON';count=3;await nav('/honors?year=2026&page=2&keep=value');await wait('!!document.querySelector("form.recognition-filters input")');await fill('form.recognition-filters input',' Toán ');await js('document.querySelector("form.recognition-filters").requestSubmit()');await wait('new URLSearchParams(location.search).get("subject")==="Toán"&&!new URLSearchParams(location.search).has("page")');assert(await js('new URLSearchParams(location.search).get("keep")==="value"'));
    await wait('!!document.querySelector("a.user-identity")');await delay(600);await js('(()=>{const e=document.querySelector("a.user-identity");e.scrollIntoView({block:"center"});e.focus()})()');await wait('!!document.querySelector(".identity-preview")');await shot('profile-focus');await key('Escape');await wait('!document.querySelector(".identity-preview")');await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:5});await delay(200);const hover=await js('(()=>{const r=document.querySelector("a.user-identity").getBoundingClientRect();return {x:r.x+15,y:r.y+15}})()');await call('Input.dispatchMouseEvent',{type:'mouseMoved',...hover});await wait('!!document.querySelector(".identity-preview")');await shot('profile-hover');await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:5});await wait('!document.querySelector(".identity-preview")');await key('Enter');await wait('location.pathname.startsWith("/users/")');checks.push('Honors submitted query/page reset/unknown params;focus preview,Escape,pointer enter/leave and Enter profile');
    await nav('/rankings?page=2');await wait('!!document.querySelector("select")');await wait('!!document.querySelector(".ranking-presentation__identity .user-identity__name")');assert.equal(await js('getComputedStyle(document.querySelector(".ranking-presentation__identity .user-identity__name")).webkitLineClamp'),'2');await js('(()=>{const e=document.querySelector("select");e.value="2026";e.dispatchEvent(new Event("change",{bubbles:true}))})()');await wait('new URLSearchParams(location.search).get("year")==="2026"&&!new URLSearchParams(location.search).has("page")');
    await js('document.querySelector("a.user-identity").scrollIntoView({block:"center"})');const rect=await js('(()=>{const r=document.querySelector("a.user-identity").getBoundingClientRect();return {x:r.x+15,y:r.y+15}})()');await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[rect]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('location.pathname.startsWith("/users/")');await call('Emulation.setTouchEmulationEnabled',{enabled:false});checks.push('Ranking year/page and touch profile destination');
    role='ADMIN';await nav('/admin/documents');await wait('!!document.querySelector(".page-heading__actions button")');await js('document.querySelector(".page-heading__actions button").click()');await dialog();await resize(320,280);await shot('document-dialog-short');const d=await js('document.querySelector(".creation-dialog").getBoundingClientRect().toJSON()');assert(d.x>=0&&d.y>=0&&d.right<=320&&d.bottom<=281);await fill('.creation-dialog input','Tiêu đề bản nháp kiểm thử');await key('Escape');await wait('!!document.querySelector("[role=alertdialog]")');await clickText('Tiếp tục chỉnh sửa');await wait('!document.querySelector("[role=alertdialog]")');assert.equal(await js('document.querySelector(".creation-dialog input").value'),'Tiêu đề bản nháp kiểm thử');await clickText('Đóng');await clickText('Bỏ thay đổi');await wait('!document.querySelector(".creation-dialog")');checks.push('320x280 creation frame;Escape dirty confirmation;keep draft;explicit discard');await resize(390,844);await nav('/news/news-0');await wait('!!document.querySelector(".rich-text-viewer h2")');assert.ok(await js('parseFloat(getComputedStyle(document.querySelector(".rich-text-viewer h2")).fontSize)>=24&&parseFloat(getComputedStyle(document.querySelector(".rich-text-viewer p")).marginBottom)>=16'));await shot('reader-rhythm');checks.push('Shared viewer heading hierarchy and16px+ paragraph rhythm;rank name two-line scan bound/full accessible identity retained');
  }
  assert.deepEqual(errors,[]);await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,requests,errors,networkFailures,limits:['Synthetic APIs only;not physical-device/live authorization proof','Representative families,not all-screen renders;Public Honors use a synthetic active ADMIN;Rankings/Documents anonymous;reader final supplement ADMIN;management/dashboard ADMIN;startup overlay omitted in temporary host','Existing dashboard companion/demo data not validated']},null,2));console.log(JSON.stringify({evidence:dir,checks,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),requests,errors,networkFailures,readiness:js?await js("import('/src/lib/query-client.ts').then(m=>({fonts:document.fonts.status,queries:m.queryClient.getQueryCache().getAll().map(q=>({key:q.queryKey,status:q.state.status,fetch:q.state.fetchStatus})),loader:document.querySelector('#startup-loader')?.outerHTML.slice(0,160),inert:document.querySelector('#root')?.inert}))").catch(()=>null):null,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},2000).unref();}
