// Mounted production UI; deterministic versioned API fixtures, not backend proof.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.DAILY_WEB_URL ?? 'http://127.0.0.1:3001';
const dir = await mkdtemp(join(tmpdir(), 'daily-auto-sync-'));
const paths = ['components/daily-plan-editor.tsx', 'components/daily-week-editor.tsx', 'hooks/use-daily-editor.ts',
  'hooks/use-daily-auto-sync.ts', 'hooks/use-daily.ts', 'lib/daily-lifecycle.ts', 'lib/plan-editor.ts',
  'lib/daily-contract.ts', 'services/daily.service.ts', 'ui/daily-sync-status.tsx', 'ui/study-notebook.css',
  'ui/study-date-picker.tsx', 'ui/use-daily-confirm.tsx', 'evidence/evidence-panel.tsx'].map(p=>'src/features/daily/'+p)
  .concat(['src/components/ui/dialog.tsx', 'src/components/ui/alert-dialog.tsx', 'src/components/ui/checkbox.tsx',
    'src/components/ui/theme-toggle.tsx', 'src/features/auth/components/user-dropdown.tsx',
    'src/layouts/dashboard-layout.tsx', 'src/layouts/components/public-header.tsx', 'src/layouts/navigation.css',
    'src/index.css', 'tests/daily-auto-sync-browser-check.mjs']);
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async p=>[p,createHash('sha256').update(await readFile(new URL('../'+p,import.meta.url))).digest('hex')])));
const candidateStart = await manifest(), requests = [], checks = [], errors = [], nativeDialogs = [];
const uuid = n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const date = '2026-10-05', owner=uuid(1);
const seed = () => ({id:uuid(4),ownerId:owner,planDate:date,version:0,firstSubmittedAt:null,onTime:false,
  reviewReasons:'',reviewWentWell:'',reviewTomorrow:'',createdAt:'2026-10-05T00:00:00Z',updatedAt:'2026-10-05T00:00:00Z',
  tasks:[{id:uuid(20),title:'Ôn tập đạo hàm',priority:'MUST',status:'TODO',position:0},{id:uuid(21),title:'Đọc lại ghi chú',priority:'SHOULD',status:'TODO',position:1}]});
