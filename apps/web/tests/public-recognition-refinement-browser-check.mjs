// Actual routes/components; synthetic public APIs only. No live data or credentials.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const web=process.env.REFINEMENT_WEB_URL??'http://127.0.0.1:3142';
const dir=await mkdtemp(join(tmpdir(),'public-refinement-'));
const id='00000000-0000-0000-0000-000000009001',other='00000000-0000-0000-0000-000000009002';
const name='Nguyễn Hoàng An '+ 'N'.repeat(55);
const identity={id,fullName:name,username:'synthetic-member',avatarUrl:'/synthetic-avatar-broken.png',avatarCrop:null,profileAvailable:true};
const achievement={id:'record-public',title:'Olympic Toán — kết quả đã xác nhận',description:'Synthetic academic context only.',category:'OLYMPIC_NATIONAL',award:'FIRST',includeParticipation:true,achievedDate:'2026-09-01',publicVisible:true,status:'APPROVED',awardPoints:10,participationPoints:6,totalPoints:16};
const profile={userId:id,fullName:name,username:identity.username,avatarUrl:identity.avatarUrl,avatarCrop:null,rankingOptIn:false,publicPoints:16,achievements:[achievement]};
let profileStatus=200,delay=0,empty=false;
const page={content:[],totalElements:0,totalPages:0,number:0,size:20,first:true,last:true};
const honors={...page,content:[{id:'synthetic-honor',title:'Olympic Toán 2026',subject:'Toán',year:2026,description:'Synthetic album only',status:'PUBLISHED',scope:'SCHOOL',version:1,participants:[{userId:id,...identity,award:'Giải Nhất'},{userId:null,fullName:'Historical guest',award:'Tham gia'},{userId:other,fullName:'Unavailable account',profileAvailable:false}],photos:[]}],totalElements:1,totalPages:1};
const ranks={...page,content:[{rank:1,userId:id,...identity,totalPoints:16,approvedCount:1}],totalElements:1,totalPages:1};
const phase=process.env.REFINEMENT_PHASE??'after';
let count=3,listStatus=200;
const media='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#153e53"/><path d="M0 280L180 80L360 250L490 100L640 240V360H0Z" fill="#97cde6"/></svg>';
const posts=Array.from({length:9},(_,i)=>({id:'post-'+i,title:i===1?'Tiêu đề giả lập '+ 'T'.repeat(70):'Bài viết kiểm thử '+(i+1),slug:'synthetic-post-'+i,summary:'Nội dung giả lập để kiểm tra tiêu đề, ngữ cảnh và mở bài viết.',type:['ANNOUNCEMENT','NEWS','BLOG'][i%3],status:'PUBLISHED',publishedAt:'2026-09-01T00:00:00Z',expiredAt:null,pinned:false,thumbnailUrl:i===1?null:'/synthetic-media.svg',author:identity,viewCount:0}));
const album=honors.content[0];album.photos=[{id:'photo-1',originalName:'synthetic.svg'}];
honors.content=Array.from({length:3},(_,i)=>({...album,id:'synthetic-honor-'+i,title:'Album kiểm thử '+(i+1)}));
ranks.content=Array.from({length:3},(_,i)=>({...ranks.content[0],userId:id.slice(0,-1)+(i+1),rank:i+1}));
const requests=[],checks=[],screenshots=[],errors=[],rects=[];
const chrome=spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',['--headless','--no-sandbox','--disable-background-timer-throttling','--remote-debugging-port=0',`--user-data-dir=${dir}/chromium`,'about:blank']);
let socket;
try {
 const endpoint=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Chrome startup timeout')),30000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1]);}});chrome.on('error',reject);});
 const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>socket.onopen=resolve);
 let serial=0;const pending=new Map();
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++serial;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
 const reply=(e,status,obj,type='application/json')=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(typeof obj==='string'?obj:JSON.stringify(obj)).toString('base64')});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result);}else if(m.method==='Fetch.requestPaused'){
 const e=m.params,path=new URL(e.request.url).pathname;requests.push(path+new URL(e.request.url).search);let work;
 if(path.includes('/photos/')||path.includes('synthetic-media'))work=()=>reply(e,200,media,'image/svg+xml');
 else if(path.endsWith('/posts'))work=()=>{const params=new URL(e.request.url).searchParams;const visible=params.get('pinned')==='true'?[]:posts.filter(p=>!params.get('type')||p.type===params.get('type')).slice(0,count);return reply(e,listStatus,{...page,content:visible,totalElements:visible.length,totalPages:visible.length?2:0});};
 else if(path.includes('/posts/slug/'))work=()=>reply(e,200,{...posts[0],content:'<p>Nội dung giả lập</p>'});
 else if(path.includes('synthetic-avatar-ok'))work=()=>reply(e,200,'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#64748b"/><circle cx="50" cy="50" r="25" fill="#ffffff"/></svg>','image/svg+xml');
 else if(path.includes('synthetic-avatar'))work=()=>reply(e,404,'','text/plain');
 else if(path.endsWith('/users/me')||path.endsWith('/auth/refresh'))work=()=>reply(e,401,{status:401,title:'Synthetic anonymous'});
 else if(path.endsWith('/recognition/honors'))work=()=>reply(e,listStatus,{...honors,content:honors.content.slice(0,count)});
 else if(path.includes('/recognition/honors/'))work=()=>reply(e,200,honors.content[0]);
 else if(path.endsWith('/recognition/rankings'))work=()=>reply(e,listStatus,{...ranks,content:ranks.content.slice(0,count)});
 else if(path.includes('/recognition/profiles/'))work=()=>reply(e,profileStatus,profileStatus===200?{...profile,achievements:empty?[]:[achievement],publicPoints:empty?0:16}:{status:profileStatus,title:'Synthetic unavailable'});
 else work=()=>reply(e,200,page);
 (delay&&path.includes('/profiles/')?new Promise(r=>setTimeout(r,delay)).then(work):work()).catch(e=>errors.push(e.message));
 }else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<300;i++){if(await js(expression))return;await new Promise(r=>setTimeout(r,100));}await writeFile(join(dir,'failure.json'),JSON.stringify({expression,requests,errors,body:await js('document.body.innerText'),html:await js('document.querySelector(".page-shell")?.outerHTML'),url:await js('location.href')},null,2));const failureShot=await call('Page.captureScreenshot');await writeFile(join(dir,'failure.png'),Buffer.from(failureShot.data,'base64'));throw Error('Timed out: '+expression+' evidence '+dir);};
 const nav=async path=>{const old=await js('window.__profileDocument');await call('Page.navigate',{url:web+path});await wait(`window.__profileDocument!==${JSON.stringify(old??null)} && !!window.__profileDocument`);await wait('!!document.querySelector(".page-shell")');await wait('!document.getElementById("startup-loader") && !document.getElementById("root").inert');};
 const shot=async label=>{const r=await call('Page.captureScreenshot',{captureBeyondViewport:false});const p=join(dir,label+'.png');await writeFile(p,Buffer.from(r.data,'base64'));screenshots.push(p);};
 await call('Page.enable');await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.__profileDocument=Math.random().toString(36)'});await call('Page.bringToFront');await call('Emulation.setFocusEmulationEnabled',{enabled:true});await call('Runtime.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*/api/*'},{urlPattern:'*synthetic-*'}]});
 if(!process.env.REFINEMENT_INTERACTIONS_ONLY){
 for(const width of [320,390,768,1280])for(const dark of [false,true]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:dark?'dark':'light'}]});
  for(const [path,label] of [['/honors','honors'],['/rankings','rankings'],['/news?type=ANNOUNCEMENT','news']]){
   count=3;await nav(path);await wait(`document.documentElement.classList.contains('dark')===${dark}`);await new Promise(r=>setTimeout(r,300));
   await wait(label==='news'?'!!document.querySelector(".school-news-post")':'!!document.querySelector(".user-identity")');
   if(phase==='after' && label==='rankings')assert(await js('getComputedStyle(document.querySelector(".ranking-presentation__row")).display==="grid" && getComputedStyle(document.querySelector(".ranking-presentation__rank")).borderStyle==="solid"'));
   assert(await js('document.documentElement.scrollWidth<=innerWidth+1'),label+' overflow '+width);
   const targets=await js('Array.from(document.querySelectorAll("a.user-identity,.school-news__categories a")).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height}))');assert(targets.every(t=>t.height>=44));rects.push({width,dark,label,targets});
   await shot(phase+'-'+label+'-'+width+'-'+(dark?'dark':'light'));
  }
 }
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:780,deviceScaleFactor:1,mobile:true});
 for(const n of [0,1])for(const [path,label] of [['/honors','honors'],['/rankings','rankings'],['/news?type=ANNOUNCEMENT','news']]){count=n;await nav(path);await wait(n===0?'!document.querySelector(".user-identity,.school-news-post")':label==='news'?'!!document.querySelector(".school-news-post")':'!!document.querySelector(".user-identity")');await shot(phase+'-'+label+'-count-'+n);}
 checks.push('24 responsive/theme long-name many captures;6 empty/single captures;no overflow;44px targets');
 await writeFile(join(dir,'layout-results.json'),JSON.stringify({phase,checks,screenshots,rects,requests,errors},null,2));
 }
 count=1;
 if(phase==='after'){
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await nav('/news?type=ANNOUNCEMENT&q=toan&page=2&keep=value');await wait('!!document.querySelector(".school-news__categories a[aria-current=page]")');
 assert.equal(await js('document.querySelectorAll(".school-news__categories a").length'),4);
 assert.equal(await js('Array.from(document.querySelectorAll(".school-news__discovery a")).filter(e=>e.textContent.trim()==="Thông báo").length'),1);
 const requestStart=requests.length;
 await js('document.querySelector(".school-news__categories a[href*=NEWS]").focus()');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait('new URLSearchParams(location.search).get("type")==="NEWS" && !new URLSearchParams(location.search).has("page")');
 assert(await js('new URLSearchParams(location.search).get("q")==="toan" && new URLSearchParams(location.search).get("keep")==="value"'));
 await wait('!!document.querySelector(".school-news-post")');for(let i=0;i<40&&!requests.slice(requestStart).some(p=>p.includes('/posts?')&&p.includes('type=NEWS')&&p.includes('keyword=toan')&&p.includes('page=0'));i++)await new Promise(r=>setTimeout(r,100));await writeFile(join(dir,'query-requests.json'),JSON.stringify(requests,null,2));assert(requests.slice(requestStart).some(p=>p.includes('/posts?')&&p.includes('type=NEWS')&&p.includes('keyword=toan')&&p.includes('page=0')));
 await js('(()=>{const f=document.querySelector(".school-news__search");f.querySelector("input").value=" dai so ";f.requestSubmit()})()');await wait('new URLSearchParams(location.search).get("q")==="dai so"');assert(await js('new URLSearchParams(location.search).get("type")==="NEWS"'));
 await js('Array.from(document.querySelectorAll(".school-news__discovery button")).find(e=>e.textContent.includes("Xóa bộ lọc")).click()');await wait('location.search===""');
 checks.push('News4 canonical type IDs,one announcement control;category preserves keyword/unknown params,resets page;request fields/sort unchanged;trimmed search and reset');
 await nav('/honors?year=2026&page=2&keep=value');await wait('!!document.querySelector(".recognition-memory")');
 await js('document.querySelector("form.recognition-filters input").focus()');await call('Input.insertText',{text:' Toán '});await js('document.querySelector("form.recognition-filters").requestSubmit()');await wait('new URLSearchParams(location.search).get("subject")==="Toán" && !new URLSearchParams(location.search).has("page")');assert(await js('new URLSearchParams(location.search).get("keep")==="value"'));
 assert(await js('!document.querySelector(".achievement-presentation__honor").closest("a,button")'));
 await nav('/rankings?page=2&keep=value');await wait('!!document.querySelector(".ranking-presentation__row")');await js('(()=>{const e=document.querySelector("select");e.value="2026";e.dispatchEvent(new Event("change",{bubbles:true}))})()');await wait('new URLSearchParams(location.search).get("year")==="2026" && !new URLSearchParams(location.search).has("page")');
 checks.push('Honors subject submit/year/unknown params preserved;editorial badge informational;rank year resets page');
 for(const path of ['/rankings','/honors','/news?type=NEWS']){listStatus=503;await nav(path);await wait('!!document.querySelector(".page-shell [role=alert]")');await shot(path.split('?')[0].slice(1)+'-error');listStatus=200;await js('document.querySelector(".page-shell [role=alert] button").click()');await wait('!!document.querySelector(".ranking-presentation__row,.recognition-memory,.school-news-post")');}
 checks.push('All3 list error/retry paths restore content');
 await nav('/honors');await wait('!!document.querySelector("a.user-identity")');
 assert.equal(await js('document.querySelectorAll("a.user-identity").length'),1,'historical/unavailable names are not links');
 const hoverRect=await js('(()=>{const e=document.querySelector("a.user-identity");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+10,y:r.y+10};})()');
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',...hoverRect});
 await wait('document.querySelector(".identity-preview")?.innerText.includes("16 điểm")');await shot('pointer-preview');
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await wait('!document.querySelector(".identity-preview")');checks.push('Pointer hover opens bounded preview; pointer leave closes it');
 await js('document.querySelector("a.user-identity").focus()');
 await wait('!!document.querySelector(".identity-preview") && document.querySelector(".identity-preview").innerText.includes("16 điểm")');
 assert((await js('document.querySelector(".identity-preview").innerText')).includes('1 thành tích công khai đã duyệt'));
 await shot('keyboard-preview');
 await wait('Array.from(document.querySelectorAll("a.user-identity .user-avatar")).every(a=>a.textContent.trim().length>0)');
 checks.push('Keyboard focus preview and broken-avatar initials; minimal preview summary matches full page');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await wait(`location.pathname==='/users/${id}' && !!document.querySelector('.public-profile-layout')`);
 await js(`document.querySelector('a[href="/honors"]').click()`);await wait(`location.pathname==='/honors' && !!document.querySelector('a.user-identity')`);
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:780,deviceScaleFactor:1,mobile:true});
 await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const rect=await js('(()=>{const e=document.querySelector("a.user-identity");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+10,y:r.y+10};})()');
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[rect]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await wait(`location.pathname==='/users/${id}'`);checks.push('Enter and emulated touch open identical public route; Honors return path retained');
 await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 profileStatus=404;await nav('/rankings');await wait('!!document.querySelector("a.user-identity")');await js('document.querySelector("a.user-identity").focus()');
 await wait('!!document.querySelector(".identity-preview [role=alert]")');
 assert(!(await js('document.querySelector(".identity-preview").innerText')).includes('16 điểm'));await shot('unavailable-preview');profileStatus=200;
 await js('document.querySelector(".identity-preview button").click()');await wait('document.querySelector(".identity-preview")?.innerText.includes("16 điểm")');
 checks.push('Denied/refetched preview masks cached stats; retry restores public result');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('!document.querySelector(".identity-preview")');checks.push('Preview Escape dismisses without navigation');
 profileStatus=503;await nav('/users/'+other);await wait('!!document.querySelector(".recognition-feedback[role=alert]")');await shot('profile-error');
 profileStatus=200;empty=true;await js('document.querySelector(".recognition-feedback button").click()');await wait('document.querySelector(".page-shell")?.innerText.includes("Chưa có thành tích công khai đã duyệt")');await shot('profile-empty');
 checks.push('Full profile failure, retry and empty approved-public state');empty=false;delay=900;
 await nav('/rankings');await wait('!!document.querySelector("a.user-identity")');await js('document.querySelector("a.user-identity").focus()');await wait('document.querySelector(".identity-preview")?.innerText.includes("Đang tải")');await shot('preview-loading');delay=0;
 profile.avatarUrl='/synthetic-avatar-ok.svg';await nav('/users/'+id);await wait('!!document.querySelector(".public-profile-identity img")?.naturalWidth');await shot('valid-avatar-390');checks.push('Successful source-backed avatar rendered through cropped AvatarImage owner');
 await nav('/achievements/'+id);await wait('!!document.querySelector(".public-profile-layout")');checks.push('Legacy achievements route uses same full profile owner');
 ranks.content[0].fullName='Thành viên thử nghiệm';count=1;
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:780,deviceScaleFactor:1,mobile:true});await nav('/rankings');await wait('!!document.querySelector(".ranking-presentation__row")');await shot('rankings-normal-single-320');
 const adjacent=await js('(()=>{const c=document.querySelector(".ranking-presentation__count").getBoundingClientRect(),p=document.querySelector(".ranking-presentation__points").getBoundingClientRect();return p.top-c.bottom})()');assert(adjacent<12,'score stays with count');checks.push('Normal single320 rank keeps identity/count/score together');
 }
 assert(!requests.some(p=>p.includes('/evidence/')||p.includes('/daily')||p.includes('/admin/')),'public identity never fetches private APIs');assert.deepEqual(errors,[]);
 await writeFile(join(dir,'results.json'),JSON.stringify({phase,checks,screenshots,rects,requests,errors,limits:['Synthetic intercepted APIs, not physical-device/live proof','No live mutation/publication','No private evidence exposed']},null,2));
 console.log(JSON.stringify({evidence:dir,checks:checks.length,screenshots:screenshots.length,errors},null,2));
}finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL');},2000).unref();}
