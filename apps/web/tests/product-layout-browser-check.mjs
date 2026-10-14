// Actual routes, synthetic intercepted API/widget only; no production content or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.TASTE_WEB_URL??'http://127.0.0.1:3151',baseline=process.env.TASTE_PHASE==='before';
const dir=await mkdtemp(join(tmpdir(),`humg-product-${baseline?'before':'after'}-`));
const checks=[],screenshots=[],requests=[],errors=[],networkFailures=[],fixtureCancellations=[];

let homeDepthCount=3,homeDepthNewsStatus=200,holdHomeDepth=false;const homeDepthReleases=[];
let registryChooser=null;
let role='ADMIN',socket,call,js,count=3,rankingStatus=200,holdRanking=false,newsDepthCount=4; const rankingReleases=[];
const uid='00000000-0000-0000-0000-000000000001';
let account=uid;
let kokonutLong=false,kokonutAvatar=null,kokonutLogoutStatus=204;
const kokonutArticleTitle='Thông báo học tập & nghiên cứu — “A+B” / Olympic?';
const user=()=>({id:account,username:'synthetic',fullName:kokonutLong?'Người dùng kiểm thử '+ 'TênDài'.repeat(12):'Synthetic administrator',email:kokonutLong?'synthetic-'+ 'identity'.repeat(20)+'@example.invalid':'fixture@example.invalid',role,status:'ACTIVE',avatarUrl:kokonutAvatar});
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
    if(process.env.PRODUCT_KOKONUT&&path.endsWith('/auth/logout')){role='ANON';return reply(e,kokonutLogoutStatus,kokonutLogoutStatus===204?'':{status:503,title:'Synthetic logout failure'},kokonutLogoutStatus===204?'text/plain':'application/json');}
    if(method!=='GET'&&method!=='OPTIONS'&&!path.endsWith('/auth/refresh'))return reply(e,503,{status:503,title:'Synthetic failure',detail:'Synthetic failure; try again'});
    if(path.endsWith('/users/me'))return reply(e,role==='ANON'?401:200,user());
    if(path.endsWith('/auth/refresh')&&holdRefresh)await new Promise(r=>refreshReleases.push(r));
    if(path.endsWith('/auth/refresh'))return reply(e,role==='ANON'?401:200,{accessToken:'synthetic'});
    if(path.endsWith('/documents/metadata'))return reply(e,metadataStatus,metadataStatus===200?metadata:{title:'Synthetic metadata failure'});
    if(process.env.PRODUCT_HOME_DEPTH&&(path.endsWith('/posts')||path.endsWith('/documents'))) {
      if(holdHomeDepth)await new Promise(resolve=>homeDepthReleases.push(resolve));
      if(path.endsWith('/documents'))return reply(e,documentStatus,documentStatus===200?{...emptyPage,totalPages:homeDepthCount?1:0,totalElements:homeDepthCount,content:Array.from({length:homeDepthCount},(_,i)=>({...docs()[i%2],id:'home-doc-'+i,title:i===1?'Tài liệu thử nghiệm có tên dài '+ 'TừDài'.repeat(18):['Bài tập ôn luyện Giải tích','', 'Chuyên đề tích phân và ứng dụng'][i%3]}))}:{title:'Synthetic library failure'});
      const type=u.searchParams.get('type');
      const content=Array.from({length:homeDepthCount},(_,i)=>({...posts()[0],id:'home-'+type+'-'+i,slug:'home-'+type+'-'+i,status:'PUBLISHED',type,publishedAt:'2026-10-'+(12-i)+'T00:00:00Z',updatedAt:'2026-10-12T00:00:00Z',title:i===1?'Bài viết thử nghiệm với tiêu đề dài '+ 'TừDài'.repeat(16):type==='ANNOUNCEMENT'?'Thông báo thử nghiệm về lịch ôn luyện':'Tài liệu và hoạt động học tập thử nghiệm '+(i+1),summary:'Nội dung giả lập để kiểm tra bố cục, cách đọc và thao tác. Không phải thông báo thật.',thumbnailUrl:i===0?'/private-evidence.svg':i===2?'/broken-thumbnail.svg':null,pinned:false}));
      return reply(e,homeDepthNewsStatus,homeDepthNewsStatus===200?{...emptyPage,totalPages:homeDepthCount?1:0,totalElements:homeDepthCount,content}:{title:'Synthetic news failure'});
    }
    if(path.endsWith('/documents')){
      if(holdDocuments)await new Promise(resolve=>heldDocumentRequests.push(resolve));
      return reply(e,documentStatus,documentStatus===200?{...emptyPage,totalPages:documentEmpty?0:3,totalElements:documentEmpty?0:22,content:documentEmpty?[]:docs().map(d=>({...d,title:d.title+(u.searchParams.get('keyword')?' · '+u.searchParams.get('keyword'):'')}))}:{status:documentStatus,title:'Synthetic document failure'});
    }
    if(path.endsWith('/posts')&&process.env.PRODUCT_NEWS_DEPTH){
      const content=Array.from({length:newsDepthCount},(_,i)=>({...posts()[0],id:'news-depth-'+i,slug:'synthetic-news-'+i,
        title:i===1?'Bài viết thử nghiệm với tiêu đề dài '+ 'L'.repeat(70):['Thông báo thử nghiệm về lịch ôn luyện','', 'Tài liệu thử nghiệm phục vụ học tập','Bài viết thử nghiệm có ảnh chưa tải được'][i%4],
        summary:'Dữ liệu giả lập để kiểm tra cách đọc tiêu đề, nhãn và nội dung trên bảng tin.',type:['ANNOUNCEMENT','BLOG','NEWS','NEWS'][i%4],
        status:'PUBLISHED',pinned:i===0,expiredAt:i===0?'2020-10-01T00:00:00Z':null,publishedAt:'2026-10-01T00:00:00Z',
        thumbnailUrl:i===2?'/private-evidence.svg':i===3?'/broken-thumbnail.svg':null}));
      return reply(e,200,{...emptyPage,totalPages:newsDepthCount?1:0,totalElements:newsDepthCount,content:u.searchParams.get('pinned')==='true'?content.filter(p=>p.pinned):content});
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
    if(path.includes('/posts/slug/'))return reply(e,200,{...posts()[0],title:process.env.PRODUCT_KOKONUT?kokonutArticleTitle:'Bài viết kiểm thử',status:'PUBLISHED',publishedAt:'2026-10-01T00:00:00Z',expiredAt:null,thumbnailUrl:null,author:user(),content:'<h2>Thông tin kiểm thử</h2>'+Array(18).fill('<p>Nội dung giả lập để kiểm tra chiều rộng đọc và nhịp đoạn văn.</p>').join('')});
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
    else if (m.method === 'Page.fileChooserOpened') registryChooser=m.params;
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);

  };
  js = async expression => {
    const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text); return r.result.value;
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { for (let i = 0; i < 600; i++) { if (await js(`(async()=>Boolean(await (${expression})))()`)) return; await delay(50); } throw Error('Timeout: ' + expression); };
  const key = async k => {
    const n = { Enter: 13, Escape: 27, Tab: 9, ' ': 32, ArrowLeft:37, ArrowUp:38, ArrowRight:39, ArrowDown:40, Home:36, End:35 }[k] ?? 0;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: n, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: n });
  };
  await call('Runtime.enable');await call('Network.enable');await call('Page.enable');await call('Page.bringToFront');await call('Emulation.setFocusEmulationEnabled',{enabled:true});await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.probeDocument=String(Date.now())+Math.random()'});
  const resize=(width,height=720)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const nav=async path=>{
    const old=await js('window.probeDocument');
    const navigation=await call('Page.navigate',{url:web+path});
    // Each fixture visit needs a fresh document/capability state. Chrome can
    // treat a repeated URL with a fragment as same-document navigation.
    if(!navigation.loaderId)await call('Page.reload',{ignoreCache:true});
    await wait(`window.probeDocument!==${JSON.stringify(old)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);
  };
  const shot=async(name,settleMs=200)=>{await delay(settleMs);const geometry=await js(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.className,account:document.getElementById('login-identifier')?.getBoundingClientRect().toJSON(),password:document.getElementById('login-password')?.getBoundingClientRect().toJSON(),forgot:document.querySelector('a[href="/forgot-password"]')?.getBoundingClientRect().toJSON()})`);if(!baseline)assert.ok(geometry.scrollWidth<=geometry.width,'overflow '+name);const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push({path,geometry});};
  const theme=value=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(value)}))`);
  const clickText=async text=>js(`(()=>{const scope=document.querySelector('[role=alertdialog]')??[...document.querySelectorAll('[role=dialog]')].at(-1)??document;const b=[...scope.querySelectorAll('button,a[data-slot="button"]')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('missing '+${JSON.stringify(text)});b.focus();b.click()})()`);
  const fill=async(selector,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('missing input');e.focus();e.select()})()`);await call('Input.insertText',{text:value});await delay(80);};
  const dialog=()=>wait(`!!document.querySelector('.creation-dialog')`);
  const buttonByLabel = label => `[...document.querySelectorAll('button')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)})`;




  const pages=[['/','h1','ADMIN'],['/honors','.recognition-memory','ADMIN'],['/rankings','.ranking-presentation__row','ADMIN'],['/documents','.document-card','ADMIN'],['/news','.school-news__feed','ADMIN'],['/subjects','.subject-directory__subject','ADMIN'],['/users/'+uid,'.public-profile-layout','ADMIN'],['/admin/dashboard','h1','ADMIN'],['/admin/documents','h1','ADMIN'],['/admin/posts','h1','ADMIN'],['/admin/users','[data-slot=table]','ADMIN'],['/admin/categories','h1','ADMIN'],['/admin/questions','h1','ADMIN'],['/admin/questions/import','h1','ADMIN'],['/admin/exams','h1','ADMIN'],['/daily?date=2026-10-07','.study-task','ADMIN'],['/daily/groups','.group-card','ADMIN'],['/toolkit?tool=gpa','h1','ADMIN'],['/toolkit?tool=rooms','.study-rooms-lobby','ADMIN'],['/profile','h1','ADMIN'],['/news/news-0','.rich-text-viewer','ADMIN'],['/login','#login-identifier','ANON']];
  const reqs=path=>requests.filter(r=>r.method==='GET'&&r.path.endsWith(path));
  const waitRequests=async(path,n)=>{for(let i=0;i<200&&reqs(path).length<n;i++)await delay(50);};
  const select=async(selector,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  if(process.env.PRODUCT_HOME_DEPTH) {
    role='ANON';
    const full=async name=>{await js('window.scrollTo(0,0)');await shot(name);const size=await call('Page.getLayoutMetrics');const path=join(dir,name+'-full.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:true,clip:{x:0,y:0,width:size.cssContentSize.width,height:size.cssContentSize.height,scale:1}})).data,'base64'));screenshots.push({path,full:true});};
    const selectTab=async name=>{await js(`[...document.querySelectorAll('.home-study-notebook [role=tab]')].find(e=>e.textContent.includes(${JSON.stringify(name)})).focus()`);await key('Enter');await wait(`document.querySelector('.home-study-notebook [role=tab][aria-selected=true]')?.textContent.includes(${JSON.stringify(name)})`);};
    const metrics=[];
    for(const [width,height] of [[320,568],[390,844],[768,900],[1280,900],[640,320]])for(const t of ['light','dark']) {
      await resize(width,height);await nav('/');await theme(t);await wait('document.querySelectorAll(".study-notebook__items a").length===3&&document.querySelectorAll(".home-news__article").length===3');await delay(650);
      const g=await js(`(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{indicator:rect('[data-smooth-indicator]'),activeTab:rect('.home-study-notebook [role=tab][aria-selected=true]'),width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,hero:rect('.home-hero__intro'),title:rect('h1'),notebook:rect('.home-study-notebook'),news:rect('.home-news'),tabs:[...document.querySelectorAll('.home-study-notebook [role=tab]')].map(e=>e.getBoundingClientRect().toJSON()),links:[...document.querySelectorAll('.study-notebook__items a')].map(e=>({rect:e.getBoundingClientRect().toJSON(),title:e.textContent})),surfaces:['.home-hero__intro','.home-study-notebook','.home-news'].map(s=>{const c=getComputedStyle(document.querySelector(s));return{selector:s,background:c.backgroundColor,image:c.backgroundImage,shadow:c.boxShadow}})}})()`);
      assert.ok(!g.overflow);assert.ok(Math.abs(g.indicator.x-g.activeTab.x)<1.1&&Math.abs(g.indicator.y-g.activeTab.y)<1.1&&Math.abs(g.indicator.width-g.activeTab.width)<1.1,"Home indicator aligned within framed tablist");assert.ok(g.tabs.every(r=>r.height>=44&&r.x>=0&&r.right<=width));assert.ok(g.links.every(e=>e.rect.x>=0&&e.rect.right<=width));metrics.push({theme:t,...g});
      await full(`home-depth-documents-${width}x${height}-${t}`);
      await js('document.querySelector(".home-study-notebook [role=tab][aria-selected=true]").focus()');await key('End');await wait('!!document.querySelector(".rb-spotlight-card a")');await delay(220);
      await js('document.querySelector(".rb-spotlight-card a").focus()');await key('Tab');assert.ok(await js('document.activeElement===document.querySelectorAll(".rb-spotlight-card a")[1]&&document.activeElement.matches(":focus-visible")'));
      await full(`home-depth-utilities-${width}x${height}-${t}`);
    }
    await writeFile(join(dir,'home-geometry.json'),JSON.stringify(metrics,null,2));
    if(!baseline) {
      await resize(390,844);await nav('/');await theme('dark');await wait('!!document.querySelector(".study-notebook__items a")');
      // Only the selected indicator moves; data/surfaces stay immediately available.
      await js(`window.homeFrames=[];window.homeRaf=requestAnimationFrame(function tick(){const e=document.querySelector('[data-smooth-indicator]'),h=document.querySelector('h1');if(e)window.homeFrames.push({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,h:h.getBoundingClientRect().height,heading:[...h.querySelectorAll('[aria-hidden] > span')].map(w=>getComputedStyle(w).opacity)});window.homeRaf=requestAnimationFrame(tick)})`);
      await selectTab('Tiện ích');await delay(260);await js('cancelAnimationFrame(window.homeRaf)');const frames=await js('window.homeFrames');assert.ok(new Set(frames.map(f=>Math.round(f.x))).size>2);assert.ok(Math.max(...frames.map(f=>f.h))-Math.min(...frames.map(f=>f.h))<.5);await writeFile(join(dir,'home-motion-frames.json'),JSON.stringify(frames,null,2));
      const target='document.querySelector(".rb-spotlight-card a")';await js(target+'.scrollIntoView({block:"center"});'+target+'.focus()');await delay(180);assert.ok(await js('getComputedStyle(document.querySelector(".rb-spotlight-card__light")).opacity==="1"'));await shot('home-depth-keyboard-focus-390-dark');
      await js('document.activeElement.blur()');const point=await js('(()=>{const r=document.querySelector(".rb-spotlight-card a").getBoundingClientRect();return{x:r.x+24,y:r.y+24}})()');await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await wait('!!document.querySelector(".rb-spotlight-card[data-hovered=true]")');await shot('home-depth-pointer-390-dark');await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await wait('!document.querySelector(".rb-spotlight-card[data-hovered=true]")');
      await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('location.pathname==="/toolkit"&&new URLSearchParams(location.search).get("tool")==="rooms"');await call('Emulation.setTouchEmulationEnabled',{enabled:false});
      await nav('/');await wait('!!document.querySelector("#home-document-search")');await fill('#home-document-search','  Giải tích & Olympic  ');await key('Enter');await wait('location.pathname==="/documents"');assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),'Giải tích & Olympic');
      await nav('/');await wait('!!document.querySelector(".study-notebook__items a")');await selectTab('Thông báo');await wait('!!document.querySelector(".study-notebook__items a[href*=home-ANNOUNCEMENT]")');await full('home-depth-announcements-390-dark');
      homeDepthCount=0;await nav('/');await wait('document.querySelector(".home-study-notebook")?.textContent.includes("Chưa có tài liệu.")&&document.querySelector(".home-news")?.textContent.includes("Chưa có tin tức")');await full('home-depth-empty-390-dark');
      homeDepthCount=1;await nav('/');await wait('document.querySelectorAll(".study-notebook__items a").length===1');await full('home-depth-single-390-dark');
      homeDepthCount=3;documentStatus=503;homeDepthNewsStatus=503;await nav('/');await wait('document.querySelector(".home-study-notebook")?.textContent.includes("Chưa tải được tài liệu.")&&document.querySelector(".home-news [role=alert]")');await full('home-depth-error-390-dark');
      documentStatus=200;homeDepthNewsStatus=200;holdHomeDepth=true;await js('[...document.querySelectorAll(".home-study-notebook button")].find(e=>e.textContent.trim()==="Thử lại").click();[...document.querySelectorAll(".home-news button")].find(e=>e.textContent.trim()==="Thử lại").click()');await wait('!!document.querySelector(".study-notebook__loading")&&document.querySelector(".home-news").getAttribute("aria-busy")==="true"');await full('home-depth-pending-390-dark');holdHomeDepth=false;homeDepthReleases.splice(0).forEach(r=>r());await wait('document.querySelectorAll(".study-notebook__items a").length===3&&document.querySelectorAll(".home-news__article").length===3');
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await nav('/');await wait('!!document.querySelector("h1 .blur-text")');assert.equal(await js('document.querySelector("h1 .blur-text").childElementCount'),0);await selectTab('Tiện ích');await js('document.querySelector(".rb-spotlight-card a").focus()');await delay(80);assert.ok(await js('getComputedStyle(document.querySelector(".rb-spotlight-card__light")).transitionDuration==="0s"'));await full('home-depth-reduced-390-dark');
      const ax=await call('Accessibility.getFullAXTree');assert.ok(ax.nodes.some(n=>n.role?.value==='heading'&&n.name?.value==='Tài nguyên học tập Olympic HUMG'));
      assert.ok(!requests.some(r=>r.method!=='GET'&&!r.path.endsWith('/auth/refresh')));
    }
    checks.push((baseline?'Before captures/geometry/End+Tab only;':'After full behavior proof;')+'Home depth:320/390/768/1280 and640x320,light/dark,long synthetic titles,44px tabs,contained rows,keyboard End/Tab;after-only indicator frames/stable heading,spotlight pointer/focus/touch,encoded search navigation,announcements,0/1/many,error/retry/held-pending/recovery,static reduced-motion and full AX heading;no mutations');
  }

  if(process.env.PRODUCT_REGISTRY_LAYOUT) {
    role='ANON';const [width,height]=(process.env.PRODUCT_VIEWPORT??'390x844').split('x').map(Number);
    await resize(width,height);
    for(const reduced of (baseline?[false]:[false,true]))for(const t of ['light','dark'])for(const route of ['/','/about']){
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
      await nav(route);await theme(t);await wait('!!document.querySelector("h1")');await delay(750);
      const geometry=await js(`(()=>{const e=document.querySelector(${JSON.stringify(route==='/'?'.home-hero h1':'.page-heading__description')});return{rect:e.getBoundingClientRect().toJSON(),text:e.innerText,animated:e.querySelectorAll('.blur-text [aria-hidden] > span').length,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,words:[...e.querySelectorAll('.blur-text [aria-hidden] > span')].map(n=>({filter:getComputedStyle(n).filter,opacity:getComputedStyle(n).opacity,transform:getComputedStyle(n).transform}))}})()`);
      if(!baseline){for(const w of geometry.words){assert.equal(Number(w.opacity),1);assert.equal(w.filter,'blur(0px)');}if(reduced)assert.equal(geometry.animated,0);const ax=await call('Accessibility.getFullAXTree');const text=route==='/'?'Tài nguyên học tập Olympic HUMG':'Một nơi để tìm tài liệu theo môn học và học cùng bạn bè.';assert.ok(ax.nodes.some(n=>n.name?.value===text),'full accessible semantic text');assert.ok(await js('!document.querySelector("h1 p")'));}
      await writeFile(join(dir,`registry-page-${route==='/'?'home':'about'}-${width}-${t}-${reduced?'reduced':'motion'}.json`),JSON.stringify(geometry,null,2));
      await shot(`registry-page-${route==='/'?'home':'about'}-${width}x${height}-${t}-${reduced?'reduced':'motion'}`);
    }
    checks.push(`Actual Home h1/About introduction at${width}x${height} light/dark;full AX text,semantic heading,natural wrapping,settled visible words and static reduced-motion branch after-only`);
  }
  if(process.env.PRODUCT_REGISTRY_PROOF) {
    assert.ok(!baseline);await resize(390,844);
    await Promise.all([writeFile(join(dir,'fixture.pdf'),'%PDF-1.4\nsynthetic only\n'),writeFile(join(dir,'invalid.txt'),'synthetic only'),writeFile(join(dir,'large.pdf'),Buffer.alloc(2052,65))]);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await nav('/tests/fixtures/registry-components.html');await js('document.documentElement.classList.add("dark")');
    await js(`window.registrySamples=[];window.registryFrame=()=>{const e=document.querySelector('#registry-title .blur-text [aria-hidden] > span');if(e){const root=document.querySelector('#registry-title .blur-text'),r=root.getBoundingClientRect(),s=getComputedStyle(e);window.registrySamples.push({time:performance.now(),opacity:Number(s.opacity),filter:s.filter,transform:s.transform,width:r.width,height:r.height})}window.registryRaf=requestAnimationFrame(window.registryFrame)};window.registryRaf=requestAnimationFrame(window.registryFrame)`);
    await clickText('Toggle text');await wait('!!document.querySelector("#registry-title .blur-text")');await shot('registry-text-early-390-dark',0);
    await wait('document.querySelector("#registry-state").dataset.completed==="1"');await shot('registry-text-settled-390-dark');
    const first=await js('window.registrySamples.slice()');assert.ok(first.some(v=>v.opacity<.99)&&first.some(v=>v.opacity>=.999),'actual reveal frames');
    const heights=first.map(v=>v.height),widths=first.map(v=>v.width);assert.ok(Math.max(...heights)-Math.min(...heights)<.5&&Math.max(...widths)-Math.min(...widths)<.5,'text reserves stable layout');
    await js('window.registrySamples=[];window.registryRoot=document.querySelector("#registry-title .blur-text");void 0');await clickText('Unrelated render');await delay(600);
    assert.ok(await js('document.querySelector("#registry-state").dataset.completed==="1"&&window.registryRoot===document.querySelector("#registry-title .blur-text")&&window.registrySamples.every(v=>v.opacity>=.999)'),'no rerender replay');
    await clickText('Toggle text');await clickText('Toggle text');await wait('!!document.querySelector("#registry-title .blur-text")');await clickText('Toggle text');await delay(600);assert.equal(await js('document.querySelector("#registry-state").dataset.completed'),'1','no completion after unmount');
    await js('cancelAnimationFrame(window.registryRaf)');await writeFile(join(dir,'registry-motion-frames.json'),JSON.stringify(first,null,2));
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await nav('/tests/fixtures/registry-components.html');await js('document.documentElement.classList.add("dark")');await clickText('Toggle text');
    await wait('!!document.querySelector("#registry-title .blur-text")');assert.ok(await js('document.querySelector("#registry-title .blur-text").childElementCount===0&&document.querySelector("#registry-title .blur-text").textContent==="Tài nguyên học tập Olympic HUMG"&&document.querySelector("#registry-title").getAnimations({subtree:true}).length===0'));
    await shot('registry-text-reduced-390-dark');
    await call('Page.setInterceptFileChooserDialog',{enabled:true});registryChooser=null;await js(`[...document.querySelectorAll('#upload-specimen button')].find(e=>e.textContent.includes('Upload File')).focus()`);await key('Enter');
    for(let i=0;i<80&&!registryChooser;i++)await delay(25);assert.ok(registryChooser,'keyboard native picker');
    const choose=async file=>{const root=await call('DOM.getDocument');const node=await call('DOM.querySelector',{nodeId:root.root.nodeId,selector:'#upload-specimen input[type=file]'});await call('DOM.setFileInputFiles',{nodeId:node.nodeId,files:[join(dir,file)]});};
    await choose('invalid.txt');await wait('!!document.querySelector("#upload-specimen [role=alert]")');assert.equal(await js('document.querySelector("#registry-state").dataset.success'),'0');await shot('registry-upload-type-error-390-dark');
    await clickText('Fail next transfer');await choose('fixture.pdf');await wait('document.querySelector("#upload-specimen [role=alert]")?.textContent==="Synthetic transfer failed"');await shot('registry-upload-transfer-error-390-dark');
    await choose('fixture.pdf');await wait('!!document.querySelector("#upload-specimen [role=progressbar]")');await clickText('Progress 60');await wait('document.querySelector("#upload-specimen [role=progressbar]")?.getAttribute("aria-valuenow")==="60"');assert.equal(await js('document.querySelector("#registry-state").dataset.success'),'0');await shot('registry-upload-pending-390-dark');
    await clickText('Cancel');await wait('!document.querySelector("#upload-specimen [role=progressbar]")');assert.equal(await js('document.querySelector("#registry-state").dataset.aborted'),'1');
    await choose('fixture.pdf');await wait('!!document.querySelector("#upload-specimen [role=progressbar]")');await clickText('Complete transfer');await wait('document.querySelector("#registry-state").dataset.success==="1"');await wait('!document.querySelector("#upload-specimen [role=progressbar]")');await shot('registry-upload-confirmed-390-dark');
    const uploadButton=await js(`(()=>{const b=[...document.querySelectorAll('#upload-specimen button')].find(e=>e.textContent.includes('Upload File'));return b.getBoundingClientRect().toJSON()})()`);assert.ok(uploadButton.height>=44);
    assert.ok(await js('document.querySelector("#upload-specimen svg").animationsPaused()'),'reduced-motion illustration paused');
    await choose('large.pdf');await wait('!!document.querySelector("#upload-specimen [role=alert]")');assert.equal(await js('document.querySelector("#registry-state").dataset.success'),'1');
    await choose('fixture.pdf');await wait('!!document.querySelector("#upload-specimen [role=progressbar]")');await clickText('Toggle upload');await wait('document.querySelector("#registry-state").dataset.aborted==="2"');await clickText('Complete transfer');await delay(300);assert.equal(await js('document.querySelector("#registry-state").dataset.success'),'1');
    assert.ok(requests.every(r=>r.method==='GET'||r.path.endsWith('/auth/refresh')),'no upload/backend request');
    checks.push('Actual registry sources under StrictMode:readable reveal frames/layout stability,no unrelated-render replay or detached completion;static reduced-motion text;Kokonut keyboard native picker,type/size rejection,transfer failure/retry,held progress60,no early success,confirmed completion,cancel/unmount abort,44px action and paused SVG;memory-only files,no backend upload');
  }



  if(process.env.PRODUCT_ADDITIONS) {
    role='ANON';const [width,height]=(process.env.PRODUCT_VIEWPORT??'390x844').split('x').map(Number);await resize(width,height);
    const indicatorGeometry=async scope=>js(`(()=>{const list=document.querySelector('${scope} [role=tablist]'),active=list.querySelector('[role=tab][data-state=active]'),i=list.querySelector('[data-smooth-indicator]');return{list:list.getBoundingClientRect().toJSON(),active:active.getBoundingClientRect().toJSON(),indicator:i?.getBoundingClientRect().toJSON(),selected:active.textContent.trim(),tabs:[...list.querySelectorAll('[role=tab]')].map(t=>({text:t.textContent.trim(),height:t.getBoundingClientRect().height,width:t.getBoundingClientRect().width,selected:t.getAttribute('aria-selected'),controls:t.getAttribute('aria-controls')}))}})()`);
    const aligned=async scope=>{if(scope==='.toolkit-workspace')await wait('document.querySelector(".toolkit-workspace [role=tab][aria-selected=true]")?.textContent.includes(new URLSearchParams(location.search).get("tool")==="gpa"?"Tính GPA":"Phòng học chung")');if(!baseline)await wait(`(()=>{const a=document.querySelector('${scope} [role=tab][data-state=active]')?.getBoundingClientRect(),i=document.querySelector('${scope} [data-smooth-indicator]')?.getBoundingClientRect();return a&&i&&Math.abs(a.x-i.x)<1.1&&Math.abs(a.y-i.y)<1.1&&Math.abs(a.width-i.width)<1.1})()`);const g=await indicatorGeometry(scope);await writeFile(join(dir,'last-indicator.json'),JSON.stringify(g,null,2));if(!baseline){assert.ok(g.indicator&&Math.abs(g.indicator.x-g.active.x)<1.1&&Math.abs(g.indicator.y-g.active.y)<1.1&&Math.abs(g.indicator.width-g.active.width)<1.1);assert.ok(g.tabs.every(t=>t.height>=44&&t.width>=44));assert.ok(g.list.x>=0&&g.list.right<=width);assert.equal(g.tabs.filter(t=>t.selected==='true').length,1);}return g;};
    for(const t of ['light','dark']) {
      await nav('/');await theme(t);await wait('!!document.querySelector(".home-study-notebook .study-notebook__items a")');
      await js('document.querySelector(".home-study-notebook [role=tablist]").scrollIntoView({block:"center"});document.querySelector(".home-study-notebook [role=tab]").focus()');await key('ArrowRight');await wait('document.querySelector(".home-study-notebook [role=tab][aria-selected=true]").textContent.includes("Thông báo")');await key('End');await wait('document.querySelector(".home-study-notebook [role=tabpanel][data-state=active]").textContent.includes("Tiện ích học tập")');
      const g=await aligned('.home-study-notebook');await writeFile(join(dir,`additions-home-${width}-${t}.json`),JSON.stringify(g,null,2));await shot(`additions-home-tabs-${width}x${height}-${t}`);
      await key('Tab'); // The panel remains a normal Radix tabpanel; links are standard anchors.
      const link='document.querySelector(".home-study-notebook a[href=\\"/toolkit?tool=rooms\\"]")';
      await js(link+'.focus()');await delay(180);await shot(`additions-home-focus-${width}x${height}-${t}`);
      if(!baseline){assert.ok(await js('document.activeElement.matches(":focus-visible")&&getComputedStyle(document.activeElement.parentElement.querySelector(".rb-spotlight-card__light")).opacity==="1"'));const rect=await js(link+'.getBoundingClientRect().toJSON()');assert.ok(rect.height>=44&&rect.x>=0&&rect.right<=width);}
      await js('document.activeElement.blur()');const point=await js('(()=>{const e=document.querySelector(".home-study-notebook a[href=\\"/toolkit?tool=gpa\\"]");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return{x:r.x+30,y:r.y+20}})()');await call('Input.dispatchMouseEvent',{type:'mouseMoved',pointerType:'mouse',...point});await delay(170);
      if(!baseline){assert.ok(await js('document.querySelectorAll(".rb-spotlight-card").length===2&&document.querySelector(".rb-spotlight-card[data-hovered=true]")!==null'));assert.ok(await js('(()=>{const e=document.querySelector(".rb-spotlight-card[data-hovered=true] a"),r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+30,r.y+20))})()'));}
      await shot(`additions-home-pointer-${width}x${height}-${t}`);await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
      if(!baseline)await wait('!document.querySelector(".rb-spotlight-card[data-hovered=true]")');

      await nav('/toolkit?tool=gpa&keep=value');await theme(t);await wait('!!document.querySelector(".toolkit-gpa__row input")');
      await fill('.toolkit-gpa__row input[id$="-name"]','Synthetic · Giải tích');await fill('.toolkit-gpa__row input[id$="-credits"]','3');await fill('.toolkit-gpa__row input[id$="-grade"]','3.5');await wait('document.querySelector(".toolkit-gpa__result strong").textContent.includes("3.50")');
      await js('document.querySelector(".toolkit-workspace [role=tablist]").scrollIntoView({block:"center"});document.querySelector(".toolkit-workspace [role=tab][aria-selected=true]").focus()');await key('Home');await wait('new URLSearchParams(location.search).get("tool")==="rooms"');assert.equal(await js('new URLSearchParams(location.search).get("keep")'),'value');await aligned('.toolkit-workspace');await shot(`additions-toolkit-rooms-${width}x${height}-${t}`);
      if(!baseline&&width===390&&t==='dark')await js(`window.tabFrames=[];window.tabSample=()=>{const e=document.querySelector('[data-smooth-indicator]');if(e){const r=e.getBoundingClientRect();window.tabFrames.push({time:performance.now(),x:r.x,y:r.y,width:r.width})}window.tabRaf=requestAnimationFrame(window.tabSample)};window.tabRaf=requestAnimationFrame(window.tabSample)`);
      await key('ArrowRight');await wait('new URLSearchParams(location.search).get("tool")==="gpa"');const tg=await aligned('.toolkit-workspace');
      if(!baseline&&width===390&&t==='dark'){await js('cancelAnimationFrame(window.tabRaf)');const frames=await js('window.tabFrames');assert.ok(new Set(frames.map(f=>Math.round(f.x*10))).size>2,'actual sliding indicator frames');await writeFile(join(dir,'tab-motion-frames.json'),JSON.stringify(frames,null,2));}
      assert.equal(await js('document.querySelector(".toolkit-gpa__row input[id$=\\"-name\\"]").value'),'Synthetic · Giải tích');assert.ok(await js('document.querySelector(".toolkit-gpa__result strong").textContent.includes("3.50")'));await writeFile(join(dir,`additions-toolkit-${width}-${t}.json`),JSON.stringify(tg,null,2));await shot(`additions-toolkit-gpa-${width}x${height}-${t}`);
      await js('history.back()');await wait('new URLSearchParams(location.search).get("tool")==="rooms"');await aligned('.toolkit-workspace');await js('history.forward()');await wait('new URLSearchParams(location.search).get("tool")==="gpa"');await aligned('.toolkit-workspace');
    }
    if(!baseline) {
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await nav('/');await theme('dark');await wait('!!document.querySelector(".home-study-notebook [role=tab]")');await js('document.querySelector(".home-study-notebook [role=tab]").focus()');await key('End');await wait('document.querySelectorAll(".rb-spotlight-card").length===2');await aligned('.home-study-notebook');await js('document.querySelector(".rb-spotlight-card a").focus()');await delay(100);assert.ok(await js('getComputedStyle(document.querySelector(".rb-spotlight-card__light")).transitionDuration==="0s"'));await shot(`additions-home-reduced-${width}x${height}`);
      const target='document.querySelector(".home-study-notebook a[href=\\"/toolkit?tool=gpa\\"]")';await js(target+'.scrollIntoView({block:"center"})');const touch=await js(`(()=>{const r=${target}.getBoundingClientRect();return{x:r.x+20,y:r.y+20}})()`);await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('location.pathname==="/toolkit"&&new URLSearchParams(location.search).get("tool")==="gpa"');await call('Emulation.setTouchEmulationEnabled',{enabled:false});await wait('!!document.querySelector(".toolkit-gpa")');
      if(width===390){documentStatus=503;await nav('/');await wait('document.querySelector(".home-study-notebook")?.textContent.includes("Chưa tải được tài liệu")');await shot('additions-home-error');documentStatus=200;holdDocuments=true;await js('[...document.querySelectorAll(".home-study-notebook button")].find(e=>e.textContent.trim()==="Thử lại").click()');await wait('!!document.querySelector(".home-study-notebook .study-notebook__loading,.home-study-notebook button[disabled]")');assert.ok(await js('document.querySelector(".home-study-notebook [role=tab][aria-selected=true]").textContent.includes("Tài liệu")'));holdDocuments=false;heldDocumentRequests.splice(0).forEach(r=>r());await wait('!!document.querySelector(".home-study-notebook .study-notebook__items a")');}
      assert.ok(!requests.some(r=>r.method!=='GET'&&!r.path.endsWith('/auth/refresh')),'no content/room mutation');
    }
    checks.push(baseline?`Before Home/Toolkit${width}x${height} light/dark,existing tab keyboard and GPA local persistence/URL history`:`Registry additions${width}x${height} light/dark:Home/Toolkit Radix keys and linked panels,indicator alignment including wraps,44px controls,pointer/focus link cue/no blockers,touch navigation,reduced motion;GPA3.50/local rows retained across tool switches,URL keep/Back/Forward;390-only transition frames and error/held retry,no mutations`);
  }

  if(process.env.PRODUCT_KOKONUT) {
    const [width,height]=(process.env.PRODUCT_VIEWPORT??'390x844').split('x').map(Number);
    await resize(width,height);
    const trigger=buttonByLabel('Mở menu tài khoản');
    const tap=async expression=>{const p=await js(`(()=>{const e=${expression},r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
    for(const t of ['light','dark']) {
      role='ADMIN';kokonutLong=true;kokonutAvatar='/broken-thumbnail.svg';
      await nav('/news');await theme(t);await wait('!!'+trigger);await js(trigger+'.focus()');await key('Enter');await wait('!!document.querySelector("[role=menu]")');
      await wait('document.activeElement.getAttribute("role")==="menuitem"');await delay(180);
      const menu=await js(`(()=>{const e=document.querySelector('[role=menu]');return{rect:e.getBoundingClientRect().toJSON(),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,items:[...e.querySelectorAll('[role=menuitem]')].map(n=>({href:n.getAttribute('href'),name:n.textContent.trim(),rect:n.getBoundingClientRect().toJSON()})),text:e.innerText}})()`);
      if(!baseline) {
        assert.ok(menu.rect.x>=0&&menu.rect.right<=width&&menu.rect.y>=0&&menu.rect.bottom<=height);
        assert.ok(menu.scrollWidth<=menu.clientWidth);
        assert.deepEqual(menu.items.map(i=>i.href),['/admin/dashboard','/profile','/',null]);
        assert.ok(menu.items.every(i=>i.rect.height>=44));
        assert.ok(menu.text.includes('Quản trị viên')&&!menu.text.includes('Gemini')&&!menu.text.includes('Eugene'));
        await wait('!document.querySelector(".shell-account [data-slot=account-avatar] img")');
        assert.ok(await js('document.querySelector(".shell-account [data-slot=account-avatar]").textContent.trim().length>0'));
      }
      await writeFile(join(dir,`kokonut-account-${width}-${t}.json`),JSON.stringify(menu,null,2));await shot(`kokonut-account-${width}x${height}-${t}`);
      if(!baseline){
        const focusVisible='(()=>{const r=document.activeElement.getBoundingClientRect(),m=document.querySelector("[role=menu]").getBoundingClientRect();return r.top>=m.top&&r.bottom<=m.bottom})()';
        assert.ok(await js(focusVisible),'first account action is visible');
        await key('End');await wait('document.activeElement.textContent.includes("Đăng xuất")');assert.ok(await js(focusVisible),'last account action scrolls into view');await shot(`kokonut-account-last-${width}x${height}-${t}`);
        await key('Home');await wait('document.activeElement.getAttribute("href")==="/admin/dashboard"');
      }

      await key('ArrowDown');await wait('document.activeElement.getAttribute("href")==="/profile"');await key('Home');await wait('document.activeElement.getAttribute("href")==="/admin/dashboard"');await key('Escape');await wait('!document.querySelector("[role=menu]")');
      assert.ok(await js('document.activeElement.getAttribute("aria-label")==="Mở menu tài khoản"'));
    }
    kokonutLong=false;kokonutAvatar=null;
    if(!baseline&&width===390) {
      for(const [r,destination] of [['ADMIN','/admin/dashboard'],['LECTURER','/lecturer/dashboard'],['STUDENT','/dashboard']]) {
        role=r;await nav('/news');await wait('!!'+trigger);await js(trigger+'.focus()');await key('Enter');await wait('document.activeElement.getAttribute("href")==='+JSON.stringify(destination));
        assert.equal(await js(`document.querySelectorAll('[role=menu] a[href="${destination}"]').length`),1);
        await key('Enter');await wait('location.pathname==='+JSON.stringify(destination));await wait('!!document.querySelector("h1")');
      }
      role='STUDENT';kokonutAvatar='/private-evidence.svg';await nav('/news');await wait('!!'+trigger);await wait('document.querySelector(".shell-account img")?.naturalWidth>0');
      await call('Emulation.setTouchEmulationEnabled',{enabled:true});await tap(trigger);await wait('!!document.querySelector("[role=menu]")');await shot('kokonut-account-student-touch-avatar');await key('Escape');await wait('!document.querySelector("[role=menu]")');await call('Emulation.setTouchEmulationEnabled',{enabled:false});
      for(const status of [204,503]) {
        role='ADMIN';kokonutAvatar=null;kokonutLogoutStatus=status;await nav('/news');await wait('!!'+trigger);
        await js('import("/src/lib/query-client.ts").then(m=>m.queryClient.setQueryData(["kokonut-private"],{value:"synthetic"})).then(()=>undefined)');
        await js(trigger+'.focus()');await key('Enter');await wait('!!document.querySelector("[role=menu]")');await key('End');await wait('document.activeElement.textContent.includes("Đăng xuất")');await key('Enter');await wait('location.pathname==="/login"');
        assert.ok(await js('import("/src/lib/query-client.ts").then(m=>m.queryClient.getQueryData(["kokonut-private"])===undefined)'));
        assert.ok(await js('import("/src/stores/use-auth-store.ts").then(m=>!m.useAuthStore.getState().accessToken)'));
        if(status===503)await wait('document.body.innerText.includes("Chưa thể đóng phiên trên máy chủ")');
        await shot('kokonut-logout-'+status);
      }
    }
    role='ANON';kokonutAvatar=null;await nav('/news');await wait('!![...document.querySelectorAll(".public-header a")].find(e=>e.getAttribute("href")==="/login")');assert.ok(await js('!'+trigger));await shot('kokonut-account-guest-'+width);

    // Browser capabilities are memory-only spies. Capture external-link activation
    // before its default action, so verification never opens a social site/posts.
    await call('Page.addScriptToEvaluateOnNewDocument',{source:`
      window.kokonutShare={copied:[],native:[],external:[],copyFailure:false,nativeMode:'success'};
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{if(window.kokonutShare.copyFailure)throw Error('Synthetic clipboard failure');window.kokonutShare.copied.push(text)}}});
      Object.defineProperty(navigator,'share',{configurable:true,value:new URL(location.href).searchParams.get('native')==='off'?undefined:async data=>{window.kokonutShare.native.push(data);if(window.kokonutShare.nativeMode==='abort')throw new DOMException('Synthetic cancel','AbortError');if(window.kokonutShare.nativeMode==='error')throw new Error('Synthetic share failure')}});
      document.addEventListener('click',e=>{const a=e.target.closest?.('a[target=_blank]');if(a){e.preventDefault();window.kokonutShare.external.push(a.href)}},true);
    `});
    for(const t of ['light','dark']) {
      await nav('/news/kokonut-article?context=A%26B#synthetic-section');await theme(t);await wait('!!document.querySelector(".rich-text-viewer")');
      const actualUrl=await js('location.href');
      if(baseline) {await js('[...document.querySelectorAll("button")].find(e=>e.getAttribute("aria-label")==="Sao chép liên kết").scrollIntoView({block:"center"})');await shot(`kokonut-share-before-${width}x${height}-${t}`);continue;}
      await wait('!!document.querySelector(".article-share-control")');await js('document.querySelector(".article-share-control").scrollIntoView({block:"center"})');await shot(`kokonut-share-closed-${width}x${height}-${t}`);
      assert.ok(await js('document.querySelector(".article-share-control [role=group]").inert'));
      if(width===390&&t==='dark')await js(`window.shareMotion=[];window.shareSample=()=>{const e=document.querySelector('.article-share-control [role=group] > *');if(e){const s=getComputedStyle(e);window.shareMotion.push({time:performance.now(),opacity:Number(s.opacity),transform:s.transform})}window.shareRaf=requestAnimationFrame(window.shareSample)};window.shareRaf=requestAnimationFrame(window.shareSample)`);
      await js('document.querySelector(".article-share-control button").focus()');await key('Enter');await wait('document.activeElement.getAttribute("aria-label")==="Sao chép liên kết"');await delay(300);
      if(width===390&&t==='dark'){
        await js('cancelAnimationFrame(window.shareRaf)');const frames=await js('window.shareMotion');assert.ok(frames.some(f=>f.opacity>0&&f.opacity<1)&&frames.some(f=>f.opacity===1),'actual intermediate reveal frames');await writeFile(join(dir,'share-motion-frames.json'),JSON.stringify(frames,null,2));
      }

      const actions=await js(`(()=>{const r=document.querySelector('.article-share-control [role=group]');return{rect:r.getBoundingClientRect().toJSON(),actions:[...r.querySelectorAll('a,button')].map(e=>({label:e.getAttribute('aria-label'),href:e.getAttribute('href'),rel:e.getAttribute('rel'),rect:e.getBoundingClientRect().toJSON(),opacity:getComputedStyle(e).opacity}))}})()`);
      assert.equal(actions.actions.length,6);assert.ok(actions.rect.x>=0&&actions.rect.right<=width);
      const ax=await call('Accessibility.getFullAXTree');assert.ok(actions.actions.every(a=>ax.nodes.some(n=>n.name?.value===a.label)));
      assert.ok(await js('[...document.querySelectorAll(".article-share-control [role=group] > *")].every(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})'),'no invisible action blocker');
      assert.ok(actions.actions.every(a=>a.rect.width>=44&&a.rect.height>=44&&Number(a.opacity)===1));
      for(const action of actions.actions.filter(a=>a.href)) {
        const link=new URL(action.href);assert.equal(link.searchParams.get(link.hostname==='www.facebook.com'?'u':'url'),actualUrl);
        if(['twitter.com','t.me'].includes(link.hostname))assert.equal(link.searchParams.get('text'),kokonutArticleTitle);
        assert.equal(action.rel,'noopener noreferrer');
      }
      await writeFile(join(dir,`kokonut-share-${width}-${t}.json`),JSON.stringify(actions,null,2));await shot(`kokonut-share-open-${width}x${height}-${t}`);
      await key('Escape');await wait('document.querySelector(".article-share-control [role=group]").inert');assert.ok(await js('document.activeElement===document.querySelector(".article-share-control button")'));
      await key('Enter');await wait('document.activeElement.getAttribute("aria-label")==="Sao chép liên kết"');
      await key('Enter');await wait('window.kokonutShare.copied.length===1');assert.equal(await js('window.kokonutShare.copied[0]'),actualUrl);await wait('document.body.innerText.includes("Đã sao chép liên kết")');
      // Native/external actions are only invoked in this390px synthetic context.
      if(width===390&&t==='dark') {
        await js('window.kokonutShare.copyFailure=true');await key('Enter');await wait('document.body.innerText.includes("Không thể sao chép liên kết")');
        for(const action of actions.actions.filter(a=>a.href))await js(`[...document.querySelectorAll('.article-share-control a')].find(e=>e.getAttribute('href')===${JSON.stringify(action.href)}).click()`);
        assert.deepEqual(await js('window.kokonutShare.external'),actions.actions.filter(a=>a.href).map(a=>a.href));
        const native='document.querySelector(".article-share-control [role=group]").lastElementChild';
        await js(native+'.focus()');await key('Enter');await wait('window.kokonutShare.native.length===1');assert.deepEqual(await js('window.kokonutShare.native[0]'),{title:kokonutArticleTitle,url:actualUrl});
        const toastCount=await js('document.querySelectorAll("[data-sonner-toast]").length');await js('window.kokonutShare.nativeMode="abort"');await key('Enter');await delay(150);assert.equal(await js('document.querySelectorAll("[data-sonner-toast]").length'),toastCount);
        await js('window.kokonutShare.nativeMode="error"');await key('Enter');await wait('document.body.innerText.includes("Không thể chia sẻ. Bạn có thể sao chép liên kết.")');
        await key('Escape');await wait('document.querySelector(".article-share-control [role=group]").inert');
        await call('Emulation.setTouchEmulationEnabled',{enabled:true});await tap('document.querySelector(".article-share-control button")');await wait('document.activeElement.getAttribute("aria-label")==="Sao chép liên kết"');await shot('kokonut-share-touch-open');await call('Emulation.setTouchEmulationEnabled',{enabled:false});
      }
      // Tabbing past the action group closes it without stealing the next focus.
      await js('document.querySelector(".article-share-control [role=group]").lastElementChild.focus()');await key('Tab');await wait('document.querySelector(".article-share-control [role=group]").inert');
    }
    if(!baseline) {
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await nav('/news/kokonut-article?native=off');await theme('dark');await wait('!!document.querySelector(".article-share-control")');await js('document.querySelector(".article-share-control").scrollIntoView({block:"center"});document.querySelector(".article-share-control button").focus()');await key('Enter');await wait('document.activeElement.getAttribute("aria-label")==="Sao chép liên kết"');
      assert.equal(await js('document.querySelectorAll(".article-share-control [role=group] a,.article-share-control [role=group] button").length'),5);
      await delay(80);assert.ok(await js('[...document.querySelectorAll(".article-share-control [role=group] > *")].every(e=>getComputedStyle(e).transform==="none"&&getComputedStyle(e).opacity==="1")'));await shot('kokonut-share-no-native-reduced-'+width);
      await key('Escape');await wait('document.querySelector(".article-share-control [role=group]").inert');
      const point=await js('(()=>{const r=document.querySelector(".article-share-control").getBoundingClientRect();return{x:r.x+20,y:r.y+20}})()');
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',pointerType:'mouse',...point});await wait('!document.querySelector(".article-share-control [role=group]").inert');
      assert.ok(await js('document.activeElement.getAttribute("aria-label")==="Sao chép liên kết"'),'focused-trigger hover transfers focus before hiding it');
      await key('Escape');await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await js('document.activeElement.blur()');
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',pointerType:'mouse',...point});await wait('!document.querySelector(".article-share-control [role=group]").inert');await shot('kokonut-share-hover-'+width);
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await wait('document.querySelector(".article-share-control [role=group]").inert');
      await nav('/news');await wait('!document.querySelector(".article-share-control")');
      assert.ok(!requests.some(r=>!r.path.endsWith('/auth/refresh')&&!r.path.endsWith('/auth/logout')&&r.method!=='GET'),'no content/admin/upload mutations');
    }
    checks.push(baseline ? `Before account/article${width}x${height} light/dark captures;existing keyboard menu arrows/Home/Escape and guest sign-in only` : `Kokonut actual account/article${width}x${height} light/dark:long identity/menu containment,keyboard arrows/Home/Escape return,guest sign-in;share trigger/44px actions,encoded actual URL/title,copy,Escape/Tab,static reduced motion and capability fallback;390-only role destinations/avatar/touch/logout204+503/private-cache clear/native cancel/error/external activation captured,not posted`);
  }

  if(process.env.PRODUCT_ACCOUNT_TOUCH) {
    role='STUDENT';await resize(390,568);await nav('/news');await theme('dark');await wait('!!'+buttonByLabel('Mở menu tài khoản'));
    const tap=async expression=>{const point=await js(`(()=>{const e=${expression},r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
    await tap(buttonByLabel('Mở menu tài khoản'));await wait('!!document.querySelector("[role=menu]")');await delay(200);await shot('account-touch-open-390-dark');
    await tap('document.querySelector("[role=menuitem]")');await wait('location.pathname==="/dashboard"');await wait('!!document.querySelector("h1")');
    checks.push('Synthetic touch390dark:avatar opens existing account menu;first student workspace entry opens guarded dashboard');
  }
  if(process.env.PRODUCT_ACCOUNT_NAV) {
    for(const width of [1280,390]) {
      await resize(width,width===390?844:900);
      for(const [r,destination,label] of [['ADMIN','/admin/dashboard','Không gian quản lý'],['LECTURER','/lecturer/dashboard','Không gian quản lý'],['STUDENT','/dashboard','Góc học tập']]) {
        role=r;await nav('/news?keep=value');await theme(width===390?'dark':'light');
        await wait('!!'+buttonByLabel('Mở menu tài khoản'));
        const trigger=buttonByLabel('Mở menu tài khoản');
        if(!baseline)assert.ok(await js('!document.querySelector(".public-header__cta")'));
        await shot(`account-nav-${r}-${width}-top`);
        await js(trigger+'.focus()');await key('Enter');await wait('!!document.querySelector("[role=menu]")');
        await wait('document.activeElement.getAttribute("role")==="menuitem"');await delay(200);
        const menu=await js(`(()=>{const e=document.querySelector('[role=menu]');return{items:[...e.querySelectorAll('[role=menuitem]')].map(n=>({text:n.textContent.trim(),href:n.getAttribute('href'),height:n.getBoundingClientRect().height})),focus:document.activeElement.getAttribute('href'),rect:e.getBoundingClientRect().toJSON()}})()`);
        assert.equal(menu.items.filter(i=>i.href===destination).length,1);assert.equal(menu.items[0].href,destination);assert.equal(menu.items[0].text,label);assert.ok(menu.items[0].height>=44);
        assert.equal(menu.focus,destination);assert.ok(menu.rect.left>=0&&menu.rect.right<=width);
        await shot(`account-nav-${r}-${width}-open`);
        await key('ArrowDown');await wait('document.activeElement.getAttribute("href")==='+JSON.stringify('/profile'));
        await key('ArrowUp');await wait('document.activeElement.getAttribute("href")==='+JSON.stringify(destination));await key('Enter');await wait('location.pathname==='+JSON.stringify(destination));await wait('!!document.querySelector("h1")');
        await nav('/news');await wait('!!'+trigger);await js(trigger+'.focus()');await key('Enter');await wait('!!document.querySelector("[role=menu]")');await key('Escape');await wait('!document.querySelector("[role=menu]")');
        assert.ok(await js('document.activeElement.getAttribute("aria-label")==="Mở menu tài khoản"&&document.activeElement.matches(":focus-visible")'));
      }
      role='ANON';await nav('/news?keep=value');await theme(width===390?'dark':'light');
      const login='[...document.querySelectorAll(".public-header a")].find(e=>e.getAttribute("href")==="/login")';
      await wait('!!'+login);
      assert.ok(await js('!'+buttonByLabel('Mở menu tài khoản')));
      await shot(`account-nav-guest-${width}`);await js(login+'.focus()');await key('Enter');await wait('location.pathname==="/login"');
    }
    checks.push('Account navigation:ADMIN/LECTURER/STUDENT exact existing first workspace link/no duplicates;desktop shortcut removed after-only;1280light/390dark menu44px,ArrowDown/Up/Enter guarded destination,Escape/focus return;guest sign-in retained');
  }

  // News-only surface proof on actual routes; neutral synthetic media, no live content.
  if (process.env.PRODUCT_NEWS_DEPTH) {
    role='ANON';
    const [width,height]=(process.env.PRODUCT_VIEWPORT??'390x844').split('x').map(Number);
    await resize(width,height);
    for(const t of ['light','dark']) {
      await nav('/news?keep=value');await theme(t);await wait('document.querySelectorAll(".school-news__feed .school-news-post").length===4');
      await js('[...document.querySelectorAll(".school-news__feed img")].at(-1)?.scrollIntoView({block:"center"})');
      await wait('document.querySelectorAll(".school-news__feed .school-news-post--illustrated").length===1');await js('scrollTo(0,0)');
      await shot(`news-depth-top-${width}x${height}-${t}`);
      await js('document.querySelector(".school-news__feed").scrollIntoView({block:"start"});scrollBy(0,-80)');
      await shot(`news-depth-rows-${width}x${height}-${t}`);
      const geometry=await js(`(()=>{
        const feed=document.querySelector('.school-news__feed'),list=feed.querySelector('.school-news__posts'),link=feed.querySelector('a.school-news-post__link'),label=feed.querySelector('.post-type-label');
        const style=e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,color:s.color,border:s.borderColor,paddingLeft:s.paddingLeft,paddingTop:s.paddingTop,shadow:s.boxShadow,outline:s.outlineStyle,outlineWidth:s.outlineWidth,outlineOffset:s.outlineOffset}};
        const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
        const rgb=value=>{ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)};
        const luminance=value=>rgb(value).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        const ls=getComputedStyle(label),fg=luminance(ls.color),bg=luminance(ls.backgroundColor);
        return {labelContrast:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05),deadlineMatchesSemantic:JSON.stringify(rgb(getComputedStyle(feed.querySelector('[data-urgency=expired]')).color))===JSON.stringify(rgb(getComputedStyle(document.documentElement).getPropertyValue('--destructive').trim())),list:style(list),link:style(link),label:style(label),card:getComputedStyle(document.documentElement).getPropertyValue('--card').trim(),primary:getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
          deadline:style(feed.querySelector('[data-urgency=expired]')),rows:[...feed.querySelectorAll('.school-news-post')].map(e=>({rect:e.getBoundingClientRect().toJSON(),title:e.querySelector('h3').getBoundingClientRect().toJSON()})),
          pinned:!!document.querySelector('.school-news__pin'),types:[...feed.querySelectorAll('.post-type-label')].map(e=>e.textContent.trim()),illustrated:feed.querySelectorAll('.school-news-post--illustrated').length,management:document.querySelector('.public-header__cta')?.textContent};
      })()`);
      if(!baseline) {
        assert.equal(geometry.link.paddingLeft,width<768?'12px':'16px');assert.equal(geometry.list.shadow,'none');assert.ok(geometry.labelContrast>=4.5,'label contrast');assert.ok(geometry.deadlineMatchesSemantic,'semantic deadline color');
        assert.notEqual(geometry.list.background,'rgba(0, 0, 0, 0)');assert.equal(geometry.illustrated,1);assert.ok(geometry.pinned);
        assert.deepEqual(geometry.types,['Thông báo','Blog','Tin tức','Tin tức']);
        for(const row of geometry.rows)assert.ok(row.rect.x>=0&&row.rect.right<=width&&row.title.right<=row.rect.right);
      }
      await js('document.querySelector(".school-news__feed .school-news-post__link").focus()');await key('Tab');
      // Return using reverse tab so focus-visible follows real keyboard navigation.
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',windowsVirtualKeyCode:9,modifiers:8});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',windowsVirtualKeyCode:9,modifiers:8});
      await delay(180);
      const focus=await js(`(()=>{const e=document.activeElement,s=getComputedStyle(e);return{row:e.matches('.school-news-post__link'),visible:e.matches(':focus-visible'),background:s.backgroundColor,outline:s.outlineStyle,width:s.outlineWidth,offset:s.outlineOffset}})()`);
      if(!baseline){assert.ok(focus.row&&focus.visible);assert.equal(focus.outline,'solid');assert.equal(focus.width,'2px');assert.equal(focus.offset,'-2px');assert.notEqual(focus.background,'rgba(0, 0, 0, 0)');assert.notEqual(focus.background,geometry.list.background);}
      await shot(`news-depth-keyboard-${width}x${height}-${t}`);
      await writeFile(join(dir,`news-depth-geometry-${width}-${t}.json`),JSON.stringify({geometry,focus},null,2));
    }
    if(!baseline) {
      await key('Enter');await wait('location.pathname==="/news/synthetic-news-0"');await wait('!!document.querySelector(".rich-text-viewer")');
      await js('history.back()');await wait('location.pathname==="/news"&&new URLSearchParams(location.search).get("keep")==="value"');await wait('!!document.querySelector(".school-news__feed .school-news-post")');
      const center=await js('(()=>{const e=document.querySelector(".school-news__feed .school-news-post__link");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return{x:r.x+20,y:r.y+20}})()');
      await js('document.activeElement.blur()');await call('Input.dispatchMouseEvent',{type:'mouseMoved',...center});await delay(200);
      assert.ok(await js('(()=>{const e=document.querySelector(".school-news__feed .school-news-post__link");return getComputedStyle(e).backgroundColor!==getComputedStyle(document.querySelector(".school-news__posts")).backgroundColor})()'));
      await shot(`news-depth-hover-${width}x${height}-dark`);
      if(width===390)for(const n of [0,1]){newsDepthCount=n;await nav('/news');await theme('dark');await wait(n?'document.querySelectorAll(".school-news__feed .school-news-post").length===1':'document.querySelector(".school-news__feed [role=status]")?.textContent.includes("Bảng tin chưa có bài viết")');if(!n)assert.ok(await js('!document.querySelector(".school-news__feed .school-news__posts")'));await shot('news-depth-count-'+n+'-390-dark');}
    }
    checks.push(`News-only ${width}x${height} light/dark:compact neutral surface/insets;blue category text/tint;keyboard inset focus;unchanged semantic deadline/pin;long title/media-error wrapping;Enter/read/Back and hover after-only`);
  }

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
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),requests,errors,state:js?await js('({url:location.href,input:document.querySelector(".document-filter-search input")?.value,probe:window.probeDocument,headers:document.querySelectorAll("header").length,startup:!!document.querySelector("#startup-loader"),inert:!!document.querySelector("#root[inert]")})').catch(()=>null):null,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},2000).unref();}
