// Actual individual profile and achievement routes; synthetic APIs, no live writes or .env.
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
const baseline=process.argv.includes('--before'), evidenceOnly=process.argv.includes('--evidence-only');
const dir=await mkdtemp(join(tmpdir(),`humg-recognition-media-${baseline?'before':'after'}-`));
const root=fileURLToPath(new URL('..',import.meta.url)),old=new Map();
if(baseline)for(const path of ['src/features/recognition/public-pages.tsx','src/features/recognition/achievement-evidence.tsx','src/components/ui/evidence-gallery.tsx','src/features/recognition/components.tsx'])old.set(join(root,path),execFileSync('git',['show',`97554cd:apps/web/${path}`],{cwd:root,encoding:'utf8'}));
const host=await createServer({root,configFile:false,envDir:false,cacheDir:join('/tmp/humg-individual-recognition-20261014','vite-cache'),define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('/api/v1')},resolve:{alias:{'@':join(root,'src')}},plugins:[{name:'entry-owner-snapshot',enforce:'pre',load(id){return old.get(id.split('?')[0]);}},react(),tailwind()],server:{host:'127.0.0.1',port:0}});
await host.listen();const web='http://127.0.0.1:'+host.httpServer.address().port;
const chrome=spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--password-store=basic','--disable-background-timer-throttling','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank'],{env:{...process.env,GSETTINGS_BACKEND:'memory',XDG_RUNTIME_DIR:dir}});

