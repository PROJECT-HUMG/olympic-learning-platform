// Local rendered fixtures, not live API, multiuser or YouTube proof.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.ROOM_WEB_URL ?? 'http://127.0.0.1:3000';
const phase = process.env.ROOM_PHASE ?? 'after';
const layoutOnly = process.env.ROOM_CHECK_SCOPE === 'layout';
const lifecycleOnly = process.env.ROOM_CHECK_SCOPE === 'lifecycle';
const interactionOnly = process.env.ROOM_CHECK_SCOPE === 'interactions';
const discoveryOnly = process.env.ROOM_CHECK_SCOPE === 'discovery';
const viewports = JSON.parse(process.env.ROOM_VIEWPORTS ?? '[[1440,900],[1024,900],[768,1024],[800,600],[390,844],[320,568],[320,360]]');
const dir = await mkdtemp(join(tmpdir(), `study-room-${phase}-`));
const paths = [
  'src/features/study-room/components/study-rooms-lobby.tsx',
  'src/features/study-room/components/study-room-session.tsx',
  'src/features/study-room/components/study-room.css',
  'src/features/study-room/components/study-room-scene.tsx',
  'src/features/study-room/components/study-room-scene.css',
  'src/features/study-room/components/study-music-player.tsx',
  'src/features/study-room/components/study-music-player.css',
  'src/features/study-room/components/edit-room-rhythm.tsx',
  'src/features/study-room/components/transfer-room-ownership.tsx',
  'src/features/study-room/hooks/use-study-room.ts',
  'src/features/study-room/services/study-room.service.ts',
  'src/features/study-room/types/study-room.ts',
  'src/features/study-room/lib/playback-selection.ts',
  'src/features/study-room/lib/room-world.ts', 'src/features/study-room/lib/room-world-layout.ts',
  'src/features/study-room/components/room-music-dialog.tsx', 'package.json', 'pnpm-lock.yaml',
  'src/features/toolkit/components/toolkit-feature.tsx',
  'src/features/toolkit/components/toolkit.css',
  'src/router/routes.tsx', 'tests/study-room-ux-browser-check.mjs',
];
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async p => [p, createHash('sha256').update(await readFile(new URL(`../${p}`, import.meta.url))).digest('hex')])));
const candidateStart = await manifest();
const uid = '00000000-0000-0000-0000-000000000001', owner = '00000000-0000-0000-0000-000000000002';
const roomId = '00000000-0000-0000-0000-000000000010';
let role = 'STUDENT', mode = 'preview', failure = false, empty = false, loading = false, holdWorld = false, state;
const checks = [], requests = [], errors = [], layoutMetrics = [];
function reset(next) {
  mode = next; failure = false; empty = false; loading = false;
  state = { id: roomId, name: 'Cùng ôn Giải tích', ownerId: next === 'host' ? uid : owner, ownerName: next === 'host' ? 'Nguyễn Minh Anh' : 'Trần Hoài An',
    focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, requestPolicy: 'OPEN', minimumStudyMinutes: 15,
    activeMembers: 3, closed: next === 'closed', phase: 'FOCUS', phaseEndsAt: new Date(Date.now() + 1195000).toISOString(), sessionNumber: 2, rhythmVersion: 3,
    playback: { videoId: 'jfKfPfyJRdk', title: 'Lofi Girl — beats to relax/study to', startedAt: new Date().toISOString(), version: 4, isDefault: true },
    members: [ { userId: uid, displayName: 'Nguyễn Minh Anh', focusSeconds: 1380, online: true },
      { userId: owner, displayName: 'Trần Hoài An', focusSeconds: 1800, online: true },
      { userId: 'member-3', displayName: 'Phạm Ngọc Linh', focusSeconds: 720, online: true },
      { userId: 'member-4', displayName: 'Lê Quang Huy', focusSeconds: 600, online: false } ],
    me: ['member', 'host'].includes(next) ? { userId: uid, focusSeconds: 1380, canRequest: true, remainingStudySeconds: 0 } : null,
    tracks: [{ id: 'track-1', videoId: 'test', title: 'Một buổi chiều yên tĩnh', requestedById: owner, requestedByName: 'Trần Hoài An', status: 'PENDING', createdAt: new Date().toISOString() }] };
}
reset('preview');
const chrome = spawn(process.env.ROOM_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, call, js;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chromium timeout')), 15000);
    chrome.stderr.on('data', b => { const m = String(b).match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    chrome.on('error', reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise(r => { socket.onopen = r; });
  let serial = 0; const pending = new Map();
  call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; const timeout=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},20000);pending.set(id, { resolve:r=>{clearTimeout(timeout);resolve(r)}, reject:e=>{clearTimeout(timeout);reject(e)} }); socket.send(JSON.stringify({ id, method, params })); });
  async function fulfill(e) {
    const u = new URL(e.request.url);
    if (!u.pathname.startsWith('/api/v1/')) {
      if (holdWorld && u.pathname.endsWith('/room-world.ts')) await new Promise(r=>setTimeout(r,5000));
      return u.origin === new URL(web).origin && !/\.(mp4|webm)$/.test(u.pathname)
        ? call('Fetch.continueRequest', { requestId: e.requestId }) : call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 404 });
    }
    const path = u.pathname.slice(7), method = e.request.method;
    const input = e.request.postData ? JSON.parse(e.request.postData) : {};
    requests.push({ mode, role, path, method, input });
    let body = {}, status = 200;
    if (method === 'OPTIONS') body = {};
    else if (path === '/users/me') { body = role ? { id: uid, username: 'room-fixture', fullName: 'Nguyễn Minh Anh', email: 'fixture@example.test', role, status: 'ACTIVE', avatarUrl: null } : {}; if (!role) status = 401; }
    else if (path === '/auth/refresh') { body = { accessToken: 'synthetic-room' }; if (!role) status = 401; }
    else if (path.startsWith('/study-rooms')) {
      if (loading) await new Promise(r => setTimeout(r, 900));
      if (failure) { status = 503; body = { status: 503, detail: 'Fixture connection failure' }; }
      else if (path === '/study-rooms' && method === 'GET') body = empty ? [] : [state, { ...state, id: 'room-2', name: 'Ôn Vật lý cùng nhau — chuyên đề dao động và sóng', ownerName: 'Vũ Phương Anh', activeMembers: 2 }];
      else {
        if (path === '/study-rooms' && method === 'POST') { state = { ...state, ...input, ownerId: uid, ownerName: 'Nguyễn Minh Anh' }; state.me = { userId: uid, focusSeconds: 0, canRequest: true, remainingStudySeconds: 0 }; }
        if (path.endsWith('/join')) state.me = { userId: uid, focusSeconds: 0, canRequest: true, remainingStudySeconds: 0 };
        if (path.endsWith('/leave')) state.me = null;
        if (path.endsWith('/close')) { state.closed = true; state.me = null; }
        if (path.endsWith('/settings')) Object.assign(state, input);
        if (path.endsWith('/rhythm')) { Object.assign(state, input); state.rhythmVersion++; }
        if (path.endsWith('/owner')) state.ownerId = input.userId;
        if (path.endsWith('/tracks')) state.tracks.push({ id: 'track-2', videoId: 'test2', title: input.title, requestedById: uid, requestedByName: 'Nguyễn Minh Anh', status: state.ownerId === uid ? 'APPROVED' : 'PENDING', createdAt: new Date().toISOString() });
        if (path.endsWith('/approve')) state.tracks[0].status = 'APPROVED';
        if (path.endsWith('/reject')) state.tracks = state.tracks.filter(t => !path.includes(t.id));
        if (path.endsWith('/next')) {
          const next = state.tracks.find(track => track.status === 'APPROVED');
          state.playback = { videoId: next?.videoId ?? 'jfKfPfyJRdk', title: next?.title ?? 'Lofi Girl', isDefault: !next, version: state.playback.version + 1, startedAt: new Date().toISOString() };
          if (next) state.tracks = state.tracks.filter(track => track.id !== next.id);
        }
        body = { ...state, id: path.split('/')[2] ?? state.id, serverNow: new Date().toISOString() };
      }
    }
    await call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: web }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,OPTIONS' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  }
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Fetch.requestPaused') void fulfill(m.params).catch(e => { if (!e.message.includes('Invalid InterceptionId')) errors.push(e.message); });
    if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails));
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(Error(JSON.stringify(m.error))); else p.resolve(m.result); }
  };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const wait = async e => { for (let n = 0; n < 150; n++) { if (await js(e)) return; await new Promise(r => setTimeout(r, 100)); } throw Error(`Timeout: ${e}`); };
  const viewport = (width, height = 900) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  const navigate = async path => { console.log('Render '+path+' ('+mode+')'); await call('Page.navigate', { url: web + path }); await wait("!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')"); };
  const shot = async (name, selector, keepScroll = false) => { if (selector) await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`); else if (!keepScroll) await js('scrollTo(0,0)'); await js('new Promise(r=>setTimeout(r,250))'); await writeFile(join(dir, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); };
  const alignedShot = async (name, selector) => {
    await js(`scrollTo(0, document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().top + scrollY - document.querySelector('.public-header').getBoundingClientRect().height - 16)`);
    await shot(name, undefined, true);
  };
  const fit = async name => { assert.ok(await js('document.documentElement.scrollWidth<=innerWidth'), `${name}: overflow`); checks.push(`${name}: no horizontal overflow`); };
  const clickText = async text => {
    const find = `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)})`;
    // Do not silently "click" a control while a preceding mutation still disables it.
    await wait(`(()=>{const b=${find};return !!b&&!b.disabled})()`);
    await js(`(()=>{const b=${find};b.focus();b.click()})()`);
  };
  const fill = (selector, value) => js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  const escape = () => call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await call('Page.enable'); await call('Page.bringToFront'); await call('Emulation.setFocusEmulationEnabled', { enabled: true }); await call('Runtime.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:'light'},version:0}));
    // Faithful local control surface only. No external player or sound is used.
    window.roomFixturePlayers=[];
    if(location.search.includes('noWebGL')) {const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:native.call(this,kind,...args)}}
    window.YT={Player:class {constructor(slot,opts){this.opts=opts;this.volume=40;this.state=1;this.muted=false;this.destroyed=false;window.roomFixturePlayers.push(this);this.frame=document.createElement('iframe');this.frame.srcdoc='<body style="margin:0;background:#071d2d;color:#d9e7f0;display:grid;place-items:center;height:100vh;font:14px sans-serif">Synthetic YouTube player · no network/audio</body>';slot.replaceWith(this.frame);setTimeout(()=>{if(!window.holdRoomPlayerReady)opts.events.onReady({target:this})},20)}getIframe(){return this.frame}setVolume(v){this.volume=v}getVolume(){return this.volume}mute(){this.muted=true}unMute(){this.muted=false}isMuted(){return this.muted}emit(state){this.state=state;this.opts.events.onStateChange({target:this,data:state})}playVideo(){this.emit(1)}pauseVideo(){this.emit(2)}destroy(){this.destroyed=true;this.frame.remove()}}};` });

  const readyWorld = () => wait("document.querySelector('.room-scene')?.dataset.world==='ready'&&Number(document.querySelector('.room-world').dataset.frames)>0");
  const openMusic = async () => { await clickText('Nhạc'); await wait("!!document.querySelector('.room-music-dialog[open]')&&window.roomFixturePlayers.some(p=>!p.destroyed)"); };
  const closeMusic = async () => { await escape(); await wait("!document.querySelector('.room-music-dialog[open]')"); };
  if (!layoutOnly && !lifecycleOnly && !interactionOnly) {
    for (const width of [1440, 768, 320]) {
      await viewport(width,width<768?568:900);
      role=null; await navigate('/toolkit?tool=rooms'); await wait("!!document.querySelector('.study-room-access')"); await fit('guest-'+width); await shot('guest-'+width);
      role='STUDENT'; reset('preview'); await navigate('/toolkit?tool=rooms'); await wait("!!document.querySelector('.study-rooms-lobby__list')"); await shot('lobby-'+width);
      await clickText('Tạo phòng'); await wait("document.activeElement.id==='study-room-name'"); await fill('#study-room-name','Preserved room draft'); await shot('create-'+width);
      await clickText('Hủy'); await clickText('Tạo phòng'); assert.equal(await js("document.querySelector('#study-room-name').value"),'Preserved room draft'); await clickText('Hủy');
      await navigate('/study-rooms/'+roomId); await wait("!!document.querySelector('.study-room-join')"); await readyWorld(); await fit('preview-'+width); await shot('preview-'+width); await alignedShot('preview-scene-'+width,'.room-scene');
      assert.equal(await js("!!document.querySelector('.study-music-player')"),false);
    }
    checks.push('guest access; discovery/create focus and retained draft; explicit preview without player or implicit joining');
  }
  role='STUDENT';
  for (const [width,height] of lifecycleOnly || interactionOnly || discoveryOnly ? [] : viewports) {
    await viewport(width,height); reset('host'); await navigate('/study-rooms/'+roomId); await readyWorld();
    await shot('owner-'+width+'x'+height); await alignedShot('scene-'+width+'x'+height,'.room-scene'); await fit('owner-'+width+'x'+height);
    const metrics=await js(`(()=>{const r=s=>{const a=document.querySelector(s).getBoundingClientRect();return{x:a.x,y:a.y,width:a.width,height:a.height,bottom:a.bottom}};return{viewport:[innerWidth,innerHeight],clock:r('.study-room-clock'),scene:r('.room-scene'),world:r('.room-world'),canvas:r('.room-world canvas'),drawCalls:Number(document.querySelector('.room-world').dataset.drawCalls),actions:[...document.querySelectorAll('.study-room-header button,.room-clock-controls button')].map(b=>b.getBoundingClientRect().height)}})()`);
    layoutMetrics.push(metrics);
    assert.ok(metrics.actions.every(h=>h>=44));
    assert.ok(metrics.canvas.width>200&&metrics.canvas.height>200);
    if(width>=1200){assert.ok(Math.abs(metrics.clock.y-metrics.scene.y)<1);assert.ok(Math.abs(metrics.clock.bottom-metrics.scene.bottom)<1);}
    if(width>=768&&width<1200){assert.ok(metrics.clock.bottom<=metrics.scene.y);}
    await js("document.documentElement.classList.add('dark')"); await alignedShot('scene-dark-'+width+'x'+height,'.room-scene'); await js("document.documentElement.classList.remove('dark')");
    await openMusic(); await wait("document.querySelector('.study-music-player__controls button').textContent.trim()==='Tạm dừng'"); await shot('music-'+width+'x'+height,undefined,true);
    const volume=await js("['label','input','output'].map(s=>{const r=document.querySelector('.study-music-player__volume '+s).getBoundingClientRect();return r.y+r.height/2})");
    assert.ok(Math.max(...volume)-Math.min(...volume)<1);
    assert.ok(await js("(()=>{const d=document.querySelector('.room-music-dialog').getBoundingClientRect(),f=document.querySelector('.study-music-player__frame').getBoundingClientRect();return d.width<=innerWidth&&d.height<=innerHeight-30&&f.width>=200&&f.height>=200})()"));
    await js("window.originalPlayer=window.roomFixturePlayers.find(p=>!p.destroyed);window.originalIframe=document.querySelector('.study-music-player__frame iframe')");
    await closeMusic(); assert.equal(await js("document.activeElement.textContent.trim()"),'Nhạc');
    await js("document.querySelector('.room-scene-music').click()"); await wait("!!document.querySelector('.room-music-dialog[open]')");
    assert.equal(await js("window.roomFixturePlayers.filter(p=>!p.destroyed).length"),1);
    assert.equal(await js("document.querySelector('.study-music-player__frame iframe')===window.originalIframe"),true);
    await closeMusic(); assert.equal(await js("document.activeElement.classList.contains('room-scene-music')"),true);
    checks.push(width+'x'+height+': real WebGL render, aligned responsive composition, dark, volume alignment, bounded dialog and persistent iframe with opener focus return');
  }
  if(!layoutOnly && !lifecycleOnly && !discoveryOnly) {
    holdWorld=true; reset('member'); await viewport(1440,900); await navigate('/study-rooms/'+roomId);
    await wait("document.querySelector('.room-scene')?.dataset.world==='loading'"); await alignedShot('scene-loading','.room-scene');
    assert.ok(await js("!!document.querySelector('[role=timer]')&&document.querySelectorAll('.room-scene-seat__button').length===4"));
    holdWorld=false; await readyWorld(); checks.push('delayed real renderer import retains usable timer/participants and an honest loading state');
    await viewport(1440,900); reset('member'); await navigate('/study-rooms/'+roomId); await readyWorld(); await alignedShot('member-desktop','.study-room-focus');

    const scenePoint = async (x,y,z) => js("(async()=>{const{Vector3,OrthographicCamera}=await import('/node_modules/.vite/deps/three.js');const r=document.querySelector('.room-world canvas').getBoundingClientRect(),a=r.width/r.height,s=Math.max(5.35,8.2/a),c=new OrthographicCamera(-s*a,s*a,s,-s,.1,100);c.position.set(11,10,15);c.lookAt(0,1,0);c.updateMatrixWorld();const p=new Vector3("+x+","+y+","+z+").project(c);return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2}})()");
    const pointer = async p => {await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});};
    await pointer(await scenePoint(.1,2.35,-3.15)); await wait("!!document.querySelector('.room-music-dialog[open]')"); await shot('in-room-tv-dialog',undefined,true);
    const modalFrames=await js("Number(document.querySelector('.room-world').dataset.frames)");
    await js("new Promise(r=>setTimeout(r,600))"); assert.equal(await js("Number(document.querySelector('.room-world').dataset.frames)"),modalFrames);
    for(let i=0;i<12;i++){await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await js("document.querySelector('.room-music-dialog').contains(document.activeElement)"),true);}
    await closeMusic(); checks.push('actual raycast TV opens the dialog; keyboard Tab remains within the native modal; obscured scene stops rendering');
    await pointer(await scenePoint(-1.65,1.65,-1.315));await wait("!!document.querySelector('.room-scene-member-dialog')");await shot('character-picked-desktop',undefined,true);await escape();await wait("!document.querySelector('.room-scene-member-dialog')");checks.push('actual 3D character raycast exposes the existing participant details');
    await js("window.originalCanvas=document.querySelector('.room-world canvas')");

    await js("new Promise(r=>setTimeout(r,5600))");
    assert.equal(await js("document.querySelector('.room-world canvas')===window.originalCanvas"),true); checks.push('timer rerenders and room polling retain the same WebGL canvas');
    await js("(()=>{const b=document.querySelector('.room-scene-seat__button');window.memberOpener=b;b.focus();b.click()})()");
    await wait("!!document.querySelector('.room-scene-member-dialog')"); await shot('member-details-desktop',undefined,true); await escape(); await wait("!document.querySelector('.room-scene-member-dialog')");
    assert.equal(await js("document.activeElement===window.memberOpener"),true); checks.push('participant identity/focus details and Escape focus return');
    await openMusic(); await wait("document.querySelector('.study-music-player__controls button').textContent.trim()==='Tạm dừng'");
    await clickText('Tạm dừng'); await js("(()=>{const e=document.querySelector('.study-music-player__volume input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'17');e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await closeMusic(); await wait("document.querySelector('.room-scene-music [role=status]').textContent.includes('tạm dừng')");
    await shot('member-paused-desktop'); await openMusic();
    assert.equal(await js("window.roomFixturePlayers.find(p=>!p.destroyed).state"),2);
    assert.equal(await js("window.roomFixturePlayers.find(p=>!p.destroyed).getVolume()"),17);
    assert.equal(await js("window.roomFixturePlayers.filter(p=>!p.destroyed).length"),1);
    await closeMusic(); checks.push('local pause survives dialog close/reopen; truthful scene state and one live player');
    await fill('#room-youtube','https://www.youtube.com/watch?v=test'); await fill('#room-track-title','Nhạc cho phiên học'); await clickText('Gửi chủ phòng duyệt'); await wait("document.querySelector('#room-track-title').value===''"); checks.push('track request keeps existing endpoint and success-only draft clearing');
    await js("window.dispatchEvent(new Event('offline'))"); await wait("document.querySelector('[role=timer]').textContent==='—:—'");
    assert.equal(await js("document.querySelector('#room-youtube').disabled"),true); await alignedShot('offline-scene','.room-scene');
    await js("window.dispatchEvent(new Event('online'))"); await wait("document.querySelector('[role=timer]').textContent!=='—:—'"); checks.push('offline/reconnect retain timer and mutation safety');
    await clickText('Rời phòng'); await wait("location.pathname==='/toolkit'&&!!document.querySelector('.study-rooms-lobby__list')");
    assert.equal(await js("window.originalCanvas.isConnected"),false); assert.equal(await js("window.roomFixturePlayers.every(p=>p.destroyed)"),true); checks.push('Leave retains original route, removes canvas and destroys player');
    reset('host'); state.playback={...state.playback,isDefault:false,videoId:'abcdefghijk',title:'Current room selection'};
    state.tracks.push({...state.tracks[0],id:'approved-track',videoId:'lmnopqrstuv',title:'Next room selection',status:'APPROVED'});
    await viewport(1024,900); await navigate('/study-rooms/'+roomId); await readyWorld();
    await clickText('Chỉnh giờ'); await wait("!!document.querySelector('.room-rhythm-dialog')"); await shot('rhythm-tablet'); await escape(); await wait("!document.querySelector('[role=dialog]')");
    await openMusic(); await wait("document.querySelector('.study-music-player__controls button').textContent.trim()==='Tạm dừng'");
    const version=state.playback.version, nextRequests=requests.filter(r=>r.path.endsWith('/playback/next')).length;
    await js("window.roomFixturePlayers.find(p=>!p.destroyed).emit(0)"); await wait("document.querySelector('.study-music-player__status').textContent.includes('đã kết thúc')");
    await js("new Promise(r=>setTimeout(r,1200))"); assert.equal(state.playback.version,version); assert.equal(requests.filter(r=>r.path.endsWith('/playback/next')).length,nextRequests); await shot('owner-local-ended',undefined,true);
    await clickText('Phát tiếp'); await wait("document.querySelector('.study-music-player__title').textContent==='Next room selection'");
    assert.equal(state.playback.version,version+1); assert.equal(requests.findLast(r=>r.path.endsWith('/playback/next')).input.expectedVersion,version); await shot('owner-explicit-next',undefined,true); await closeMusic();
    await clickText('Duyệt'); await wait("document.querySelector('.study-room-queue').textContent.includes('Đã duyệt')"); await clickText('Bỏ'); await wait("!document.querySelector('.study-room-queue').textContent.includes('Một buổi chiều')");
    await clickText('Chọn chủ phòng mới'); await wait("!!document.querySelector('[role=dialog]')"); await shot('transfer-tablet'); await escape();
    await clickText('Kết thúc buổi học'); assert.equal(state.closed,false); await clickText('Học tiếp'); await clickText('Kết thúc buổi học'); await clickText('Đóng phòng học'); await wait("document.body.textContent.includes('Buổi học đã khép lại.')"); await shot('closed-tablet');
    checks.push('local ended never advances; explicit owner versioned Next, moderation, rhythm, transfer and confirmed closure preserved');
    for(const staff of ['STUDENT','ADMIN','LECTURER']) {
      role=staff; reset('member'); await navigate('/study-rooms/'+roomId); await readyWorld(); await openMusic(); await wait("window.roomFixturePlayers.some(p=>!p.destroyed)");
      assert.equal(await js("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Phát tiếp'||b.textContent.trim()==='Chỉnh giờ')"),false);
      const v=state.playback.version; await js("window.roomFixturePlayers.find(p=>!p.destroyed).emit(0)"); await wait("document.querySelector('.room-scene-music [role=status]').textContent.includes('kết thúc')"); assert.equal(state.playback.version,v);
      await closeMusic();
    } checks.push('all nonowner roles retain local ended and no owner controls');
    role='STUDENT'; reset('preview'); empty=true; await navigate('/toolkit?tool=rooms'); await wait("document.body.textContent.includes('Chưa có phòng nào')"); await shot('lobby-empty');
    failure=true; await navigate('/study-rooms/'+roomId); await wait("document.body.textContent.includes('Chưa kết nối được')"); await shot('room-error'); failure=false; await clickText('Thử kết nối lại'); await readyWorld();
    state.members=[];state.activeMembers=0;await navigate('/study-rooms/'+roomId);await readyWorld();await alignedShot('empty-room-scene','.room-scene');
    assert.equal(await js("document.querySelectorAll('.room-scene-empty-seat').length"),4); checks.push('empty lobby/room and API error/retry distinguish absence from failure');
    reset('member'); state.members=Array.from({length:50},(_,n)=>({userId:n===0?uid:'many-'+n,displayName:'Thành viên '+(n+1),focusSeconds:300,online:true}));state.activeMembers=50;
    await viewport(390,844); await navigate('/study-rooms/'+roomId); await readyWorld(); await fit('50-members'); await alignedShot('many-members-mobile','.room-scene');
    await js("document.querySelector('[aria-label=\"Bàn tiếp\"]').click()"); await readyWorld(); assert.equal(await js("document.querySelectorAll('.room-scene-seat__button').length"),12); checks.push('50 members keep twelve-desk pagination and DOM details');
  }
  if (!lifecycleOnly && !discoveryOnly) {
  role='STUDENT'; reset('host'); state.playback={...state.playback,isDefault:false,videoId:'abcdefghijk',title:'Một buổi học thật yên tĩnh cùng bạn bè với nhạc lofi và những giai điệu nhẹ nhàng cho buổi tối ôn tập'};
  await viewport(320,568); await navigate('/study-rooms/'+roomId); await readyWorld(); await alignedShot('long-track-scene-320','.room-scene'); await openMusic();
  await wait("document.querySelector('.study-music-player__controls button').textContent.trim()==='Tạm dừng'");
  await js("(()=>{const p=window.roomFixturePlayers.find(p=>!p.destroyed);p.opts.events.onError({target:p,data:153})})()");
  await wait("document.querySelector('.study-music-player__status').getAttribute('role')==='alert'"); await shot('long-track-error-320',undefined,true);
  assert.equal(await js("document.querySelector('.study-music-player__frame').getBoundingClientRect().height"),0);
  await js("window.holdRoomPlayerReady=true"); await clickText('Thử lại'); await wait("document.querySelector('.study-music-player__status').textContent.includes('Đang kết nối')"); await shot('long-track-loading-320',undefined,true);
  assert.ok(await js("document.querySelector('.study-music-player__frame').getBoundingClientRect().height>=200"));
  await js("(()=>{const p=window.roomFixturePlayers.find(p=>!p.destroyed);p.opts.events.onReady({target:p});window.holdRoomPlayerReady=false})()");
  await wait("document.querySelector('.study-music-player__controls button').textContent.trim()==='Tạm dừng'");
  await closeMusic(); checks.push('long-title narrow error, compact Retry and valid loading frame; same selected track retry');
  }
  if (!layoutOnly && !discoveryOnly) {
  await viewport(1440,900); reset('member'); await navigate('/study-rooms/'+roomId); await readyWorld(); await alignedShot('scene-performance','.room-scene');
  await js("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");
  const hiddenFrames=await js("Number(document.querySelector('.room-world').dataset.frames)");
  await js("new Promise(r=>setTimeout(r,600))"); assert.equal(await js("Number(document.querySelector('.room-world').dataset.frames)"),hiddenFrames);
  await js("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))");
  await wait("Number(document.querySelector('.room-world').dataset.frames)>"+hiddenFrames);
  await js("window.dispatchEvent(new PageTransitionEvent('pagehide'))");
  const pageHiddenFrames=await js("Number(document.querySelector('.room-world').dataset.frames)");
  await js("new Promise(r=>setTimeout(r,600))"); assert.equal(await js("Number(document.querySelector('.room-world').dataset.frames)"),pageHiddenFrames);
  await js("window.dispatchEvent(new PageTransitionEvent('pageshow'))");
  await wait("Number(document.querySelector('.room-world').dataset.frames)>"+pageHiddenFrames);
  checks.push('deterministic document-hidden and pagehide/pageshow events stop and resume frames; not physical tab/bfcache proof');
  await js("window.stableCanvas=document.querySelector('.room-world canvas');window.frameCount=Number(document.querySelector('.room-world').dataset.frames)");
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await wait("matchMedia('(prefers-reduced-motion: reduce)').matches");
  await wait("document.querySelector('.room-world').dataset.motion==='reduced'"); await js("new Promise(r=>setTimeout(r,200))");
  // State/resize updates may redraw once in reduced motion; autonomous animation must stop.
  const reducedFrames=await js("Number(document.querySelector('.room-world').dataset.animatedFrames)"); await js("new Promise(r=>setTimeout(r,600))"); assert.equal(await js("Number(document.querySelector('.room-world').dataset.animatedFrames)"),reducedFrames);
  await alignedShot('reduced-motion-scene','.room-scene'); checks.push('OS reduced motion stops continuous WebGL frames');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await viewport(390,568);
  await js("document.querySelector('.study-room-request').scrollIntoView({block:'start'});scrollTo(0,document.documentElement.scrollHeight)");
  await wait("document.querySelector('.room-world').getBoundingClientRect().bottom<0");
  await js("new Promise(r=>setTimeout(r,200))"); const offscreenFrames=await js("Number(document.querySelector('.room-world').dataset.frames)");await js("new Promise(r=>setTimeout(r,600))");assert.equal(await js("Number(document.querySelector('.room-world').dataset.frames)"),offscreenFrames); checks.push('offscreen scene stops rendering');
  await alignedShot('context-before-loss','.room-scene');
  await js("document.querySelector('.room-world canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");
  await wait("document.querySelector('.room-scene').dataset.world==='fallback'"); await alignedShot('webgl-context-loss','.room-scene');
  assert.equal(await js("document.querySelectorAll('.room-world canvas').length"),0);
  await clickText('Thử lại cảnh 3D'); await readyWorld(); checks.push('context loss disposes canvas and retains participant/timer/music with explicit recovery');
  await viewport(1440,900); await navigate('/study-rooms/'+roomId+'?noWebGL=1'); await wait("document.querySelector('.room-scene')?.dataset.world==='fallback'"); await alignedShot('webgl-unavailable-desktop','.room-scene');
  await openMusic(); await wait("window.roomFixturePlayers.some(p=>!p.destroyed)"); await shot('fallback-music',undefined,true); await closeMusic();
  await js("document.documentElement.classList.add('dark')"); await alignedShot('webgl-unavailable-dark-desktop','.room-scene');
  await openMusic(); await shot('music-dark-desktop',undefined,true); await closeMusic(); await js("document.documentElement.classList.remove('dark')");
  await viewport(320,360);await alignedShot('webgl-unavailable-320x360','.room-scene');await fit('fallback-short');checks.push('actual unavailable WebGL path retains accessible list and Music dialog without a blank scene');
  }
  assert.deepEqual(await manifest(),candidateStart); assert.equal(errors.length,0,JSON.stringify(errors));
  console.log(JSON.stringify({dir,checks:checks.length,errors:errors.length,layoutMetrics}));
} catch(e) {
  if(call&&js){await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot')).data,'base64'));await writeFile(join(dir,'failure.txt'),String(e)+'\n'+await js("JSON.stringify({text:document.body.innerText,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,visibility:document.visibilityState,world:document.querySelector('.room-world')?.dataset,rect:document.querySelector('.room-world')?.getBoundingClientRect()})"));}
  throw e;
} finally {
  await writeFile(join(dir,'results.json'),JSON.stringify({phase,scope:process.env.ROOM_CHECK_SCOPE??'full',checks,errors,layoutMetrics,requests,candidateStart,candidateEnd:await manifest(),limits:'Actual Three.js via local Chromium software WebGL (SwiftShader); synthetic auth/API/YouTube, external assets blocked. Not real audio, backend authorization, live multiuser or physical GPU performance proof.'},null,2));
  socket?.close();chrome.kill('SIGTERM');console.log('Evidence: '+dir);
}