let plan=seed(), missing=false, held=false, fail=false, loseResponse=false, release, holdSubmit=false, releaseSubmit;
let week={id:uuid(5),weekStart:date,version:0,recurringUnfinished:'',issues:'',reflection:'',nextWeekChanges:'',plannedDays:1,weekDays:7,nonemptyDays:1,completionRate:0,mustTotal:1,mustCompleted:0,mustRate:0,onTimeDays:0};
let active=0,maxActive=0;
const recount = p => ({...p,totalCount:p.tasks.length,completedCount:p.tasks.filter(t=>t.status==='COMPLETED').length,mustTotal:p.tasks.filter(t=>t.priority==='MUST').length,mustCompleted:p.tasks.filter(t=>t.priority==='MUST'&&t.status==='COMPLETED').length});
const chrome=spawn(process.env.DAILY_CHROME_PATH??'/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless','--no-sandbox','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank']);
let socket,call,js;
try {
  const endpoint=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Startup timeout')),15000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1]);}});chrome.on('error',reject);});
  const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>{socket.onopen=r});let serial=0;const pending=new Map();
  call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  async function fulfill(e) {
    const u=new URL(e.request.url),method=e.request.method,path=u.pathname.slice(7);
    if(!u.pathname.startsWith('/api/v1/'))return u.origin===new URL(web).origin&&!/\.(mp4|webm)$/.test(u.pathname)?call('Fetch.continueRequest',{requestId:e.requestId}):call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:404});
    const input=e.request.postData?JSON.parse(e.request.postData):{};requests.push({path,method,input,query:u.search,time:Date.now()});let body={},status=200;
    if(method==='OPTIONS')body={};
    else if(path==='/users/me')body={id:owner,username:'fixture',fullName:'Daily sync fixture',role:'STUDENT',status:'ACTIVE',email:'fixture@example.test',avatarUrl:null};
    else if(path==='/auth/refresh')body={accessToken:'synthetic-sync'};
    else if(path==='/daily/plans/dates')body=missing?[]:[date];
    else if(path==='/daily/plans'&&method==='PUT'||path==='/daily/weeks'&&method==='PUT') {
      active++;maxActive=Math.max(active,maxActive);
      if(held)await new Promise(r=>{release=r});
      const current=path==='/daily/plans'?plan:week;
      if(fail){status=503;body={status:503,detail:'Local fixture offline'};}
      else if(input.expectedVersion!==(missing&&path==='/daily/plans'?null:current.version)){status=409;body={status:409,messageKey:'error.resource.stateConflict'};}
      else if(path==='/daily/plans'){missing=false;plan={...plan,...input,version:plan.version+1,tasks:input.tasks.map((t,n)=>({...t,id:t.id??uuid(100+n),position:n}))};body=plan;}
      else {week={...week,...input,version:week.version+1};body=week;}
      if(loseResponse){status=503;body={status:503,detail:'Response lost after server commit'};}
      active--;
    }
    else if(path==='/daily/plans'){if(missing){status=404;body={status:404,messageKey:'error.resource.notFound'};}else body={...plan,planDate:u.searchParams.get('date')};}
    else if(path==='/daily/weeks')body={...week,weekStart:u.searchParams.get('weekStart')};
    else if(path==='/daily/plans/tasks'){plan={...plan,version:plan.version+1,tasks:[...plan.tasks,{id:input.taskId,title:input.title,priority:input.priority,status:input.status,position:plan.tasks.length}]};body=plan;}
    else if(path.endsWith('/submit')){if(holdSubmit)await new Promise(r=>{releaseSubmit=r});plan={...plan,version:plan.version+1,firstSubmittedAt:plan.firstSubmittedAt??'2026-10-05T00:00:00Z',onTime:true};body=plan;}
    else if(path.includes('/evidence'))body=[];
    else if(path==='/groups'||path==='/groups/invitations')body=[];
    else if(path==='/documents'||path==='/posts')body={content:[],totalElements:0,totalPages:0,number:0,size:20};
    else {status=404;body={status:404};}
    if(status<300&&body.tasks)body=recount(body);
    return call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:new URL(web).origin},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,DELETE,OPTIONS'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
  }
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused')void fulfill(m.params).catch(e=>errors.push(e.message));if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails));if(m.method==='Page.javascriptDialogOpening'){nativeDialogs.push(m.params.type);void call('Page.handleJavaScriptDialog',{accept:false});}if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);}};
  js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=async expression=>{for(let n=0;n<200;n++){if(await js(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout: '+expression);};
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  const fill=async(selector,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Missing/disabled field');e.focus();Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);};
  const click=async label=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&b.getClientRects().length);if(!b||b.disabled)throw Error('Missing/disabled button '+${JSON.stringify(label)});b.focus();b.click()})()`);
  const key=async(key,code,v)=>{await call('Input.dispatchKeyEvent',{type:key==='Enter'?'keyDown':'rawKeyDown',key,code,windowsVirtualKeyCode:v,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:v});};
  const navigate=async path=>{const prev=await js('window.syncDocument');await call('Page.navigate',{url:web+path});await wait(`window.syncDocument!==${JSON.stringify(prev)}&&!!document.querySelector('.study-savebar')&&!document.querySelector('#startup-loader')`);};
  const viewport=async(w,h,dark=false)=>{await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<768});await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:dark?'dark':'light'}]});await js(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))).then(()=>{const b=document.querySelector('.shell-icon-control');if(b&&b.getAttribute('aria-pressed')!==String(${dark}))b.click()})`);await wait(`document.documentElement.classList.contains('dark')===${dark}`);};
  const shot=async name=>{await pause(200);await writeFile(join(dir,name+'.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));};
  const synced=()=>wait("document.querySelector('.study-savebar .daily-sync-status').textContent.includes('Đã đồng bộ')");
  const putCount=()=>requests.filter(r=>r.method==='PUT'&&r.path==='/daily/plans').length;
  const openTaskMenu=async()=>{await wait("!document.querySelector('.daily-reflection-dialog')");await js("document.querySelector('.study-task__menu').focus()");await key('Enter','Enter',13);await wait("!!document.querySelector('[role=menu]')");};
  await call('Page.enable');await call('Runtime.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.syncDocument=crypto.randomUUID();'});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await viewport(1440,900);await navigate('/daily?date='+date);
  const completion = '.study-task__complete [role=checkbox]';
  assert.equal(await js(`document.querySelector('${completion}').getAttribute('aria-checked')`),'false');
  await js(`document.querySelector('${completion}').focus()`);await key('Enter','Enter',13);
  assert.equal(await js(`document.querySelector('${completion}').getAttribute('aria-checked')`),'false');
  await key(' ','Space',32);await synced();assert.equal(plan.tasks[0].status,'COMPLETED');
  await shot('checkbox-keyboard-checked-desktop');await key(' ','Space',32);await synced();assert.equal(plan.tasks[0].status,'TODO');
  const hit = await js("(()=>{const b=document.querySelector('.study-task__complete').getBoundingClientRect();return {x:b.x+3,y:b.y+b.height/2}})()");
  await call('Input.dispatchMouseEvent',{type:'mousePressed',...hit,button:'left',clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',...hit,button:'left',clickCount:1});
  await synced();assert.equal(plan.tasks[0].status,'COMPLETED');await js(`document.querySelector('${completion}').click()`);await synced();
  assert.equal(plan.firstSubmittedAt,null);await navigate('/daily?date='+date);assert.equal(await js(`document.querySelector('${completion}').getAttribute('aria-checked')`),'false');
  checks.push('Shadcn checkbox: Space toggles, Enter does not submit, 44px label hit area toggles, auto-sync and reopen preserve wire states');
  assert.equal(await js("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Lưu kế hoạch')"),false);
  const start=putCount();for(let n=0;n<6;n++){await fill('.study-task__main > input','Auto title '+n);await pause(55);}
  assert.equal(putCount(),start);await shot('pending-desktop');await synced();assert.equal(putCount(),start+1);assert.equal(plan.tasks[0].title,'Auto title 5');assert.equal(plan.firstSubmittedAt,null);
  checks.push('Six rapid edits batch once; no Save affordance or implicit Submit');

  held=true;await fill('.study-task__main > input','Sent batch');await wait("document.querySelector('.study-savebar').textContent.includes('Đang đồng bộ')");
  assert.ok(release);await fill('.study-task__main > input','Newer during request');await js("document.querySelector('.study-task__complete [role=checkbox]').click();document.querySelector('.study-task__controls select').value='COULD';document.querySelector('.study-task__controls select').dispatchEvent(new Event('change',{bubbles:true}))");
  await shot('inflight-editable-desktop');held=false;release();await wait("document.querySelector('.study-task__main > input').value==='Newer during request'");await synced();
  assert.equal(plan.tasks[0].title,'Newer during request');assert.equal(plan.tasks[0].status,'COMPLETED');assert.equal(plan.tasks[0].priority,'COULD');assert.equal(maxActive,1);
  checks.push('Newer title/priority/completion survive stale response; next versioned batch serializes');

  held=true;await fill('.study-task__main > input','Persist before leaving');await wait("document.querySelector('.study-savebar').textContent.includes('Đang đồng bộ')");
  await js("document.querySelector('a[href=\"/profile\"]').click()");await wait("document.querySelector('.study-notice')?.textContent.includes('Thay đổi chưa đồng bộ')");assert.equal(await js('location.pathname'),'/daily');
  held=false;release();await wait("location.pathname==='/profile'");assert.equal(plan.tasks[0].title,'Persist before leaving');await navigate('/daily?date='+date);
  checks.push('Route leave blocks only while unsynchronized, then proceeds automatically after successful batch');

  fail=true;await fill('.study-task__main > input','Keep through failure');await wait("document.querySelector('.daily-sync-status').textContent.includes('Thử đồng bộ lại')");
  const failed=putCount();await pause(1800);assert.equal(putCount(),failed);await fill('.study-task__main > input','Updated while offline');await pause(1100);assert.equal(putCount(),failed);
  await shot('error-desktop');fail=false;await click('Thử đồng bộ lại');await synced();assert.equal(plan.tasks[0].title,'Updated while offline');
  checks.push('Failure retains editable text, avoids retry loops, explicit retry saves latest draft');

  await fill('.study-task__main > input','');await wait("document.querySelector('.daily-sync-status').textContent.includes('Mỗi việc cần')");const invalid=putCount();await pause(900);assert.equal(putCount(),invalid);
  await fill('.study-task__main > input','Valid again');await synced();assert.equal(plan.tasks[0].title,'Valid again');checks.push('Invalid intermediate text stays local; valid correction resumes auto-sync');
  plan={...plan,version:plan.version+1,tasks:plan.tasks.map((t,n)=>n? t:{...t,title:'Other device edit'})};
  await fill('.study-task__main > input','My conflicting edit');await wait("document.querySelector('.daily-sync-status').textContent.includes('Bản máy chủ đã đổi')");const conflict=putCount();await pause(1200);assert.equal(putCount(),conflict);assert.equal(plan.tasks[0].title,'Other device edit');
  await js("document.querySelector('.study-date-trigger').click()");await wait("!!document.querySelector('.study-date-popover')");await js("document.querySelector('[data-calendar-date=\"2026-10-06\"]').click()");
  assert.equal(await js("new URLSearchParams(location.search).get('date')"),date);await key('Escape','Escape',27);
  await click('Tải bản trên máy chủ');await wait("!!document.querySelector('[data-slot=alert-dialog-content]')");await click('Giữ nguyên');await wait("!document.querySelector('[data-slot=alert-dialog-content]')");assert.equal(await js("document.querySelector('.study-task__main > input').value"),'My conflicting edit');
  await shot('conflict-desktop');await click('Tải bản trên máy chủ');await wait("!!document.querySelector('[data-slot=alert-dialog-content]')");await click('Xác nhận');await synced();
  assert.equal(await js("document.querySelector('.study-task__main > input').value"),'Other device edit');checks.push('409 never overwrites remote data; date stays; custom reload cancel retains local edit');

  loseResponse=true;await fill('.study-task__main > input','Committed with lost response');await wait("document.querySelector('.daily-sync-status').textContent.includes('Thử đồng bộ lại')");loseResponse=false;await click('Thử đồng bộ lại');await wait("document.querySelector('.daily-sync-status').textContent.includes('Bản máy chủ đã đổi')");
  assert.equal(plan.tasks[0].title,'Committed with lost response');await click('Tải bản trên máy chủ');await wait("!!document.querySelector('[data-slot=alert-dialog-content]')");await click('Xác nhận');await synced();checks.push('Unknown committed outcome retries safely into conflict, never blind version overwrite');

  await click('Nhìn lại ngày');await wait("!!document.querySelector('#daily-tomorrow')");await fill('#daily-tomorrow','Automatically persisted reflection');await key('Escape','Escape',27);await synced();assert.equal(plan.reviewTomorrow,'Automatically persisted reflection');
  await navigate('/daily?date='+date);assert.equal(await js("document.querySelector('.study-task__main > input').value"),'Committed with lost response');await click('Nhìn lại ngày');await wait("!!document.querySelector('#daily-tomorrow')");assert.equal(await js("document.querySelector('#daily-tomorrow').value"),'Automatically persisted reflection');await shot('reflection-desktop');await key('Escape','Escape',27);
  checks.push('Reflection closing continues synchronization; fresh document reopens stored fixture data');

  await openTaskMenu();await js("[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.includes('Đưa xuống sau')).click()");await synced();assert.equal(plan.tasks[0].id,uuid(21));
  await openTaskMenu();await js("[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.includes('Xóa việc')).click()");await wait("!!document.querySelector('[data-slot=alert-dialog-content]')");await click('Giữ nguyên');await wait("!document.querySelector('[data-slot=alert-dialog-content]')");assert.equal(plan.tasks.length,2);assert.equal(await js("document.activeElement.classList.contains('study-task__menu')"),true);
  await openTaskMenu();await js("[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.includes('Xóa việc')).click()");await wait("!!document.querySelector('[data-slot=alert-dialog-content]')");await click('Xóa việc');await synced();assert.equal(plan.tasks.length,1);
  assert.equal(await js("document.activeElement.getAttribute('data-slot')"),'checkbox');checks.push('Reorder auto-persists; destructive removal requires confirmation; cancel/focus retained and delete returns focus to remaining checkbox');

  for(const [w,h,dark] of [[1440,900,false],[1440,900,true],[768,1024,false],[768,1024,true],[390,844,false],[390,844,true],[320,568,false],[320,568,true],[320,360,true]]) {
    await viewport(w,h,dark);await js('window.scrollTo(0,0)');
    const sizes = await js(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,cy:r.y+r.height/2}},a=document.querySelector('.shell-account'),t=document.querySelector('.shell-icon-control'),c=document.querySelector('${completion}'),label=c.closest('label'),title=document.querySelector('.study-task__main > input');return {avatar:rect(a),theme:rect(t),image:rect(a.querySelector('[data-slot="account-avatar"]')),icon:rect(t.querySelector('svg')),checkbox:rect(c),hit:rect(label),title:rect(title),avatarBorder:getComputedStyle(a).borderColor,themeBorder:getComputedStyle(t).borderColor,avatarBackground:getComputedStyle(a).backgroundColor,themeBackground:getComputedStyle(t).backgroundColor}})()`);
    assert.equal(sizes.avatar.w,44);assert.equal(sizes.avatar.h,44);assert.deepEqual(sizes.avatar,sizes.theme);assert.equal(sizes.image.w,42);assert.equal(sizes.icon.w,20);
    assert.equal(sizes.avatarBorder,sizes.themeBorder);assert.equal(sizes.avatarBackground,sizes.themeBackground);
    assert.equal(sizes.checkbox.w,20);assert.equal(sizes.checkbox.h,20);assert.equal(sizes.hit.w,44);assert.equal(sizes.hit.h,44);assert.ok(Math.abs(sizes.checkbox.cy-sizes.title.cy)<1);
    await shot(`polish-${w}x${h}-${dark?'dark':'light'}`);checks.push({name:`${w}x${h}: equal visible header frames, centered checkbox/tick and title`,sizes});
    await viewport(w,h,dark);await js('window.scrollTo(0,document.body.scrollHeight)');await shot(`day-synced-${w}x${h}-${dark?'dark':'light'}`);
    assert.ok(await js('document.documentElement.scrollWidth<=innerWidth'));assert.ok(await js("(()=>{const b=document.querySelector('.study-savebar').getBoundingClientRect();return b.left>=0&&b.right<=innerWidth})()"));
    await click('Nhìn lại ngày');await wait("!!document.querySelector('#daily-tomorrow')");await shot(`reflection-${w}x${h}`);assert.ok(await js("(()=>{const b=document.querySelector('.daily-reflection-dialog').getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight+1})()"));
    for(let n=0;n<8;n++)await key('Tab','Tab',9);assert.ok(await js("document.querySelector('.daily-reflection-dialog').contains(document.activeElement)"));await key('Escape','Escape',27);
    fail=true;await fill('.study-task__main > input',`Retained failure ${w} ${h} ${dark?'dark':'light'}`);await wait("document.querySelector('.daily-sync-status').textContent.includes('Thử đồng bộ lại')");await js('window.scrollTo(0,document.body.scrollHeight)');await shot(`day-error-${w}x${h}`);
    if(h<500){
      assert.equal(await js("getComputedStyle(document.querySelector('.study-savebar')).position"),'static');
      await js("document.querySelector('.study-task__main > input').scrollIntoView({block:'center'});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
      assert.ok(await js("(()=>{const e=document.querySelector('.study-task__main > input'),b=e.getBoundingClientRect();return b.top>=64&&b.bottom<=innerHeight&&document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===e})()"));await shot('short-screen-editing-reachable');
    }
    fail=false;await click('Thử đồng bộ lại');await synced();
    checks.push(`${w}x${h} ${dark?'dark':'light'}: status/error/retry, bounded reflection/focus and responsive composition`);
  }
  await viewport(390,844,true);await js("document.querySelector('.shell-icon-control').focus()");await key('Enter','Enter',13);await wait("!document.documentElement.classList.contains('dark')");
  assert.equal(await js("document.activeElement.getAttribute('aria-label')"),'Đổi giao diện');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await js("getComputedStyle(document.querySelector('.shell-icon-control svg')).animationName"),'none');checks.push('Header theme keyboard activation/focus and automatic reduced motion preserved');
  holdSubmit=true;await click('Nộp kế hoạch');await wait(`document.querySelector('${completion}').disabled`);
  assert.ok(releaseSubmit);const priorStatus=plan.tasks[0].status;await js(`document.querySelector('${completion}').click()`);await pause(900);assert.equal(plan.tasks[0].status,priorStatus);await shot('checkbox-disabled-during-explicit-submit');
  holdSubmit=false;releaseSubmit();await wait(`!document.querySelector('${completion}').disabled`);await synced();checks.push('Explicit Submit disables completion; automatic saves keep completion editable; no status mutation during locked operation');
  await viewport(768,1024);await navigate('/daily/week?weekStart='+date);await fill('#week-reflection','Auto weekly reflection');await synced();assert.equal(week.reflection,'Auto weekly reflection');assert.equal(await js("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Lưu nhìn lại')"),false);
  held=true;await fill('#week-next','Sent next week');await wait("document.querySelector('.study-savebar').textContent.includes('Đang đồng bộ')");await fill('#week-next','Later next week');held=false;release();await synced();assert.equal(week.nextWeekChanges,'Later next week');await shot('week-tablet');
  await viewport(320,568,true);await shot('week-mobile-dark');await navigate('/daily/week?weekStart='+date);assert.equal(await js("document.querySelector('#week-next').value"),'Later next week');checks.push('Weekly text auto-syncs/rebases/reopens without Save or changes to day statistics');

  plan={...seed(),tasks:[]};missing=true;await navigate('/daily?date='+date);const empty=putCount();await pause(1200);assert.equal(putCount(),empty);await click('Nộp kế hoạch');await synced();assert.ok(plan.firstSubmittedAt);assert.equal(plan.tasks.length,0);checks.push('Empty visit creates no plan; explicit Submit creates then submits empty plan');
  assert.equal(maxActive,1);assert.equal(requests.filter(r=>r.path.endsWith('/submit')).length,2);assert.equal(requests.some(r=>r.path.endsWith('/sharing')&&r.method==='PUT'),false);assert.deepEqual(errors,[]);assert.deepEqual(nativeDialogs,[]);
  const candidateEnd=await manifest();assert.deepEqual(candidateStart,candidateEnd);await writeFile(join(dir,'results.json'),JSON.stringify({candidateStart,candidateEnd,checks,requests,errors,nativeDialogs,maxActive,limits:'Synthetic auth/API only. External requests blocked; not SQL, authorization, offline recovery or live multiuser proof.'},null,2));
  console.log(JSON.stringify({dir,checks:checks.length,maxActive}));
} catch(error) {await writeFile(join(dir,'failure.json'),JSON.stringify({message:error.stack,checks,requests,errors,nativeDialogs,candidateStart},null,2));if(call)await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot')).data,'base64')).catch(()=>{});console.error(dir,error);process.exitCode=1;}
finally {socket?.close();chrome.kill('SIGTERM');}
