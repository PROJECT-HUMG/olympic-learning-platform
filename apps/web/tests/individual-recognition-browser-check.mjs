// Actual individual profile and achievement routes; synthetic APIs, no live writes or .env.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
const baseline=process.argv.includes('--before'),interactionsOnly=process.argv.includes('--interactions-only'),statesOnly=process.argv.includes('--states-only'),toastBefore=process.argv.includes('--toast-before'),toastOnly=toastBefore||process.argv.includes('--toast-only');
const dir=await mkdtemp(join(tmpdir(),`humg-individual-recognition-${baseline?'before':'after'}-`));
const root=fileURLToPath(new URL('..',import.meta.url)),old=new Map();
if(baseline)for(const path of ['src/features/recognition/public-pages.tsx','src/features/recognition/private-pages.tsx','src/features/recognition/components.tsx','src/features/recognition/achievement-presentation.tsx','src/features/recognition/achievement-presentation-model.ts','src/features/user/components/user-hover-card.tsx','src/features/user/lib/public-identity.ts'])old.set(join(root,path),execFileSync('git',['show',`8b73c83:apps/web/${path}`],{cwd:root,encoding:'utf8'}));
if(toastBefore)old.set(join(root,'src/components/ui/sonner.css'),execFileSync('git',['show','8b73c83:apps/web/src/components/ui/sonner.css'],{cwd:root,encoding:'utf8'}));
const host=await createServer({root,configFile:false,envDir:false,cacheDir:join('/tmp/humg-individual-recognition-20261014','vite-cache'),define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('/api/v1')},resolve:{alias:{'@':join(root,'src')}},plugins:[{name:'entry-owner-snapshot',enforce:'pre',load(id){return old.get(id.split('?')[0]);}},react(),tailwind()],server:{host:'127.0.0.1',port:0}});
await host.listen();const web='http://127.0.0.1:'+host.httpServer.address().port;
const chrome=spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--password-store=basic','--disable-background-timer-throttling','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank'],{env:{...process.env,GSETTINGS_BACKEND:'memory',XDG_RUNTIME_DIR:dir}});

