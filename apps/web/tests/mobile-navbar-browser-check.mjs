// Actual shells with synthetic local API; no credentials, backend or external requests.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const web=process.env.NAVBAR_WEB_URL??'http://127.0.0.1:3126',baseline=process.env.NAVBAR_BASELINE==='1';
const dir=await mkdtemp(join(tmpdir(),`mobile-navbar-${baseline?'before':'after'}-`));
const checks=[],screenshots=[],errors=[],requests=[],expectedFixtureErrors=[];
const extraOnly=process.env.NAVBAR_EXTRA_ONLY==='1',roomOnly=process.env.NAVBAR_ROOM_ONLY==='1';
let role=null,socket,call,js;
const uid='00000000-0000-0000-0000-000000000001';
const chrome = spawn(process.env.ADOPTION_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium startup timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => { socket.onopen = resolve; });
  let serial = 0;
  const pending = new Map();
  call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const reply = (e, status, body, contentType = 'application/json') => call('Fetch.fulfillRequest', {
    requestId: e.requestId, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: contentType }, { name: 'Access-Control-Allow-Origin', value: web },
      { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }],
    body: Buffer.from(contentType === 'application/json' ? JSON.stringify(body) : body).toString('base64'),
  });
  const fulfill = async e => {
    const u=new URL(e.request.url),path=u.pathname;
    if(!path.startsWith('/api/'))return u.origin===web&&!/\.(mp4|webm)$/.test(path)?call('Fetch.continueRequest',{requestId:e.requestId}):reply(e,404,{});
    requests.push({path,role,method:e.request.method});
    if(path.endsWith('/users/me'))return role?reply(e,200,{id:uid,username:'synthetic',fullName:'Synthetic fixture',email:'fixture@example.invalid',role,status:'ACTIVE',avatarUrl:null}):reply(e,401,{});
    if(path.endsWith('/auth/refresh'))return role?reply(e,200,{accessToken:'synthetic'}):reply(e,401,{});
    if(path.endsWith('/achievements/me'))return reply(e,200,[]);
    if(path.includes('/study-rooms/'))return reply(e,200,{
      id:uid,name:'Synthetic continuity room',ownerId:uid,ownerName:'Synthetic fixture',focusMinutes:25,breakMinutes:5,longBreakMinutes:15,requestPolicy:'OPEN',minimumStudyMinutes:15,
      activeMembers:1,closed:false,phase:'FOCUS',phaseEndsAt:new Date(Date.now()+600000).toISOString(),sessionNumber:1,rhythmVersion:1,
      playback:{videoId:'jfKfPfyJRdk',title:'Synthetic track',startedAt:new Date().toISOString(),version:1,isDefault:true},
      members:[{userId:uid,displayName:'Synthetic fixture',focusSeconds:60,online:true}],me:{userId:uid,focusSeconds:60,canRequest:true,remainingStudySeconds:0},tracks:[],serverNow:new Date().toISOString()
    });
    if(path.endsWith('/preferences/me'))return reply(e,200,{rankingOptIn:false});
    return reply(e,200,{subjects:[],categories:[],tags:[],content:[],totalPages:0,totalElements:0});
  };
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') fulfill(m.params).catch(e => errors.push(e.message));
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      const message=m.params.args.map(a => a.value ?? a.description).join(' ');
      if(message==='THREE.WebGLRenderer: THREE.WebGLRenderer: Error creating WebGL context.')expectedFixtureErrors.push(message); // Deliberately disabled by the noWebGL fixture.
      else errors.push(message);
    }
  };
  js = async expression => {
    const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value;
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { for (let i = 0; i < 200; i++) { if (await js(`Boolean(${expression})`)) return; await delay(50); } throw Error('Timeout: ' + expression); };
  const key = async k => {
    const n = { Enter: 13, Escape: 27, Tab: 9, ' ': 32 }[k] ?? 0;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: n, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: n });
  };
  await call('Runtime.enable');await call('Page.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.probeDocument=crypto.randomUUID()'});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`    window.roomFixturePlayers=[];
    if(location.search.includes('noWebGL')) {const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:native.call(this,kind,...args)}}
    window.YT={Player:class {constructor(slot,opts){this.opts=opts;this.volume=40;this.state=1;this.muted=false;this.destroyed=false;window.roomFixturePlayers.push(this);this.frame=document.createElement('iframe');this.frame.srcdoc='<body style="margin:0;background:#071d2d;color:#d9e7f0;display:grid;place-items:center;height:100vh;font:14px sans-serif">Synthetic YouTube player · no network/audio</body>';slot.replaceWith(this.frame);setTimeout(()=>{if(!window.holdRoomPlayerReady)opts.events.onReady({target:this})},20)}getIframe(){return this.frame}setVolume(v){this.volume=v}getVolume(){return this.volume}mute(){this.muted=true}unMute(){this.muted=false}isMuted(){return this.muted}emit(state){this.state=state;this.opts.events.onStateChange({target:this,data:state})}playVideo(){this.emit(1)}pauseVideo(){this.emit(2)}destroy(){this.destroyed=true;this.frame.remove()}}};`});
  const resize=(width,height=720)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const nav=async path=>{const old=await js('window.probeDocument');await call('Page.navigate',{url:web+path});await wait(`window.probeDocument!==${JSON.stringify(old)}&&!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')`);};
  const controls = () => js(`[...document.querySelector('.public-header,.workspace-topbar').querySelectorAll('a,button')].filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label')??e.textContent.trim(),...e.getBoundingClientRect().toJSON()}))`);
  const shot = async name => {
    await delay(250);
    const geometry = await js(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.className,header:document.querySelector('header').getBoundingClientRect().toJSON()})`);
    assert.ok(geometry.scrollWidth <= geometry.width, 'overflow '+name);
    const path = join(dir,name+'.png');
    await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));
    screenshots.push({path,geometry,controls:await controls()});
  };
  const click=selector=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('missing selector');e.focus();e.click()})()`);
  const theme=value=>js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(value)}))`);
  for(const width of extraOnly||roomOnly?[]:[320,390])for(const mode of ['light','dark']){
    await resize(width,568);
    let reference;
    for(const variant of ['public-anonymous','public-account','internal']){
      role=variant==='public-anonymous'?null:'STUDENT';
      await nav(variant==='internal'?'/profile/achievements':'/documents');
      await wait(variant==='internal'?`document.querySelector('.workspace-content h1')`:`document.querySelector('.public-header')&&document.querySelector('h1')`);
      await theme(mode);await shot(`${variant}-${width}-${mode}`);
      const targets=await controls(),sorted=targets.toSorted((a,b)=>a.x-b.x);
      for(const t of targets){assert.ok(t.height>=44&&t.width>=44,JSON.stringify(t));assert.ok(t.x>=0&&t.right<=width,JSON.stringify(t));}
      for(let i=1;i<sorted.length;i++)assert.ok(sorted[i].x-sorted[i-1].right>=7.5,JSON.stringify(sorted));
      if(variant==='public-account')reference=targets;
      if(!baseline){
        assert.equal(await js(`document.querySelectorAll('header .mobile-navbar').length`),1);
        assert.equal(targets.length,4);
        assert.equal(targets.at(-1).name,'Mở menu điều hướng');
        assert.equal(await js(`document.querySelector('.shell-menu-trigger__label').textContent`),'Menu');
        if(variant==='internal'){
          assert.deepEqual(targets.map(t=>({x:t.x,y:t.y,width:t.width,height:t.height})),reference.map(t=>({x:t.x,y:t.y,width:t.width,height:t.height})));
          assert.ok(await js(`document.querySelector('.workspace-mobile-context').textContent.includes('Thành tích')`));
        }
      }
      await js(`window.routeContent=document.querySelector('.workspace-content')?.firstElementChild;window.menuButton=document.querySelector('header [aria-label="Mở menu điều hướng"]');window.menuButton.focus()`);
      await key('Enter');await wait(`document.querySelector('[role=dialog]')`);
      assert.equal(await js(`window.menuButton.getAttribute('aria-expanded')`),'true');
      assert.equal(await js(`document.getElementById(window.menuButton.getAttribute('aria-controls'))?.getAttribute('role')`),'dialog');
      assert.equal(await js(`!!document.activeElement.closest('[role=dialog]')`),true);
      for(let i=0;i<16;i++){await key('Tab');assert.equal(await js(`!!document.activeElement.closest('[role=dialog]')`),true);}
      assert.equal(await js(`document.querySelector('[role=dialog]').textContent.includes('Giao diện tối')`),false);
      await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);await delay(300);
      assert.equal(await js(`document.activeElement===window.menuButton`),true);
      assert.equal(await js(`window.menuButton.getAttribute('aria-expanded')`),'false');
      if(!baseline)assert.equal(await js(`getComputedStyle(window.menuButton).outlineOffset`),'3px');
      if(variant==='internal')assert.equal(await js(`window.routeContent===document.querySelector('.workspace-content').firstElementChild`),true);
      await key(' ');await wait(`document.querySelector('[role=dialog]')`);await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);
      checks.push(`${variant}/${width}/${mode}:fit44px/8px,Enter/Space,expanded/controls,Tab trap,Escape focus,content preserved`);
    }
  }
  if(!baseline&&!roomOnly){
    role='STUDENT';await resize(320,360);await nav('/profile/achievements');await wait(`document.querySelector('.workspace-content h1')`);await shot('internal-320-short');
    await js(`void(window.contentNode=document.querySelector('.workspace-content').firstElementChild)`);
    await click('header [aria-label="Mở menu điều hướng"]');await wait(`document.querySelector('[role=dialog]')`);await resize(768,900);await wait(`!document.querySelector('[role=dialog]')&&document.querySelector('.workspace-sidebar')`);await delay(400);
    assert.equal(await js(`document.activeElement.getAttribute('aria-label')`),'Mở menu điều hướng');
    assert.equal(await js(`window.contentNode===document.querySelector('.workspace-content').firstElementChild`),true);
    assert.equal(await js(`document.querySelectorAll('.mobile-navbar').length`),0);await shot('internal-tablet');
    await resize(1440,900);await wait(`document.querySelector('.workspace-discovery')`);await shot('internal-desktop');
    assert.equal(await js(`document.querySelectorAll('.mobile-navbar').length`),0);
    await resize(390,568);await wait(`document.querySelector('.mobile-navbar')`);await js(`document.querySelector('header [aria-label="Đổi giao diện"]').focus()`);await key('Enter');
    await js(`document.querySelector('header .shell-account').focus()`);await key('Enter');await wait(`document.querySelector('[role=menu]')`);assert.ok(await js(`Boolean(document.querySelector('[role=menu] a[href="/profile"]'))`));await key('Escape');await wait(`!document.querySelector('[role=menu]')`);assert.equal(await js(`document.activeElement.classList.contains('shell-account')`),true);
    const saved=await js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().theme)`);
    await nav('/documents');await wait(`document.querySelector('.mobile-navbar')`);assert.equal(await js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().theme)`),saved);
    await resize(768,900);await wait(`document.querySelector('.public-header__nav')`);await shot('public-tablet');
    await resize(1440,900);await shot('public-desktop');
    role='ADMIN';await resize(320,568);await nav('/admin/recognition');await wait(`document.querySelector('.mobile-navbar')`);await click('header .shell-menu-trigger');await wait(`document.querySelector('[role=dialog]')`);assert.ok(await js(`Boolean(document.querySelector('[role=dialog] a[href="/admin/recognition"]'))`));await shot('admin-drawer-320');await key('Escape');
    checks.push('short320px;breakpoint drawer close/focus;content identity retained;desktop/tablet variants;keyboard theme persistence;admin destinations');
  }
  if(!baseline&&!extraOnly){
    role='STUDENT';await resize(320,568);await nav('/study-rooms/'+uid+'?noWebGL');await wait(`document.querySelector('.room-listening')`);
    await click('.room-listening [aria-label="Mở trình phát"]');await wait(`document.querySelector('.room-music-dialog[open]')&&window.roomFixturePlayers.length===1`);await wait(`!document.querySelector('.room-listening__play').disabled`);
    await key('Escape');await wait(`!document.querySelector('.room-music-dialog[open]')`);
    await js(`void(window.retainedPlayer=window.roomFixturePlayers[0]);void(window.retainedScene=document.querySelector('.room-scene'))`);
    const previousState=await js(`window.retainedPlayer.state`);
    assert.equal(await js(`document.querySelector('.room-scene').dataset.world`),'fallback');
    await click('header .shell-menu-trigger');await wait(`document.querySelector('[role=dialog]')`);await key('Escape');await wait(`!document.querySelector('[role=dialog]')`);
    await click('header [aria-label="Đổi giao diện"]');await resize(768,900);await wait(`document.querySelector('.public-header__nav')`);await resize(390,568);await wait(`document.querySelector('.mobile-navbar')`);
    assert.equal(await js(`window.roomFixturePlayers.length`),1);assert.equal(await js(`window.retainedPlayer.destroyed`),false);assert.equal(await js(`window.retainedPlayer.state`),previousState);assert.equal(await js(`window.retainedScene===document.querySelector('.room-scene')`),true);
    await shot('room-continuity-390');checks.push('Synthetic joined room:player/scene identity and local playback state survive drawer,theme,768px/390px handoff');
  }
  assert.deepEqual(errors,[]);
} catch(e){errors.push(e.stack);process.exitCode=1;}
finally{
  await writeFile(join(dir,'results.json'),JSON.stringify({baseline,checks,screenshots,requests,errors,expectedFixtureErrors,limits:'Synthetic Chromium shells; no live auth/backend/media, physical device, AT speech or real room socket/player proof'},null,2));
  socket?.close();chrome.kill('SIGTERM');await new Promise(resolve=>chrome.once('exit',resolve));
  await rm(join(dir,'profile'),{recursive:true,force:true,maxRetries:5,retryDelay:100});
  console.log(JSON.stringify({dir,checks,screenshots:screenshots.length,errors}));
}