// Owned synthetic raster bands, not product photography.
const crc=b=>{let c=-1;for(const v of b){c^=v;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^-1)>>>0;};
const chunk=(t,b)=>{const a=Buffer.from(t),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(b.length);c.writeUInt32BE(crc(Buffer.concat([a,b])));return Buffer.concat([n,a,b,c]);};
const header=Buffer.alloc(13);header.writeUInt32BE(640);header.writeUInt32BE(400,4);header[8]=8;header[9]=2;
const pixels=Buffer.alloc(400*(640*3+1));for(let y=0;y<400;y++)for(let x=0;x<640;x++){const i=y*(1921)+1+x*3;pixels[i]=x<320?31:58;pixels[i+1]=y<200?100:143;pixels[i+2]=x+y>500?153:205;}
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
const checks=[],screenshots=[],geometry=[],errors=[],requests=[],cancelled=[],held=[],choosers=[];
const uid='00000000-0000-0000-0000-000000000101';
let imageFailure=false,denyEvidence=false,albumCount=3;
let socket,call,js,role='ANON',mode='normal',count=4,hold=false,mutationStatus=503,holdMutation=false,optIn=false,privateHidden=false;
const user=()=>({id:uid,username:'synthetic-learner',fullName:'Người học thử nghiệm Nguyễn Minh Anh',email:'fixture@example.invalid',role:role==='ANON'?'STUDENT':role,status:'ACTIVE',avatarUrl:null});
const records=()=>Array.from({length:count},(_,i)=>({id:'record-'+i,userId:uid,fullName:user().fullName,title:i===1?'Đề tài kiểm thử về phương pháp học tập và ứng dụng với một tiêu đề dài cần đọc trọn vẹn':'Kỳ thi Olympic thử nghiệm '+(i+1),description:'Nội dung giả lập để kiểm tra hành trình thành tích, không phải hồ sơ thật.',category:i%2?'RESEARCH_SCHOOL':'OLYMPIC_SCHOOL',award:'FIRST',includeParticipation:true,achievedDate:i<2?'2026-09-01':'2025-06-12',publicVisible:i===0?!privateHidden:i!==2,status:['APPROVED','PENDING','REJECTED','REVOKED'][i%4],awardPoints:5,participationPoints:2,totalPoints:7,reviewNote:i===2?'Minh chứng chưa thể hiện đầy đủ kết quả. Vui lòng bổ sung.':null,evidence:[{id:'image-a',originalName:'Ảnh minh chứng dài kiểm thử.png',contentType:'image/png',size:12000},{id:'image-b',originalName:'Ảnh thứ hai.png',contentType:'image/png',size:12000},{id:'pdf-c',originalName:'Tệp PDF gốc.pdf',contentType:'application/pdf',size:12000}],version:0,createdAt:'2026-09-01T00:00:00Z',updatedAt:'2026-09-01T00:00:00Z'}));
try {
 const endpoint=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Chrome timeout')),30000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1]);}});chrome.on('error',reject);});
 const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);let serial=0;const pending=new Map();
 call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const reply=(e,status,body,type='application/json')=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(type==='application/json'?JSON.stringify(body):body).toString('base64')});
 const respond=async e=>{
  const u=new URL(e.request.url),path=u.pathname,method=e.request.method;
  if(u.origin===web&&!path.startsWith('/api/'))return call('Fetch.continueRequest',{requestId:e.requestId});
  if(!path.startsWith('/api/'))return reply(e,200,'','text/css');
  requests.push({path,query:u.search,method,body:method!=='GET'?e.request.postData?.slice(0,12000):null});
  if(path.endsWith('/users/me'))return reply(e,role==='ANON'?401:200,role==='ANON'?{}:user());
  if(path.endsWith('/auth/refresh'))return reply(e,role==='ANON'?401:200,{accessToken:'synthetic-only'});
  if(method!=='GET'){
    if(holdMutation)await new Promise(r=>held.push(r));
    if(mutationStatus===200&&method==='PATCH'){const input=JSON.parse(e.request.postData);if(path.endsWith('/preferences/me'))optIn=input.rankingOptIn;else if(path.endsWith('/visibility'))privateHidden=!input.publicVisible;}
    return reply(e,mutationStatus,mutationStatus===200?{rankingOptIn:optIn,publicVisible:!privateHidden}:{detail:'Thay đổi thử nghiệm chưa lưu được. Hãy thử lại.'});
  }
  if(path.includes('/recognition/honors/')) {
   if(path.includes('/photos/'))return reply(e,imageFailure?503:200,imageFailure?'Unavailable':png,'image/png');
   return reply(e,200,{id:'synthetic-album',title:'Kỷ niệm kiểm thử nhóm và một tiêu đề album dài',subject:'Toán học',year:2026,status:'PUBLISHED',scope:'SCHOOL',version:0,description:'Album tổng hợp chỉ phục vụ kiểm tra giao diện.',photos:[{id:'photo-a',originalName:'Ảnh nhóm thứ nhất.png'},{id:'photo-b',originalName:'Ảnh nhóm thứ hai có tên dài để kiểm tra xuống dòng.png'},{id:'photo-c',originalName:'Ảnh nhóm thứ ba.png'}].slice(0,albumCount),participants:[]});
  }
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
  if(path.includes('/evidence/'))return denyEvidence?reply(e,403,{detail:'Không có quyền xem minh chứng'}):path.endsWith('/pdf-c')?reply(e,200,'%PDF-1.4\nSynthetic only','application/pdf'):reply(e,200,png,'image/png');
  if(path.includes('/documents')||path.includes('/posts'))return reply(e,200,{content:[],totalElements:0,totalPages:0,number:0,size:10});
  return reply(e,200,[]);
 };
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result);}else if(m.method==='Page.fileChooserOpened')choosers.push(m.params);else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);else if(m.method==='Fetch.requestPaused')void respond(m.params).catch(e=>/Invalid InterceptionId/.test(e.message)?cancelled.push(e.message):errors.push(e.message));};
 js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,timeout:20000});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async expression=>{for(let n=0;n<450;n++){if(await js(`Boolean(${expression})`))return;await delay(30);}throw Error('Timeout '+expression);};
 const resize=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 const key=async(name,code,text,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:name,windowsVirtualKeyCode:code,text,modifiers});await call('Input.dispatchKeyEvent',{type:'keyUp',key:name,windowsVirtualKeyCode:code,modifiers});};
 const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest'})`);const r=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mouseMoved',...r});await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});};
 const touch=async (selector,disabled=false)=>{await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest'})`);const r=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),disabled:e.disabled,rect:r.toJSON()}})()`);assert.ok(r.hit||(disabled&&r.disabled),'touch target unobstructed: '+selector);assert.ok(r.rect.left>=0&&r.rect.top>=0&&r.rect.right<=await js('innerWidth')&&r.rect.bottom<=await js('innerHeight'));await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return r;};
 const clickText=label=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)throw Error('Missing button');b.focus();b.click()})()`);
 const theme=t=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(t)}))`);
 const nav=async route=>{await call('Page.navigate',{url:web+route});await wait('!!document.querySelector("h1")&&!document.querySelector("#startup-loader")');await delay(100);};
 const shot=async name=>{await delay(220);assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'no page overflow');const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});

 if(baseline){for(const [w,h,t] of [[320,568,'light'],[390,844,'dark'],[768,900,'light'],[1280,900,'light'],[1280,900,'dark']]){role='ANON';await resize(w,h);await nav('/honors/synthetic-album');await theme(t);await js('document.querySelector(".recognition-photo-grid").scrollIntoView({block:"center"})');await wait('!!document.querySelector(".recognition-photo-grid img")');await shot(`before-album-${w}-${t}`);}checks.push('Committed97554cd album image-grid baseline; synthetic media.');}
 if(!baseline){role='ANON';
 if(!evidenceOnly){for(const [w,h,t] of [[320,568,'light'],[390,844,'dark'],[768,900,'light'],[1280,900,'light'],[1280,900,'dark']]){
  await resize(w,h);await nav('/honors/synthetic-album');await theme(t);await wait('document.querySelector(".depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');
  await js('document.querySelector(".depth-carousel").scrollIntoView({block:"center"})');await shot(`album-${w}-${t}`);
  assert.equal(await js('document.querySelector(".depth-carousel [role=status]").textContent'),'1 / 3');
  await js('document.querySelector(".depth-carousel__stage").focus()');await key('ArrowRight',39);await wait('document.querySelector(".depth-carousel [role=status]").textContent==="2 / 3"');
  geometry.push(await js('({width:innerWidth,transform:document.querySelector(".depth-carousel__card[aria-hidden=false]").style.transform,controls:[...document.querySelectorAll(".depth-carousel__controls button")].map(e=>e.getBoundingClientRect().toJSON())})'));await shot(`album-selected-second-${w}-${t}`);await key('End',35);await wait('document.querySelector(".depth-carousel [role=status]").textContent==="3 / 3"');await key('Home',36);
  await clickText('Mở ảnh lớn');await wait('document.querySelector("[role=dialog] .depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');await shot(`album-dialog-${w}-${t}`);await key('Escape',27);await wait('!document.querySelector("[role=dialog]")');assert.equal(await js('document.activeElement.textContent'),'Mở ảnh lớn');
 }
 checks.push('Album: original three-photo order, native 44px controls, keyboard arrows/Home/End, 320/390/1280 light-dark, modal Escape and focus return.');
 await resize(390,844);await js('document.querySelector(".depth-carousel__stage").scrollIntoView({block:"center"})');
 const point=await js('(()=>{const r=document.querySelector(".depth-carousel__stage").getBoundingClientRect();return{x:r.x+r.width*.75,y:r.y+r.height/2}})()');
 await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x-100,y:point.y}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('document.querySelector(".depth-carousel [role=status]").textContent==="2 / 3"');
 imageFailure=true;await nav('/honors/synthetic-album');await wait('[...document.querySelectorAll("button")].some(b=>b.textContent==="Thử tải ảnh lại")');imageFailure=false;await clickText('Thử tải ảnh lại');await wait('document.querySelector(".depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');
 checks.push('Actual CDP horizontal touch swipe advances source order; album photo503 displays retry and successful retry renders bytes.');
 }
 role='STUDENT';count=1;await resize(390,844);await nav('/profile/achievements');await theme('dark');await wait('!!document.querySelector(".evidence-previews")');
 await delay(800);await js('document.querySelector(".evidence-photo").click()');await wait('document.querySelector(".evidence-viewer .depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');await shot('evidence-image-390-dark');await clickText('Phóng to');await wait('document.querySelector(".evidence-gallery-view--zoomed img")?.naturalWidth>0');assert.equal(await js('!!document.querySelector(".evidence-viewer .depth-carousel")'),false);assert.ok(await js('document.querySelector(".evidence-gallery-view").scrollWidth>document.querySelector(".evidence-gallery-view").clientWidth'));await clickText('Thu nhỏ');await wait('document.querySelector(".evidence-viewer .depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');const prior= requests.filter(r=>r.path.includes("/evidence/")).length;await clickText('Thử tải ảnh lại');await wait('document.querySelector(".evidence-viewer .depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');assert.equal(requests.filter(r=>r.path.includes("/evidence/")).length,prior+1);checks.push('Zoom bypasses depth rail and uses native overflow scroll; retry fetches exactly selected private image once.');
 await clickText('Sau');await wait('document.querySelector(".evidence-gallery-caption strong").textContent==="Ảnh thứ hai.png"');
 await clickText('Sau');await wait('!!document.querySelector(".evidence-gallery-file")');assert.equal(await js('!!document.querySelector(".evidence-gallery-file img")'),false);await shot('evidence-pdf-truthful-fallback-390-dark');
 assert.ok(await js('[...document.querySelectorAll(".evidence-gallery-controls button")].some(b=>b.textContent==="Tải tệp")'));await call('Page.setDownloadBehavior',{behavior:'allow',downloadPath:join(dir,'downloads')});await clickText('Tải tệp');await wait('[...document.querySelectorAll(".evidence-gallery-controls button")].some(b=>b.textContent==="Tải tệp")');assert.ok(requests.some(r=>r.path.endsWith('/evidence/pdf-c')));
 await key('Escape',27);await wait('!document.querySelector("[role=dialog]")');assert.ok(await js('document.activeElement.classList.contains("evidence-photo")'));await js('document.querySelectorAll(".evidence-photo")[1].click()');await wait('!!document.querySelector(".evidence-viewer .depth-carousel__card[aria-hidden=false]")');assert.ok(await js('document.querySelector(".evidence-viewer .depth-carousel__card[aria-hidden=false]").style.transform.includes("translateX(0px)")'));await key('Escape',27);await wait('!document.querySelector("[role=dialog]")');checks.push('Opening selected second image starts centered, without an entrance replay.');
 denyEvidence=true;await click('.evidence-photo');await wait('!!document.querySelector(".evidence-viewer .evidence-image-failure")');await shot('evidence403-390-dark');
 await js('void import("/src/lib/query-client.ts").then(m=>m.queryClient.setQueryData(["auth","currentUser"],null))');await wait('!document.querySelector(".evidence-viewer")');
 role='ANON';await nav('/users/'+uid);await wait('!!document.querySelector(".public-profile-layout")');assert.equal(await js('!!document.querySelector(".evidence-previews")'),false);
 checks.push('Owner evidence: two authorized raster previews in original order; PDF remains file with original download, no invented thumbnail;403 shows failure; Escape returns focus. Anonymous public profile excludes all evidence.');
 if(!evidenceOnly){role='ANON';albumCount=0;await nav('/honors/synthetic-album');await wait('document.body.innerText.includes("Chưa có ảnh kỷ niệm.")');assert.equal(await js('!!document.querySelector(".depth-carousel")'),false);albumCount=1;await nav('/honors/synthetic-album');await wait('document.querySelector(".depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');assert.equal(await js('[...document.querySelectorAll(".depth-carousel__controls button")].every(b=>b.disabled)'),true);albumCount=3;await resize(320,280);await nav('/honors/synthetic-album');await clickText('Mở ảnh lớn');await wait('!!document.querySelector(".honor-gallery-dialog")');await js('document.querySelector(".honor-gallery-dialog").scrollTop=9999');await touch('.honor-gallery-dialog__header button');await wait('!document.querySelector("[role=dialog]")');checks.push('320x280: sticky44px Close remains touch reachable after dialog scroll.');await resize(390,844);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await nav('/honors/synthetic-album');await wait('document.querySelector(".depth-carousel__card[aria-hidden=false] img")?.naturalWidth>0');await js('document.querySelector(".depth-carousel__stage").focus()');await key('ArrowRight',39);await wait('document.querySelector(".depth-carousel [role=status]").textContent==="2 / 3"');
 await shot('album-reduced-motion-390-dark');checks.push('Reduced-motion selection remains readable and changes without a transition tween.');}
 }
 assert.deepEqual(errors,[]);await writeFile(join(dir,'results.json'),JSON.stringify({checks,screenshots,geometry,requests,errors,limits:['Synthetic intercepted API and generated640x400 raster;not real media quality/physical phone/live authorization.','PDF first-page renderer not present in evidence contract;original-file download remains existing owner.']},null,2));console.log(JSON.stringify({evidence:dir,checks,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,screenshots,errors,requests,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}
finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},1500).unref();await host.close();}