const checks=[],screenshots=[],geometry=[],errors=[],requests=[],cancelled=[],held=[];
const uid='00000000-0000-0000-0000-000000000101', other='00000000-0000-0000-0000-000000000102';
let socket,call,js,role='ANON',mode='normal',count=4,hold=false,mutationStatus=503,holdMutation=false,optIn=false,privateHidden=false;
const user=()=>({id:uid,username:'synthetic-learner',fullName:'Người học thử nghiệm Nguyễn Minh Anh',email:'fixture@example.invalid',role:role==='ANON'?'STUDENT':role,status:'ACTIVE',avatarUrl:null});
const records=()=>Array.from({length:count},(_,i)=>({id:'record-'+i,userId:uid,fullName:user().fullName,title:i===1?'Đề tài kiểm thử về phương pháp học tập và ứng dụng với một tiêu đề dài cần đọc trọn vẹn':'Kỳ thi Olympic thử nghiệm '+(i+1),description:'Nội dung giả lập để kiểm tra hành trình thành tích, không phải hồ sơ thật.',category:i%2?'RESEARCH_SCHOOL':'OLYMPIC_SCHOOL',award:'FIRST',includeParticipation:true,achievedDate:i<2?'2026-09-01':'2025-06-12',publicVisible:i===0?!privateHidden:i!==2,status:['APPROVED','PENDING','REJECTED','REVOKED'][i%4],awardPoints:5,participationPoints:2,totalPoints:7,reviewNote:i===2?'Minh chứng chưa thể hiện đầy đủ kết quả. Vui lòng bổ sung.':null,evidence:[{id:'evidence-'+i,originalName:'minh-chung-thu-nghiem.pdf',contentType:'application/pdf',size:12000}],version:0,createdAt:'2026-09-01T00:00:00Z',updatedAt:'2026-09-01T00:00:00Z'}));
try {
 const endpoint=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Chrome timeout')),30000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1]);}});chrome.on('error',reject);});
 const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);let serial=0;const pending=new Map();
 call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const reply=(e,status,body,type='application/json')=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(type==='application/json'?JSON.stringify(body):body).toString('base64')});
 const respond=async e=>{
  const u=new URL(e.request.url),path=u.pathname,method=e.request.method;
  if(u.origin===web&&!path.startsWith('/api/'))return call('Fetch.continueRequest',{requestId:e.requestId});
  if(!path.startsWith('/api/'))return reply(e,200,'','text/css');
  requests.push({path,query:u.search,method,body:method==='PATCH'?e.request.postData:null});
  if(path.endsWith('/users/me'))return reply(e,role==='ANON'?401:200,role==='ANON'?{}:user());
  if(path.endsWith('/auth/refresh'))return reply(e,role==='ANON'?401:200,{accessToken:'synthetic-only'});
  if(method!=='GET'){
    if(holdMutation)await new Promise(r=>held.push(r));
    if(mutationStatus===200&&method==='PATCH'){const input=JSON.parse(e.request.postData);if(path.endsWith('/preferences/me'))optIn=input.rankingOptIn;else if(path.endsWith('/visibility'))privateHidden=!input.publicVisible;}
    return reply(e,mutationStatus,mutationStatus===200?{rankingOptIn:optIn,publicVisible:!privateHidden}:{detail:'Thay đổi thử nghiệm chưa lưu được. Hãy thử lại.'});
  }
  if(path.endsWith('/recognition/honors'))return reply(e,200,{content:[{id:'synthetic-album',title:'Album kiểm thử hành trình',subject:'Toán',year:2026,status:'PUBLISHED',scope:'SCHOOL',photos:[],participants:[{userId:uid,fullName:user().fullName,award:'Tham gia',avatarUrl:null,profileAvailable:true}]}],totalElements:1,totalPages:1,number:0,size:12});
  if(path.includes('/recognition/profiles/')){
   if(hold)await new Promise(r=>held.push(r));
   if(mode==='error'||mode==='missing')return reply(e,mode==='missing'?404:503,{detail:'Hồ sơ thử nghiệm chưa khả dụng'});
   return reply(e,200,{userId:path.split('/').at(-1),fullName:user().fullName+' '+ 'TênDài'.repeat(5),username:'synthetic-learner',avatarUrl:null,rankingOptIn:true,publicPoints:count*7,achievements:records().map(({id,title,description,category,award,includeParticipation,achievedDate,awardPoints,participationPoints,totalPoints})=>({id,title,description,category,award,includeParticipation,achievedDate,awardPoints,participationPoints,totalPoints,status:'APPROVED',publicVisible:true}))});
  }
  if(path.endsWith('/recognition/achievements/me')){
   if(hold)await new Promise(r=>held.push(r));
   return reply(e,mode==='error'?503:200,mode==='error'?{detail:'Lỗi thử nghiệm'}:records());
  }
  if(path.endsWith('/recognition/preferences/me'))return reply(e,200,{rankingOptIn:optIn});
  if(path.includes('/evidence/'))return reply(e,200,'%PDF-1.4\nSynthetic only','application/pdf');
  return reply(e,200,[]);
 };
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);else if(m.method==='Fetch.requestPaused')void respond(m.params).catch(e=>/Invalid InterceptionId/.test(e.message)?cancelled.push(e.message):errors.push(e.message));};
 js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,timeout:20000});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async expression=>{for(let n=0;n<450;n++){if(await js(`Boolean(${expression})`))return;await delay(30);}throw Error('Timeout '+expression);};
 const resize=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 const key=async(name,code,text,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:name,windowsVirtualKeyCode:code,text,modifiers});await call('Input.dispatchKeyEvent',{type:'keyUp',key:name,windowsVirtualKeyCode:code,modifiers});};
 const fill=(selector,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
 const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest'})`);const r=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mouseMoved',...r});await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});};
 const touch=async (selector,disabled=false)=>{await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest'})`);const r=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),disabled:e.disabled,rect:r.toJSON()}})()`);assert.ok(r.hit||(disabled&&r.disabled),'touch target unobstructed: '+selector);assert.ok(r.rect.left>=0&&r.rect.top>=0&&r.rect.right<=await js('innerWidth')&&r.rect.bottom<=await js('innerHeight'));await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return r;};
 const clickText=label=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)throw Error('Missing button');b.focus();b.click()})()`);
 const theme=t=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(t)}))`);
 const nav=async route=>{await call('Page.navigate',{url:web+route});await wait('!!document.querySelector("h1")&&!document.querySelector("#startup-loader")');await delay(100);};
 const shot=async name=>{await delay(220);assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'no page overflow');const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});
 for(const t of (interactionsOnly||statesOnly||toastOnly?[]:['light','dark']))for(const [w,h] of [[320,568],[390,844],[768,900],[1280,900]])for(const kind of ['public','mine']){
  role=kind==='mine'?'STUDENT':'ANON';mode='normal';count=4;await resize(w,h);await nav(kind==='mine'?'/profile/achievements':'/users/'+uid);await theme(t);await wait(kind==='mine'?'!!document.querySelector(".recognition-record")':'!!document.querySelector(".public-profile-layout")');await shot(`${kind}-${w}x${h}-${t}`);
  geometry.push(await js(`({kind:${JSON.stringify(kind)},width:innerWidth,theme:${JSON.stringify(t)},heading:document.querySelector('h1').getBoundingClientRect().toJSON(),record:document.querySelector('.recognition-record,.achievement-presentation__record')?.getBoundingClientRect().toJSON()})`));
 }
 if(!interactionsOnly&&!statesOnly&&!toastOnly)checks.push('Actual public/private individual routes320/390/768/1280 light-dark with synthetic long identity/title and genuine status fields; no horizontal overflow.');
 if(!baseline&&!statesOnly&&!toastOnly){
  role='ANON';await resize(390,844);await nav('/honors?year=2026&subject=To%C3%A1n&keep=value');await wait('!!document.querySelector("a.user-identity")');
  await js('document.querySelector("a.user-identity").focus()');await wait('document.querySelector(".identity-preview__summary")?.textContent.includes("Có 4 thành tích · Tổng 28 điểm")');await key('Escape',27);await key('Enter',13,'\r');await wait('location.pathname.startsWith("/users/")&&!!document.querySelector(".recognition-person__identity")');
  assert.ok(await js('!!document.querySelector(\'a[href="/honors?year=2026&subject=To%C3%A1n&keep=value"]\')'));assert.ok(!requests.some(r=>r.path.includes('/evidence/')));
  await shot('profile-from-honors-390');await click('.recognition-person > nav a');await wait('location.pathname==="/honors"&&new URLSearchParams(location.search).get("keep")==="value"');
  checks.push('Actual Honors identity keyboard focus preview → Enter profile → contextual return retains year/subject/unknown query; anonymous flow fetches no private evidence.');
  role='STUDENT';await nav('/profile/achievements');await wait('!!document.querySelector(".recognition-record")');await click('.recognition-personal a[href^="/users/"]');await wait('!!document.querySelector(".recognition-person__identity")');assert.ok(await js('!!document.querySelector(\'a[href="/profile/achievements"]\')'));await shot('owner-public-profile-390');await click('.recognition-person a[href="/profile/achievements"]');await wait('!!document.querySelector(".recognition-personal")');
  await click('.evidence-all');await wait('!!document.querySelector(".evidence-gallery-header")');assert.ok(await js('document.querySelector("[role=dialog]").textContent.includes("minh-chung-thu-nghiem.pdf")'));await key('Escape',27);await wait('!document.querySelector("[role=dialog]")');assert.ok(await js('document.activeElement.matches(".evidence-all")'));
  // Failed visibility is shown beside the actual target; choices only update after confirmed success.
  holdMutation=true;mutationStatus=503;await click('.recognition-record .recognition-actions button');await wait('document.querySelector(".recognition-record .recognition-actions button").disabled');await shot('visibility-pending-390');assert.ok(await js('[...document.querySelectorAll(".recognition-record .recognition-actions button:first-child")].every(b=>b.disabled)'));holdMutation=false;held.splice(0).forEach(r=>r());await wait('!!document.querySelector(".recognition-record [role=alert]")');await shot('visibility-error-390');
  mutationStatus=200;await click('.recognition-record .recognition-actions button');await wait('document.querySelector(".recognition-record .recognition-actions button").textContent.includes("Đặt công khai")');assert.ok(await js('document.querySelector(".recognition-record").textContent.includes("Riêng tư")'));
  await click('.recognition-personal__preferences summary');mutationStatus=503;await click('.recognition-personal__preferences input[type=checkbox]');await wait('!!document.querySelector(".recognition-personal__preferences [role=alert]")');assert.equal(await js('document.querySelector(".recognition-personal__preferences input").checked'),false);mutationStatus=200;await click('.recognition-personal__preferences input');await wait('document.querySelector(".recognition-personal__preferences input").checked');
  checks.push('Owner/public view navigation shares current identity; private PDF viewer Escape returns opener; visibility pending sibling gate/error/confirmed retry and opt-in error/retry keep real server choices.');
  await js('scrollTo(0,0)');await clickText('Gửi thành tích');await wait('!!document.querySelector(".creation-dialog")');assert.ok(await js('document.activeElement.matches("[data-slot=dialog-title]")'));await fill('.creation-dialog input[maxlength="200"]','Bản đang nhập cần giữ lại');await delay(150);await key('Escape',27);await wait('!!document.querySelector("[role=alertdialog]")');await clickText('Tiếp tục chỉnh sửa');await wait('!document.querySelector("[role=alertdialog]")');assert.equal(await js('document.querySelector(\'.creation-dialog input[maxlength="200"]\').value'),'Bản đang nhập cần giữ lại');
  const file=join(dir,'synthetic-evidence.pdf');await writeFile(file,'%PDF-1.4\nSynthetic only');const doc=await call('DOM.getDocument');const node=await call('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'.creation-dialog input[type=file]'});await call('DOM.setFileInputFiles',{nodeId:node.nodeId,files:[file]});
  await resize(320,280);holdMutation=true;mutationStatus=503;await clickText('Gửi để duyệt');await wait('document.querySelector(".creation-dialog fieldset").disabled');await key('Escape',27);assert.ok(await js('!!document.querySelector(".creation-dialog")&&!document.querySelector("[role=alertdialog]")'));await shot('editor-busy-320x280-dark');holdMutation=false;held.splice(0).forEach(r=>r());await wait('!!document.querySelector(".creation-dialog [role=alert]")');assert.equal(await js('document.querySelector(\'.creation-dialog input[maxlength="200"]\').value'),'Bản đang nhập cần giữ lại');assert.equal(await js('document.querySelector(\'.creation-dialog input[type="file"]\').files.length'),1);await shot('editor-error-320x280-dark');
  await key('Escape',27);await wait('!!document.querySelector("[role=alertdialog]")');await clickText('Bỏ thay đổi');await wait('!document.querySelector(".creation-dialog")');await wait('document.activeElement.textContent.trim()==="Gửi thành tích"');await resize(390,844);
  await clickText('Bổ sung và gửi lại');await wait('!!document.querySelector(".creation-dialog")');assert.ok(await js('document.querySelector(\'.creation-dialog input[type="file"]\').required'));await shot('resubmit-390-dark');await clickText('Đóng');await wait('!document.querySelector(".creation-dialog")');
  checks.push('Create/edit uses existing CreationDialog: heading focus, dirty Escape/continue/discard and focus return;320x280 busy Escape blocked;failed synthetic submission retains text/file;resubmit still requires replacement evidence.');
  for(const kind of ['public','mine'])for(const n of [0,1]){
   role=kind==='mine'?'STUDENT':'ANON';count=n;mode='normal';await resize(320,568);await nav(kind==='mine'?'/profile/achievements':'/users/'+uid);await theme('dark');await wait(kind==='mine'?'!!document.querySelector(".recognition-personal__history")':'!!document.querySelector(".recognition-person__identity")');await shot(`${kind}-count-${n}-320-dark`);
  }
  count=4;role='ANON';mode='error';await nav('/users/'+other);await wait('!!document.querySelector(".recognition-feedback[role=alert]")');await shot('public-error-320-dark');mode='normal';await clickText('Thử lại');await wait('!!document.querySelector(".recognition-person__identity")');
  mode='missing';await nav('/users/'+other);await wait('document.body.innerText.includes("Không tìm thấy hồ sơ hoặc tài khoản hiện không khả dụng")');await shot('public-unavailable-320-dark');
  mode='normal';role='STUDENT';hold=true;await nav('/profile/achievements');await wait('!!document.querySelector(".recognition-feedback[role=status]")');await shot('mine-pending-320-dark');mode='error';hold=false;held.splice(0).forEach(r=>r());await wait('!!document.querySelector(".recognition-feedback[role=alert]")');await shot('mine-error-320-dark');mode='normal';await clickText('Thử lại');await wait('!!document.querySelector(".recognition-record")');
  checks.push('0/1/many,public unavailable/error/retry and private pending/error/retry are distinct;long titles/names read without clipping;synthetic mutations intercepted only.');
 }

 if(toastOnly){
  role='STUDENT';count=1;
  for(const [w,h,t] of (toastBefore?[[320,280,'dark']]:[[320,280,'light'],[320,280,'dark'],[390,280,'dark'],[640,320,'light'],[768,900,'light'],[1280,900,'dark'],[1920,1080,'light']])){
   await resize(w,h);await nav('/profile/achievements');await theme(t);await wait('!!document.querySelector(".recognition-record")');
   mutationStatus=503;await click('.recognition-record .recognition-actions button');await wait('!!document.querySelector("[data-sonner-toast][data-front=true]")');
   await js('scrollTo(0,0)');await clickText('Gửi thành tích');await wait('!!document.querySelector(".creation-dialog")');await delay(200);
   const bounds=await js('(()=>{const e=document.querySelector(".creation-dialog__header button"),r=e.getBoundingClientRect(),t=document.querySelector("[data-sonner-toast][data-front=true]");return{close:r.toJSON(),toast:t.getBoundingClientRect().toJSON(),toastText:t.textContent,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()');geometry.push({width:w,height:h,theme:t,...bounds});
   await shot(`toast-${toastBefore?'obstructed':'close-reachable'}-${w}x${h}-${t}`);
   if(toastBefore){assert.ok(bounds.toast.left<bounds.close.right&&bounds.toast.right>bounds.close.left&&bounds.toast.top<bounds.close.bottom&&bounds.toast.bottom>bounds.close.top,'reproduce visible overlap');await touch('.creation-dialog__header button');await wait('!document.querySelector(".creation-dialog")');checks.push('Existing320x280 toast visually covers Close;modal pointer isolation lets CDP touch through,but the action is not visually discoverable.');break;}
   assert.ok(bounds.close.width>=44&&bounds.close.height>=44);assert.ok(bounds.hit);assert.ok(bounds.toastText.length>0);assert.ok(bounds.toast.bottom<=h,'toast remains within viewport');assert.ok(bounds.toast.right<=bounds.close.left,'Close stays visibly outside toast');
   await touch('.creation-dialog__header button');await wait('!document.querySelector(".creation-dialog")');await wait('document.activeElement.textContent.trim()==="Gửi thành tích"');
  }
  if(!toastBefore){
   await resize(320,280);await nav('/profile/achievements');await wait('!!document.querySelector(".recognition-record")');await clickText('Gửi thành tích');await wait('!!document.querySelector(".creation-dialog")');await fill('.creation-dialog input[maxlength="200"]','Bản nhập thử nghiệm cần giữ');await delay(150);
   const file=join(dir,'synthetic-touch-evidence.pdf');await writeFile(file,'%PDF-1.4\nSynthetic only');const doc=await call('DOM.getDocument');const node=await call('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'.creation-dialog input[type=file]'});await call('DOM.setFileInputFiles',{nodeId:node.nodeId,files:[file]});
   holdMutation=true;await clickText('Gửi để duyệt');await wait('document.querySelector(".creation-dialog fieldset").disabled');await touch('.creation-dialog__header button',true);await key('Escape',27);assert.ok(await js('!!document.querySelector(".creation-dialog")&&!document.querySelector("[role=alertdialog]")'));holdMutation=false;held.splice(0).forEach(r=>r());await wait('!!document.querySelector(".creation-dialog [role=alert]")&&!!document.querySelector("[data-sonner-toast][data-front=true]")');
   // Inline error stays readable through the form's own scroll while the toast remains visible.
   await js('document.querySelector(".creation-dialog [role=alert]").scrollIntoView({block:"center"})');await shot('toast-inline-error-320x280-dark');await touch('.creation-dialog__header button');await wait('!!document.querySelector("[role=alertdialog]")');await touch('[role=alertdialog] button:first-of-type');await wait('!document.querySelector("[role=alertdialog]")');assert.equal(await js('document.querySelector(\'.creation-dialog input[maxlength="200"]\').value'),'Bản nhập thử nghiệm cần giữ');assert.equal(await js('document.querySelector(\'.creation-dialog input[type=file]\').files.length'),1);
   await key('Escape',27);await wait('!!document.querySelector("[role=alertdialog]")');await touch('[role=alertdialog] button:last-of-type');await wait('!document.querySelector(".creation-dialog")');await wait('document.activeElement.textContent.trim()==="Gửi thành tích"');
   // Without a modal, the unchanged toast close button is still reachable and dismisses it.
   await touch('[data-sonner-toast][data-front=true] [data-close-button]');await wait('!document.querySelector("[data-sonner-toast][data-front=true]")');
   checks.push('Visible error toast and44px modal Close coexist at320x280 light/dark,390 short,640 landscape and desktop;actual CDP touch closes clean form and restores focus. Busy touch/Escape stays blocked;error/dirty touch opens confirmation,continue retains text/file,discard returns focus;inline error remains scrollable and ordinary toast dismisses after modal closes.');
  }
 }

 if(statesOnly){
  count=1;mode='normal';await resize(390,844);await nav('/users/'+uid);await theme('light');
  for(const actor of ['ANON','ADMIN','LECTURER','STUDENT']){
   role=actor;await nav('/achievements/'+uid);await wait('!!document.querySelector(".recognition-person__identity")');
   assert.equal(await js('!![...document.querySelectorAll(".recognition-person nav a")].find(a=>a.textContent.includes("Quản lý thành tích"))'),actor==='STUDENT');
   assert.ok(await js('!document.querySelector(".evidence-previews")&&!document.body.innerText.includes("example.invalid")'));
   if(actor==='ADMIN')await shot('admin-public-only-390-light');
  }
  await nav('/users/'+other);await wait('!!document.querySelector(".recognition-person__identity")');
  assert.equal(await js('!![...document.querySelectorAll(".recognition-person nav a")].find(a=>a.textContent.includes("Quản lý thành tích"))'),false);
  assert.ok(await js('document.querySelector(".recognition-person__totals").textContent.includes("Có 1 thành tích")&&document.querySelector(".recognition-person__totals").textContent.includes("Tổng 7 điểm")'));
  role='ANON';await nav('/users/'+uid);await wait('!!document.querySelector(".recognition-person__identity")');
  await js('void import("/src/lib/query-client.ts").then(m=>m.queryClient.setQueryData(["recognition","profile",'+JSON.stringify(uid)+'],{userId:'+JSON.stringify(uid)+',fullName:"Stale identity must hide",username:"stale",publicPoints:7,rankingOptIn:true,avatarUrl:null,achievements:[]}))');hold=true;
  await js('void import("/src/lib/query-client.ts").then(m=>m.queryClient.invalidateQueries({queryKey:["recognition","profile"]}))');await wait('!!document.querySelector(".recognition-feedback[role=status]")&&!document.querySelector(".recognition-person__identity")');await shot('public-revalidation-hidden-390-light');hold=false;held.splice(0).forEach(r=>r());await wait('!!document.querySelector(".recognition-person__identity")');
  role='STUDENT';await resize(640,320);await nav('/profile/achievements');await wait('!!document.querySelector(".recognition-record")');await shot('mine-landscape-640x320-light');await clickText('Gửi thành tích');await wait('!!document.querySelector(".creation-dialog")');
  const bounds=await js('(()=>{const d=document.querySelector(".creation-dialog").getBoundingClientRect(),c=document.querySelector(".creation-dialog__header button").getBoundingClientRect();return{d:d.toJSON(),c:c.toJSON()}})()');assert.ok(bounds.d.left>=0&&bounds.d.top>=0&&bounds.d.right<=640&&bounds.d.bottom<=320);assert.ok(bounds.c.height>=44&&bounds.c.bottom<=320);await shot('editor-landscape-640x320-light');await key('Escape',27);await wait('!document.querySelector(".creation-dialog")');
  await resize(390,844);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await nav('/users/'+uid);await wait('!!document.querySelector(".recognition-person__identity")');assert.ok(await js('getComputedStyle(document.querySelector(".recognition-person__identity")).opacity==="1"'));await shot('profile-reduced-390-light');
  // CDP touch activation of the existing semantic public destination.
  await js('document.querySelector(".recognition-person > nav a").scrollIntoView({block:"center"})');const pt=await js('(()=>{const r=document.querySelector(".recognition-person > nav a").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('location.pathname==="/rankings"');
  checks.push('Legacy alias uses same public owner;guest/admin/lecturer see public-only data,student owner gets management link;public data hides during revalidation;640x320 modal/Close geometry;static reduced motion and touch navigation.');
 }
 assert.deepEqual(errors,[]);await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,geometry,requests,errors,cancelled,limits:['Owned Chromium and intercepted synthetic APIs;no production mutations/private content.','Not physical phone/keyboard/AT speech or live backend authorization proof.']},null,2));console.log(JSON.stringify({evidence:dir,checks,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,screenshots,errors,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}
finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},1500).unref();await host.close();}
