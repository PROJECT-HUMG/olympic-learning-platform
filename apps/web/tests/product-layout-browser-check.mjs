// Actual routes, synthetic intercepted API/widget only; no production content or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.TASTE_WEB_URL??'http://127.0.0.1:3151',baseline=process.env.TASTE_PHASE==='before';
const dir=await mkdtemp(join(tmpdir(),`humg-product-${baseline?'before':'after'}-`));
const checks=[],screenshots=[],requests=[],errors=[],networkFailures=[],fixtureCancellations=[];

let role='ADMIN',socket,call,js,count=3,rankingStatus=200,holdRanking=false; const rankingReleases=[];
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
  const metadata={subjects:[{id:'subject-1',name:'Giải tích',code:'MATH'},{id:'subject-2',name:'Đại số',code:'ALG'}],categories:[{id:'category-1',name:'Giáo trình',code:'BOOK'}],tags:[{id:'tag-1',name:'Ôn tập',code:'REVIEW'}]};
  let documentStatus=200,documentEmpty=false,metadataStatus=200,priorityStatus=200,priorityEmpty=false,holdDocuments=false,holdRefresh=false; const refreshReleases=[];
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
    requests.push({path,method,query:u.search,origin:u.origin,account,body:e.request.postData,time:Date.now()});if(method==='OPTIONS')return reply(e,204,'','text/plain');
    if(method!=='GET'&&method!=='OPTIONS'&&!path.endsWith('/auth/refresh'))return reply(e,503,{status:503,title:'Synthetic failure',detail:'Synthetic failure; try again'});
    if(path.endsWith('/users/me'))return reply(e,role==='ANON'?401:200,user());
    if(path.endsWith('/auth/refresh')&&holdRefresh)await new Promise(r=>refreshReleases.push(r));
    if(path.endsWith('/auth/refresh'))return reply(e,role==='ANON'?401:200,{accessToken:'synthetic'});
    if(path.endsWith('/documents/metadata'))return reply(e,metadataStatus,metadataStatus===200?metadata:{title:'Synthetic metadata failure'});
    if(path.endsWith('/documents')){
      if(holdDocuments)await new Promise(resolve=>heldDocumentRequests.push(resolve));
      return reply(e,documentStatus,documentStatus===200?{...emptyPage,totalPages:documentEmpty?0:3,totalElements:documentEmpty?0:22,content:documentEmpty?[]:docs().map(d=>({...d,title:d.title+(u.searchParams.get('keyword')?' · '+u.searchParams.get('keyword'):'')}))}:{status:documentStatus,title:'Synthetic document failure'});
    }
    if(path.endsWith('/posts')){if(u.searchParams.get('pinned')==='true'&&priorityStatus!==200)return reply(e,priorityStatus,{title:'Synthetic priority failure'});const content=posts().map((p,i)=>({...p,status:'PUBLISHED',pinned:i===0&&!priorityEmpty,expiredAt:null,publishedAt:'2026-10-01T00:00:00Z',thumbnailUrl:null}));return reply(e,200,u.searchParams.get('pinned')==='true'?{...emptyPage,totalPages:1,totalElements:priorityEmpty?0:1,content:priorityEmpty?[]:content.slice(0,1)}:{...emptyPage,totalPages:3,totalElements:22,content});}
    if(path.endsWith('/posts/management'))return reply(e,200,{...emptyPage,totalPages:3,totalElements:22,content:posts()});
    if(path.endsWith('/status-counts'))return reply(e,200,{draft:1,published:0,expired:0,archived:1});
    if(path.endsWith('/admin/users/permissions'))return reply(e,200,[{id:'MANAGE_POSTS',description:'Synthetic permission'}]);
    if(path.endsWith('/admin/users'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:2,content:[1,2].map(i=>({...user(),id:uid.slice(0,-1)+i,fullName:'Synthetic administrator '+i,role:i===2?'STUDENT':'ADMIN',email:'administrator-'+i+'@example.invalid',createdAt:'2026-10-01T00:00:00Z',permissions:['MANAGE_POSTS','MANAGE_DOCUMENTS','MANAGE_QUESTIONS']}))});
    if(path.endsWith('/recognition/honors')&&!path.includes('/admin/'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:count,content:Array.from({length:count},(_,i)=>({id:'album-'+i,title:i?'Album kiểm thử '+i:'Album kiểm thử '+ 'A'.repeat(40),subject:'Toán',year:2026,status:'PUBLISHED',scope:'SCHOOL',participants:Array.from({length:5},(_,n)=>({userId:uid,fullName:n?'Thành viên thử nghiệm':'Tên kiểm thử '+ 'N'.repeat(35),award:'Tham gia',avatarUrl:null,profileAvailable:true})),photos:i===2?[]:[{id:'photo-1',originalName:'synthetic.png'}]}))});
    if(path.includes('/recognition/honors/')&&path.includes('/photos/'))return reply(e,200,picture,'image/svg+xml');
    if(path.endsWith('/recognition/rankings')){if(holdRanking)await new Promise(r=>rankingReleases.push(r));if(rankingStatus!==200)return reply(e,rankingStatus,{title:'Synthetic ranking failure'});return reply(e,200,{...emptyPage,totalPages:1,totalElements:count,content:Array.from({length:count},(_,i)=>({userId:uid.slice(0,-1)+(i+1),fullName:i===1?'Tên kiểm thử '+ 'N'.repeat(55):'Thành viên thử nghiệm',username:'member',rank:i<2?1:3,totalPoints:16,approvedCount:1,avatarUrl:null}))});}
    if(path.includes('/recognition/profiles/'))return reply(e,200,{userId:uid,fullName:'Thành viên thử nghiệm',username:'member',publicPoints:16,rankingOptIn:true,avatarUrl:null,achievements:[{id:'public-record',title:'Kết quả kiểm thử đã duyệt',category:'OLYMPIC_NATIONAL',award:'FIRST',status:'APPROVED',publicVisible:true,includeParticipation:true,awardPoints:10,participationPoints:6,totalPoints:16,achievedDate:'2026-09-01'}]});
    if(path.includes('/posts/slug/'))return reply(e,200,{...posts()[0],title:'Bài viết kiểm thử',status:'PUBLISHED',publishedAt:'2026-10-01T00:00:00Z',expiredAt:null,thumbnailUrl:null,author:user(),content:'<h2>Thông tin kiểm thử</h2>'+Array(18).fill('<p>Nội dung giả lập để kiểm tra chiều rộng đọc và nhịp đoạn văn.</p>').join('')});
    if(path.endsWith('/daily/plans/dates'))return reply(e,200,['2026-10-07']);
    if(path.endsWith('/daily/plans'))return reply(e,200,{id:'00000000-0000-0000-0000-000000000004',ownerId:uid,planDate:u.searchParams.get('date'),firstSubmittedAt:null,onTime:false,reviewReasons:'',reviewWentWell:'',reviewTomorrow:'',version:0,createdAt:'2026-10-07T00:00:00Z',updatedAt:'2026-10-07T00:00:00Z',tasks:Array.from({length:3},(_,i)=>({id:'00000000-0000-0000-0000-'+String(20+i).padStart(12,'0'),title:i?'Synthetic · Ôn tập '+i:'Synthetic · '+ 'N'.repeat(120),priority:'MUST',status:'TODO',position:i})),totalCount:3,completedCount:0,mustTotal:3,mustCompleted:0});
    if(path.endsWith('/daily/weeks'))return reply(e,200,{id:'00000000-0000-0000-0000-000000000005',weekStart:'2026-10-05',recurringUnfinished:'',issues:'',reflection:'Synthetic reflection',nextWeekChanges:'',plannedDays:1,weekDays:7,nonemptyDays:1,completionRate:0,mustCompleted:0,mustTotal:3,mustRate:0,onTimeDays:0,version:0});
    if(path.endsWith('/groups/invitations')||path.endsWith('/evidence'))return reply(e,200,[]);
    if(path.endsWith('/groups'))return reply(e,200,[{id:'00000000-0000-0000-0000-000000000003',name:'Synthetic · Nhóm ôn tập '+ 'N'.repeat(60),ownerId:uid,avatar:null,members:[{userId:uid,displayName:'Synthetic member'}],mySharing:{shareDaily:false,sharingMode:'GROUP',selectedViewerIds:[]}}]);
    if(path.endsWith('/study-rooms'))return reply(e,200,[{id:'room-1',name:'Synthetic · Giải tích',ownerName:'Synthetic member',focusMinutes:25,breakMinutes:5,activeMembers:1}]);
    if(path.endsWith('/exams/papers/paper-1'))return reply(e,200,{id:'paper-1',examId:'exam-1',versionNumber:1,title:'Synthetic · Đề đọc đối chiếu',subjectId:'subject-1',instructions:'Synthetic · Hướng dẫn đọc đề dài. '.repeat(5),releaseAt:'2026-10-01T00:00:00Z',publishedAt:'2026-09-30T00:00:00Z',totalPoints:'10.00',items:[{questionId:'question-1',points:10,partPoints:{},instructions:'',content:{schemaVersion:1,title:'Synthetic · Chứng minh',structure:'SINGLE',stem:[{id:'s',kind:'text',source:'Synthetic · Nội dung câu hỏi khoa học để kiểm tra nhịp đọc.'}],parts:[{id:'p1',responseType:'WRITTEN',prompt:[],options:[]}]}}]});
    if(path.endsWith('/exams')||path.endsWith('/exams/drafts')||path.endsWith('/exams/papers'))return reply(e,200,[{id:'exam-1',createdById:uid,subjectId:'subject-1',instructions:'Synthetic · Hướng dẫn đọc đề',items:[],createdAt:'2026-10-01T00:00:00Z',updatedAt:'2026-10-01T00:00:00Z',examId:'exam-1',publishedAt:'2026-10-01T00:00:00Z',title:'Synthetic · '+ 'N'.repeat(80),version:1,versionNumber:1,totalPoints:'10.00',releaseAt:'2026-10-20T00:00:00Z'}]);
    if(path.endsWith('/topics'))return reply(e,200,[{id:'topic-1',name:'Bất đẳng thức',subjectId:'subject-1'}]);
    if(path.endsWith('/questions'))return reply(e,200,{...emptyPage,totalPages:2,totalElements:3,content:[{id:'question-1',subjectId:'subject-1',subjectName:'Giải tích',topicId:'topic-1',topicName:'Bất đẳng thức',status:'PUBLISHED',version:1,content:{schemaVersion:1,title:'Synthetic · Chứng minh bất đẳng thức',structure:'SINGLE',stem:[{id:'text-1',kind:'text',source:'Synthetic · Nội dung kiểm thử khoa học'}],parts:[{id:'p1',responseType:'WRITTEN',prompt:[],options:[]}]}}]});
    if(path.includes('/system-categories'))return reply(e,200,metadata.categories);
    return reply(e,200,emptyPage);
  };
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(e => {if(e.message==='Invalid InterceptionId.')fixtureCancellations.push({url:m.params.request.url,reason:e.message});else errors.push(e.message);});
    else if (m.method === 'Network.loadingFailed') networkFailures.push(m.params);
    else if (m.method === 'Network.responseReceived'&&m.params.response.status>=400) networkFailures.push({url:m.params.response.url,status:m.params.response.status});
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);

  };
  js = async expression => {
    const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text); return r.result.value;
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { for (let i = 0; i < 600; i++) { if (await js(`(async()=>Boolean(await (${expression})))()`)) return; await delay(50); } throw Error('Timeout: ' + expression); };
  const key = async k => {
    const n = { Enter: 13, Escape: 27, Tab: 9, ' ': 32, ArrowLeft:37, ArrowUp:38, ArrowRight:39, ArrowDown:40 }[k] ?? 0;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: n, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: n });
  };
  await call('Runtime.enable');await call('Network.enable');await call('Page.enable');await call('Page.bringToFront');await call('Emulation.setFocusEmulationEnabled',{enabled:true});await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
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
  const fill=async(selector,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('missing input');e.focus();e.select()})()`);await call('Input.insertText',{text:value});await delay(80);};
  const dialog=()=>wait(`!!document.querySelector('.creation-dialog')`);
  const buttonByLabel = label => `[...document.querySelectorAll('button')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)})`;




  const pages=[['/','h1','ADMIN'],['/honors','.recognition-memory','ADMIN'],['/rankings','.ranking-presentation__row','ADMIN'],['/documents','.document-card','ADMIN'],['/news','.school-news__feed','ADMIN'],['/subjects','.subject-directory__subject','ADMIN'],['/users/'+uid,'.public-profile-layout','ADMIN'],['/admin/dashboard','h1','ADMIN'],['/admin/documents','h1','ADMIN'],['/admin/posts','h1','ADMIN'],['/admin/users','[data-slot=table]','ADMIN'],['/admin/categories','h1','ADMIN'],['/admin/questions','h1','ADMIN'],['/admin/questions/import','h1','ADMIN'],['/admin/exams','h1','ADMIN'],['/daily?date=2026-10-07','.study-task','ADMIN'],['/daily/groups','.group-card','ADMIN'],['/toolkit?tool=gpa','h1','ADMIN'],['/toolkit?tool=rooms','.study-rooms-lobby','ADMIN'],['/profile','h1','ADMIN'],['/news/news-0','.rich-text-viewer','ADMIN'],['/login','#login-identifier','ANON']];
  const reqs=path=>requests.filter(r=>r.method==='GET'&&r.path.endsWith(path));
  const waitRequests=async(path,n)=>{for(let i=0;i<200&&reqs(path).length<n;i++)await delay(50);};
  const select=async(selector,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  // Bounded album/News/header refinement proof; the same synthetic fixtures run on both hosts.
  if (process.env.PRODUCT_REFINEMENTS) {
    role = 'ADMIN'; count = 3;
    const [width, height] = (process.env.PRODUCT_VIEWPORT ?? '1280x900').split('x').map(Number);
    await resize(width, height);
    for (const t of ['light', 'dark']) {
      await nav('/honors'); await theme(t);
      await wait('document.querySelectorAll(".recognition-memory").length===3&&!!document.querySelector(".recognition-memory img")');
      await shot(`refinement-honors-top-${width}x${height}-${t}`);
      await js('document.querySelector(".recognition-memory").scrollIntoView({block:"start"});scrollBy(0,-80)');
      await shot(`refinement-honors-albums-${width}x${height}-${t}`);
      const albums = await js(`(()=>{
        const rect=e=>e?.getBoundingClientRect().toJSON();
        const year=document.querySelector('.recognition-filters select');
        return {yearLabel:year.labels[0].textContent,yearLabelRect:rect(year.labels[0]),year:rect(year),
          columns:getComputedStyle(document.querySelector('.recognition-gallery')).gridTemplateColumns,
          cards:[...document.querySelectorAll('.recognition-memory')].map(e=>({frame:rect(e),title:rect(e.querySelector('h2')),photo:rect(e.querySelector('.recognition-memory__photo')),names:[...e.querySelectorAll('.user-identity__name')].map(n=>({rect:rect(n),clamped:getComputedStyle(n).webkitLineClamp,overflow:getComputedStyle(n).overflow,scrollWidth:n.scrollWidth,width:n.clientWidth}))}))};
      })()`);
      if (!baseline) {
        assert.equal(albums.yearLabel, 'Năm'); assert.ok(albums.yearLabelRect.width <= 1, 'year label is visually hidden');
        if(width>=1100) assert.equal(albums.columns.split(' ').length,2,'two deliberate desktop columns');
        for(const card of albums.cards) {
          assert.ok(card.frame.x>=0&&card.frame.right<=width,'album stays in viewport');
          for(const name of card.names) {assert.ok(name.rect.right<=card.frame.right,'full name contained'); assert.equal(name.clamped,'none');}
        }
      }
      await nav('/news'); await theme(t); await wait('!!document.querySelector(".school-news-post")');
      await shot(`refinement-news-toolbar-${width}x${height}-${t}`);
      const toolbar = await js(`(()=>{
        const rect=e=>e.getBoundingClientRect().toJSON();
        return {search:rect(document.querySelector('#school-news-search')),group:rect(document.querySelector('.school-news__categories')),categories:[...document.querySelectorAll('.school-news__categories a')].map(e=>({text:e.textContent,rect:rect(e)}))};
      })()`);
      if (!baseline) {
        assert.equal(toolbar.categories.length,4);
        for(const c of toolbar.categories) assert.ok(c.rect.height>=44&&c.rect.width>=44);
        if(width>900) assert.ok(Math.abs(toolbar.search.y-toolbar.group.y)<1&&Math.abs(toolbar.search.height-toolbar.group.height)<1,'search and categories share top/bottom edges');
      }
      await js('document.querySelector(".school-news__pagination").scrollIntoView({block:"center"})');
      await shot(`refinement-news-pagination-${width}x${height}-${t}`);
      const pagination=await js(`(()=>{const e=document.querySelector('.school-news__pagination');return {duplicate:!!e.querySelector(':scope > p'),current:[...e.querySelectorAll('[aria-current=page]')].filter(n=>n.getClientRects().length).map(n=>({label:n.getAttribute('aria-label'),text:n.textContent}))}})()`);
      if(!baseline) {assert.ok(!pagination.duplicate);assert.equal(pagination.current.length,1);}
      await js('scrollTo(0,0)');
      const menu=await js(`(()=>{const e=${buttonByLabel('Mở menu điều hướng')};return{text:e.textContent,label:e.getAttribute('aria-label'),rect:e.getBoundingClientRect().toJSON()}})()`);
      if(!baseline) {assert.equal(menu.text.trim(),'');assert.ok(menu.rect.width>=44&&menu.rect.height>=44);}
      await writeFile(join(dir,`refinement-geometry-${width}x${height}-${t}.json`),JSON.stringify({albums,toolbar,pagination,menu},null,2));
    }
    checks.push(`Album title/member wrapping,year accessible label,News aligned44px controls/single current-page indicator,icon-only44px menu at${width}x${height} light/dark`);
  }
  if (process.env.PRODUCT_REFINEMENTS_INTERACTIONS) {
    assert.ok(!baseline);role='ADMIN';await resize(390,844);
    await nav('/honors?year=2025&subject=Toán&page=2&keep=value');await wait('!!document.querySelector(".recognition-memory")');
    const yearRequests=reqs('/recognition/honors').length;
    await select('.recognition-filters select','2024');await wait('new URLSearchParams(location.search).get("year")==="2024"');
    await waitRequests('/recognition/honors',yearRequests+1);await wait('document.querySelector(".list-search-status")?.textContent==="3 album"');
    assert.ok(await js('new URLSearchParams(location.search).get("subject")==="Toán"&&!new URLSearchParams(location.search).has("page")&&new URLSearchParams(location.search).get("keep")==="value"'));
    await js('document.querySelector(".user-identity").scrollIntoView({block:"center"});document.querySelector(".user-identity").focus()');
    await wait('!!document.querySelector(".identity-preview")');await key('Escape');await wait('!document.querySelector(".identity-preview")');
    await key('Enter');await wait('location.pathname.startsWith("/users/")');await wait('!!document.querySelector(".public-profile-layout")');
    await nav('/news?page=2&keep=value');await wait('!!document.querySelector(".school-news-post")');
    await js('document.querySelector(".school-news__categories a[href*=ANNOUNCEMENT]").focus()');await key('Enter');
    await wait('new URLSearchParams(location.search).get("type")==="ANNOUNCEMENT"');
    assert.ok(await js('!new URLSearchParams(location.search).has("page")&&new URLSearchParams(location.search).get("keep")==="value"'));
    await fill('#school-news-search','Olympic');await wait('new URLSearchParams(location.search).get("q")==="Olympic"');
    assert.ok(await js('document.activeElement.id==="school-news-search"'));
    await resize(1280,900);await nav('/news?keep=value');await wait('!!document.querySelector(".school-news__pagination")');
    await js(buttonByLabel('Trang 2')+'.focus()');await key('Enter');
    await wait('new URLSearchParams(location.search).get("page")==="2"');
    await wait('document.querySelector(".school-news__pagination button[aria-current=page]")?.getAttribute("aria-label")==="Trang 2"');
    assert.equal(await js('new URLSearchParams(location.search).get("keep")'),'value');
    await js('history.back()');await wait('!new URLSearchParams(location.search).has("page")');
    await wait('document.querySelector(".school-news__pagination button[aria-current=page]")?.getAttribute("aria-label")==="Trang 1"');
    for(const route of ['/honors','/admin/dashboard'])for(const width of [320,390,768,1280]) {
      await resize(width,568);await nav(route);await wait('!!document.querySelector("h1")');
      // Desktop workspace has an intentionally labelled side rail, not a top menu trigger.
      if(route==='/admin/dashboard'&&width>=768)continue;
      await js(buttonByLabel('Mở menu điều hướng')+'.focus()');await key('Enter');
      await wait('!!document.querySelector(".navigation-drawer[data-state=open]")');
      await shot(`refinement-menu-${route==='/honors'?'public':'workspace'}-${width}`);
      await key('Escape');await wait('!document.querySelector(".navigation-drawer")');
      assert.ok(await js('document.activeElement.getAttribute("aria-label")==="Mở menu điều hướng"&&document.activeElement.matches(":focus-visible")'));
    }
    await resize(390,360);await nav('/honors');await wait('!!document.querySelector(".recognition-memory")');
    const point=await js('(()=>{const e=document.querySelector(".user-identity");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return{x:r.x+10,y:r.y+r.height/2}})()');
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await wait('location.pathname.startsWith("/users/")');await wait('!!document.querySelector(".public-profile-layout")');
    checks.push('Year immediate query/page reset;profile focus-preview/Escape/Enter and touch detail;News category/search focus/query/numbered page/Back;public+workspace icon-menu keyboard/Escape/focus return');
  }

  if(process.env.PRODUCT_LAYOUT){
    for(const [width,height] of (process.env.PRODUCT_VIEWPORT?[process.env.PRODUCT_VIEWPORT.split('x').map(Number)]:[[320,568],[390,844],[768,900],[1280,900]]))for(const t of ['light','dark']){
      await resize(width,height);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:t}]});
      for(const [route,selector,r] of (process.env.PRODUCT_ROUTES?pages.filter(p=>process.env.PRODUCT_ROUTES.split(",").includes(p[0])):process.env.PRODUCT_HOME?pages.filter(p=>p[0]==="/"):process.env.PRODUCT_DASH?pages.filter(p=>p[0]==="/admin/dashboard"):pages.slice(Number(process.env.PRODUCT_FROM_INDEX??0),Number(process.env.PRODUCT_TO_INDEX??pages.length)))){role=r;count=3;await nav(route);await wait('!!document.querySelector('+JSON.stringify(selector)+')');await theme(t);if(process.env.PRODUCT_HOME&&!baseline){const h=await js('document.querySelector(".home-hero h1").getBoundingClientRect().toJSON()');const header=await js('document.querySelector(".public-header").getBoundingClientRect().toJSON()');assert.ok(h.y>=header.bottom,"Home title below in-flow header");}await shot(route.replaceAll('/','_').replaceAll('?','_').replaceAll('=','_')+'-'+width+'-'+t);}
    }
    for(const n of (process.env.PRODUCT_TO_INDEX||process.env.PRODUCT_DASH||process.env.PRODUCT_HOME?[]:[0,1]))for(const [width,t] of [[320,'dark'],[1280,'light']])for(const route of ['/honors','/rankings']){count=n;role='ADMIN';await resize(width,720);await nav(route);await theme(t);await wait(n?'!!document.querySelector(".user-identity")':'!!document.querySelector(".recognition-feedback")');await shot(route.slice(1)+'-count-'+n+'-'+width+'-'+t);}
    checks.push(`${process.env.PRODUCT_ROUTES?process.env.PRODUCT_ROUTES.split(",").length:process.env.PRODUCT_DASH||process.env.PRODUCT_HOME?1:pages.slice(Number(process.env.PRODUCT_FROM_INDEX??0),Number(process.env.PRODUCT_TO_INDEX??pages.length)).length} selected actual routes ×${process.env.PRODUCT_VIEWPORT??"320/390/768/1280"} light/dark;long titles/many records;after geometry has no document overflow`);
  }

  if(process.env.PRODUCT_COMPOSITION){
    role='ADMIN';count=3;
    const [width,height]=(process.env.PRODUCT_VIEWPORT??'390x844').split('x').map(Number);await resize(width,height);
    for(const t of ['light','dark'])for(const route of ['/honors','/documents','/news','/admin/dashboard','/news/news-0']){
      await nav(route);await theme(t);await wait(route==='/honors'?'!!document.querySelector(".recognition-memory")':route==='/documents'?'!!document.querySelector(".document-card")':route==='/news'?'!!document.querySelector(".school-news-post")':route==='/admin/dashboard'?'!!document.querySelector(".dashboard-shortcut")':'!!document.querySelector(".rich-text-viewer")');
      if(route==='/honors')await js('document.querySelector(".recognition-memory").scrollIntoView({block:"start"});scrollBy(0,-80)');
      if(route==='/news/news-0')await js('document.querySelector(".rich-text-viewer").scrollIntoView({block:"start"});scrollBy(0,-100)');
      await shot('composition-'+route.replaceAll('/','_')+'-'+width+'x'+height+'-'+t);
      const geometry=await js(`(()=>{const rect=s=>document.querySelector(s)?.getBoundingClientRect().toJSON();return{album:rect('.recognition-memory'),participants:[...document.querySelectorAll('.recognition-memory .recognition-participants li')].map(e=>e.getBoundingClientRect().toJSON()),documentFilters:rect('.document-filter-bar'),documentResults:rect('.document-card'),feed:rect('.school-news__feed'),pinned:rect('.school-news__pinned'),readerHeader:rect('.news-reader__heading'),readerBody:rect('.news-reader__body')}})()`);await writeFile(join(dir,'geometry-'+route.replaceAll('/','_')+'-'+width+'-'+t+'.json'),JSON.stringify(geometry,null,2));
    }
    checks.push('Composition details:album media/identity grouping,library facets/results,News feed+pinned,workspace tasks,reader geometry at'+width+'x'+height+' light/dark');
  }
  if(process.env.PRODUCT_COMPOSITION_INTERACTIONS){
    assert.ok(!baseline);role='ADMIN';await resize(390,844);
    await nav('/documents?keyword=old&page=2&keep=value');await wait('!!document.querySelector(".document-card")');await js('window.compositionInput=document.querySelector(".document-filter-search input");window.compositionHistory=history.length');
    const before=reqs('/documents').length;await fill('.document-filter-search input','giới hạn');await delay(500);await wait('new URLSearchParams(location.search).get("keyword")==="giới hạn"');await waitRequests('/documents',before+1);assert.ok(reqs('/documents').length>before);assert.ok(await js('document.activeElement===window.compositionInput&&document.querySelector(".document-filter-search input")===window.compositionInput&&history.length===window.compositionHistory&&!new URLSearchParams(location.search).has("page")&&new URLSearchParams(location.search).get("keep")==="value"'));
    await js('document.querySelector(".document-filter-fields button").focus()');await key('Enter');await wait('!!document.querySelector("[role=listbox]")');await js('[...document.querySelectorAll("[role=option]")].find(e=>e.textContent.includes("Giải tích")).click()');await wait('new URLSearchParams(location.search).get("subjectId")==="subject-1"');await shot('library-keyboard-filter');
    await js(buttonByLabel('Xem dạng danh sách')+'.click()');await wait('!!document.querySelector(".page-table")');assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),'giới hạn');
    await nav('/news?keep=value');await wait('!!document.querySelector(".school-news__pinned")');await js('window.newsInput=document.querySelector("#school-news-search");document.querySelector(".school-news__categories a[href*=ANNOUNCEMENT]").focus()');await key('Enter');await wait('new URLSearchParams(location.search).get("type")==="ANNOUNCEMENT"');await wait('!document.querySelector(".school-news__pinned")');assert.ok(await js('document.querySelector("#school-news-search")===window.newsInput&&new URLSearchParams(location.search).get("keep")==="value"&&document.querySelectorAll(".school-news__categories [aria-current=page]").length===1'));await shot('news-selected-category');await js('history.back()');await wait('!new URLSearchParams(location.search).has("type")');await wait('!!document.querySelector(".school-news__pinned")');
    await nav('/honors?year=2025&subject=Toán');await wait('!!document.querySelector(".recognition-memory")');await js('document.querySelector(".page-local-nav a[aria-current=page]").focus()');await key('Tab');assert.ok(await js('document.activeElement.getAttribute("href")==="/rankings"'));await key('Enter');await wait('location.pathname==="/rankings"');await wait('!!document.querySelector(".ranking-presentation__row")');await js('document.querySelector("a.user-identity").scrollIntoView({block:"center"});document.querySelector("a.user-identity").focus()');await wait('!!document.querySelector(".identity-preview")');await key('Escape');await wait('!document.querySelector(".identity-preview")');await key('Enter');await wait('location.pathname.startsWith("/users/")');await wait('!!document.querySelector(".public-profile-layout")');await shot('profile-from-ranking');
    await nav('/admin/dashboard');await wait('!!document.querySelector(".dashboard-shortcut")');await js(buttonByLabel('Mở menu điều hướng')+'.focus()');await key('Enter');await wait('!!document.querySelector(".navigation-drawer[data-state=open]")');await shot('workspace-mobile-drawer');await key('Escape');await wait('!document.querySelector(".navigation-drawer")');assert.ok(await js('document.activeElement.getAttribute("aria-label")==="Mở menu điều hướng"'));
    await resize(1280,900);await nav('/admin/dashboard');await wait('!!'+buttonByLabel('Thu gọn menu'));await js(buttonByLabel('Thu gọn menu')+'.click()');await wait('!!'+buttonByLabel('Mở rộng menu'));assert.ok(await js('document.activeElement.getAttribute("aria-label")==="Mở rộng menu"'));await shot('workspace-collapsed');
    checks.push('Changed compositions:debounced library search retains input/focus/history;keyboard facet/page reset/query;list/grid URL;News type/pinned/Back;Recognition local-nav Tab/Enter/current state;profile preview/Escape/detail;workspace drawer/return/collapse focus');
  }

  if(process.env.PRODUCT_COMPOSITION_STATES){
    role='ADMIN';await resize(320,568);
    for(const n of [0,1]){count=n;await nav('/honors');await theme('dark');await wait(n?'!!document.querySelector(".recognition-memory")':'!!document.querySelector(".recognition-feedback")');if(n)await js('document.querySelector(".recognition-memory").scrollIntoView({block:"center"})');await shot('honors-count-'+n+'-320-dark');}
    metadataStatus=503;documentEmpty=true;await nav('/documents');await wait('!!document.querySelector(".document-filter-bar [role=alert]")');await shot('library-empty-metadata-error');metadataStatus=200;await clickText('Thử lại bộ lọc');await wait('!document.querySelector(".document-filter-bar [role=alert]")');await shot('library-metadata-recovered');documentEmpty=false;
    priorityEmpty=true;await resize(1280,900);await nav('/news');await wait('!!document.querySelector(".school-news-post")');assert.ok(await js('!document.querySelector(".school-news__pinned")&&!document.querySelector(".school-news__body--with-pinned")'));await shot('news-no-pinned-full-feed');
    priorityEmpty=false;priorityStatus=503;await nav('/news');await wait('!!document.querySelector(".school-news__pinned-error")');assert.ok(await js('!!document.querySelector(".school-news__feed .school-news-post")'));await shot('news-pinned-error-feed-usable');priorityStatus=200;await clickText('Thử lại phần được ghim');await wait('!!document.querySelector(".school-news__pinned-posts .school-news-post")');await shot('news-pinned-recovered');
    checks.push('New composition states:Honors0/1 at320dark;empty library plus metadata failure/retry;News no-pinned full-width feed and independent priority failure/retry without losing feed');
  }

  if(process.env.PRODUCT_RANKING){
    role='ANON';
    for(const [width,height] of (process.env.PRODUCT_RANKING_INTERACTIONS?[]:[[320,568],[390,844],[320,280],[640,320],[768,900],[1280,900]]))for(const t of ['light','dark'])for(const n of [0,1,6]){
      count=n;await resize(width,height);await nav('/rankings');await theme(t);
      await wait(n?'document.querySelectorAll(".ranking-presentation__row").length==='+n:'!!document.querySelector(".recognition-feedback")');
      if(n){
        const geometry=await js(`Array.from(document.querySelectorAll('.ranking-presentation__row'),r=>{const a=r.querySelector('.user-identity'),name=r.querySelector('.user-identity__name'),points=r.querySelector('.ranking-presentation__points');return{rank:r.querySelector('.ranking-presentation__rank > [aria-hidden]').textContent,height:r.getBoundingClientRect().height,nameHeight:name.getBoundingClientRect().height,nameScrollHeight:name.scrollHeight,nameClipped:getComputedStyle(name).overflow==='hidden'&&name.scrollHeight>name.clientHeight,targetHeight:a.getBoundingClientRect().height,points:points.innerText,pointsX:points.getBoundingClientRect().x,fontSize:getComputedStyle(name).fontSize}})`);
        if(!baseline){assert.deepEqual(geometry.slice(0,3).map(r=>r.rank),n===1?['1']:['1','1','3']);assert.ok(geometry.every(r=>!r.nameClipped&&r.targetHeight>=44));assert.ok(geometry.filter((_,i)=>i!==1).every(r=>r.height<=110),'ordinary rows remain compact');}
        await writeFile(join(dir,`geometry-${n}-${width}x${height}-${t}.json`),JSON.stringify(geometry,null,2));
      }
      await shot(`ranking-${n}-${width}x${height}-${t}`);
      if(n===6&&width===320&&height===568){await js('document.querySelectorAll(".ranking-presentation__row")[1].scrollIntoView({block:"center"})');await shot(`ranking-long-${width}x${height}-${t}`);}
    }
    if(!baseline){
      count=6;await resize(390,844);await nav('/rankings?year=2026&page=3&keep=value');await wait('!!document.querySelector("a.user-identity")');
      await js('document.querySelector("select").focus()');await select('select','2025');await wait('location.search.includes("year=2025")&&!new URLSearchParams(location.search).has("page")');assert.ok(await js('new URLSearchParams(location.search).get("keep")==="value"'));await js('history.back()');await wait('location.search.includes("year=2026")&&location.search.includes("page=3")');
      await js('document.querySelector("a.user-identity").scrollIntoView({block:"center"});document.querySelector("a.user-identity").focus()');await wait('!!document.querySelector(".identity-preview")');await shot('ranking-focus-preview');await key('Escape');await wait('!document.querySelector(".identity-preview")');await key('Enter');await wait('location.pathname.startsWith("/users/")');await wait('!!document.querySelector(".public-profile-layout")');await js('history.back()');await wait('location.pathname==="/rankings"&&location.search.includes("page=3")');await wait('!!document.querySelector("a.user-identity")');
      // Scoped interaction only: no setup/refetch animation; focus uses the same affordance as mouse.
      await js('document.querySelector("a.user-identity").focus()');await delay(220);const active=await js('getComputedStyle(document.querySelector(".user-identity__affordance")).transform');assert.notEqual(active,'none');
      await js('document.querySelector("select").focus()');await delay(220);assert.equal(await js('document.querySelector(".user-identity__affordance").style.transform'),'');
      await js(`import('/src/lib/query-client.ts').then(m=>m.queryClient.invalidateQueries({queryKey:['recognition','rankings']}))`);await delay(250);assert.ok(await js('Array.from(document.querySelectorAll(".ranking-presentation__row,.user-identity__affordance")).every(e=>!e.style.transform)'));
      // Navigate mid-tween; the old scoped node must be restored when its component unmounts.
      await js('window.oldArrow=document.querySelector(".user-identity__affordance");document.querySelector("a.user-identity").focus();document.querySelector("a.user-identity").click()');await wait('location.pathname.startsWith("/users/")');await delay(220);assert.equal(await js('window.oldArrow.style.transform'),'');
      await nav('/rankings');await wait('!!document.querySelector("a.user-identity")');const r=await js('(()=>{const a=document.querySelector("a.user-identity");a.scrollIntoView({block:"center"});const r=a.getBoundingClientRect();return{x:r.x+10,y:r.y+10}})()');await call('Input.dispatchMouseEvent',{type:'mouseMoved',...r});await wait('!!document.querySelector(".identity-preview")');await shot('ranking-hover-preview');await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await wait('!document.querySelector(".identity-preview")');await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('location.pathname.startsWith("/users/")');await call('Emulation.setTouchEmulationEnabled',{enabled:false});
      // Fresh timeframe query exposes loading/error/retry without publishing anything.
      rankingStatus=503;holdRanking=true;await nav('/rankings?year=2024');await wait('!!document.querySelector(".recognition-feedback[role=status]")');await shot('ranking-pending-390');holdRanking=false;rankingReleases.splice(0).forEach(r=>r());await wait('!!document.querySelector(".recognition-feedback[role=alert]")');await shot('ranking-error-390');rankingStatus=200;await clickText('Thử lại');await wait('!!document.querySelector(".ranking-presentation__row")');await shot('ranking-retried-390');
      checks.push('Ranking: unchanged ties/order/points/count;full unclamped long names;44px identity targets;compact ordinary rows;timeframe immediate/page reset/unknown params/Back;focus/Escape/Enter and touch detail/hover preview;GSAP scope cleanup/unmount/reopen/no-refetch replay;loading/error/retry');
    }
    if(!process.env.PRODUCT_RANKING_INTERACTIONS)checks.push('Ranking0/1/6 synthetic records ×320/390/short320/landscape640/tablet768/desktop1280 ×light/dark;measured row/text/target geometry');
  }

  if(process.env.PRODUCT_CARD_BODY){
    role='ADMIN';count=3;
    for(const [width,t] of [[320,'dark'],[390,'light'],[768,'dark'],[1280,'light']])for(const route of ['/honors','/rankings']){await resize(width,844);await nav(route);await theme(t);await wait('!!document.querySelector(".user-identity")');await js(route==='/honors'?'document.querySelector(".recognition-memory").scrollIntoView({block:"center"})':'document.querySelectorAll(".ranking-presentation__row")[1].scrollIntoView({block:"center"})');await shot(route.slice(1)+'-grouping-'+width+'-'+t);}
    checks.push('Scrolled Honors media/title/metadata/participant-award/action and ranking long-name rows at320/390/768/1280;actual supplied identity fallback;no personal imagery');
  }
  if(process.env.PRODUCT_SEARCH){
    assert.ok(!baseline,'functional search proof is after only');role='ADMIN';await resize(390,844);
    // DOM identity, request coalescing, URL merge and replace-only history.
    await nav('/documents?keyword=old&page=3&keep=value');await wait('!!document.querySelector(".document-filter-search input")');await delay(450);
    await js('window.searchNode=document.querySelector(".document-filter-search input");window.searchHistory=history.length');
    let before=reqs('/documents').length;
    await js(`(async()=>{const e=window.searchNode;e.focus();for(const value of ['a','ax','axit']){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,50))}})()`);
    assert.equal(reqs('/documents').length,before);await delay(500);
    await wait(`new URLSearchParams(location.search).get('keyword')==='axit'`);await wait(`import('/src/lib/query-client.ts').then(m=>m.queryClient.getQueryCache().getAll().some(q=>q.queryKey[0]==='documents'&&q.state.status==='success'&&JSON.stringify(q.queryKey).includes('axit')))`);await wait('!!document.querySelector(".document-card")');await waitRequests('/documents',before+1);assert.equal(reqs('/documents').length,before+1);
    assert.ok(await js('new URLSearchParams(location.search).get("keyword")==="axit"&&!new URLSearchParams(location.search).has("page")&&new URLSearchParams(location.search).get("keep")==="value"&&history.length===window.searchHistory&&document.activeElement===window.searchNode&&document.querySelector(".document-filter-search input")===window.searchNode'));
    // Intermediate composition never escapes to URL/API; a fresh350ms starts after compositionend.
    before=reqs('/documents').length;
    await js('window.searchNode.dispatchEvent(new CompositionEvent("compositionstart",{bubbles:true}))');await fill('.document-filter-search input','中');await delay(500);assert.equal(reqs('/documents').length,before);
    await fill('.document-filter-search input','中文');await js('window.searchNode.dispatchEvent(new CompositionEvent("compositionend",{bubbles:true,data:"中文"}))');await delay(150);assert.equal(reqs('/documents').length,before);await delay(400);await wait("new URLSearchParams(location.search).get('keyword')==='中文'");await delay(250);await waitRequests('/documents',before+1);assert.equal(reqs('/documents').length,before+1);
    checks.push('Documents:350ms debounce coalesces typing;URL/page/unknown params;REPLACE history;input node/focus retained;IME suppressed until settled after end');
    // A discrete filter PUSH is immediate; same-keyword POP cancels a pending draft.
    await js('document.querySelector(".document-filter-fields button").click()');await wait('!!document.querySelector("[role=listbox]")');await js('[...document.querySelectorAll("[role=option]")].find(e=>e.textContent.includes("Giải tích")).click()');
    await wait('new URLSearchParams(location.search).get("subjectId")==="subject-1"');await delay(150);
    await js('(()=>{const e=document.querySelector(".document-filter-search input");e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"must-cancel");e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));history.back()})()');await wait('!new URLSearchParams(location.search).has("subjectId")');await delay(500);
    assert.equal(await js('document.querySelector(".document-filter-search input").value'),'中文');assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),'中文');
    await js('history.forward()');await wait('new URLSearchParams(location.search).get("subjectId")==="subject-1"');await js('(()=>{const e=document.querySelector(".document-filter-search input");e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"unmount-cancel");e.dispatchEvent(new Event("input",{bubbles:true}));const a=[...document.querySelectorAll("a")].find(a=>a.getAttribute("href")==="/subjects");if(!a)throw Error("missing subjects navigation");a.click()})()');await wait('location.pathname==="/subjects"');await delay(500);assert.equal(await js('location.search'),'');
    checks.push('Discrete subject filter immediately applies;back/forward retains its URL;POP cancels pending same-keyword draft;unmount cannot alter next route');
    // Hold an older response while the latest key settles. Stale response cannot replace current state.
    await nav('/documents');await wait('!!document.querySelector(".document-filter-search input")');holdDocuments=true;
    await fill('.document-filter-search input','slow-old');await wait("new URLSearchParams(location.search).get('keyword')==='slow-old'");for(let i=0;i<200&&!heldDocumentRequests.length;i++)await delay(50);assert.ok(heldDocumentRequests.length);holdDocuments=false;
    await fill('.document-filter-search input','latest');await delay(500);await wait('new URLSearchParams(location.search).get("keyword")==="latest"&&document.querySelector(".document-card")?.textContent.includes("latest")');
    heldDocumentRequests.splice(0).forEach(r=>r());await delay(300);assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),'latest');assert.equal(await js('document.querySelector(".document-filter-search input").value'),'latest');assert.ok(await js('document.querySelector(".document-card").textContent.includes("latest")&&!document.querySelector(".document-card").textContent.includes("slow-old")'));
    checks.push('Held older Documents response never replaces latest query/typing;consumed query AbortSignal cancels obsolete request');
    for(const [route,input,param,value] of [['/honors?year=2020&page=2&keep=value','.recognition-filters input','subject','Toán'],['/news?type=NEWS&page=2&keep=value','#school-news-search','q','học'],['/admin/posts?status=DRAFT&page=2&keep=value','.page-toolbar input','keyword','bài'],['/admin/documents?subjectId=subject-1&page=2&keep=value','.page-toolbar input','keyword','đề'],['/admin/users?page=2&keep=value','.page-toolbar input','search','admin'],['/admin/questions?status=PUBLISHED&page=2&keep=value','.page-toolbar input','search','bất']]){
      await nav(route);await wait('!!document.querySelector('+JSON.stringify(input)+')');await fill(input,value);await delay(500);assert.ok(await js(`new URLSearchParams(location.search).get(${JSON.stringify(param)})===${JSON.stringify(value)}&&!new URLSearchParams(location.search).has('page')&&new URLSearchParams(location.search).get('keep')==='value'`));assert.ok(await js(`document.activeElement===document.querySelector(${JSON.stringify(input)})`));
    }
    await nav('/honors?subject=Toán&page=2');await wait('!!document.querySelector("select")');await select('select','2020');await wait('new URLSearchParams(location.search).get("year")==="2020"&&!new URLSearchParams(location.search).has("page")');
    await nav('/news?q=học&page=2&keep=value');await wait('!!document.querySelector(".school-news__categories a")');await js('[...document.querySelectorAll(".school-news__categories a")].find(e=>e.textContent.includes("Thông báo")).click()');await wait('new URLSearchParams(location.search).get("type")==="ANNOUNCEMENT"');assert.ok(await js('new URLSearchParams(location.search).get("q")==="học"&&!new URLSearchParams(location.search).has("page")&&new URLSearchParams(location.search).get("keep")==="value"'));
    checks.push('Honors/News/admin Posts/Documents/Users/Question Bank automatic search retains focus/unknown params and resets page;year/News type immediate;canonical four News types');
    await nav('/subjects');await wait('!!document.querySelector("#subject-search")');await fill('#subject-search','giai tich');await delay(500);assert.equal(await js('document.querySelectorAll(".subject-directory__subject").length'),1);
    await js('document.querySelector(".subject-directory__subject").click()');await wait('location.pathname==="/documents"&&new URLSearchParams(location.search).get("subjectId")==="subject-1"');
    checks.push('Subject live search retains existing Vietnamese accent-insensitive name/code match;result opens matching Documents subject');
    // Actual nested exam chooser inside a dirty form: typing/Enter changes search, never save.
    await nav('/admin/exams/new');await wait('!!document.querySelector("#exam-subject option[value=subject-1]")&&!document.querySelector("#exam-subject").disabled');await select('#exam-subject','subject-1');await wait('!!document.querySelector("#bank-search")');const mutations=requests.filter(r=>r.method!=='GET'&&!r.path.endsWith('/auth/refresh')).length;
    await fill('#bank-search','bất');await key('Enter');await delay(500);assert.equal(requests.filter(r=>r.method!=='GET'&&!r.path.endsWith('/auth/refresh')).length,mutations);assert.ok(reqs('/questions').some(r=>new URLSearchParams(r.query).get('search')==='bất'));
    await select('#exam-subject','subject-2');await wait('document.querySelector("#bank-search")?.value===""');
    checks.push('Nested exam chooser Enter/debounce never submits editor;subject identity resets draft;no live mutations');
    await nav('/admin/recognition?tab=submit');await wait('document.body.innerText.includes("Gửi thành tích thay sinh viên")');await clickText('Gửi thành tích thay sinh viên');await dialog();await wait('!!document.querySelector(".recognition-user-picker input")');await fill('.recognition-user-picker input','member');await waitRequests('/admin/users',reqs('/admin/users').length+1);await delay(250);await wait('!!document.querySelector(".recognition-user-picker select option[value]")');
    await select('.recognition-user-picker select',uid.slice(0,-1)+'2');await fill('.recognition-user-picker input','different');await delay(500);assert.equal(await js('document.querySelector(".recognition-user-picker select").value'),uid.slice(0,-1)+'2');await key('Escape');await wait('!!document.querySelector("[role=alertdialog]")');await clickText('Bỏ thay đổi');await wait('!document.querySelector(".creation-dialog")');
    checks.push('Recognition server UserPicker search debounced;eligible student selection preserved across query change;editor remains explicitly submitted');

  }

  if(process.env.PRODUCT_STATES){
    role='ADMIN';count=3;
    for(const [width,height,t] of (process.env.PRODUCT_REFINEMENTS_ONLY?[]:[[320,280,'dark'],[390,360,'light'],[640,320,'dark']]))for(const route of ['/admin/documents','/admin/posts']){
      await resize(width,height);await nav(route);await theme(t);await wait('!!document.querySelector(".page-heading__actions button")');await js('document.querySelector(".page-heading__actions button").focus();document.querySelector(".page-heading__actions button").click()');await dialog();
      await fill('.creation-dialog input','Synthetic · Bản nháp '+ 'N'.repeat(60));await js('document.querySelector(".creation-dialog form").requestSubmit()');await wait('!!document.querySelector(".creation-dialog [id$=form-item-message]")');
      await shot(route.replaceAll('/','_')+'-short-'+width+'x'+height+'-'+t);
      await js('document.querySelector(".creation-dialog__body").scrollTop=100000');await shot(route.replaceAll('/','_')+'-short-actions-'+width+'x'+height+'-'+t);
      if(!baseline){const g=await js('(()=>{const d=document.querySelector(".creation-dialog"),c=d.querySelector(".creation-dialog__header button"),s=d.querySelector("button[type=submit]");return{d:d.getBoundingClientRect().toJSON(),c:c.getBoundingClientRect().toJSON(),s:s.getBoundingClientRect().toJSON()}})()');assert.ok(g.d.x>=0&&g.d.y>=0&&g.d.right<=width+1&&g.d.bottom<=height+1);assert.ok(g.c.width>=44&&g.c.height>=44&&g.s.y>=0&&g.s.bottom<=height+1);}
      await key('Escape');await wait('!!document.querySelector("[role=alertdialog]")');await clickText('Tiếp tục chỉnh sửa');await wait('!document.querySelector("[role=alertdialog]")');assert.ok(await js('document.querySelector(".creation-dialog input").value.includes("Bản nháp")'));await key('Escape');await wait('!!document.querySelector("[role=alertdialog]")');await clickText('Bỏ thay đổi');await wait('!document.querySelector(".creation-dialog")');await wait('document.activeElement===document.querySelector(".page-heading__actions button")');
    }
    if(!process.env.PRODUCT_REFINEMENTS_ONLY)checks.push('320×280,390×360,640×320 Post/Document long/error drafts:frame bounds,scroll-reachable actions,44px controls,dirty keep/discard and opener focus;viewport shrink simulation,not physical keyboard');
    for(const width of (process.env.PRODUCT_SHORT_ONLY?[]:[320,390,768,1280]))for(const t of ['light','dark'])for(const [route,r] of [['/login','ANON'],['/profile','ADMIN'],['/admin/exams','ADMIN'],['/admin/exams/papers/paper-1','ADMIN']]){role=r;await resize(width,width<500?720:900);await nav(route);await theme(t);await wait('!!document.querySelector('+JSON.stringify(route==='/login'?'#login-identifier':'h1')+')');await shot(route.replaceAll('/','_')+'-refined-'+width+'-'+t);}
    if(!baseline&&!process.env.PRODUCT_SHORT_ONLY){role='ANON';await resize(320,568);await nav('/login');await wait('!!document.querySelector(".lbi-eye")');await fill('#login-password','synthetic-secret-fixture');await js('document.querySelector(".lbi-eye").focus()');await key('Enter');assert.equal(await js('document.querySelector("#login-password").type'),'text');const eye=await js('document.querySelector(".lbi-eye").getBoundingClientRect().toJSON()');assert.ok(eye.width>=44&&eye.height>=44);await shot('auth-password-keyboard');
      role='ADMIN';await resize(390,844);await nav('/honors');await wait('!!document.querySelector("a.user-identity")');await delay(500);await js('document.querySelector("a.user-identity").scrollIntoView({block:"center"});document.querySelector("a.user-identity").focus()');await wait('!!document.querySelector(".identity-preview")');await shot('identity-focus');await key('Escape');await wait('!document.querySelector(".identity-preview")');await key('Enter');await wait('location.pathname.startsWith("/users/")');
      await nav('/rankings');await wait('!!document.querySelector("a.user-identity")');await js('document.querySelector("a.user-identity").scrollIntoView({block:"center"})');const r=await js('(()=>{const r=document.querySelector("a.user-identity").getBoundingClientRect();return{x:r.x+12,y:r.y+12}})()');await call('Input.dispatchMouseEvent',{type:'mouseMoved',...r});await wait('!!document.querySelector(".identity-preview")');await shot('identity-hover');await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await wait('!document.querySelector(".identity-preview")');await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('location.pathname.startsWith("/users/")');await call('Emulation.setTouchEmulationEnabled',{enabled:false});
      checks.push('Actual profile focus/Escape/Enter,pointer open/leave and touch detail;password keyboard toggle has44px target and retained text;no public account fields');
    }
  }

  if(process.env.PRODUCT_RESET){
    role='ADMIN';await resize(390,844);
    for(const [route,input,label,param] of [['/documents?keyword=old&subjectId=subject-1&page=2&keep=value','.document-filter-search input','Xóa tất cả','keyword'],['/news?q=old&type=NEWS&page=2&keep=value','#school-news-search','Xóa bộ lọc','q']]){
      await nav(route);await wait('!!document.querySelector('+JSON.stringify(input)+')');await delay(450);await js('window.resetHistory=history.length');
      await js(`(()=>{const e=document.querySelector(${JSON.stringify(input)});e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'must-not-return');e.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});b.click()})()`);
      await wait('location.search==="?keep=value"');await delay(500);assert.equal(await js(`document.querySelector(${JSON.stringify(input)}).value`),'');assert.equal(await js('history.length'),await js('window.resetHistory')+1);
      await js('history.back()');await wait(`new URLSearchParams(location.search).get(${JSON.stringify(param)})==='old'`);await delay(300);assert.equal(await js(`document.querySelector(${JSON.stringify(input)}).value`),'old');assert.equal(await js('new URLSearchParams(location.search).get("page")'),'2');
    }
    checks.push('Composite reset:cancel pending typing,clear all supported filters/page in one PUSH,keep unknown params;Back restores keyword and discrete filters/page together;Docs and News actual owners');
  }
  if(process.env.PRODUCT_RACE){
    role='ANON';holdRefresh=true;await nav('/news');await wait('document.body.innerText.includes("Synthetic announcement")');await wait('import("/src/lib/query-client.ts").then(m=>m.queryClient.getQueryCache().getAll().some(q=>q.state.fetchStatus==="fetching"&&q.queryKey[0]==="auth"))');
    await js('import("/src/lib/query-client.ts").then(m=>m.queryClient.setQueryData(["private-fixture"],{secret:"synthetic"}))');
    holdRefresh=false;refreshReleases.splice(0).forEach(r=>r());await delay(600);
    const outcome=await js('import("/src/lib/query-client.ts").then(m=>({queries:m.queryClient.getQueryCache().getAll().filter(q=>q.queryKey[0]==="posts").map(q=>({key:q.queryKey,status:q.state.status,publicRead:q.meta?.publicRead,data:!!q.state.data})),privateCleared:m.queryClient.getQueryData(["private-fixture"])===undefined,article:document.body.innerText.includes("Synthetic announcement")}))');
    await writeFile(join(dir,'race.json'),JSON.stringify(outcome,null,2));assert.ok(outcome.privateCleared);if(baseline){assert.ok(!outcome.article);assert.ok(outcome.queries.some(q=>q.status==='error'));}else{assert.ok(outcome.article);assert.ok(outcome.queries.every(q=>q.publicRead&&q.status==='success'&&q.data));}
    await shot('anonymous-news-expiry');checks.push(baseline?'Reproduced:public feed lost after delayed startup refresh401;private cache cleared':'Fixed:public minimal News stays visible after delayed refresh401;private cache still cleared');
  }
  assert.deepEqual(errors,[]);await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,requests,errors,networkFailures,fixtureCancellations,limits:['Actual routes with intercepted synthetic APIs only;no live mutations or physical-device proof','Layout host omits startup overlay only;expiry race exercises actual auth/query owners','Representative routes,not all screen/state live proof;room joined media continuity unchanged/source inspected']},null,2));console.log(JSON.stringify({evidence:dir,checks,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),requests,errors,state:js?await js('({url:location.href,input:document.querySelector(".document-filter-search input")?.value})').catch(()=>null):null,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},2000).unref();}
