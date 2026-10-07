// Mounted routes with synthetic intercepted APIs. No live backend or external requests.
// Dedicated reduced-motion validation intentionally omitted by delivery scope.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web = process.env.MOTION_WEB_URL ?? 'http://127.0.0.1:3112';
const dir = await mkdtemp(join(tmpdir(), 'ui-secondary-motion-'));
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {encoding:'utf8'}).trim();
const paths = execFileSync('git', ['ls-files','--cached','--others','--exclude-standard','apps/web/src','apps/web/tests'], {cwd:root,encoding:'utf8'}).trim().split('\n');
const hashes = async () => Object.fromEntries(await Promise.all(paths.map(async p=>[p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')])));
const candidateStart=await hashes(),checks=[],observations=[],requests=[],errors=[];
const uid='00000000-0000-0000-0000-000000000001';
let role='ADMIN',holdReview=false,heldReview;
const user=()=>({id:uid,username:'synthetic-account',fullName:'Synthetic Account',email:'synthetic@example.test',role,status:'ACTIVE',avatarUrl:null});
const importStatus={id:uid,status:'REVIEW_REQUIRED',phase:'REVIEW_REQUIRED',progress:100,totalPages:10,processedPages:10,draftCount:1,warningCount:0};
const draft={id:uid,ordinal:1,status:'APPROVED',content:{text:'Synthetic · Đối chiếu câu hỏi trước khi duyệt.',subjectId:uid,topicId:uid},answer:{},confidence:.82,warnings:[],sourcePage:1,sourcePageUrl:null,assets:[]};
const page=content=>({content,totalElements:content.length,totalPages:1,number:0,size:20});
const pdf=join(dir,'synthetic.pdf');await writeFile(pdf,'%PDF-1.4\nSynthetic test bytes only\n%%EOF');
const chrome=spawn(process.env.MOTION_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',['--headless','--no-sandbox','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank']);
let socket,call,js,failure,requestedViewport;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium startup timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise(resolve => { socket.onopen = resolve; });
  const pending = new Map(); let serial = 0;
  call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });

  const reply=(e,status,body)=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:new URL(web).origin},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PATCH,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'}],body:status===204?'':Buffer.from(JSON.stringify(body)).toString('base64')});
  const fulfill=async e=>{
    const u=new URL(e.request.url),method=e.request.method;
    if(!u.pathname.startsWith('/api/v1/'))return u.origin===new URL(web).origin&&!/\.(mp4|webm)$/.test(u.pathname)?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
    const path=u.pathname.slice(7);requests.push({path,method,body:e.request.postData});
    if(method==='OPTIONS')return reply(e,204,{});
    if(path==='/users/me')return reply(e,200,user());
    if(path==='/auth/refresh')return reply(e,200,{accessToken:'synthetic-only'});
    if(path==='/documents/metadata')return reply(e,200,{categories:[],subjects:[{id:uid,name:'Synthetic Toán',code:'MATH'}],tags:[]});
    if(path==='/topics')return reply(e,200,[{id:uid,subjectId:uid,name:'Synthetic Chủ đề',slug:'synthetic'}]);
    if(path.startsWith('/admin/recognition/'))return reply(e,200,page([]));
    if(path==='/assessment-imports'&&method==='POST'||path===`/assessment-imports/${uid}`)return reply(e,200,importStatus);
    if(path===`/assessment-imports/${uid}/drafts`)return reply(e,200,[draft]);
    if(path.endsWith('/approve')||path.endsWith('/reject')){
      if(holdReview){heldReview=e;return;}
      draft.status=path.endsWith('/approve')?'APPROVED':'REJECTED';return reply(e,200,draft);
    }
    if(path.startsWith(`/assessment-imports/${uid}/drafts/`)&&method==='PATCH')return reply(e,200,draft);
    if(path==='/questions')return reply(e,200,page([]));
    return reply(e,404,{status:404});
  };
  socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==='Fetch.requestPaused')fulfill(m.params).catch(e=>errors.push(e.message));else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text)};
  js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value};
  const wait=async expression=>{for(let n=0;n<200;n++){if(await js(expression))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+expression)};
  const check=(condition,label)=>{assert.ok(condition,label);checks.push(label)};
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const key=async key=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:key==='Enter'?13:9,...(key==='Enter'?{text:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code:key})};
  const click=async text=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Missing enabled '+${JSON.stringify(text)});b.focus();b.click()})()`);
  const invalidate=key=>js(`(async()=>{const {queryClient}=await import('/src/lib/query-client.ts');await queryClient.invalidateQueries({queryKey:${JSON.stringify(key)}})})()`);
  const viewport=async(width,height,theme)=>{requestedViewport={width,height,deviceScaleFactor:1,mobile:width===320};await call('Emulation.setDeviceMetricsOverride',requestedViewport);await js(`localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:${JSON.stringify(theme)}},version:0}))`)};
  const navigate=async route=>{await call('Page.navigate',{url:web+route});await wait("!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')")};
  const observe=async(name,selector)=>{
    const data=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),s=getComputedStyle(e);return{layout:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},visual:{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale},bounds:{x:r.x,y:r.y,width:r.width,height:r.height},opacity:s.opacity,transform:s.transform,animation:s.animationName,active:document.activeElement?.tagName,events:window.motionEvents.filter(x=>x.owned)}})()`);
    const png=Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64');await writeFile(join(dir,name+'.png'),png);
    observations.push({name,requestedViewport:{...requestedViewport},screenshot:{width:png.readUInt32BE(16),height:png.readUInt32BE(20),path:join(dir,name+'.png')},...data});
    check(data.layout.width===requestedViewport.width&&data.layout.scrollWidth<=requestedViewport.width&&data.visual.scale===1&&png.readUInt32BE(16)===requestedViewport.width,name+': actual viewport/PNG and no page overflow');
  };
  const animationCount=selector=>js(`[...window.motionEvents].filter(e=>e.type==='animationstart'&&e.selector===${JSON.stringify(selector)}).length`);
  await call('Page.enable');await call('Runtime.enable');await call('DOM.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.motionEvents=[];const seenReview=new WeakSet();function recordReview(){const e=document.querySelector('.assessment-review-status');if(e&&!seenReview.has(e)){const opacity=Number(getComputedStyle(e).opacity);if(opacity>0&&opacity<1){seenReview.add(e);window.motionEvents.push({type:'animationstart',selector:'review',name:'framer-confirmed-status',owned:true,opacity})}}requestAnimationFrame(recordReview)}requestAnimationFrame(recordReview);const nativeAnimate=Element.prototype.animate;Element.prototype.animate=function(frames,options){const animation=nativeAnimate.call(this,frames,options);if(this.matches('.recognition-rules__content'))window.motionEvents.push({type:'animationstart',selector:'recognition',name:'native-disclosure',owned:true,class:this.className,duration:options.duration,frames});return animation};for(const type of ['animationstart','animationend','transitionrun'])document.addEventListener(type,e=>{const owned=e.target.closest('.recognition-rules,section[aria-labelledby=draft-review-title],.assessment-phase-marker,.manual-question-preview');const selector=e.target.matches('.recognition-rules__content')?'recognition':e.animationName==='assessment-status-reveal'?'review':e.target.matches('.manual-question-preview')?'preview':null;window.motionEvents.push({type,name:e.animationName||e.propertyName,selector,owned:!!owned,class:e.target.className,duration:getComputedStyle(e.target,e.pseudoElement||null).animationDuration,opacity:getComputedStyle(e.target,e.pseudoElement||null).opacity,transform:getComputedStyle(e.target,e.pseudoElement||null).transform});},true)`});
  await call('Page.navigate',{url:web+'/about'});await wait("!!document.querySelector('header')&&!document.querySelector('#startup-loader')");
  // No reduced-motion emulation/assertions: intentionally outside delivery checks.
  for(const [width,height,theme]of[[320,640,'light'],[1280,800,'dark']]){
    await viewport(width,height,theme);await navigate('/admin/recognition');await wait("!!document.querySelector('.recognition-rules summary')");
    await js("document.querySelector('.recognition-rules summary').scrollIntoView({block:'center'});document.querySelector('.recognition-rules summary').focus()");await key('Enter');await delay(250);
    check(await js("document.querySelector('.recognition-rules').open"),'native keyboard disclosure opens');
    check(await animationCount('recognition')===1,'disclosure reveals once on explicit open');
    check(await js("getComputedStyle(document.querySelector('.recognition-rules__content')).opacity==='1'"),'disclosure ends fully visible');
    await observe(`recognition-${width}-${theme}`,'.recognition-rules');
    await invalidate(['recognition']);await delay(100);check(await animationCount('recognition')===1,'open disclosure does not replay on query refetch');
    await key('Enter');await delay(50);await key('Enter');await delay(250);check(await animationCount('recognition')===2,'explicit reopen reveals again');
    check(await js("document.activeElement===document.querySelector('.recognition-rules summary')"),'disclosure keeps summary focus');
  }
  await viewport(320,640,'light');
  const upload=async(selector="!!document.querySelector('section[aria-labelledby=draft-review-title] textarea')")=>{await navigate('/admin/questions/import');await wait("!!document.querySelector('#assessment-pdf')");const d=await call('DOM.getDocument'),n=await call('DOM.querySelector',{nodeId:d.root.nodeId,selector:'#assessment-pdf'});await call('DOM.setFileInputFiles',{nodeId:n.nodeId,files:[pdf]});await click('Bắt đầu phân tích');await wait(selector)};
  await upload();await delay(250);check(await animationCount('review')===0,'initial already-approved draft is still');
  await invalidate(['assessment-imports',uid,'drafts']);check(await animationCount('review')===0,'same initial approved status stays still on refetch');
  draft.status='NEEDS_REVIEW';await upload();
  await js("window.editor=document.querySelector('textarea');window.editor.focus()");await call('Input.insertText',{text:'Synthetic dirty before approval'});
  holdReview=true;await click('Duyệt');await wait("!!document.querySelector('button[aria-busy=true]')");await wait("!!document.querySelector('textarea')");
  for(let n=0;n<100&&!heldReview;n++)await delay(20);check(!!heldReview,'approval reached held real mutation');
  check(await animationCount('review')===0&&!await js("[...document.querySelectorAll('span')].some(e=>e.textContent==='Đã duyệt')"),'pending approval does not imply confirmed success');
  await js("window.editor.focus()");await call('Input.insertText',{text:'Synthetic unsaved during pending'});
  await js("window.dirty=window.editor.value");holdReview=false;draft.status='APPROVED';await reply(heldReview,200,draft);heldReview=null;
  await wait("[...document.querySelectorAll('section[aria-labelledby=draft-review-title] span')].some(e=>e.textContent==='Đã duyệt')");await delay(250);
  check(await animationCount('review')===1,'confirmed approval reveals status once');
  check(await js("document.querySelector('textarea')===window.editor&&window.editor.value===window.dirty&&document.activeElement===window.editor"),'approval retains editor DOM, unsaved text and input focus');
  await invalidate(['assessment-imports',uid,'drafts']);await delay(100);check(await animationCount('review')===1,'unchanged approved refetch does not replay');
  await observe('assessment-approved-320-light','section[aria-labelledby=draft-review-title]');
  holdReview=true;await click('Từ chối');for(let n=0;n<100&&!heldReview;n++)await delay(20);check(!!heldReview,'reject reached held real mutation');
  check(await animationCount('review')===1,'pending reject does not reveal status');
  holdReview=false;draft.status='REJECTED';await reply(heldReview,200,draft);heldReview=null;
  await wait("[...document.querySelectorAll('section[aria-labelledby=draft-review-title] span')].some(e=>e.textContent==='Đã từ chối')");await delay(250);check(await animationCount('review')===2,'confirmed rejection reveals once');
  await invalidate(['assessment-imports',uid,'drafts']);check(await animationCount('review')===2,'unchanged rejected refetch does not replay');
  // Fresh processing job: real-shaped status/phase/progress combination, separate from review.
  importStatus.status='PROCESSING';importStatus.phase='RENDERING_PAGES';importStatus.progress=20;
  await upload("!!document.querySelector('.assessment-phase-marker')");
  await js("document.querySelector('.assessment-phase-marker').scrollIntoView({block:'center'})");
  await observe('assessment-processing-start-320-light','.assessment-phase-marker');
  importStatus.phase='PARSING_QUESTIONS';importStatus.progress=64;await invalidate(['assessment-imports',uid,'status']);await delay(200);
  check(await js("[...document.querySelectorAll('.assessment-phase-marker')].every(e=>getComputedStyle(e).transitionDuration.includes('0.15s'))"),'phase marker uses150ms transition');
  check(await js("window.motionEvents.some(e=>e.type==='transitionrun'&&e.class.includes('assessment-phase-marker'))"),'server phase change starts marker transition');
  check(await js("document.body.textContent.includes('64%')"),'progress retains server numeric value');
  await observe('assessment-phase-320-light','.assessment-phase-marker');
  const phaseEvents=await js("window.motionEvents.filter(e=>e.type==='transitionrun'&&e.class.includes('assessment-phase-marker')).length");
  await invalidate(['assessment-imports',uid,'status']);await delay(200);
  check(await js("window.motionEvents.filter(e=>e.type==='transitionrun'&&e.class.includes('assessment-phase-marker')).length")===phaseEvents,'same-phase refetch does not restart marker transitions');
  await viewport(1280,800,'dark');await navigate('/admin/questions/new');await wait("!!document.querySelector('#manual-title')");
  check(await animationCount('preview')===0,'initial editing has no preview reveal');
  await js("document.querySelector('#manual-title').focus()");await call('Input.insertText',{text:'Synthetic unsaved preview title'});
  await click('Xem');await wait("!!document.querySelector('.manual-question-preview')");await delay(250);
  check(await animationCount('preview')===1,'explicit View reveals once');
  check(await js("document.querySelector('.manual-question-preview').textContent.includes('Synthetic unsaved preview title')"),'preview shows unsaved draft');
  await js("window.previewNode=document.querySelector('.manual-question-preview');window.previewFocus=document.activeElement");
  await invalidate(['auth','currentUser']);await delay(100);
  check(await animationCount('preview')===1&&await js("document.querySelector('.manual-question-preview')===window.previewNode&&document.activeElement===window.previewFocus"),'ordinary identity refetch does not replay/remount preview or change focus');
  await observe('manual-preview-1280-dark','.manual-question-preview');
  await click('Chỉnh sửa');await wait("!!document.querySelector('#manual-title')");check(await js("document.querySelector('#manual-title').value==='Synthetic unsaved preview title'"),'Edit returns unsaved title');
  await click('Xem');await delay(250);check(await animationCount('preview')===2,'second explicit View reveals again');
  // Permission changes must not count as an explicit View intent.
  await click('Chỉnh sửa');role='STUDENT';await invalidate(['auth','currentUser']);await delay(300);
  check(!await js("!!document.querySelector('#manual-question-form')"),'permission change removes unauthorized editor');
  check(await animationCount('preview')===2,'permission transition does not trigger preview animation');
  check(requests.filter(r=>r.path==='/questions'&&r.method==='POST').length===0,'preview/permission checks do not save or publish');
  check(errors.length===0,'no runtime exceptions');assert.deepEqual(candidateStart,await hashes());check(true,'source hashes stable during run');
}catch(e){failure=e.stack;try{observations.push({name:'failure-state',state:await js("({open:document.querySelector('.recognition-rules')?.open,activeTag:document.activeElement?.tagName,activeText:document.activeElement?.textContent?.slice(0,80),events:window.motionEvents})")})}catch{}}
finally{
 await writeFile(join(dir,'results.json'),JSON.stringify({base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),candidateStart,checks,observations,requests,errors,failure,limits:'Synthetic intercepted APIs/PDF; mounted actual app routes; headless Chromium. Reduced-motion behavior intentionally unverified; no live backend or physical device/AT proof.'},null,2));
 socket?.close();const stopped=new Promise(r=>chrome.once('exit',r));chrome.kill('SIGTERM');await stopped;await rm(join(dir,'profile'),{recursive:true,force:true,maxRetries:5,retryDelay:100});console.log(JSON.stringify({artifact:join(dir,'results.json'),checks:checks.length,observations:observations.length,failure}));
}
if(failure)process.exitCode=1;
