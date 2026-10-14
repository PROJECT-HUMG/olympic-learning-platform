// Actual startup HTML/owners, controlled TanStack Query/tasks. No live data.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
let web=process.env.PRELOADER_WEB_URL;
const dir=await mkdtemp(join(tmpdir(),'humg-preloader-'));
const checks=[],screenshots=[],errors=[],geometry=[],timings=[];
// Own an ephemeral host by default. Never load operator Vite config or .env.
const host=web?null:await createServer({
  root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,envDir:false,
  cacheDir:join(dir,'vite-cache'),define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('/api/v1')},
  resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}},
  plugins:[{name:'owned-preloader-fixture',transformIndexHtml(html,ctx){return (ctx.originalUrl??ctx.path).split('?')[0]==='/__preloader_proof__'?html.replace('/src/main.tsx','/tests/fixtures/preloader.tsx'):html;}},react(),tailwind()],
  server:{host:'127.0.0.1',port:0},
});
if(host){await host.listen();web='http://127.0.0.1:'+host.httpServer.address().port;}
const chrome=spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',['--headless','--no-sandbox','--disable-background-timer-throttling','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank']);
let socket,call,js;
try {
  const endpoint=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Chrome timeout')),30000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});chrome.on('error',reject);});
  const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);let serial=0;const pending=new Map();
  call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);else if(m.method==='Fetch.requestPaused'){const e=m.params,u=new URL(e.request.url);const local=u.origin===web&&!u.pathname.startsWith('/api/');const body={content:[],totalPages:0,totalElements:0};void(local?call('Fetch.continueRequest',{requestId:e.requestId}):call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:u.pathname.endsWith('/users/me')||u.pathname.endsWith('/auth/refresh')?401:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')})).catch(e=>errors.push(e.message));}};
  js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const wait=async expression=>{for(let n=0;n<400;n++){if(await js(`Boolean(${expression})`))return;await delay(20);}throw Error('Timeout '+expression);};
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.loadingFrames=[];requestAnimationFrame(function sample(){const l=document.querySelector('#startup-loader'),logo=l?.querySelector('.loading-screen__logo');window.loadingFrames.push({time:performance.now(),present:!!l,inert:!!document.querySelector('#root')?.inert,opacity:l?Number(getComputedStyle(l).opacity):null,logo:logo?Number(getComputedStyle(logo).opacity):null});if(window.loadingFrames.length<1000)requestAnimationFrame(sample)})`});
  const resize=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const nav=async(reduced=false)=>{await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});await call('Page.navigate',{url:web+'/__preloader_proof__?case='+Math.random()});await wait('window.preloaderProof?.setups===2&&!!document.querySelector("main")&&!!document.querySelector("#startup-loader")');};
  const shot=async name=>{assert.ok(await js('document.documentElement.scrollWidth<=innerWidth'));const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
  const theme=t=>js(`document.documentElement.classList.toggle('dark',${t==='dark'});document.documentElement.style.colorScheme=${JSON.stringify(t)}`);
  for(const [width,height] of [[320,568],[390,844],[768,900],[1280,900],[320,280]])for(const t of ['light','dark']) {
    await resize(width,height);await nav();await theme(t);await delay(220);
    assert.ok(await js('document.querySelector("#root").inert&&!document.querySelector("[role=progressbar],.loading-screen__percent,.loading-screen__curtain")'));
    assert.ok(await js('getComputedStyle(document.querySelector(".loading-screen__message")).opacity==="1"'));
    await js('document.querySelector(".loading-screen__help a").focus()');
    const g=await js(`({width:innerWidth,height:innerHeight,theme:${JSON.stringify(t)},help:document.querySelector('.loading-screen__help a').getBoundingClientRect().toJSON(),logo:document.querySelector('.loading-screen__logo').getBoundingClientRect().toJSON(),status:document.querySelector('#startup-loader').getAttribute('role')})`);assert.ok(g.help.height>=44&&g.help.y>=0&&g.help.bottom<=height+1);geometry.push(g);await shot(`waiting-${width}x${height}-${t}`);
    await js('window.preloaderProof.finishTask()');await delay(30);assert.ok(await js('document.querySelector("#root").inert'),'query still genuinely pending');
    await js('window.loadingRelease=performance.now();window.preloaderProof.resolve()');await wait('!document.querySelector("#root").inert');const elapsed=await js('performance.now()-window.loadingRelease');timings.push({width,height,theme:t,unlockMs:elapsed});assert.ok(elapsed<500,'no minimum/completion hold');assert.equal(await js('document.activeElement.id'),'public-main');
    await wait('!document.querySelector("#startup-loader")');assert.ok(await js('getComputedStyle(document.body).overflow!=="hidden"'));await shot(`ready-${width}x${height}-${t}`);
    if(width===390&&t==='dark'){await delay(40);const frames=await js('window.loadingFrames');assert.ok(frames.some(f=>!f.inert&&f.opacity>0&&f.opacity<1),'actual nonblocking exit frames');await writeFile(join(dir,'opacity-frames.json'),JSON.stringify(frames,null,2));}
  }
  checks.push('Actual initial HTML + StrictMode replacement:320/390/768/1280/320x280 light-dark,status/reload readable,44px focus/short scroll,no numeric fake progress/curtains;task alone does not bypass pending query;ready unlock<500ms then180ms opacity-only exit,focus transfers only from disappearing loader,body scroll restored');
  await resize(390,844);await nav();await theme('dark');await js('Object.defineProperty(document.fonts,"status",{configurable:true,get:()=>"loading"});window.preloaderProof.reject()');await wait('!!document.querySelector("[role=alert]")&&!document.querySelector("#startup-loader")');assert.ok(await js('!document.querySelector("#root").inert'));await shot('error-visible-with-unfinished-task-font');
  await js('document.querySelector("[role=alert] button").focus()');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',windowsVirtualKeyCode:13,text:'\r'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',windowsVirtualKeyCode:13});await wait('!document.querySelector("[role=alert]")');assert.ok(await js('!document.querySelector("#startup-loader")&&!document.querySelector("#root").inert'));await js('window.preloaderProof.resolve()');await wait('document.body.innerText.includes("Dữ liệu thử nghiệm đã sẵn sàng")');
  checks.push('Terminal actual Query error releases overlay despite unfinished task/fonts;feature error/retry keyboard reachable,retry has real pending→success without startup replay');
  await js('window.preloaderProof.showRoute(true)');await wait('!!document.querySelector(".loading-screen--route")');await delay(220);await shot('route-loading-dark');await js('window.oldRouteLogo=document.querySelector(".loading-screen--route .loading-screen__logo");window.preloaderProof.showRoute(false)');await wait('!document.querySelector(".loading-screen--route")');assert.equal(await js('window.preloaderProof.tweens(window.oldRouteLogo)'),0);assert.equal(await js('window.oldRouteLogo.style.opacity'),'');
  await js('window.preloaderProof.showRoute(true)');await wait('!!document.querySelector(".loading-screen--route")');await js('window.preloaderProof.showRoute(false)');await wait('!document.querySelector(".loading-screen--route")');
  await nav();await js('window.cancelledLogo=document.querySelector("#startup-loader .loading-screen__logo");window.preloaderProof.unmount()');await wait('!document.querySelector("#startup-loader")&&!document.querySelector("#root").inert');assert.equal(await js('window.preloaderProof.tweens(window.cancelledLogo)'),0);
  await nav();await js('window.preloaderProof.finishTask();window.preloaderProof.resolve()');await wait('!document.querySelector("#root").inert');await js('window.preloaderProof.unmount()');await wait('!document.querySelector("#startup-loader")');
  checks.push('Route fallback mount/unmount/reopen and interrupted startup pending/exit cleanup:zero detached logo tweens/restored opacity,no orphan overlay,inert root or scroll lock');
  await nav(true);await theme('light');assert.ok(await js('getComputedStyle(document.querySelector(".loading-screen__logo")).opacity==="1"&&document.querySelector(".loading-screen__writing").getAnimations({subtree:true}).length===0'));await shot('reduced-waiting-390-light');await js('window.preloaderProof.finishTask();window.preloaderProof.resolve()');await wait('!document.querySelector("#startup-loader")');await js('window.preloaderProof.showRoute(true)');await wait('!!document.querySelector(".loading-screen--route")');assert.equal(await js('window.preloaderProof.tweens(document.querySelector(".loading-screen--route .loading-screen__logo"))'),0);await shot('reduced-route-390-light');
  await nav();await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait('matchMedia("(prefers-reduced-motion:reduce)").matches&&getComputedStyle(document.querySelector(".loading-screen__logo")).opacity==="1"');assert.equal(await js('window.preloaderProof.tweens(document.querySelector(".loading-screen__logo"))'),0);await js('window.preloaderProof.finishTask();window.preloaderProof.resolve()');await wait('!document.querySelector("#startup-loader")');
  checks.push('Reduced motion initially and changed while pending:static logo/underline,no fade delay or route animation,immediate removal when ready');
  await call('Emulation.setEmulatedMedia',{features:[]});await call('Page.navigate',{url:web+'/'});await wait('!!document.querySelector(".home-study-notebook")&&!document.querySelector("#startup-loader")');assert.equal(await js('document.querySelectorAll(".home-video,.home-videos, .home-hero video").length'),0);await shot('actual-home-startup-complete');
  assert.deepEqual(errors,[]);await writeFile(join(dir,'results.json'),JSON.stringify({checks,screenshots,geometry,timings,errors,limits:['Owned actual-HTML fixture/actual loading/query/GSAP owners plus real Home route;synthetic API failures,data and task/font holds only','Chromium emulation/fallback fonts,not physical WebKit/screen-reader speech/production performance or live backend proof']},null,2));console.log(JSON.stringify({evidence:dir,checks:checks.length,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,errors,geometry,timings,body:js?await js('document.body.innerText').catch(()=>null):null},null,2));throw e;}finally{socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL')},1500).unref();await host?.close();}
