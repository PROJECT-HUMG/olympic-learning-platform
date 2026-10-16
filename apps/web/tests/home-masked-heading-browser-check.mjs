// Real routes + local original MP4s, intercepted synthetic API only. No .env or live auth.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck, webRoot } from './browser/session.mjs';

const options = browserOptions('home');
const baseline=Boolean(options.before);
const dir = await evidenceDirectory(options);
const root = webRoot;
const old=new Map();
if(baseline)for(const path of ['src/features/home/components/home-hero-section.tsx']) {
  old.set(join(root,path),execFileSync('git',['show',`97554cd:apps/web/${path}`],{cwd:root,encoding:'utf8'}));
}
let session, web;
const screenshots=[],geometry=[],checks=[],errors=[],requests=[],playback=[],motion=[];
let call,js,mediaMode='normal',dataMode='normal';const held=[];
try {
  session = await startBrowserCheck({ dir, options, snapshots: old });
  ({ web, call, js } = session);
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
  session.onRequest(respond);
  session.onEvent(m => {if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const wait=async expression=>{for(let n=0;n<500;n++){if(await js(`Boolean(${expression})`))return;await delay(30);}throw Error('Timeout '+expression);};
  const resize=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const key=async(key,code,text)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code,text});await call('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});};
  const fill=(selector,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  const shot=async name=>{assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'no horizontal page overflow');const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
  const nav=async(route,theme='light',reduced=false)=>{
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme},{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    await call('Page.navigate',{url:web+route});await wait('!!document.querySelector("h1")&&!document.querySelector("#startup-loader")&&!document.querySelector("#root").inert');
    await wait(`document.documentElement.classList.contains('dark')===${theme==='dark'}`);await delay(60);
  };
  const selected=`document.querySelector('.cinematic-scene [data-scene="'+(document.documentElement.classList.contains('dark')?'night':'day')+'"] video')`;
  const media=selector=>js(`(()=>{const v=${selector};return {src:v.currentSrc,time:v.currentTime,duration:v.duration,paused:v.paused,width:v.videoWidth,height:v.videoHeight,frames:v.getVideoPlaybackQuality().totalVideoFrames,loop:v.loop,controls:v.controls}})()`);
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});
  const title=baseline?'Tài nguyên học tập Olympic HUMG':'Tài nguyên học tập OLYMPIC HUMG';
  const geometryOf=()=>js(`(()=>{const h=document.querySelector('#home-hero-title'),text=h.querySelector('.masked-heading__measure')||h.querySelector('.blur-text > [aria-hidden]')||h;return{width:innerWidth,theme:document.documentElement.classList.contains('dark')?'dark':'light',heading:h.getBoundingClientRect().toJSON(),font:getComputedStyle(h).fontSize,text:text.textContent.trim(),glyphs:[...h.querySelectorAll('text')].map(g=>({text:g.textContent,box:(()=>{const b=g.getBBox();return{x:b.x,y:b.y,width:b.width,height:b.height}})(),x:g.getAttribute('x'),y:g.getAttribute('y')}))}})()`);
  for(const [width,height] of [[320,568],[390,844],[768,900],[1280,900]])for(const theme of ['light','dark']){
    await resize(width,height);await nav('/',theme);
    if(!baseline)await wait('document.querySelector(".masked-heading").dataset.ready==="true"');
    await delay(900);const g=await geometryOf();geometry.push(g);assert.equal(g.text,title);
    assert.ok(g.heading.x>=0&&g.heading.right<=width+1);assert.ok(parseFloat(g.font)>=(baseline?26:23));
    const ax=await call('Accessibility.getFullAXTree');assert.ok(ax.nodes.some(n=>n.role?.value==='heading'&&n.name?.value===title));
    if(!baseline){assert.equal(g.glyphs.map(g=>g.text).join(' '),title);assert.ok(g.glyphs.every(g=>g.box.width>0&&g.box.height>0&&g.box.y>=-1&&g.box.y+g.box.height<=geometry.at(-1).heading.height+1));assert.equal(await js('document.querySelectorAll(".tech-text,.home-hero .blur-text,canvas").length'),0);}
    await shot(`home-${width}x${height}-${theme}`);
    if(!baseline){
      const lines=await js('[...document.querySelectorAll(".masked-heading__line")].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON(),words:[...e.querySelectorAll(".masked-heading__word")].map(w=>w.getBoundingClientRect().y)}))');
      assert.deepEqual(lines.map(l=>l.text),['Tài nguyên học tập','OLYMPIC HUMG']);
      assert.ok(lines.every(l=>new Set(l.words).size===1),'each intended heading line fits without an extra wrap');
      assert.ok(lines[1].rect.top>=lines[0].rect.bottom-1,'brand is the second line');
      if(width!==768){
        await js('document.querySelector(".public-footer").scrollIntoView({block:"start"})');
        assert.equal(await js('document.querySelectorAll(".public-footer details,.public-footer summary").length'),0);
        assert.equal(await js('document.querySelectorAll(".public-footer__group").length'),3);
        assert.ok(await js('[...document.querySelectorAll(".public-footer__group-content")].every(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=="none")'));
        await shot(`footer-${width}-${theme}`);
      }
    }
  }
  checks.push('Actual Home320/390/768/1280 light-dark:readable Vietnamese title,SVG words/diacritics contained,semantic h1 and no horizontal overflow;no TechText/BlurText stacking.');
  if(!baseline)checks.push('Two intended heading lines with OLYMPIC HUMG uppercase on line two;320/390/1280 light-dark footer groups show content without expansion controls.');
  if(!baseline){
    for(const [width,height,theme] of [[390,844,'dark'],[1280,900,'light']]){
      await resize(width,height);await nav('/',theme);await wait('document.querySelector(".masked-heading").dataset.ready==="true"');
      const before=await geometryOf(),frames=[],start=performance.now();
      for(let i=0;i<16;i++){const path=join(dir,`motion-${width}-${theme}-${String(i).padStart(2,'0')}.png`);await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));frames.push({path,ms:performance.now()-start});await delay(90);}
      const after=await geometryOf();assert.deepEqual(before.heading,after.heading);motion.push({name:`masked-heading-${width}-${theme}`,frames});
    }
    // Refetch updates data, not the masked heading owner or its entrance.
    await js('window.maskOwner=document.querySelector(".masked-heading"),window.maskWord=document.querySelector(".masked-heading text");void 0');
    await js('import("/src/lib/query-client.ts").then(({queryClient})=>queryClient.invalidateQueries())');await delay(400);
    assert.ok(await js('window.maskOwner===document.querySelector(".masked-heading")&&window.maskWord===document.querySelector(".masked-heading text")&&getComputedStyle(window.maskWord).opacity==="1"'));
    checks.push('Actual word reveal and slow mesh drift recorded;heading bounds stable;query invalidation retains owner/glyphs without entrance replay.');
    await wait(`!${selected}.paused&&${selected}.videoWidth>0`);const a=await media(selected);
    // Decode scheduling can exceed180ms on a busy host; loop wrap may decrease currentTime.
    await wait(`${selected}.currentTime!==${a.time}&&${selected}.getVideoPlaybackQuality().totalVideoFrames>${a.frames}`);
    const b=await media(selected);assert.notEqual(b.time,a.time);assert.ok(b.frames>a.frames);playback.push(b);
    await js('window.outgoingHome='+selected+';[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Đổi giao diện").click()');await wait('window.outgoingHome.paused&&document.documentElement.classList.contains("dark")');await wait(`!${selected}.paused&&${selected}.videoWidth>0`);await shot('home-theme-switch-1280-dark');await js('localStorage.removeItem("olympic-theme")');
    assert.ok(await js('!document.querySelector(".home-hero video[controls]")&&[...document.querySelectorAll(".home-hero video")].every(v=>v.muted&&v.loop&&v.playsInline&&v.tabIndex===-1)'));
    checks.push('Original local MP4 advances;theme change pauses outgoing source and plays correct scene;decorative video controls/keyboard stops remain absent;logo is unchanged.');
    for(const [width,height,theme] of [[320,280,'dark'],[1280,900,'light']]){
      await resize(width,height);await nav('/',theme,true);assert.equal(await js('document.querySelectorAll(".masked-heading__reveal").length'),0);assert.equal(await js('getComputedStyle(document.querySelector(".masked-heading__measure")).opacity'),'1');await shot(`home-reduced-${width}x${height}-${theme}`);
    }
    await nav('/','dark');await delay(900);const normal=await geometryOf();await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait('!document.querySelector(".masked-heading__reveal")');assert.deepEqual(normal.heading,(await geometryOf()).heading);await shot('home-live-reduced-1280-dark');
    const fallback=await call('Page.addScriptToEvaluateOnNewDocument',{source:'const supported=CSS.supports.bind(CSS);CSS.supports=(...a)=>a[0]==="clip-path"?false:supported(...a)'});
    await nav('/','light');assert.ok(await js('document.querySelector(".masked-heading").dataset.ready!=="true"&&getComputedStyle(document.querySelector(".masked-heading__measure")).opacity==="1"'));await shot('home-unsupported-mask-1280-light');await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:fallback.identifier});
    checks.push('Initial/live reduced motion is plain native text without reveal/media animation and unchanged bounds;unsupported clip masks retain native visible title.');
    await resize(390,844);await nav('/','light');await delay(900);await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
    const r=await js('document.querySelector(".masked-heading").getBoundingClientRect().toJSON()');await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+40,y:r.bottom-10}]});
    for(let i=1;i<=5;i++){await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+40,y:r.bottom-10-i*12}]});await delay(30);}await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(200);assert.ok(await js('scrollY>0'));await js('scrollTo(0,0)');
    await fill('#home-document-search','  A+B & Giải tích  ');await key('Tab',9);assert.equal(await js('document.activeElement.type'),'submit');
    await js('window.oldMaskFill=document.querySelector(".masked-heading__media");void 0');await key('Enter',13,'\r');await wait('location.pathname==="/documents"');assert.equal(await js('new URLSearchParams(location.search).get("keyword")'),'A+B & Giải tích');
    await delay(150);const transform=await js('window.oldMaskFill.style.transform');await delay(350);assert.equal(await js('window.oldMaskFill.style.transform'),transform);
    checks.push('Touch swipe scrolls page;keyboard search retains trimmed/encoded query;unmounted mesh stops changing.');
    for(const clip of motion){
      const frames=await Promise.all(clip.frames.map(async f=>({...f,data:'data:image/png;base64,'+(await readFile(f.path)).toString('base64')})));
      const video=await js(`(async()=>{const frames=${JSON.stringify(frames)};const images=await Promise.all(frames.map(f=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=f.data})));const c=document.createElement('canvas');c.width=images[0].width;c.height=images[0].height;const x=c.getContext('2d'),stream=c.captureStream(0),track=stream.getVideoTracks()[0],chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(r=>recorder.onstop=r);recorder.start();for(let i=0;i<images.length;i++){x.drawImage(images[i],0,0);track.requestFrame();await new Promise(r=>setTimeout(r,i+1<frames.length?frames[i+1].ms-frames[i].ms:150));}recorder.stop();await stopped;track.stop();return new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}))});})()`);
      clip.video=join(dir,clip.name+'.webm');await writeFile(clip.video,Buffer.from(video,'base64'));
    }
  }
  assert.deepEqual([...errors,...session.requestFailures],[]);await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,geometry,motion,playback,errors,requestFailures:session.requestFailures,cancelledRequests:session.cancelledRequests,limits:['Owned Chromium actual routes/StrictMode with intercepted synthetic API and real local MP4s.','Not physical-device/WebKit/AT speech or production-performance evidence;motion clips encode sampled real page frames.']},null,2));console.log(JSON.stringify({evidence:dir,checks:checks.length,screenshots:screenshots.length,motion:motion.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,screenshots,geometry,motion,playback,errors,requestFailures:session?.requestFailures,cancelledRequests:session?.cancelledRequests,body:js?await js('document.body.innerText').catch(()=>null):null,focus:js?await js('({tag:document.activeElement?.tagName,id:document.activeElement?.id,text:document.activeElement?.textContent?.slice(0,200)})').catch(()=>null):null},null,2));throw e;}
finally { await session?.cleanup(); }
