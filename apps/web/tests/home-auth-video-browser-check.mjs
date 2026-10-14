// Real routes + local original MP4s, intercepted synthetic API only. No .env or live auth.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

const baseline=process.argv.includes('--before');
const authTailOnly=process.argv.includes('--auth-tail-only');
const statesOnly=process.argv.includes('--states-only')||authTailOnly;
const dir=await mkdtemp(join(tmpdir(),`humg-home-auth-${baseline?'before':'after'}-`));
const root=fileURLToPath(new URL('..',import.meta.url));
const old=new Map();
if(baseline)for(const path of ['src/features/home/components/home-hero-section.tsx','src/features/home/components/home-hero-section.css','src/layouts/welcome-layout.tsx']) {
  old.set(join(root,path),execFileSync('git',['show',`b7a8f66:apps/web/${path}`],{cwd:root,encoding:'utf8'}));
}
const host=await createServer({root,configFile:false,envDir:false,cacheDir:join(dir,'vite-cache'),
  define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('/api/v1')},
  resolve:{alias:{'@':join(root,'src')}},
  plugins:[{name:'owned-before-snapshot',enforce:'pre',load(id){return old.get(id.split('?')[0]);}},react(),tailwind()],
  server:{host:'127.0.0.1',port:0}});
await host.listen();const web='http://127.0.0.1:'+host.httpServer.address().port;
const chrome=spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless','--no-sandbox','--disable-background-timer-throttling','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank']);
const screenshots=[],geometry=[],checks=[],errors=[],requests=[],playback=[];
let socket,call,js,mediaMode='normal',dataMode='normal';const held=[];
try {
  const endpoint=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Chrome timeout')),30000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});chrome.on('error',reject);});
  const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);
  let serial=0;const pending=new Map();
  call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const reply=(e,status,body,type='application/json')=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(type==='application/json'?JSON.stringify(body):body).toString('base64')});
  const respond=async e=>{
    const u=new URL(e.request.url),path=u.pathname;requests.push({path,method:e.request.method,mode:mediaMode});
    if(path.endsWith('.mp4')&&mediaMode==='hold') {held.push(e);return;}
    if(path.endsWith('.mp4')&&mediaMode==='fail')return reply(e,503,'Synthetic media unavailable','text/plain');
    if(u.origin===web&&!path.startsWith('/api/'))return call('Fetch.continueRequest',{requestId:e.requestId});
    if(path.endsWith('/users/me')||path.endsWith('/auth/refresh'))return reply(e,401,{});
    if(e.request.method!=='GET')return reply(e,503,{title:'Synthetic auth failure',detail:'Synthetic failure; no real account action.'});
    if(path.endsWith('/documents/metadata'))return reply(e,200,{subjects:[],categories:[],tags:[]});
    if(path.startsWith('/api/'))return reply(e,dataMode==='error'?503:200,dataMode==='error'?{title:'Synthetic content failure'}:{content:[],totalElements:0,totalPages:0,number:0,size:10});
    return reply(e,404,'','text/plain');
  };
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);else if(m.method==='Fetch.requestPaused')void respond(m.params).catch(e=>errors.push(e.message));};
  js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,timeout:20000});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const wait=async expression=>{for(let n=0;n<500;n++){if(await js(`Boolean(${expression})`))return;await delay(30);}throw Error('Timeout '+expression);};
  const resize=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const key=async(key,code,text)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code,text});await call('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});};
  const fill=(selector,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  const shot=async name=>{assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'no horizontal page overflow');const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
  const nav=async(route,theme='light',reduced=false)=>{
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme},{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    await call('Page.navigate',{url:web+route});await wait('!!document.querySelector("h1")&&!document.querySelector("#startup-loader")&&!document.querySelector("#root").inert');
    await wait(`document.documentElement.classList.contains('dark')===${theme==='dark'}`);await delay(750);
  };
  const selected=`document.querySelector('.cinematic-scene [data-scene="'+(document.documentElement.classList.contains('dark')?'night':'day')+'"] video')`;
  const media=selector=>js(`(()=>{const v=${selector};return {src:v.currentSrc,time:v.currentTime,duration:v.duration,paused:v.paused,width:v.videoWidth,height:v.videoHeight,frames:v.getVideoPlaybackQuality().totalVideoFrames,loop:v.loop,controls:v.controls}})()`);
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});
  for(const [width,height] of (statesOnly?[]:[[320,568],[390,844],[768,900],[1280,900]]))for(const theme of ['light','dark'])for(const route of ['/','/login','/register']){
    await resize(width,height);await nav(route,theme);
    const g=await js(`(()=>{const form=document.querySelector(${JSON.stringify(route==='/'?'.home-hero__content':'.welcome-layout__content')}),v=document.querySelector('.home-hero video'),scene=document.querySelector('.cinematic-scene');return{route:${JSON.stringify(route)},theme:${JSON.stringify(theme)},width:innerWidth,height:innerHeight,form:form.getBoundingClientRect().toJSON(),video:v?.getBoundingClientRect().toJSON(),scene:scene?.getBoundingClientRect().toJSON(),videos:document.querySelectorAll('video').length}})()`);
    assert.ok(g.form.x>=0&&g.form.right<=width+1);geometry.push(g);
    if(!baseline) {
      if(route==='/') {
        assert.equal(g.videos,2);assert.ok(g.video.x>=0&&g.video.right<=width+1);
        assert.ok(width>=1024?g.video.x>=g.form.right:g.video.y>=g.form.bottom);
        assert.ok(await js('!document.querySelector(".home-hero video[controls]")&&!document.querySelector(".home-hero figcaption")'));
        assert.ok(await js('[...document.querySelectorAll(".home-hero video")].every(v=>v.muted&&v.loop&&v.playsInline&&v.tabIndex===-1)'));
      } else {assert.equal(g.videos,width>=1024?2:0);assert.ok(await js('!document.body.innerText.includes("Tắt nền động")&&!document.body.innerText.includes("Bật nền động")'));if(width>=1024)assert.ok(route==='/register'?g.form.x>width/2:g.form.right<width/2);}
      if(route==='/'||width>=1024) {
        await wait(`!${selected}.paused&&${selected}.videoWidth>0`);const a=await media(selected);await delay(160);const b=await media(selected);assert.ok(b.time>a.time&&b.frames>a.frames);playback.push({route,theme,...b});
        assert.ok(await js(`${selected}.src.endsWith(${JSON.stringify(theme==='dark'?'anime-night.mp4':'anime-day.mp4')})||${selected}.src.startsWith('blob:')`));
      }
    }
    await shot(`${route==='/'?'home':route.slice(1)}-${width}x${height}-${theme}`);
  }
  if(!statesOnly)checks.push('24 actual route/theme/size captures:Home copy/search left + ambient scene right desktop,stacked mobile;auth original left login/right registration scene desktop,no scene mobile;contained forms,no page overflow,no player controls/captions/auth motion toggle. Both real MP4s decode with advancing frames/time.');
  if(!baseline) {
    if(!authTailOnly){
    await resize(1280,900);await nav('/');await wait(`!${selected}.paused`);
    await js('window.outgoingHome='+selected+';[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Đổi giao diện").click()');
    await wait('document.querySelector(".home-hero .cinematic-scene").dataset.theme==="dark"&&window.outgoingHome.paused');await wait(`!${selected}.paused&&${selected}.videoWidth>0`);await shot('home-theme-switch-playing-dark');await js('localStorage.removeItem("olympic-theme")');
    await resize(390,844);await nav('/');await fill('#home-document-search','  A+B & Giải tích  ');await js('document.querySelector(".home-hero form").requestSubmit()');await wait('location.pathname==="/documents"');assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),'A+B & Giải tích');
    await nav('/');await js('document.querySelector(".home-study-notebook [role=tab]").focus()');await key('End',35);await key('Enter',13,'\r');await wait('document.activeElement.getAttribute("role")==="tab"&&document.activeElement.getAttribute("aria-selected")==="true"');
    checks.push('Theme swap pauses outgoing Home scene and plays correct original source;trimmed/encoded document search and notebook End/Enter retain existing behavior. Decorative videos have no keyboard stops.');
    mediaMode='hold';await nav('/');assert.ok(held.length>0);assert.ok(await js('!document.querySelector("#root").inert&&!document.querySelector("#startup-loader")'));
    await fill('#home-document-search','still usable');await shot('home-media-pending-390-light');mediaMode='normal';for(const e of held.splice(0))await call('Fetch.continueRequest',{requestId:e.requestId});await wait(`!${selected}.paused&&${selected}.videoWidth>0`);
    mediaMode='fail';await nav('/');await wait('document.querySelector(".home-hero .cinematic-scene").dataset.playing==="false"');assert.ok(requests.some(r=>r.path.endsWith('.mp4')&&r.mode==='fail'));assert.ok(await js('[...document.querySelectorAll(".home-hero .cinematic-scene img")].every(i=>i.complete&&i.naturalWidth>0)'));await shot('home-media-error-390-light');mediaMode='normal';
    const blocker=await call('Page.addScriptToEvaluateOnNewDocument',{source:'HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException("Synthetic blocked autoplay","NotAllowedError"))}'});
    await nav('/');assert.ok(await js('[...document.querySelectorAll(".home-hero video")].every(v=>v.paused&&v.dataset.ready!=="true")'));await shot('home-blocked-autoplay-390-light');await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocker.identifier});
    checks.push('Held Home media does not register a startup readiness task:poster and typing available before release;real503 media and simulated autoplay rejection retain decoded posters without player/error clutter.');
    for(const [width,height] of [[320,280],[640,320]])for(const theme of ['light','dark'])for(const route of ['/','/register']){
      await resize(width,height);await nav(route,theme);if(route==='/register'){
        await js('document.querySelector("form").requestSubmit()');await wait('!!document.querySelector("[aria-invalid=true]")');
        await js('document.querySelector("button[type=submit]").scrollIntoView({block:"center"});document.querySelector("button[type=submit]").focus()');
        const r=await js('document.activeElement.getBoundingClientRect().toJSON()');assert.ok(r.y>=0&&r.bottom<=height+1&&r.height>=43.95);
      }else await js('document.querySelector(".home-hero__window").scrollIntoView({block:"center"})');
      await shot(`${route==='/'?'home':'register-validation'}-${width}x${height}-${theme}`);
    }
    for(const theme of ['light','dark'])for(const route of ['/forgot-password','/reset-password','/verify-email']) {
      await resize(390,844);await nav(route,theme);assert.equal(await js('document.querySelectorAll(".cinematic-scene").length'),0);await shot(route.slice(1)+'-390-'+theme);
    }
    await resize(390,360);await nav('/login');await fill('#login-password','synthetic-fixture-password');await js('document.querySelector(".lbi-eye").focus()');await key('Enter',13,'\r');assert.equal(await js('document.querySelector("#login-password").type'),'text');
    await js('document.querySelector(".login-recovery-link").focus()');await key('Enter',13,'\r');await wait('location.pathname==="/forgot-password"');
    assert.ok(!requests.some(r=>r.method==='POST'&&!r.path.endsWith('/auth/refresh')),'no account mutations');
    checks.push('320x280/640x320 short layouts:Home imagery scrollable;registration validation and44px submit reachability;recovery/reset/verify routes mobile both themes,password reveal and recovery keyboard;no account submissions.');
    }
    await resize(1280,900);await nav('/login');await wait(`!${selected}.paused&&${selected}.videoWidth>0`);
    await js('window.outgoingAuth='+selected+';[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Đổi giao diện").click()');await wait('document.querySelector(".cinematic-scene").dataset.theme==="dark"&&window.outgoingAuth.paused');await wait(`!${selected}.paused&&${selected}.videoWidth>0`);await shot('auth-theme-switch-playing-dark');await js('localStorage.removeItem("olympic-theme")');
    await fill('#login-identifier','synthetic-retained-identity');await js('window.resizedAuthVideo='+selected+';void 0');
    await resize(390,360);await wait('!document.querySelector(".cinematic-scene")&&window.resizedAuthVideo.paused');
    assert.equal(await js('document.querySelector("#login-identifier").value'),'synthetic-retained-identity');assert.equal(await js('document.activeElement.id'),'login-identifier');await shot('auth-viewport-shrink-390x360-dark');
    await resize(1280,480);await wait(`!!document.querySelector('.cinematic-scene')&&!${selected}.paused`);
    await js('document.querySelector("form").requestSubmit()');await wait('document.querySelector("#login-password").getAttribute("aria-invalid")==="true"');
    await js('document.querySelector("button[type=submit]").scrollIntoView({block:"center"})');await shot('auth-short-validation-1280x480-dark');
    checks.push('Desktop-to390x360 shrink removes/pauses auth background while retaining identifier/input focus;desktop-short validation/actions remain page-scroll reachable. Viewport emulation,not a physical virtual keyboard.');
    for(const route of ['/login','/']){
      await resize(1280,900);await nav(route,'dark',true);assert.ok(await js('[...document.querySelectorAll(".cinematic-scene video")].every(v=>v.paused&&!v.hasAttribute("src"))'));await shot((route==='/'?'home':'auth')+'-reduced-desktop-dark');
    }
    await nav('/');await wait(`!${selected}.paused`);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait('document.querySelector(".cinematic-scene").dataset.ready==="false"&&[...document.querySelectorAll(".cinematic-scene video")].every(v=>v.paused)');await shot('home-live-reduced-preference');
    mediaMode='fail';await nav('/login');await wait('document.querySelector(".cinematic-scene").dataset.ready==="false"');assert.ok(await js('[...document.querySelectorAll(".cinematic-scene img")].every(i=>i.complete&&i.naturalWidth>0)'));await shot('auth-failed-media-desktop-light');mediaMode='normal';
    await resize(390,844);const start=requests.length;await nav('/login');assert.equal(requests.slice(start).filter(r=>r.path.endsWith('.mp4')).length,0);
    await nav('/not-a-real-route');assert.ok(await js('!!document.querySelector(".welcome-layout__context")&&!document.querySelector(".cinematic-scene")'));
    checks.push('Auth has no motion-toggle UI;theme swap pauses old source;Home reacts to a changed reduced preference;Home/auth initial reduced motion uses decoded static posters without MP4 sources;auth source failure keeps readable form/poster,mobile requests no MP4;404 remains unchanged.');
  }
  assert.deepEqual(errors,[]);
  await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,geometry,playback,requests,errors,limits:['Actual Chromium routes/StrictMode/HTML with synthetic API and network failures;local original media streamed/decoded,not fake video.','No physical phone/WebKit/virtual-keyboard/screen-reader speech/live auth/Turnstile or production performance claim.']},null,2));
  console.log(JSON.stringify({evidence:dir,checks:checks.length,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,geometry,playback,errors,requests,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}
finally {socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},1500).unref();await host.close();}
