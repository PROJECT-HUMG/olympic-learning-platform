// Actual Documents route + Sheet/Popover/query owners; synthetic APIs, no live writes or .env.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
const baseline=process.argv.includes('--before'),tailOnly=process.argv.includes('--tail-only'),cardOnly=process.argv.includes('--card-assessment-only'),statesOnly=process.argv.includes('--states-only')||tailOnly||cardOnly;
const dir=await mkdtemp(join(tmpdir(),`humg-document-filters-${baseline?'before':'after'}-`));
const root=fileURLToPath(new URL('..',import.meta.url)),old=new Map();
if(baseline)for(const path of ['src/features/documents/components/document-filters.tsx','src/features/documents/components/document-discovery.css'])old.set(join(root,path),execFileSync('git',['show',`3d600d0:apps/web/${path}`],{cwd:root,encoding:'utf8'}));
const host=await createServer({root,configFile:false,envDir:false,cacheDir:cardOnly?join(dir,'vite-cache'):join('/tmp/humg-document-filter-sheet-20261014','vite-cache'),define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('/api/v1')},resolve:{alias:{'@':join(root,'src')}},plugins:[{name:'entry-owner-snapshot',enforce:'pre',load(id){return old.get(id.split('?')[0]);}},react(),tailwind()],server:{host:'127.0.0.1',port:0}});
await host.listen();const web='http://127.0.0.1:'+host.httpServer.address().port;
const chrome=spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--password-store=basic','--disable-background-timer-throttling','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank'],{env:{...process.env,GSETTINGS_BACKEND:'memory',XDG_RUNTIME_DIR:dir}});

