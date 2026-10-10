// Actual routes, synthetic intercepted API/widget only; no production content or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.VISUAL_WEB_URL??'http://127.0.0.1:3132',baseline=process.env.VISUAL_BASELINE==='1',broad=process.env.VISUAL_BROAD==='1',documents=process.env.VISUAL_DOCUMENTS==='1',news=process.env.VISUAL_NEWS==='1';
const discoveryMatrix=process.env.VISUAL_MATRIX_EXTRA==='1'?[[320,568,'dark'],[390,844,'light'],[820,900,'dark'],[1440,900,'light']]:[[320,568,'light'],[390,844,'dark'],[820,900,'light'],[1440,900,'dark']];
const dir=await mkdtemp(join(tmpdir(),`visual-layout-${baseline?'before':'after'}-`));
const checks=[],screenshots=[],requests=[],errors=[],networkFailures=[];
let failureContext=null;
let mode='many',role='ADMIN',socket,call,js;
let recordOwner='00000000-0000-0000-0000-000000000001';
let album={id:'synthetic-album',title:'Synthetic album',subject:'Toán',year:2026,description:'Local only',scope:'SCHOOL',status:'DRAFT',participants:[{fullName:'Synthetic participant'}],photos:[],version:1};
const uid='00000000-0000-0000-0000-000000000001';
const user=()=>({id:uid,username:'synthetic',fullName:'Synthetic fixture',email:'fixture@example.invalid',role,status:'ACTIVE',avatarUrl:null});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const records=()=>[{id:'synthetic-record',userId:recordOwner,fullName:'Synthetic fixture',title:'Synthetic · Thành tích học tập',description:'Local fixture only',category:'OLYMPIC_NATIONAL',award:'THIRD',includeParticipation:true,achievedDate:'2026-10-09',publicVisible:true,status:'PENDING',awardPoints:8,participationPoints:6,totalPoints:14,version:1,evidence:mode==='zero'?[]:[...Array.from({length:mode==='one'?1:3},(_,i)=>({id:'image-'+i,originalName:'synthetic-'+i+'.png',contentType:'image/png',size:png.length})),...(mode==='one'?[]:[{id:'pdf',originalName:'synthetic-report.pdf',contentType:'application/pdf',size:123}])]}];
const fixtureScript=`window.widgets=[];window.turnstile={render(c,o){const box=document.createElement('div');box.textContent='Synthetic Turnstile';box.style='width:100%;min-height:65px;border:1px solid gray';c.append(box);window.widgets.push({options:o,box});return ''+(window.widgets.length-1)},remove(id){window.widgets[+id].box.remove()},reset(){}};`;
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
  const emptyPage={content:[],totalPages:0,totalElements:0,number:0,size:12};
  const metadata={subjects:[{id:broad?'00000000-0000-0000-0000-000000000011':'subject-1',name:'Giải tích',code:'MATH',description:'Synthetic subject'}],categories:[{id:'category-1',name:'Giáo trình',description:'Synthetic category'}],tags:[{id:'tag-1',name:'Ôn tập'}]};
  const picture='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#00387b"/><path d="M0 380L280 120L600 500H0" fill="#97cde6"/><circle cx="640" cy="130" r="65" fill="#e3f0f5"/><text x="35" y="450" fill="white" font-size="28">Synthetic local illustration</text></svg>';
  const honor={...album,status:'PUBLISHED',title:'Dấu mốc Olympic Toán 2026',photos:[{id:'photo-1',originalName:'synthetic.svg'}],participants:[{fullName:'Synthetic student',award:'Giải Nhất'},{fullName:'Synthetic participant',award:'Giải Ba'}]};
  const documentFixture={id:'document-1',title:'Giáo trình Giải tích · Synthetic',slug:'synthetic-document',description:'Local illustration of study materials',thumbnailUrl:'/synthetic.svg',category:metadata.categories[0],subject:metadata.subjects[0],tags:[],owner:user(),createdAt:'2026-10-10T00:00:00Z',viewCount:12,downloadCount:3};
  const post={id:'post-1',slug:'synthetic-news',title:'Cùng chuẩn bị cho mùa Olympic mới',summary:'Synthetic local news for layout checks.',type:'NEWS',status:'PUBLISHED',thumbnailUrl:'/synthetic.svg',author:null,pinned:false,expiredAt:null,viewCount:0,createdAt:'2026-10-10T00:00:00Z',updatedAt:'2026-10-10T00:00:00Z',publishedAt:'2026-10-10T00:00:00Z',content:'<p>Synthetic content.</p>'};
  let newsState='ok',holdNews=false,releaseNews;
  const newsPosts=()=>[
    {...post,id:'news-announcement',slug:'synthetic-announcement',title:'Đăng ký ôn luyện Olympic Giải tích',summary:'Thông báo lịch đăng ký và hướng dẫn chuẩn bị cho lớp ôn luyện. Nội dung minh họa tổng hợp.',type:'ANNOUNCEMENT',pinned:true,expiredAt:'2026-10-20T00:00:00Z'},
    {...post,id:'news-story',slug:'synthetic-story',title:'Sinh viên chuẩn bị cho mùa Olympic mới',summary:'Hoạt động học tập và trao đổi trong trường. Nội dung minh họa tổng hợp.'},
    {...post,id:'news-blog',slug:'synthetic-blog',title:'Ghi chép học tập: giải bài toán giới hạn',type:'BLOG',thumbnailUrl:null,summary:'Cách tổ chức ghi chép và trao đổi bài tập. Nội dung minh họa tổng hợp.'},
    {...post,id:'news-broken',slug:'synthetic-broken',title:'Lịch sinh hoạt học thuật tháng mười',type:'ANNOUNCEMENT',thumbnailUrl:'/blocked-news.svg',summary:'Thông báo dành cho sinh viên. Nội dung minh họa tổng hợp.'}
  ];
  let documentState='ok',holdPreview=false,releasePreview,holdDocumentQuery=false,releaseDocumentQuery;
  const discoveryMetadata={
    subjects:[{id:'00000000-0000-0000-0000-000000000011',name:'Giải tích',code:'MATH'},{id:'00000000-0000-0000-0000-000000000012',name:'Đại số',code:'ALG'}],
    categories:[{id:'00000000-0000-0000-0000-000000000021',name:'Giáo trình'},{id:'00000000-0000-0000-0000-000000000022',name:'Đề thi'}],
    tags:[{id:'00000000-0000-0000-0000-000000000031',name:'Giới hạn'},{id:'00000000-0000-0000-0000-000000000032',name:'Ma trận'}]
  };
  const discoveryDocs=()=>[0,1,2].map(i=>({...documentFixture,id:'discovery-'+i,slug:'synthetic-material-'+i,
    title:i===2?'Đại số — Bộ bài tập':'Giải tích — Bộ bài tập',
    description:i===0?'Lý thuyết và bài tập giới hạn. Tài liệu minh họa tổng hợp.':i===1?'Đề ôn luyện có hướng dẫn giải. Tài liệu minh họa tổng hợp.':'Bài tập ma trận. Tài liệu minh họa tổng hợp.',
    subject:discoveryMetadata.subjects[i===2?1:0],category:discoveryMetadata.categories[i===1?1:0],tags:[discoveryMetadata.tags[i===2?1:0]],
    thumbnailUrl:i===0?'/synthetic-page.svg'+(holdPreview?'?pending=1':''):i===1?'/blocked-page.svg':null,downloadUrl:null}));
  let mutationStatus=503,holdMutation=false,releaseMutation;
  const fulfill = async e => {
    const u=new URL(e.request.url),path=u.pathname,method=e.request.method;
    if(news&&path.startsWith('/api/'))requests.push({path,method,role,query:u.search,body:e.request.postData});
    if(news&&path==='/blocked-news.svg')return reply(e,403,{});
    if(news&&path.endsWith('/posts')){
      const pinned=u.searchParams.get('pinned')==='true';
      if(holdNews)await new Promise(resolve=>releaseNews=resolve);
      if(newsState==='feed-error'&&!pinned||newsState==='priority-error'&&pinned)return reply(e,503,{detail:'Synthetic news failure'});
      let content=newsPosts().filter(p=>!pinned||p.pinned);
      if(u.searchParams.get('type'))content=content.filter(p=>p.type===u.searchParams.get('type'));
      if(u.searchParams.get('keyword'))content=content.filter(p=>p.title.toLowerCase().includes(u.searchParams.get('keyword').toLowerCase()));
      const page=Number(u.searchParams.get('page')||0);
      return reply(e,200,{...emptyPage,content:page===0?content:[],number:page,totalPages:content.length?2:0,totalElements:content.length});
    }
    if(news&&path.includes('/posts/slug/'))return reply(e,200,{...newsPosts().find(p=>path.endsWith('/'+p.slug)),content:'<h2>Hướng dẫn đăng ký</h2><p>Nội dung minh họa tổng hợp cho kiểm tra đọc trên điện thoại. Xem thông báo và chuẩn bị tài liệu cho buổi học.</p><h2>Chuẩn bị</h2><p>Đọc hướng dẫn, ghi lại lịch học và chọn tài liệu phù hợp.</p>'});
    if(documents&&path==='/synthetic-page.svg'){
      if(holdPreview)await new Promise(resolve=>releasePreview=resolve);
      return reply(e,200,'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="white"/><text x="50" y="85" fill="#00387b" font-family="sans-serif" font-size="30">Synthetic first page</text><text x="50" y="150" fill="#102d42" font-size="24">Calculus - Limits</text><path d="M50 195H550M50 230H500M50 265H530M50 300H490M50 400H550M50 435H500M50 470H530" stroke="#64748b" stroke-width="6"/></svg>','image/svg+xml');
    }
    if(documents&&path==='/blocked-page.svg')return reply(e,403,{});
    if(u.hostname==='challenges.cloudflare.com')return reply(e,200,fixtureScript,'application/javascript');
    if(path==='/synthetic.svg'||path.includes('/photos/'))return reply(e,200,picture,'image/svg+xml');
    if(!path.startsWith('/api/'))return u.origin===web&&!/\.(mp4|webm)$/.test(path)?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
    if(!news)requests.push({path,method,role,query:u.search,body:e.request.postData});
    if(documents&&path.endsWith('/documents/metadata'))return documentState==='metadata-error'?reply(e,503,{detail:'Synthetic filter failure'}):reply(e,200,discoveryMetadata);
    if(documents&&path.endsWith('/documents')){
      if(holdDocumentQuery)await new Promise(resolve=>releaseDocumentQuery=resolve);
      if(documentState==='error')return reply(e,503,{detail:'Synthetic document failure'});
      let content=discoveryDocs();
      for(const [param,field] of [['subjectId','subject'],['categoryId','category']])if(u.searchParams.get(param))content=content.filter(d=>d[field].id===u.searchParams.get(param));
      const tag=u.searchParams.get('tagIds[]')??u.searchParams.get('tagIds');if(tag)content=content.filter(d=>d.tags.some(t=>t.id===tag));
      const keyword=u.searchParams.get('keyword');if(keyword)content=content.filter(d=>(d.title+' '+d.description).toLowerCase().includes(keyword.toLowerCase()));
      return reply(e,200,{...emptyPage,content,totalElements:content.length,totalPages:content.length?1:0});
    }
    if(documents&&path.includes('/documents/synthetic-material-'))return reply(e,200,discoveryDocs().find(d=>path.endsWith('/'+d.slug))??discoveryDocs()[0]);
    if(path.endsWith('/users/me'))return role?reply(e,200,user()):reply(e,401,{status:401});
    if(path.endsWith('/auth/refresh'))return role?reply(e,200,{accessToken:'synthetic'}):reply(e,401,{status:401});
    if(method!=='GET'&&method!=='OPTIONS'){
      if(holdMutation)await new Promise(resolve=>releaseMutation=resolve);
      return reply(e,mutationStatus,path.includes('/storage/')&&mutationStatus===200?{id:'00000000-0000-0000-0000-000000000055',url:'/synthetic.svg'}:mutationStatus===503?{status:503,detail:'Synthetic failure; try again'}:{...album,id:'synthetic-saved'});
    }
    if(broad){
      if(path.endsWith('/recognition/rankings'))return reply(e,200,{...emptyPage,totalPages:1,totalElements:3,content:[1,2,3].map(rank=>({rank,userId:uid.slice(0,-1)+rank,fullName:'Synthetic participant '+rank,username:'synthetic',totalPoints:14,approvedCount:2}))});
      if(path.includes('/recognition/profiles/'))return reply(e,200,{userId:uid,fullName:'Synthetic participant',username:'synthetic',rankingOptIn:true,publicPoints:28,achievements:[...records().map(r=>({...r,status:'APPROVED',evidence:undefined})),{...records()[0],id:'older-public',status:'APPROVED',achievedDate:'2025-10-01',evidence:undefined},{...records()[0],id:'private-sentinel',title:'PRIVATE SENTINEL',status:'APPROVED',publicVisible:false}]});
      if(path.endsWith('/documents/synthetic-document'))return reply(e,200,{...documentFixture,downloadUrl:null});
      if(path.endsWith('/questions'))return reply(e,200,{...emptyPage,page:0,totalPages:1,totalElements:2,content:['DRAFT','PUBLISHED'].map((status,i)=>({id:'question-'+i,subjectName:'Giải tích',topicName:'Đạo hàm',status,createdById:uid,content:{schemaVersion:1,title:'Synthetic câu hỏi về giới hạn và đạo hàm của hàm số',structure:'SINGLE',stem:[],parts:[]},version:1}))});
      if(path.endsWith('/exams')||path.endsWith('/exams/drafts'))return reply(e,200,[{id:'exam-1',createdById:uid,version:2,latestPublishedVersion:1,totalPoints:10,title:'Synthetic đề Olympic Giải tích năm 2026 '+('unbroken'.repeat(8)),subjectId:'subject-1',instructions:'',releaseAt:'2026-10-11T07:00:00Z',items:[]}]);
      if(path.endsWith('/exams/papers'))return reply(e,200,[{id:'paper-1',examId:'exam-1',versionNumber:1,title:'Synthetic đề Olympic Giải tích năm 2026 '+('unbroken'.repeat(8)),subjectId:'subject-1',releaseAt:'2026-10-11T07:00:00Z',publishedAt:'2026-10-10T00:00:00Z',totalPoints:10}]);
    }
    if(path.endsWith('/documents/metadata'))return reply(e,200,metadata);
    if(path.endsWith('/topics')||path.endsWith('/subjects'))return reply(e,200,path.endsWith('/topics')?[{id:'topic-1',name:'Đạo hàm',subjectId:metadata.subjects[0].id}]:metadata.subjects);
    if(path.endsWith('/recognition/honors'))return reply(e,200,{...emptyPage,content:Array.from({length:3},(_,i)=>({...honor,id:'honor-'+i})),totalPages:1,totalElements:3});
    if(path.endsWith('/achievements/me'))return reply(e,200,records());
    if(path.endsWith('/preferences/me'))return reply(e,200,{rankingOptIn:false});
    if(path.endsWith('/admin/recognition/achievements'))return reply(e,200,emptyPage);
    if(path.endsWith('/documents'))return reply(e,200,{...emptyPage,content:[documentFixture],totalElements:1,totalPages:1});
    if(path.endsWith('/posts')||path.endsWith('/posts/management'))return reply(e,200,{...emptyPage,content:[post],totalElements:1,totalPages:1});
    if(path.endsWith('/status-counts'))return reply(e,200,{DRAFT:0,PUBLISHED:1,ARCHIVED:0});
    if(path.endsWith('/study-rooms'))return reply(e,200,[]);
    if(path.endsWith('/exams')||path.endsWith('/exams/drafts')||path.endsWith('/exams/papers'))return reply(e,200,[]);
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
  const nav=async path=>{if(broad&&await js(`!!document.querySelector('main')&&!document.querySelector('#startup-loader')`)){await js(`history.pushState({idx:(history.state?.idx??0)+1,key:String(Date.now()),usr:null},'',${JSON.stringify(path)});window.dispatchEvent(new PopStateEvent('popstate'))`);await wait(`location.pathname+location.search===${JSON.stringify(path)}&&!!document.querySelector('main')`);return;}const old=await js('window.probeDocument');await call('Page.navigate',{url:web+path});await wait(`window.probeDocument!==${JSON.stringify(old)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);};
  const shot=async name=>{await delay(200);const geometry=await js(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.className,account:document.getElementById('login-identifier')?.getBoundingClientRect().toJSON(),password:document.getElementById('login-password')?.getBoundingClientRect().toJSON(),forgot:document.querySelector('a[href="/forgot-password"]')?.getBoundingClientRect().toJSON()})`);if(!baseline)assert.ok(geometry.scrollWidth<=geometry.width,'overflow '+name);const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push({path,geometry});};
  const theme=value=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(value)}))`);
  const clickText=async text=>js(`(()=>{const scope=document.querySelector('[role=alertdialog]')??[...document.querySelectorAll('[role=dialog]')].at(-1)??document;const b=[...scope.querySelectorAll('button,a[data-slot="button"]')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('missing '+${JSON.stringify(text)});b.focus();b.click()})()`);
  const fill=async(selector,value)=>{ await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('missing input');e.focus();Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`); await delay(100); };
  const dialog=()=>wait(`!!document.querySelector('.creation-dialog')`);
  const modalCheck=async()=>{await dialog();await delay(200);assert.equal(await js(`document.activeElement.getAttribute('data-slot')`),'dialog-title');const g=await js(`({r:document.querySelector('.creation-dialog').getBoundingClientRect().toJSON(),w:innerWidth,h:innerHeight})`);assert.ok(g.r.x>=-1&&g.r.right<=g.w+1&&g.r.y>=-1&&g.r.bottom<=g.h+1,JSON.stringify(g));assert.ok(await js(`document.querySelector('.creation-dialog__header > button').getBoundingClientRect().height>=44`));await key('Tab');assert.ok(await js(`document.querySelector('.creation-dialog').contains(document.activeElement)`));};
  const closeClean=async()=>{await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);};
  for(const [width,height,t] of (news||documents||broad||process.env.VISUAL_CREATION_ONLY==='1')?[]:[[320,568,'light'],[390,844,'dark'],[820,900,'light'],[1440,900,'dark'],[320,360,'dark']]){
    await resize(width,height);role='ADMIN';await nav('/honors');await theme(t);await wait(`document.querySelector('.recognition-memory img')`);await shot((baseline?'before':'after')+'-honors-'+width+'x'+height+'-'+t);await js(`document.querySelector('.recognition-memory').scrollIntoView({block:'start'})`);await shot((baseline?'before':'after')+'-honor-card-'+width+'x'+height+'-'+t);
    if(!baseline){const r=await js(`(()=>{const c=document.querySelector('.recognition-memory'),p=c.querySelector('.recognition-memory__photo'),b=c.querySelector('.recognition-memory__body');return {border:getComputedStyle(c).borderTopWidth,shadow:getComputedStyle(c).boxShadow,photo:p.getBoundingClientRect().toJSON(),body:b.getBoundingClientRect().toJSON()}})()`);assert.equal(r.border,'1px');assert.notEqual(r.shadow,'none');assert.ok(r.photo.bottom<=r.body.y+1);checks.push('Cohesive Honors card '+width);}
    for(const route of ['/documents','/news','/subjects','/admin/questions','/toolkit?tool=gpa']){await nav(route);await wait(`document.querySelector('main')`);await delay(350);await shot((baseline?'before':'after')+'-'+route.split('?')[0].replaceAll('/','-')+'-'+width+'x'+height+'-'+t);}
    await nav('/admin/exams/new');await wait(`document.getElementById('exam-title')`);await shot((baseline?'before':'after')+'-exam-create-'+width+'x'+height+'-'+t);if(!baseline){await modalCheck();await fill('#exam-title','Synthetic draft');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');await wait(`!document.querySelector('[role=alertdialog]')`);assert.equal(await js(`document.getElementById('exam-title').value`),'Synthetic draft');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Bỏ thay đổi');await wait(`location.pathname==='/admin/exams'`);await wait(`document.activeElement?.getAttribute('href')==='/admin/exams/new'||document.activeElement?.matches('main h1')`);checks.push('Exam modal geometry/dirty keep/discard/route focus return '+width);}
  }
  if(broad){
    const pages=[['/news','.school-news__pinned-posts'],['/documents/synthetic-document',baseline?'main [style*="600px"]':'.document-reader__viewport'],['/rankings','.ranking-presentation__row'],['/achievements/'+uid,'.achievement-presentation__record'],['/profile','.profile-identity'],['/toolkit?tool=gpa','.toolkit-gpa__row'],['/admin/questions','main .content-card'],['/admin/exams','main ul li'],['/admin/exams/papers','main ul li'],['/admin/categories','main [role=tab]']];
    for(const [width,height,t] of process.env.VISUAL_BROAD_INTERACTIONS==='1'?[]:(process.env.VISUAL_BROAD_TAIL==='1'?[[1440,900,'dark'],[320,360,'dark']]:[[320,568,'light'],[390,844,'dark'],[820,900,'light'],[1440,900,'dark'],[320,360,'dark']])){
      await resize(width,height);role='ADMIN';
      for(const [route,selector] of process.env.VISUAL_BROAD_ASSESSMENT==='1'?pages.filter(([route])=>['/admin/questions','/admin/exams','/admin/exams/papers'].includes(route)):pages){
        await nav(route);await theme(t);await wait(`document.querySelector(${JSON.stringify(selector)})`);await delay(150);
        await shot((baseline?'before':'after')+'-broad-'+route.split('?')[0].replaceAll('/','-')+'-'+width+'x'+height+'-'+t);
        if(!baseline){
          if(route==='/news'&&width>=768){const g=await js(`(()=>{const p=document.querySelector('.school-news__pinned-posts'),c=p.firstElementChild;return {p:p.clientWidth,c:c.getBoundingClientRect().width}})()`);assert.ok(g.c>=g.p-2,'one pinned item occupies available width');}
          if(route.includes('synthetic-document')){assert.ok(await js(`(()=>{const card=document.querySelector('main .content-card');return [...card.querySelectorAll('button')].every(b=>b.scrollWidth<=b.clientWidth&&b.getBoundingClientRect().height>=44)})()`),'reader action labels fit');const h=await js(`document.querySelector('.document-reader__viewport').getBoundingClientRect().height`);if(width<=640)assert.ok(h<600&&h<=height,'mobile reader no forced600px');}
          if(route==='/rankings'){assert.equal(await js(`document.querySelectorAll('.ranking-presentation__row').length`),3);assert.ok(await js(`document.querySelector('.ranking-presentation__identity a').getBoundingClientRect().height>=44`));}
          if(route==='/admin/categories')assert.ok(await js(`Array.from(document.querySelectorAll('main [role=tab]')).every(t=>t.getBoundingClientRect().height>=44)`),'category44px triggers');
          if(route==='/profile'&&width===820)assert.ok(await js(`document.querySelector('.profile-identity').getBoundingClientRect().height<350`),'tablet identity compact');
        }
      }
      checks.push((baseline?'Baseline geometry recorded (existing overflow retained) ':process.env.VISUAL_BROAD_ASSESSMENT==='1'?'Three final assessment layouts/no overflow incl long unbroken titles ':'Ten nonempty page-family layouts/no page overflow ')+width+'x'+height+' '+t);
    }
    if(!baseline&&process.env.VISUAL_DISCOVERY_MATRIX_ONLY!=='1'&&process.env.VISUAL_DISCOVERY_WALK_ONLY!=='1'){
      await resize(320,568);await nav('/rankings');await wait(`document.querySelector('.ranking-presentation__identity a')`);await js(`document.querySelector('.ranking-presentation__identity a').focus()`);await key('Enter');await wait(`location.pathname.startsWith('/achievements/')`);await wait(`document.querySelector('.achievement-presentation__record')`);assert.ok(!requests.some(r=>r.path.includes('/evidence/')));assert.equal(await js(`document.querySelectorAll('.achievement-presentation__year').length`),2);assert.ok(await js(`!document.querySelector('main').textContent.includes('PRIVATE SENTINEL')`));checks.push('Ranking native Enter destination; two public years grouped/private record excluded/no private evidence fetch');
      await nav('/news');await wait(`document.getElementById('school-news-search')`);await fill('#school-news-search',' limits ');await js(`document.getElementById('school-news-search').focus()`);await key('Enter');await wait(`new URLSearchParams(location.search).get('q')==='limits'`);await wait(`!document.querySelector('.school-news__pinned')`);checks.push('News Enter trim/URL and independent priority visibility');
      await nav('/toolkit?tool=gpa');await wait(`document.querySelector('.toolkit-gpa__row input')`);const row=await js(`document.querySelector('.toolkit-gpa__row input').value`);await clickText('Thêm học phần');await modalCheck();await closeClean();assert.equal(await js(`document.querySelector('.toolkit-gpa__row input').value`),row);checks.push('GPA reflow retains rows through modal open/close and focus return');
      await nav('/admin/categories');await wait(`document.querySelector('main h1')?.textContent==='Danh mục hệ thống'&&document.querySelectorAll('main [role=tab]').length===3`);await delay(200);await js(`document.querySelector('main [role=tab]').focus()`);await key('ArrowRight');await wait(`document.activeElement.getAttribute('data-state')==='active'&&document.activeElement.textContent.includes('Môn học')`);await clickText('Thêm môn học');await modalCheck();await closeClean();checks.push('Category ArrowRight Radix activation/44px targets; correct subject Create modal/Escape focus return');
      await nav('/admin/questions?subjectId=00000000-0000-0000-0000-000000000011');await wait(`document.querySelector('main input[aria-label="Tìm nội dung câu hỏi"]')`);await fill('main input[aria-label="Tìm nội dung câu hỏi"]',' limit ');await key('Enter');await wait(`new URLSearchParams(location.search).get('search')==='limit'`);assert.equal(await js(`new URLSearchParams(location.search).get('subjectId')`),'00000000-0000-0000-0000-000000000011');await wait(`Array.from(document.querySelectorAll('main .content-card button')).some(b=>b.textContent.trim()==='Sao chép')`);await delay(400);await wait(`Array.from(document.querySelectorAll('main .content-card button')).some(b=>b.textContent.trim()==='Sao chép')`);holdMutation=true;await js(`(()=>{const b=[...document.querySelectorAll('main .content-card button')].find(b=>b.textContent.trim()==='Sao chép');b.focus()})()`);assert.equal(await js(`document.activeElement.textContent.trim()`),'Sao chép');await key('Enter');await wait(`Array.from(document.querySelectorAll('main .content-card button')).some(b=>b.textContent.trim()==='Sao chép'&&b.disabled)`);assert.ok(requests.some(r=>r.path.endsWith('/questions/question-0/duplicate')));holdMutation=false;releaseMutation();await wait(`Array.from(document.querySelectorAll('main .content-card button')).some(b=>b.textContent.trim()==='Sao chép'&&!b.disabled)`);assert.equal(await js(`document.querySelectorAll('main .content-card').length`),2);assert.ok(await js(`Array.from(document.querySelectorAll('main .content-card button,main .content-card a')).every(b=>b.getBoundingClientRect().height>=44)`));checks.push('Question Enter search trims/keeps subject; native duplicate activates correct callback, pending disablement/failure retains cards/44px actions');
      await nav('/admin/exams');await wait(`document.querySelector('main a[href="/admin/exams/new"]')`);await js(`document.querySelector('main a[href="/admin/exams/new"]').focus()`);await key('Enter');await wait(`document.getElementById('exam-title')`);await modalCheck();await fill('#exam-title','Preserved local exam draft');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');assert.equal(await js(`document.getElementById('exam-title').value`),'Preserved local exam draft');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Bỏ thay đổi');await wait(`location.pathname==='/admin/exams'&&!!document.querySelector('main a[href="/admin/exams/new"]')`);checks.push('Assessment list Create native Enter opens existing modal; dirty keep/discard/return path unchanged');
    }
  }
  if(!baseline&&!broad&&!documents&&!news){
    await resize(320,568);role='ADMIN';await nav('/admin/exams/new');await wait(`document.getElementById('exam-title')`);await modalCheck();await fill('#exam-title','Synthetic draft');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');await wait(`!document.querySelector('[role=alertdialog]')`);assert.equal(await js(`document.getElementById('exam-title').value`),'Synthetic draft');checks.push('Exam dirty close retains draft');
    await nav('/admin/recognition');await clickText('Tạo vinh danh');await modalCheck();await shot('after-honor-create-320');await closeClean();assert.equal(await js(`document.activeElement.textContent.trim()`),'Tạo vinh danh');
    await clickText('Tạo vinh danh');await dialog();await fill('.creation-dialog input:not([type]),.creation-dialog input[type=text]','Synthetic draft');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');assert.equal(await js(`document.querySelector('.creation-dialog input:not([type]),.creation-dialog input[type=text]').value`),'Synthetic draft');await shot('after-honor-dirty-320');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Bỏ thay đổi');await wait(`!document.querySelector('[role=dialog]')`);checks.push('Honors initial focus/opener return/discard');
    for(const [route,text] of [['/admin/documents','Thêm tài liệu mới'],['/admin/posts','Tạo bài viết mới'],['/admin/categories','Thêm phân loại'],['/profile/achievements','Thêm thành tích'],['/toolkit?tool=rooms','Tạo phòng']]){role=route==='/profile/achievements'?'STUDENT':'ADMIN';await nav(route);await delay(400);await clickText(text);await modalCheck();await shot('after-create-'+route.replaceAll('/','-').replaceAll('?','-')+'-320');await closeClean();checks.push('Modal opening/clean Escape/focus trap '+route);}
    role='ADMIN';await nav('/admin/documents');await clickText('Thêm tài liệu mới');await dialog();await js(`void(document.querySelector('.creation-dialog [role=combobox]').focus())`);await key('Enter');await wait(`document.querySelector('[role=listbox]')`);await key('Escape');await wait(`!document.querySelector('[role=listbox]')`);assert.ok(await js(`document.querySelector('.creation-dialog').contains(document.activeElement)`));await key('Enter');await wait(`document.querySelector('[role=listbox]')`);await key('ArrowDown');await key('Enter');await wait(`!document.querySelector('[role=listbox]')`);await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');checks.push('Document dropdown focus/escape/selection-only dirty guard');
    await nav('/admin/posts');await clickText('Tạo bài viết mới');await dialog();await js(`(()=>{const b=document.querySelector('.creation-dialog [aria-label="Chèn hình ảnh"]');b.focus();b.click()})()`);await wait(`document.querySelectorAll('[role=dialog]').length===2`);await key('Escape');await wait(`document.querySelectorAll('[role=dialog]').length===1`);assert.equal(await js(`document.activeElement.getAttribute('aria-label')`),'Chèn hình ảnh');await js(`document.activeElement.click()`);await wait(`document.querySelectorAll('[role=dialog]').length===2`);
    holdMutation=true;await js(`(()=>{const e=[...document.querySelectorAll('[role=dialog]')].at(-1).querySelector('input[type=file]'),d=new DataTransfer();d.items.add(new File(['synthetic'],'fixture.png',{type:'image/png'}));e.files=d.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await wait(`document.querySelector('.creation-dialog__header button').disabled`);await key('Escape');assert.equal(await js(`document.querySelectorAll('[role=dialog]').length`),2);holdMutation=false;releaseMutation();await wait(`!document.querySelector('.creation-dialog__header button').disabled`);mutationStatus=200;await js(`(()=>{const e=[...document.querySelectorAll('[role=dialog]')].at(-1).querySelector('input[type=file]'),d=new DataTransfer();d.items.add(new File(['synthetic'],'fixture.png',{type:'image/png'}));e.files=d.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await wait(`document.querySelector('.tiptap img')&&document.querySelectorAll('[role=dialog]').length===1`);mutationStatus=503;await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');assert.ok(await js(`!!document.querySelector('.tiptap img')`));checks.push('Nested post image focus return; upload busy close blocked; failure/retry URL retained in draft');
    role='ADMIN';await nav('/admin/questions/new');await wait(`document.getElementById('manual-title')`);await modalCheck();await fill('#manual-title','Synthetic unsaved question');await key('Escape');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');assert.equal(await js(`document.getElementById('manual-title').value`),'Synthetic unsaved question');await shot('after-question-draft-320');checks.push('New question modal draft retained');
    await nav('/toolkit?tool=gpa');await clickText('Thêm học phần');await modalCheck();await fill('#new-course-credits','0');await fill('#new-course-grade','8');await clickText('Thêm học phần');await wait(`document.querySelector('#new-course-credits-error')`);assert.equal(await js(`document.getElementById('new-course-grade').value`),'8');await fill('#new-course-credits','3');await fill('#new-course-grade','3,5');await clickText('Thêm học phần');await wait(`!document.querySelector('[role=dialog]')`);assert.equal(await js(`document.querySelectorAll('.toolkit-gpa__row').length`),3);checks.push('GPA invalid range retains draft; comma decimal accepted and adds row');
    await nav('/toolkit?tool=rooms');await clickText('Tạo phòng');await dialog();await fill('#study-room-name','Synthetic room');holdMutation=true;await clickText('Tạo phòng và vào học');await wait(`document.querySelector('.creation-dialog__header button').disabled`);await key('Escape');assert.ok(await js(`!!document.querySelector('.creation-dialog')`));holdMutation=false;releaseMutation();await wait(`document.querySelector('.study-room-error')`);assert.equal(await js(`document.getElementById('study-room-name').value`),'Synthetic room');await shot('after-room-create-failure-320');checks.push('Room pending blocks close; failed create keeps draft');
    await nav('/admin/questions/import');await clickText('Nhập đề từ PDF');await modalCheck();await js(`(()=>{const e=document.getElementById('assessment-pdf'),d=new DataTransfer();d.items.add(new File(['not pdf'],'synthetic.txt',{type:'text/plain'}));e.files=d.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await clickText('Bắt đầu phân tích');await wait(`document.querySelector('.creation-dialog [role=alert]')`);assert.equal(await js(`document.getElementById('assessment-pdf').files[0].name`),'synthetic.txt');checks.push('PDF invalid selection retained; no API mutation');
    await resize(320,360);role='ADMIN';await nav('/admin/recognition');await clickText('Tạo vinh danh');await modalCheck();await js(`(()=>{const body=document.querySelector('.creation-dialog__body');body.scrollTop=body.scrollHeight;})()`);await shot('after-honor-scroll-short-320');assert.ok(await js(`(()=>{const b=document.querySelector('.creation-dialog__body'),submit=b.querySelector('button[type=submit]'),r=submit.getBoundingClientRect();return b.scrollHeight>b.clientHeight&&r.top>=b.getBoundingClientRect().top&&r.bottom<=innerHeight&&document.querySelector('.creation-dialog__header > button').getBoundingClientRect().top>=0;})()`));await closeClean();checks.push('Short320 dialog body scroll reaches submit with header close available');
    await resize(820,900);await clickText('Tạo vinh danh');await modalCheck();await fill('.creation-dialog input:not([type]),.creation-dialog input[type=text]','Backdrop draft');await call('Input.dispatchMouseEvent',{type:'mousePressed',x:4,y:4,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:4,y:4,button:'left',clickCount:1});await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Tiếp tục chỉnh sửa');await wait(`!document.querySelector('[role=alertdialog]')`);assert.equal(await js(`document.querySelector('.creation-dialog input:not([type]),.creation-dialog input[type=text]').value`),'Backdrop draft');await clickText('Đóng');await wait(`document.querySelector('[role=alertdialog]')`);await clickText('Bỏ thay đổi');await wait(`!document.querySelector('[role=dialog]')`);assert.equal(await js(`document.activeElement.textContent.trim()`),'Tạo vinh danh');checks.push('Tablet backdrop/Close dirty guard and discard returns external opener');
    role='STUDENT';await nav('/admin/recognition');await wait(`location.pathname!=='/admin/recognition'`);assert.equal(await js(`document.querySelectorAll('.creation-dialog').length`),0);checks.push('Non-admin route guard unchanged');
    await resize(320,568);role=null;await nav('/register');await wait(`document.getElementById('register-email')`);await modalCheck();await wait(`window.widgets?.length`);await js(`window.widgets.at(-1).options.callback('synthetic-token')`);await wait(`document.querySelector('.creation-dialog button[type=submit]:not(:disabled)')`);await clickText('Tạo tài khoản');await wait(`document.getElementById('register-email').getAttribute('aria-invalid')==='true'`);await shot('after-register-validation-320');assert.ok(await js(`(()=>{const b=document.querySelector('.creation-dialog__body');return b.scrollWidth<=b.clientWidth&&[...b.querySelectorAll('.lbi-eye')].every(e=>e.getBoundingClientRect().width>=44&&e.getBoundingClientRect().height>=44);})()`));checks.push('Registration widget/validation, no horizontal body overflow and44px password controls; no OTP request');
    for(const [width,t] of [[390,'dark'],[820,'light'],[1440,'dark']]){await resize(width,900);await theme(t);await shot('after-register-validation-'+width+'-'+t);assert.ok(await js(`(()=>{const b=document.querySelector('.creation-dialog__body');return b.scrollWidth<=b.clientWidth&&[...b.querySelectorAll('.lbi-eye')].every(e=>e.getBoundingClientRect().width>=44&&e.getBoundingClientRect().height>=44);})()`));}checks.push('Register modal validation responsive390/820/1440 light/dark without overflow');
  }
  if(documents){
    const subject='00000000-0000-0000-0000-000000000011',category='00000000-0000-0000-0000-000000000022',tag='00000000-0000-0000-0000-000000000031';
    const openDocs=async query=>{await nav('/documents'+(query??''));await wait(`document.querySelector('main article h3')`);await delay(300);await js('window.scrollTo(0,0)')};
    for(const [width,height,t] of process.env.VISUAL_DOCUMENTS_INTERACTIONS==='1'||process.env.VISUAL_DISCOVERY_WALK_ONLY==='1'?[]:discoveryMatrix){
      await resize(width,height);await openDocs('');await theme(t);await shot((baseline?'before':'after')+'-documents-search-'+width+'-'+t);
      await js(`document.querySelector('main article').scrollIntoView({block:'start'});window.scrollBy(0,-80)`);await delay(400);await shot((baseline?'before':'after')+'-documents-recognition-'+width+'-'+t);
      if(!baseline){
        assert.ok(await js(`Array.from(document.querySelectorAll('main article')).every(a=>a.textContent.includes(a.querySelector('h3').textContent.startsWith('Đại số')?'Đại số':'Giải tích')&&a.textContent.includes('Mở tài liệu'))`));
        assert.ok(await js(`Array.from(document.querySelectorAll('main article a[data-slot=button],main article button')).every(e=>e.getBoundingClientRect().height>=44)`));
        assert.ok(await js(`!!document.querySelector('.document-thumbnail__image:not(.invisible)')`));
        await js(`document.querySelectorAll('main article')[1].scrollIntoView({block:'center'})`);
        await wait(`document.querySelectorAll('main article')[1].textContent.includes('Không tải được ảnh xem trước')`);
        assert.ok(await js(`document.querySelectorAll('main article')[2].textContent.includes('Chưa có ảnh xem trước')`));
      }
      checks.push((baseline?'Before':'After')+' learner scan/search/similar-title kind+context, public preview/blocked/unsupported '+width+' '+t);
    }
    if(!baseline&&process.env.VISUAL_DISCOVERY_MATRIX_ONLY!=='1'&&process.env.VISUAL_DISCOVERY_WALK_ONLY!=='1'){
      await resize(320,568);await openDocs('?view=list');
      assert.ok(await js(`Array.from(document.querySelectorAll('main article')).every(a=>a.textContent.includes('Mở tài liệu')&&a.textContent.includes('Giáo trình')||a.textContent.includes('Đề thi'))`));
      await shot('after-documents-list-320');
      await nav('/documents?view=list&page=2&retained=yes');await wait(`document.querySelector('main [role=combobox]')`);
      await js(`document.querySelector('main [role=combobox][aria-label="Môn học"]').focus()`);await key('ArrowDown');await key('Enter');
      await wait(`new URLSearchParams(location.search).get('subjectId')===${JSON.stringify(subject)}&&document.querySelector('main [role=combobox][aria-label="Môn học"]').value==='Giải tích'`);await delay(100);
      assert.equal(await js(`new URLSearchParams(location.search).get('view')`),'list');assert.equal(await js(`new URLSearchParams(location.search).get('page')`),null);assert.equal(await js(`new URLSearchParams(location.search).get('retained')`),'yes');
      await js(`document.querySelector('main [role=combobox][aria-label="Loại tài liệu"]').focus()`);await key('ArrowDown');await key('ArrowDown');await key('Enter');
      await wait(`new URLSearchParams(location.search).get('categoryId')===${JSON.stringify(category)}&&document.querySelector('main [role=combobox][aria-label="Loại tài liệu"]').value==='Đề thi'`);await delay(100);
      await js(`document.querySelector('main [role=combobox][aria-label="Thẻ"]').focus()`);await key('ArrowDown');await key('Enter');
      await wait(`new URLSearchParams(location.search).get('tagId')===${JSON.stringify(tag)}&&document.querySelector('main [role=combobox][aria-label="Thẻ"]').value==='Giới hạn'`);await delay(100);
      await fill('main input[aria-label="Tìm trong kho tài liệu"]',' ôn luyện ');await delay(100);assert.ok(!requests.some(r=>r.path.endsWith('/documents')&&new URLSearchParams(r.query).get('keyword')==='ôn luyện'),'typing does not apply search');await key('Enter');
      await wait(`new URLSearchParams(location.search).get('keyword')==='ôn luyện'`);await wait(`document.querySelectorAll('main article').length===1`);await delay(300);assert.equal(await js(`new URLSearchParams(location.search).get('subjectId')`),subject);assert.equal(await js(`new URLSearchParams(location.search).get('categoryId')`),category);assert.equal(await js(`new URLSearchParams(location.search).get('tagId')`),tag);
      assert.ok(await js(`document.querySelector('main article').textContent.includes('Đề thi')`));await shot('after-documents-subject-kind-tag-keyword-320');
      checks.push('Keyboard subject/kind/topic-tag then trimmed Enter search; matching similarly named item; page reset/view+unrelated URL retained');
      await js(`document.querySelector('main article a').focus()`);await key('Enter');await wait(`location.pathname==='/documents/synthetic-material-1'`);await wait(`document.querySelector('main').textContent.includes('Đề ôn luyện')&&document.querySelector('main h1')?.textContent.includes('Giải tích')`);
      await js(`document.querySelector('main a[href^="/documents?"]').focus()`);await key('Enter');await wait(`location.pathname==='/documents'&&new URLSearchParams(location.search).get('keyword')==='ôn luyện'`);await wait(`document.querySelector('main article')`);
      await clickText('Xóa tất cả');await wait(`!new URLSearchParams(location.search).has('keyword')`);assert.equal(await js(`new URLSearchParams(location.search).get('view')`),'list');assert.equal(await js(`new URLSearchParams(location.search).get('retained')`),'yes');await wait(`document.querySelectorAll('main article').length===3&&document.querySelector('main input[aria-label="Tìm trong kho tài liệu"]').value===''`);await delay(200);
      checks.push('Native open/details/list return keeps filters; visible reset removes only filter/page params');
      await fill('main input[aria-label="Tìm trong kho tài liệu"]','no-results');await key('Enter');await wait(`document.querySelector('main').textContent.includes('Không tìm thấy tài liệu nào')`);await shot('after-documents-empty-320');await clickText('Xóa tất cả');await wait(`document.querySelector('main article')`);
      documentState='error';await nav('/documents?keyword=failure');await wait(`document.querySelector('main [role=alert]')`);await shot('after-documents-query-error-320');holdDocumentQuery=true;await clickText('Thử lại');await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes('Thử lại')&&b.disabled)||document.querySelector('main [role=status]')?.textContent.includes('Đang tải tài liệu')`);documentState='ok';holdDocumentQuery=false;releaseDocumentQuery();await wait(`!document.querySelector('main [role=alert]')`);
      checks.push('Empty query remains honest/reset usable; query failure/retry action disabled or replaced by loading while pending, recovers without changing query');
      documentState='metadata-error';await nav('/documents?metadata-failure=1');await wait(`document.querySelector('main').textContent.includes('Chưa tải được bộ lọc')`);assert.ok(await js(`Array.from(document.querySelectorAll('main [role=combobox]')).every(e=>e.disabled)`));documentState='ok';await clickText('Thử lại bộ lọc');await wait(`Array.from(document.querySelectorAll('main [role=combobox]')).every(e=>!e.disabled)`);checks.push('Metadata failure disables selectors; dedicated retry recovers independently');
      holdPreview=true;await nav('/documents?preview-pending=1');await wait(`document.querySelector('main article')`);await js(`document.querySelector('main article').scrollIntoView({block:'start'})`);await wait(`document.querySelector('.document-thumbnail[aria-busy=true]')`);await shot('after-documents-preview-loading-320');holdPreview=false;releasePreview();await wait(`document.querySelector('.document-thumbnail__image:not(.invisible)')`);checks.push('Preview loading keeps space/title/open action, then renders page; blocked/absent previews do not break browsing');
      assert.ok(!requests.some(r=>r.path.includes('/download')||r.path.includes('/evidence/')||r.method!=='GET'&&!r.path.endsWith('/view')),'discovery does not download originals/fetch private media/mutate content');
    }
  }
  if(news){
    role='STUDENT';
    for(const [width,height,t] of process.env.VISUAL_NEWS_INTERACTIONS==='1'||process.env.VISUAL_DISCOVERY_WALK_ONLY==='1'?[]:discoveryMatrix){
      await resize(width,height);await nav('/news');await theme(t);await wait(`document.querySelector('.school-news__posts article')`);await delay(400);
      await shot((baseline?'before':'after')+'-news-discovery-'+width+'-'+t);
      if(!baseline){
        const g=await js(`(()=>{const s=document.querySelector('.school-news__discovery'),p=document.querySelector('.school-news__pinned');return {s:s.getBoundingClientRect().y,p:p.getBoundingClientRect().y}})()`);assert.ok(g.s<g.p);
        assert.ok(await js(`Array.from(document.querySelectorAll('.school-news__categories a,.school-news__search button')).every(e=>e.getBoundingClientRect().height>=44)`));
      }
      await js(`document.querySelector('.school-news__posts').scrollIntoView({block:'start'});window.scrollBy(0,-80)`);await shot((baseline?'before':'after')+'-news-scan-'+width+'-'+t);
      if(!baseline&&width<=390)assert.ok(await js(`document.querySelector('.school-news__posts .school-news-post__image').getBoundingClientRect().width<=80`));
      await nav('/news/synthetic-announcement');await wait(`document.querySelector('main h1')?.textContent.includes('Đăng ký')`);await delay(600);await shot((baseline?'before':'after')+'-news-reader-'+width+'-'+t);
      checks.push('News search/scan/reader '+width+' '+t);
    }
    if(!baseline&&process.env.VISUAL_DISCOVERY_MATRIX_ONLY!=='1'&&process.env.VISUAL_DISCOVERY_WALK_ONLY!=='1'){
      await resize(320,568);await nav('/news?page=2&retained=yes');await wait(`document.querySelector('.school-news__categories a')`);
      await js(`document.querySelector('.school-news__categories a[href*=ANNOUNCEMENT]').focus()`);await key('Enter');await wait(`new URLSearchParams(location.search).get('type')==='ANNOUNCEMENT'&&!new URLSearchParams(location.search).has('page')`);await wait(`document.querySelector('.school-news__posts article')`);
      assert.equal(await js(`new URLSearchParams(location.search).get('retained')`),'yes');assert.ok(await js(`!document.querySelector('.school-news__pinned')`));
      await delay(250);const n=requests.length;await fill('#school-news-search',' Giải tích ');await delay(150);assert.ok(!requests.slice(n).some(r=>new URLSearchParams(r.query).get('keyword')));
      await js(`document.getElementById('school-news-search').focus()`);await key('Enter');await wait(`new URLSearchParams(location.search).get('q')==='Giải tích'`);await wait(`document.querySelectorAll('.school-news__posts article').length===1`);await shot('after-news-announcement-keyword-320');
      assert.ok(await js(`document.querySelector('.school-news__filter-summary').textContent.includes('Thông báo')&&document.querySelector('.school-news__filter-summary').textContent.includes('Giải tích')`));
      await js(`document.querySelector('.school-news__posts article a').focus()`);await key('Enter');await wait(`location.pathname==='/news/synthetic-announcement'`);await wait(`document.querySelector('main h1')?.textContent.includes('Đăng ký')`);
      await js(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.includes('Mục lục')).focus()`);await key('Enter');await wait(`document.querySelector('button[aria-expanded=true]')`);
      await js(`document.querySelector('button[aria-label^="Phóng to ảnh"]').focus()`);await key('Enter');await wait(`document.querySelector('[role=dialog]')`);await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);assert.ok(await js(`document.activeElement.matches('button[aria-label^="Phóng to ảnh"]')`));
      await js(`document.querySelector('main a[href^="/news?"]').focus()`);await key('Enter');await wait(`location.pathname==='/news'&&new URLSearchParams(location.search).get('q')==='Giải tích'`);await wait(`document.querySelector('.school-news__posts article')`);
      checks.push('Announcement native Enter/type/page reset/trimmed submit; typing does not submit; list return preserves type/q/unrelated URL; TOC and Dialog Escape/focus return');
      await clickText('Xóa bộ lọc');await wait(`location.search===''&&document.getElementById('school-news-search')?.value===''&&document.querySelector('.school-news__posts article')`);await delay(250);
      await fill('#school-news-search','no-results');await key('Enter');await wait(`document.querySelector('main').textContent.includes('Chưa tìm thấy bài viết phù hợp')`);await shot('after-news-empty-320');await clickText('Xem tất cả bài viết');await wait(`location.search===''&&document.querySelector('.school-news__posts article')`);
      newsState='feed-error';await nav('/news?q=failure');await wait(`document.querySelector('main [role=alert]')`);await shot('after-news-error-320');holdNews=true;await clickText('Thử lại bảng tin');await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes('Thử lại bảng tin')&&b.disabled)||document.querySelector('.school-news__loading')`);newsState='ok';holdNews=false;releaseNews();await wait(`!document.querySelector('main [role=alert]')`);assert.equal(await js(`new URLSearchParams(location.search).get('q')`),'failure');
      newsState='priority-error';await nav('/news');await wait(`document.querySelector('.school-news__pinned-error')`);assert.ok(await js(`!!document.querySelector('.school-news__posts article')`));newsState='ok';await clickText('Thử lại phần được ghim');await wait(`!document.querySelector('.school-news__pinned-error')&&document.querySelector('.school-news__pinned-posts article')`);
      checks.push('Empty reset retains existing clear-all policy; feed pending retry/query preserved; independent pinned retry leaves feed usable');
      assert.ok(!requests.some(r=>r.path.includes('/download')||r.path.includes('/evidence/')||r.method!=='GET'&&!r.path.endsWith('/view')),'news does not fetch private media/mutate content');
    }
  }
  if(process.env.VISUAL_DISCOVERY_WALK_ONLY==='1'){
    role='STUDENT';
    for(const [width,height,t] of [[320,568,'light'],[390,844,'dark'],[820,900,'light'],[1440,900,'dark']]){
      await resize(width,height);await nav('/documents');await theme(t);await wait(`document.querySelector('main [role=combobox][aria-label="Môn học"]')`);
      await js(`document.querySelector('main [role=combobox][aria-label="Môn học"]').focus()`);await key('ArrowDown');await key('Enter');await wait(`new URLSearchParams(location.search).has('subjectId')&&document.querySelectorAll('main article').length===2`);await delay(250);
      await js(`document.querySelector('main [role=combobox][aria-label="Loại tài liệu"]').focus()`);await key('ArrowDown');await key('ArrowDown');await key('Enter');await wait(`document.querySelectorAll('main article').length===1&&document.querySelector('main article').textContent.includes('Đề thi')`);await delay(250);
      await js(`document.querySelector('main article a[href^="/documents/"]').focus()`);await key('Enter');await wait(`location.pathname==='/documents/synthetic-material-1'`);await wait(`document.querySelector('main h1')?.textContent.includes('Giải tích')`);await shot('walk-documents-open-'+width+'-'+t);
      await js(`document.querySelector('main a[href^="/documents?"]').focus()`);await key('Enter');await wait(`location.pathname==='/documents'&&new URLSearchParams(location.search).has('subjectId')&&new URLSearchParams(location.search).has('categoryId')&&document.querySelector('main article')`);
      checks.push('Learner subject/kind selects distinguish identical document titles; native open and filtered return '+width);
      await nav('/news');await wait(`document.querySelector('.school-news__categories a')`);await js(`document.querySelector('.school-news__categories a[href*=ANNOUNCEMENT]').focus()`);await key('Enter');await wait(`new URLSearchParams(location.search).get('type')==='ANNOUNCEMENT'&&document.querySelector('.school-news__posts article')`);await delay(250);
      await fill('#school-news-search','Giải tích');await js(`document.getElementById('school-news-search').focus()`);await key('Enter');await wait(`new URLSearchParams(location.search).get('q')==='Giải tích'&&document.querySelectorAll('.school-news__posts article').length===1`);await delay(250);
      await js(`document.querySelector('.school-news__posts article a').focus()`);await key('Enter');await wait(`location.pathname==='/news/synthetic-announcement'&&document.querySelector('main h1')?.textContent.includes('Đăng ký')`);await shot('walk-news-open-'+width+'-'+t);
      await js(`document.querySelector('main a[href^="/news?"]').focus()`);await key('Enter');await wait(`location.pathname==='/news'&&new URLSearchParams(location.search).get('q')==='Giải tích'&&new URLSearchParams(location.search).get('type')==='ANNOUNCEMENT'`);
      checks.push('Learner announcement type/title search/native open/read/filtered return '+width);
    }
  }
  assert.deepEqual(errors,[]);
} catch(e){errors.push(e.stack);if(js)failureContext=await js(`({url:location.href,heading:document.querySelector('main h1')?.textContent,buttons:Array.from(document.querySelectorAll('main button')).map(b=>({text:b.textContent,disabled:b.disabled})),cards:Array.from(document.querySelectorAll('main .content-card')).map(c=>c.textContent.slice(0,300))})`).catch(()=>null);process.exitCode=1;if(call)await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));}
finally{await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,requests,errors,networkFailures,failureContext,limits:'Synthetic Chromium only; no live authorization/Cloudflare/OTP/persistence,physical mobile or screen-reader proof'},null,2));socket?.close();chrome.kill('SIGTERM');await new Promise(resolve=>{if(chrome.exitCode!==null)resolve();else{chrome.once('exit',resolve);setTimeout(resolve,3000)}});await rm(join(dir,'profile'),{recursive:true,force:true,maxRetries:5,retryDelay:100});console.log(JSON.stringify({dir,checks,screenshots:screenshots.length,errors}));}
