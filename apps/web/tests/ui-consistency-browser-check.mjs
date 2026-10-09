// Actual routes with clearly synthetic fixtures; no live API or authorization proof.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'ui-consistency-')),web=process.env.UI_WEB_URL??'http://127.0.0.1:3117';
const base=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),observations=[],requests=[],exceptions=[],consoleErrors=[],checks=[];
const baseline=process.env.UI_BASELINE==='1',headerOnly=process.env.UI_HEADER_ONLY==='1',authoringOnly=process.env.UI_AUTHORING_ONLY==='1'||process.env.UI_HEADER_ONLY==='1',selectOnly=process.env.UI_SELECT_ONLY==='1',coreOnly=process.env.UI_CORE_ONLY==='1';
const viewports=process.env.UI_SHORT_ONLY==='1'?[[320,360,'dark']]:[[1440,900,'light'],[820,900,'dark'],[320,640,'light'],[320,360,'dark']];
let metadataMode='ready',releaseMetadata;
const user={id:'00000000-0000-0000-0000-000000000001',username:'synthetic-review',fullName:'Synthetic · Người kiểm tra',displayName:'Synthetic · Người kiểm tra',email:'synthetic@example.test',role:'ADMIN',status:'ACTIVE',permissions:[],avatarUrl:null,createdAt:'2026-10-09T00:00:00Z'};
const options=Array.from({length:18},(_,i)=>({id:`synthetic-${i}`,name:i===0?'Synthetic · Chuyên đề bất đẳng thức, tổ hợp và các phương pháp chứng minh trong kỳ thi Olympic sinh viên toàn quốc':'Synthetic · Môn học '+(i+1)}));
const legacyId='00000000-0000-0000-0000-000000000002';
const legacy={id:legacyId,subjectId:'synthetic-0',subjectName:'Synthetic · Môn học',topicId:'synthetic-0',topicName:'Synthetic · Chủ đề',status:'DRAFT',type:'essay',content:{text:'Synthetic · Câu hỏi cũ'},answer:{text:'Synthetic · Đáp án'},explanation:{text:''},difficulty:'HARD',assets:[],createdById:user.id,version:0};
const page={content:[],totalPages:1,totalElements:0,number:0,size:20};
const chrome=spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',['--headless','--no-sandbox','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank']);let socket,call,js,shot,failure,requested;
try{
const endpoint=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Chrome timeout')),15000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1])}});chrome.on('error',reject)});
const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);let serial=0;const pending=new Map();
call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
const reply=(e,status,body)=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:web},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,PATCH,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'}],body:status===204?'':Buffer.from(JSON.stringify(body)).toString('base64')});
const fulfill=async e=>{const u=new URL(e.request.url),method=e.request.method,path=u.pathname; requests.push({path,method,query:u.search,input:e.request.postData?JSON.parse(e.request.postData):null});
 if(!path.startsWith('/api/v1/'))return u.origin===web&&!/\.(mp4|webm)$/.test(path)?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
 if(method==='OPTIONS')return reply(e,204,{}); const p=path.slice(7);
 if(p==='/users/me')return reply(e,200,user);
 if(p==='/auth/refresh')return reply(e,200,{accessToken:'synthetic-local-only'});
 if(p==='/documents/metadata'&&metadataMode==='hold')await new Promise(r=>releaseMetadata=r);
 if(p==='/documents/metadata'&&metadataMode==='error')return reply(e,503,{status:503});
 if(p===`/questions/${legacyId}`)return reply(e,200,legacy);
 if(p.endsWith('/topics'))return reply(e,200,options);
 if(p==='/documents/metadata')return reply(e,200,{subjects:options.map(o=>({...o,code:'SYN'})),categories:options,tags:options});
 if(p==='/admin/users/permissions')return reply(e,200,[]);
 if(p==='/admin/users')return reply(e,200,{...page,content:[user]});
 if(p.includes('rankings')||p.includes('leaderboard'))return reply(e,200,page);
 return reply(e,200,page);
};
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==='Fetch.requestPaused')fulfill(m.params).catch(e=>exceptions.push(e.message));else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.value??a.description).join(' '));else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text)};
js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};const delay=ms=>new Promise(r=>setTimeout(r,ms));const wait=async expression=>{for(let i=0;i<200;i++){if(await js(expression))return;await delay(50)}throw Error('Timeout '+expression)};
await call('Page.enable');await call('Runtime.enable');await call('DOM.enable');await call('Accessibility.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.recoveryDocument=crypto.randomUUID()'});
const nav=async path=>{const previous=await js('window.recoveryDocument');await call('Page.navigate',{url:web+path});await wait(`window.recoveryDocument!==${JSON.stringify(previous)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`)};
const viewport=async(width,height,theme)=>{requested={width,height,deviceScaleFactor:1,mobile:width===320};await call('Emulation.setDeviceMetricsOverride',requested);await js(`localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:${JSON.stringify(theme)}},version:0}))`)};
const click=async text=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Missing '+${JSON.stringify(text)});b.focus();b.click()})()`);
const set=async(selector,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
const key=async k=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:k,...(k==='Enter'?{text:'\r',windowsVirtualKeyCode:13}:{windowsVirtualKeyCode:({Escape:27,Tab:9,ArrowDown:40,ArrowUp:38})[k]??0})});await call('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:k})};
shot=async(name,details={})=>{await delay(200);const metrics=await js(`({layout:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},visual:{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale},theme:document.documentElement.className,nativeScheme:getComputedStyle(document.documentElement).colorScheme,headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>({tag:e.tagName,text:e.textContent})),active:document.activeElement?.id})`);const b=Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64');const path=join(dir,name+'.png');await writeFile(path,b);observations.push({name,requestedViewport:{...requested},...metrics,screenshot:{path,width:b.readUInt32BE(16),height:b.readUInt32BE(20)},...details})};

const checkRichSelect=async(w,h,theme)=>{
  await nav('/admin/documents');await wait("!!document.querySelector('main input')");await click('Thêm tài liệu mới');await wait("!!document.querySelector('[data-slot=select-trigger]:not(:disabled)')");await delay(250);
  const select='[data-slot=select-trigger]';await js(`document.querySelector('${select}').focus()`);await key('ArrowDown');await wait("!!document.querySelector('[data-slot=select-content]')");
  const radix=await js(`(()=>{const p=document.querySelector('[data-slot=select-content]'),r=p.getBoundingClientRect(),i=p.querySelector('[role=option]');return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,itemHeight:i.getBoundingClientRect().height,scroll:i.scrollWidth,client:i.clientWidth}})()`);
  assert.ok(radix.left>=0&&radix.right<=w&&radix.top>=0&&radix.bottom<=h);assert.ok(radix.itemHeight>=44&&radix.scroll<=radix.client);
  await shot(`after-radix-document-form-${w}x${h}-${theme}`,{radix});await key('Enter');
  await wait(`document.activeElement===document.querySelector('${select}')&&!document.querySelector('[data-slot=select-content]')`);
  await key('ArrowDown');await wait("!!document.querySelector('[data-slot=select-content]')");await key('Escape');
  await wait(`document.activeElement===document.querySelector('${select}')&&!document.querySelector('[data-slot=select-content]')`);
  assert.ok(await js("!!document.querySelector('[role=dialog]')"));
 checks.push({richSelectViewportAndKeyboard:true,w,h,theme,radix});
};
if(!authoringOnly)for(const [w,h,theme]of viewports){
 await nav('/about');await viewport(w,h,theme);
 if(!selectOnly){
 for(const route of ['/documents','/subjects','/news','/admin/users','/admin/questions','/admin/documents']){
  await nav(route);await wait("!!document.querySelector('main input')||!!document.querySelector('main [role=combobox]')");
  await delay(350);await shot(`${baseline?'before':'after'}-${route.replaceAll('/','')}-${w}x${h}-${theme}`,{route});
 }
 await nav('/documents');await wait("!!document.querySelector('input[role=combobox]:not(:disabled)')");
 const selector='input[role=combobox]';await js(`document.querySelector('${selector}').focus()`);await key('ArrowDown');await key('Enter');await delay(250);
 const enter=await js(`({focus:document.activeElement===document.querySelector('${selector}'),value:document.querySelector('${selector}').value,url:location.search})`);
 if(!baseline){assert.ok(enter.focus);assert.match(enter.url,/subjectId=synthetic-0/)}
 await js(`document.querySelector('${selector}').focus()`);await key('ArrowDown');await key('Escape');
 const escape=await js(`({focus:document.activeElement===document.querySelector('${selector}'),expanded:document.querySelector('${selector}').getAttribute('aria-expanded')})`);
 if(!baseline){assert.ok(escape.focus);assert.equal(escape.expanded,'false')}
 await shot(`${baseline?'before':'after'}-documents-selected-${w}x${h}-${theme}`,{enter,escape});
 await js(`document.querySelector('${selector}').focus()`);await key('ArrowDown');await delay(150);
 const popup=await js(`(()=>{const p=document.querySelector('[role=listbox]'),r=p.getBoundingClientRect(),o=p.querySelector('[role=option]');return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,optionScroll:o.scrollWidth,optionClient:o.clientWidth,optionHeight:o.getBoundingClientRect().height,text:o.textContent}})()`);
 if(!baseline){assert.ok(popup.left>=0&&popup.right<=w&&popup.top>=0&&popup.bottom<=h);assert.ok(popup.optionScroll<=popup.optionClient)}
 await shot(`${baseline?'before':'after'}-documents-popup-${w}x${h}-${theme}`,{popup});await key('Escape');await key('Tab');
 if(!baseline){
  assert.ok(await js(`document.activeElement!==document.querySelector('${selector}')`));
  await js(`document.querySelector('${selector}').focus()`);await key('ArrowDown');
  await js("document.querySelector('[role=option]:nth-child(2)').click()");await delay(100);
  assert.ok(await js(`document.activeElement===document.querySelector('${selector}')&&location.search.includes('subjectId=synthetic-1')`));
  await set(selector,'No matching synthetic option');await wait("document.querySelector('[role=listbox]')?.textContent.includes('Không tìm thấy')");await key('Escape');
  await wait(`document.querySelector('${selector}').value==='Synthetic · Môn học 2'`);
  assert.ok(await js(`document.activeElement===document.querySelector('${selector}')`));

 }

 checks.push({w,h,theme,enter,escape,popup});
 }
 if(!baseline&&!coreOnly)await checkRichSelect(w,h,theme);
}
if(headerOnly){await nav('/about');await viewport(320,640,'light');await nav(`/admin/questions/${legacyId}`);await wait("!!document.querySelector('.page-heading__description > div')");await shot('after-shared-heading-320-light');assert.ok(!consoleErrors.some(e=>/cannot (contain|be a descendant)|validateDOMNesting/.test(e)));checks.push({sharedHeadingBlockDescriptionValid:true});}
if(authoringOnly&&!headerOnly){
 for(const [w,h,theme]of [[1440,900,'light'],[820,900,'dark'],[320,640,'light']]){
  await nav('/about');await viewport(w,h,theme);await nav('/admin/exams/new');await wait(`!!document.querySelector('#exam-subject option[value="synthetic-0"]')`);
  await set('#exam-title','Synthetic · Bản nháp đang giữ');await js(`(()=>{const e=document.querySelector('#exam-subject');e.value='synthetic-0';e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await wait("!!document.querySelector('#bank-search')");
  await js("void (window.examTitle=document.querySelector('#exam-title'))");await set('#bank-search','Synthetic · câu đã xuất bản');await js("document.querySelector('#bank-search').scrollIntoView({block:'center'})");
  const before=requests.length;await key('Enter');await wait("document.querySelector('#bank-search').value==='Synthetic · câu đã xuất bản'");await delay(300);
  assert.ok(requests.slice(before).some(r=>r.path==='/api/v1/questions'&&new URLSearchParams(r.query).get('search')==='Synthetic · câu đã xuất bản'));
  assert.ok(!requests.slice(before).some(r=>r.method==='POST'||r.method==='PUT'||r.method==='PATCH'));assert.ok(await js("window.examTitle===document.querySelector('#exam-title')&&window.examTitle.value==='Synthetic · Bản nháp đang giữ'&&document.activeElement===document.querySelector('#bank-search')"));
  const bankGeometry=await js(`(()=>{const i=document.querySelector('#bank-search').getBoundingClientRect(),b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Tìm').getBoundingClientRect();return{input:{left:i.left,right:i.right,top:i.top,bottom:i.bottom,height:i.height},button:{left:b.left,right:b.right,top:b.top,bottom:b.bottom}}})()`);
  assert.equal(bankGeometry.input.top,bankGeometry.button.top);await shot(`after-exam-bank-${w}x${h}-${theme}`,{bankGeometry});checks.push({examSearchRetainsDraftAndFocus:true,w,h,theme});
 }
 await nav(`/admin/questions/${legacyId}`);await wait("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Chỉnh sửa')");await click('Chỉnh sửa');await wait("!!document.querySelector('#edit-difficulty')");
 await js("void (window.legacyType=document.querySelector('#edit-type'))");await js("document.querySelector('#edit-difficulty').focus()");await key('ArrowDown');await wait("!!document.querySelector('[data-slot=select-content]')");
 await js("[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()==='Chưa đặt').click()");await wait("document.querySelector('#edit-difficulty').textContent.includes('Chưa đặt')");
 await wait("document.activeElement===document.querySelector('#edit-difficulty')");assert.ok(await js("window.legacyType===document.querySelector('#edit-type')"));await shot('after-legacy-optional-difficulty-320-light');
 await js("document.querySelector('#edit-difficulty').closest('form').requestSubmit()");await wait(`document.querySelector('#edit-difficulty')===null`);
 assert.ok(requests.some(r=>r.path===`/api/v1/questions/${legacyId}`&&r.method==='PATCH'&&r.input.difficulty===null));checks.push({legacyDifficultyClearedToNull:true,editorIdentityAndFocus:true});
 // Hold metadata, fail once and explicitly retry; do not send document mutations.
 metadataMode='hold';await nav('/admin/documents');await wait("!!document.querySelector('main input')");await click('Thêm tài liệu mới');await wait("!!document.querySelector('[data-slot=select-trigger]:disabled')");
 const titleSelector='input[placeholder="Nhập tiêu đề..."]';await set(titleSelector,'Synthetic · Tên được giữ khi tải danh mục');await js(`void (window.documentTitle=document.querySelector('${titleSelector}'))`);
 metadataMode='error';releaseMetadata();await wait("document.querySelector('[role=dialog] [role=alert]')?.textContent.includes('Chưa tải được')");await shot('after-document-metadata-error-320-light');
 assert.ok(await js(`window.documentTitle===document.querySelector('${titleSelector}')&&window.documentTitle.value==='Synthetic · Tên được giữ khi tải danh mục'`));metadataMode='ready';await click('Thử lại bộ chọn');await wait("!!document.querySelector('[data-slot=select-trigger]:not(:disabled)')");
 assert.ok(await js(`window.documentTitle===document.querySelector('${titleSelector}')&&window.documentTitle.value==='Synthetic · Tên được giữ khi tải danh mục'`));await shot('after-document-metadata-retry-320-light');checks.push({metadataPendingErrorRetryRetainsDraft:true});
}
if(!baseline)for(const o of observations){assert.ok(o.layout.scrollWidth<=o.requestedViewport.width);assert.equal(o.visual.scale,1);assert.equal(o.screenshot.width,o.requestedViewport.width);assert.equal(o.screenshot.height,o.requestedViewport.height);assert.equal(o.nativeScheme,o.theme.includes('dark')?'dark':'light')}
assert.deepEqual(exceptions,[]);
}catch(e){failure=e.stack;try{await shot('failure',{context:await js(`({url:location.href,active:{tag:document.activeElement?.tagName,id:document.activeElement?.id,role:document.activeElement?.getAttribute('role')},combobox:[...document.querySelectorAll('[role=combobox]')].map(e=>({value:e.value,expanded:e.getAttribute('aria-expanded')}))})`)})}catch{}}finally{await writeFile(join(dir,'results.json'),JSON.stringify({base,baseline,checks,observations,requests,exceptions,consoleErrors,failure,limits:'Synthetic intercepted API/headless Chromium; no live API, physical keyboard, AT speech or dedicated reduced-motion proof.'},null,2));socket?.close();const exited=new Promise(r=>chrome.once('exit',r));chrome.kill('SIGTERM');await exited;await rm(join(dir,'profile'),{recursive:true,force:true,maxRetries:5,retryDelay:100});console.log(JSON.stringify({dir,checks:checks.length,observations:observations.length,exceptions,failure}))}if(failure)process.exitCode=1;