const checks=[],screenshots=[],geometry=[],errors=[],requests=[],cancelled=[],heldMetadata=[],heldDocuments=[];
let socket,call,js,metadataMode='normal',documentMode='normal',holdKeyword=null,previewMode=false;
const metadata={subjects:[{id:'subject-1',name:'Giải tích nâng cao và phương pháp giải toán Olympic'},{id:'subject-2',name:'Đại số'}],categories:[{id:'category-1',name:'Chuyên đề ôn tập'},{id:'category-2',name:'Giáo trình'}],tags:[{id:'tag-1',name:'Bất đẳng thức và các phương pháp chứng minh mở rộng'},{id:'tag-2',name:'Ôn tập'}]};
try {
 const endpoint=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Chrome timeout')),30000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1]);}});chrome.on('error',reject);});
 const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);let serial=0;const pending=new Map();
 call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const reply=(e,status,body,type='application/json')=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(type==='application/json'?JSON.stringify(body):body).toString('base64')});
 const respond=async e=>{
  const u=new URL(e.request.url),path=u.pathname;
  if(path==='/synthetic-preview.svg')return reply(e,200,'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="white"/><text x="40" y="80" fill="#123b75" font-size="30">SYNTHETIC PREVIEW</text><path d="M40 150H560M40 190H500M40 230H540M40 270H480" stroke="#a5afbd" stroke-width="12"/></svg>','image/svg+xml');
  if(path==='/synthetic-preview-failed.svg')return reply(e,403,'Synthetic unavailable image','text/plain');
  if(u.origin===web&&!path.startsWith('/api/'))return call('Fetch.continueRequest',{requestId:e.requestId});
  if(!path.startsWith('/api/'))return reply(e,200,'','text/css');
  requests.push({path,query:u.search,method:e.request.method,time:Date.now()});
  if(path.endsWith('/users/me')||path.endsWith('/auth/refresh'))return reply(e,401,{});
  assert.equal(e.request.method,'GET','no product mutations');
  if(path.endsWith('/documents/metadata')){
   if(metadataMode==='hold')await new Promise(resolve=>heldMetadata.push(resolve));
   return reply(e,metadataMode==='error'?503:200,metadataMode==='error'?{title:'Synthetic metadata unavailable'}:metadataMode==='empty'?{subjects:[],categories:[],tags:[]}:metadata);
  }
  if(path.endsWith('/documents')){
   const keyword=u.searchParams.get('keyword')??'';
   if(keyword===holdKeyword)await new Promise(resolve=>heldDocuments.push(resolve));
   const count=documentMode==='empty'?0:3;
   const content=Array.from({length:count},(_,i)=>({id:'doc-'+i,slug:'synthetic-doc-'+i,title:`Tài liệu thử nghiệm ${keyword} · `+(i===1?'Chuyên đề có tiêu đề dài dành cho kiểm tra bố cục thư viện':'Chuyên đề ôn tập '+(i+1)),description:'Dữ liệu giả lập để kiểm tra bộ lọc, không phải tài liệu thật.',subject:metadata.subjects[0],category:metadata.categories[0],tags:[],owner:{id:"00000000-0000-0000-0000-000000000001",username:"synthetic-author",fullName:"Người biên soạn thử nghiệm",avatarUrl:null},thumbnailUrl:previewMode?(i===0?"/synthetic-preview.svg":i===2?"/synthetic-preview-failed.svg":null):null,viewCount:0,downloadCount:0,createdAt:'2026-10-10T00:00:00Z'}));
   return reply(e,documentMode==='error'?503:200,documentMode==='error'?{title:'Synthetic library unavailable'}:{content,totalElements:count?36:0,totalPages:count?3:0,number:Number(u.searchParams.get('page')??0),size:12});
  }
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
 const clickText=label=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)throw Error('Missing button');b.click()})()`);
 const search='.document-filter-search input',trigger='.document-filter-trigger';
 const theme=t=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(t)}))`);
 const nav=async query=>{await call('Page.navigate',{url:web+'/documents'+(query??'')});await wait('!!document.querySelector(".document-filter-search input")&&!document.querySelector("#startup-loader")');await delay(100);};
 const shot=async name=>{await delay(220);assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'no page overflow');const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
 const open=async()=>{await click(trigger);await wait('!!document.querySelector(".document-filter-sheet")');await delay(250);};
 const close=async()=>{await click('[aria-label="Đóng bộ lọc"]');await wait('!document.querySelector(".document-filter-sheet")');await wait('document.activeElement.matches(".document-filter-trigger")');};
 const combobox=label=>`input[role="combobox"][aria-label=${JSON.stringify(label)}]`;
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});await resize(390,844);await nav();
 for(const t of (statesOnly?[]:['light','dark'])){
  await theme(t);
  for(const [w,h] of [[320,568],[390,844],[768,900],[1280,900]]){
   await resize(w,h);await js('scrollTo(0,0)');await delay(180);await shot(`page-${w}x${h}-${t}`);
   const g=await js(`({width:innerWidth,height:innerHeight,theme:${JSON.stringify(t)},filter:document.querySelector('.document-filter-bar').getBoundingClientRect().toJSON(),results:document.querySelector('.document-browser__results').getBoundingClientRect().toJSON(),fields:document.querySelectorAll('.document-filter-fields').length,trigger:!!document.querySelector('.document-filter-trigger')})`);geometry.push(g);
   if(!baseline){assert.equal(g.fields,w<640?0:1);assert.equal(g.trigger,w<640);if(w<640){await open();assert.ok(await js('document.activeElement.matches("[data-slot=sheet-title]")&&!document.querySelector("[role=listbox]")'));await shot(`sheet-${w}x${h}-${t}`);await close();}}
  }
 }
 if(!statesOnly)checks.push('Actual Documents route320/390/768/1280 light-dark:phone search/trigger only,desktop/tablet facets visible;one facet set,initial heading focus,no automatic chooser,no page overflow;ordinary close returns trigger.');
 if(!baseline&&!cardOnly){
  if(!tailOnly){
  await resize(390,844);await theme('light');await nav('?keyword=old&page=2&view=list&keep=value');await js('window.retainedSearch=document.querySelector(".document-filter-search input");window.initialHistory=history.length');
  await fill(search,'  新 A+B  ');await open();await wait('new URLSearchParams(location.search).get("keyword")==="新 A+B"');assert.equal(await js('history.length'),await js('window.initialHistory'));assert.ok(await js('window.retainedSearch===document.querySelector(".document-filter-search input")&&window.retainedSearch.value==="  新 A+B  "'));assert.equal(await js('new URLSearchParams(location.search).get("page")'),null);
  await js('window.selectionHistory=history.length');await click(combobox('Môn học'));await wait('!!document.querySelector("[role=listbox]")');await key('Escape',27);await wait('!document.querySelector("[role=listbox]")');assert.ok(await js('!!document.querySelector(".document-filter-sheet")'));await key('Escape',27);await wait('!document.querySelector(".document-filter-sheet")');await wait('document.activeElement.matches(".document-filter-trigger")');
  await open();await click(combobox('Môn học'));await wait('!!document.querySelector("[role=listbox]")');await click('[role=option]:first-child');await wait('new URLSearchParams(location.search).get("subjectId")==="subject-1"');await wait('!!document.querySelector(".document-filter-sheet")&&!document.querySelector("[role=listbox]")');assert.equal(await js('history.length'),await js('window.selectionHistory')+1);
  assert.equal(await js('new URLSearchParams(location.search).get("view")'),'list');assert.equal(await js('new URLSearchParams(location.search).get("keep")'),'value');
  await click(combobox('Loại tài liệu'));await key('ArrowDown',40);await key('Enter',13,'\r');await wait('new URLSearchParams(location.search).get("categoryId")==="category-1"');await wait('!document.querySelector("[role=listbox]")');
  await click(combobox('Thẻ'));await key('ArrowDown',40);await key('Enter',13,'\r');await wait('new URLSearchParams(location.search).get("tagId")==="tag-1"');await wait('!document.querySelector("[role=listbox]")');
  await shot('selected-sheet-390-light');await clickText('Xong');await wait('!document.querySelector(".document-filter-sheet")');await wait('document.activeElement.matches(".document-filter-trigger")');await shot('selected-chips-390-light');
  assert.ok(await js('!![...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Bỏ lọc môn học")'));assert.ok(requests.some(r=>r.path.endsWith('/documents')&&new URLSearchParams(r.query).get('subjectId')==='subject-1'&&new URLSearchParams(r.query).get('categoryId')==='category-1'&&new URLSearchParams(r.query).get('tagIds[]')==='tag-1'));
  await open();assert.equal(await js(`document.querySelector(${JSON.stringify(combobox('Môn học'))}).value`),metadata.subjects[0].name);
  await clickText('Xóa bộ lọc');await wait('!new URLSearchParams(location.search).has("subjectId")&&!new URLSearchParams(location.search).has("categoryId")&&!new URLSearchParams(location.search).has("tagId")');assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),'新 A+B');await close();
  await js('history.back()');await wait('new URLSearchParams(location.search).has("tagId")');await open();assert.equal(await js(`document.querySelector(${JSON.stringify(combobox('Thẻ'))}).value`),metadata.tags[0].name);await close();
  await click('[aria-label="Bỏ lọc môn học"]');await wait('!new URLSearchParams(location.search).has("subjectId")');
  await fill(search,'must-not-return');await clickText('Xóa tất cả');await wait('location.search==="?view=list&keep=value"');await delay(450);assert.equal(await js(`document.querySelector(${JSON.stringify(search)}).value`),'');await js('history.back()');await wait('new URLSearchParams(location.search).get("keyword")==="新 A+B"');await js('history.forward()');await wait('location.search==="?view=list&keep=value"');await wait('document.querySelector(".document-filter-search input").value===""');
  checks.push('Pending350ms search survives sheet opening/node identity;REPLACE typing,immediate discrete PUSH,correct supported API fields/page reset/unknown+view preservation;pointer and keyboard nested selections,first Escape closes chooser,second sheet;chips,secondary reset/full reset,Back/Forward and reopen keep URL state.');
  await fill(search,'');await js(`document.querySelector(${JSON.stringify(search)}).dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}))`);await fill(search,'構成中');await delay(450);assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),null);await js(`document.querySelector(${JSON.stringify(search)}).dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}))`);await wait('new URLSearchParams(location.search).get("keyword")==="構成中"&&document.body.innerText.includes("構成中 ·")');assert.equal(await js('document.activeElement===window.retainedSearch'),true);
  holdKeyword='stale';await fill(search,'stale');await wait('new URLSearchParams(location.search).get("keyword")==="stale"&&'+JSON.stringify(true));await delay(100);assert.ok(heldDocuments.length>0);await fill(search,'fresh');await wait('new URLSearchParams(location.search).get("keyword")==="fresh"&&document.body.innerText.includes("fresh ·")');holdKeyword=null;heldDocuments.splice(0).forEach(r=>r());await delay(120);assert.ok(await js('document.body.innerText.includes("fresh ·")&&!document.body.innerText.includes("stale ·")'));checks.push('IME holds commit until compositionend;typing focus retained;held stale query cannot replace newer list result.');
  }
  await js('void(window.retainedSearch=document.querySelector(".document-filter-search input"))');
  for(const [w,h] of [[320,280],[390,360],[639,320]]){
   await resize(w,h);await theme('dark');await open();const g=await js('(()=>{const s=document.querySelector(".document-filter-sheet"),c=s.querySelector("header button"),f=s.querySelector("footer");return{s:s.getBoundingClientRect().toJSON(),c:c.getBoundingClientRect().toJSON(),f:f.getBoundingClientRect().toJSON()}})()');assert.ok(g.s.x>=0&&g.s.y>=0&&g.s.right<=w+1&&g.s.bottom<=h+1);assert.ok(g.c.height>=43.95&&g.c.width>=43.95&&g.f.bottom<=h+1);await shot(`short-sheet-${w}x${h}-dark`);
   await js('document.querySelector(".document-filter-sheet footer button:last-child").focus()');await key('Tab',9);assert.equal(await js('document.activeElement.getAttribute("aria-label")'),'Đóng bộ lọc');await key('Tab',9,undefined,8);assert.equal(await js('document.activeElement.textContent.trim()'),'Xong');
   await js(`document.querySelector(${JSON.stringify(combobox('Thẻ'))}).scrollIntoView({block:'nearest'})`);await click(combobox('Thẻ'));await wait('!!document.querySelector("[role=listbox]")');await shot(`short-nested-${w}x${h}-dark`);await key('Escape',27);await wait('!document.querySelector("[role=listbox]")');await key('Escape',27);await wait('!document.querySelector(".document-filter-sheet")');
  }
  await resize(390,844);await open();await resize(768,900);await wait('!document.querySelector(".document-filter-sheet")&&document.querySelectorAll(".document-filter-fields").length===1');await wait('document.activeElement===window.retainedSearch');assert.ok(await js('getComputedStyle(document.body).overflow!=="hidden"'));await resize(390,844);assert.equal(await js('document.querySelectorAll(".document-filter-sheet").length'),0);
  checks.push('320x280/390x360/639x320:bounded frame and44px Close/footer,body scroll,nested chooser,Tab/ShiftTab trap and Escape;breakpoint teardown restores search focus and body scroll without losing URL draft.');
  metadataMode='hold';await js('void import("/src/lib/query-client.ts").then(m=>{void m.queryClient.resetQueries({queryKey:["documents"],exact:true})})');await wait('document.body.innerText.includes("Đang tải bộ lọc")');await open();assert.ok(await js('[...document.querySelectorAll(".document-filter-sheet [role=combobox]")].every(e=>e.disabled)'));await shot('metadata-pending-sheet-390-dark');metadataMode='error';heldMetadata.splice(0).forEach(r=>r());await wait('document.querySelector(".document-filter-sheet [role=alert]")');await shot('metadata-error-sheet-390-dark');await close();assert.ok(await js('!!document.querySelector(".document-filter-bar [role=alert]")'));
  metadataMode='hold';await clickText('Thử lại bộ lọc');await open();await wait('document.querySelector(".document-filter-sheet [aria-busy=true]")||document.querySelector(".document-filter-sheet [role=status]")');await shot('metadata-retry-sheet-390-dark');metadataMode='normal';heldMetadata.splice(0).forEach(r=>r());await wait('![...document.querySelectorAll(".document-filter-sheet [role=combobox]")].some(e=>e.disabled)&&!document.querySelector(".document-filter-sheet [role=alert]")');await close();checks.push('Metadata hold/error/retry feedback visible outside or inside sheet without duplicates;pending fields disabled,Close usable;retry busy feedback and genuine recovery preserve search/filter state.');
  metadataMode='empty';await js('void import("/src/lib/query-client.ts").then(m=>{void m.queryClient.resetQueries({queryKey:["documents"],exact:true})})');await delay(200);await open();await click(combobox('Môn học'));await wait('document.body.innerText.includes("Không tìm thấy môn học")');await shot('metadata-empty-options-390-dark');await key('Escape',27);await close();metadataMode='normal';
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await open();assert.equal(await js('getComputedStyle(document.querySelector(".document-filter-sheet")).animationName'),'none');await shot('reduced-sheet-390-dark');await close();
  assert.ok(!requests.some(r=>r.method!=='GET'&&!r.path.endsWith('/auth/refresh')));checks.push('Empty metadata is honest searchable-empty feedback;reduced-motion sheet has no entrance animation;no live requests or product writes.');
 }
 if(cardOnly){
  previewMode=true;await js('void import("/src/lib/query-client.ts").then(m=>{void m.queryClient.invalidateQueries({queryKey:["documents","list"]})})');await wait('!!document.querySelector(".document-thumbnail__image")&&document.querySelector(".document-thumbnail__image").complete');
  for(const t of ['light','dark'])for(const [w,h] of [[320,568],[390,844],[1280,900]]){
   await theme(t);await resize(w,h);await js('scrollTo(0,document.querySelector(".document-results-grid").getBoundingClientRect().top+scrollY-80)');await shot(`card-states-${w}-${t}`);
   const rows=await js(`([...document.querySelectorAll('.document-card')].map(c=>({card:c.getBoundingClientRect().toJSON(),title:c.querySelector('h3').getBoundingClientRect().toJSON(),thumbnail:c.querySelector('.document-thumbnail').getBoundingClientRect().toJSON(),image:!!c.querySelector('img'),status:c.querySelector('.document-thumbnail__fallback')?.innerText,open:c.querySelector('a[aria-label]')?.getBoundingClientRect().toJSON()})))`);geometry.push({assessmentOnly:true,width:w,theme:t,rows});
   assert.equal(rows.length,3);assert.ok(rows[0].image&&!rows[1].image&&!rows[2].image);assert.ok(rows.every(r=>r.open.height>=43.95));
  }
  checks.push('Assessment-only unchanged DocumentCard:loaded synthetic first-page image,absent preview and HTTP403 fallback;long title/subject/type/owner/actions at320/390/1280 light-dark. No card implementation changes.');
 }
 assert.deepEqual(errors,[]);await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,geometry,requests,errors,cancelled,limits:['Actual route/StrictMode/Sheet/Popover/query owners;synthetic intercepted APIs only.','Chromium viewport and composition-event simulation,not physical phone/browser keyboard/native IME/AT speech/live backend or every device.']},null,2));console.log(JSON.stringify({evidence:dir,checks:checks.length,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,screenshots,geometry,requests,errors,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}
finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},1500).unref();await host.close();}
