// Local rendered fixtures, not live API, multiuser or YouTube proof.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const web = process.env.ROOM_WEB_URL ?? 'http://127.0.0.1:3000';
const phase = process.env.ROOM_PHASE ?? 'after';
const layoutOnly = !process.env.ROOM_CHECK_SCOPE || process.env.ROOM_CHECK_SCOPE === 'layout';
const lifecycleOnly = process.env.ROOM_CHECK_SCOPE === 'lifecycle';
const interactionOnly = process.env.ROOM_CHECK_SCOPE === 'interactions';
const discoveryOnly = process.env.ROOM_CHECK_SCOPE === 'discovery';
const statesOnly = process.env.ROOM_CHECK_SCOPE === 'states';
const viewports = JSON.parse(process.env.ROOM_VIEWPORTS ?? '[[1440,900],[1024,900],[768,1024],[800,600],[390,844],[320,568],[320,360]]');
const layoutMode = process.env.ROOM_LAYOUT_ROLE === 'member' ? 'member' : 'host';
const dir = await mkdtemp(join(tmpdir(), `room-listening-${phase}-`));
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
  'src/router/routes.tsx', 'tests/study-room-listening-browser-check.mjs',
  'src/features/study-room/components/room-listening-bar.tsx', 'src/features/study-room/components/room-track-dialog.tsx',
  'src/layouts/components/public-header.tsx', 'src/layouts/components/public-header.css', 'src/layouts/navigation.css', 'src/index.css',
  'src/components/ui/popover.tsx', 'tests/study-playback-selection.test.ts', 'tests/study-room-world.test.ts',
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
        if (path.endsWith('/close')) { state.closed = true; state.me = null; state.members = []; state.activeMembers = 0; }
        if (path.endsWith('/settings')) Object.assign(state, input);
        if (path.endsWith('/rhythm')) { Object.assign(state, input); state.rhythmVersion++; }
        if (path.endsWith('/owner')) { state.ownerId = input.userId; state.ownerName = state.members.find(m=>m.userId===input.userId)?.displayName; }
        if (path.endsWith('/tracks')) state.tracks.push({ id: 'track-2', videoId: 'test2', title: input.title, requestedById: uid, requestedByName: 'Nguyễn Minh Anh', status: state.ownerId === uid ? 'APPROVED' : 'PENDING', createdAt: new Date().toISOString() });
        if (path.endsWith('/approve')) state.tracks[0].status = 'APPROVED';
        if (path.endsWith('/reject')) state.tracks = state.tracks.filter(t => !path.includes(t.id));
        if (path.endsWith('/next')) {
          const next = state.tracks.find(track => track.status === 'APPROVED');
          state.playback = { videoId: next?.videoId ?? 'jfKfPfyJRdk', title: next?.title ?? 'Lofi Girl', isDefault: !next, version: state.playback.version + 1, startedAt: new Date().toISOString() };
          if (next) state.tracks = state.tracks.filter(track => track.id !== next.id);
        }
        if (state.me) state.me.canRequest = !state.tracks.some(t => t.requestedById === uid) && state.tracks.length < 50 && (state.ownerId === uid || state.requestPolicy === 'OPEN' || state.requestPolicy === 'AFTER_FOCUS' && state.me.remainingStudySeconds === 0);
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
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error' && /mergeGeometries|BufferGeometryUtils/.test(JSON.stringify(m.params.args))) errors.push(JSON.stringify(m.params.args));
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(Error(JSON.stringify(m.error))); else p.resolve(m.result); }
  };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const wait = async e => { for (let n = 0; n < 150; n++) { if (await js('Boolean('+e+')')) return; await new Promise(r => setTimeout(r, 100)); } throw Error(`Timeout: ${e}`); };
  const viewport = (width, height = 900) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  const navigate = async path => { console.log('Render '+path+' ('+mode+')'); await call('Page.navigate', { url: web + path }); await wait("!!document.querySelector('header')&&!document.querySelector('#startup-loader')&&!document.querySelector('#root[inert]')"); };
  const shot = async (name, selector, keepScroll = false) => { if (selector) await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`); else if (!keepScroll) await js('scrollTo(0,0)'); await js('new Promise(r=>setTimeout(r,250))'); await writeFile(join(dir, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); };
  const alignedShot = async (name, selector) => {
    await js(`scrollTo(0, document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().top + scrollY - document.querySelector('.public-header').getBoundingClientRect().height - 16)`);
    await shot(name, undefined, true);
  };
  const fit = async name => { assert.ok(await js('document.documentElement.scrollWidth<=innerWidth'), `${name}: overflow`); checks.push(`${name}: no horizontal overflow`); };
  const clickText = async text => {
    const find = `[...document.querySelectorAll('button,[role=menuitem]')].find(b=>b.textContent.trim()===${JSON.stringify(text)})`;
    // Do not silently "click" a control while a preceding mutation still disables it.
    await wait(`(()=>{const b=${find};return !!b&&!b.disabled&&b.getAttribute('aria-disabled')!=='true'})()`);
    await js(`(()=>{const b=${find};b.focus();b.click()})()`);
  };
  const fill = (selector, value) => js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`);
  const escape = async () => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); };
  await call('Page.enable'); await call('Page.bringToFront'); await call('Emulation.setFocusEmulationEnabled', { enabled: true }); await call('Runtime.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('olympic-theme',JSON.stringify({state:{theme:'light'},version:0}));
    // Faithful local control surface only. No external player or sound is used.
    window.roomFixturePlayers=[];
    if(location.search.includes('noWebGL')) {const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:native.call(this,kind,...args)}}
    window.YT={Player:class {constructor(slot,opts){this.opts=opts;this.volume=40;this.state=1;this.muted=false;this.destroyed=false;window.roomFixturePlayers.push(this);this.frame=document.createElement('iframe');this.frame.srcdoc='<body style="margin:0;background:#071d2d;color:#d9e7f0;display:grid;place-items:center;height:100vh;font:14px sans-serif">Synthetic YouTube player · no network/audio</body>';slot.replaceWith(this.frame);setTimeout(()=>{if(!window.holdRoomPlayerReady)opts.events.onReady({target:this})},20)}getIframe(){return this.frame}setVolume(v){this.volume=v}getVolume(){return this.volume}mute(){this.muted=true}unMute(){this.muted=false}isMuted(){return this.muted}emit(state){this.state=state;this.opts.events.onStateChange({target:this,data:state})}playVideo(){this.emit(1)}pauseVideo(){this.emit(2)}destroy(){this.destroyed=true;this.frame.remove()}}};` });

  const readyWorld = () => wait("document.querySelector('.room-scene')?.dataset.world==='ready'&&Number(document.querySelector('.room-world').dataset.frames)>0");
  const openMusic = async () => { await clickText('Nhạc'); await wait("!!document.querySelector('.room-music-dialog[open]')&&window.roomFixturePlayers.some(p=>!p.destroyed)"); await wait("!document.querySelector('.room-listening__play').disabled"); };
  const closeMusic = async () => { await escape(); await wait("!document.querySelector('.room-music-dialog[open]')"); };

  const pointer = async expression => {
    const r = await js("(()=>{const e="+expression+";e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r}); await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});
  };
  const people = async () => { await pointer("[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent.startsWith('Mọi người'))"); await wait("document.querySelector('.room-people-host').getBoundingClientRect().height>0"); };
  const queue = async () => { await pointer("[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent.startsWith('Hàng đợi'))"); };
  const add = async () => { await js("document.querySelector('.room-queue-heading button').focus();document.querySelector('.room-queue-heading button').click()"); await wait("!!document.querySelector('.room-track-dialog')"); };
  const changeTheme = async dark => { await js("document.documentElement.classList."+(dark?'add':'remove')+"('dark')"); await js("new Promise(r=>setTimeout(r,300))"); };
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (layoutOnly) for (const [width,height] of viewports) {
    await viewport(width,height); reset(layoutMode); await navigate('/study-rooms/'+roomId); await readyWorld();
    assert.equal(await js("window.roomFixturePlayers.length"),0);
    await shot(layoutMode+'-'+width+'x'+height); await alignedShot('scene-'+width+'x'+height,'.room-scene'); await fit(layoutMode+'-'+width+'x'+height);
    const metrics=await js("(()=>{const r=s=>{const a=document.querySelector(s).getBoundingClientRect();return{x:a.x,y:a.y,width:a.width,height:a.height}};return{viewport:[innerWidth,innerHeight],listening:r('.room-listening'),scene:r('.room-scene'),clock:r('.study-room-clock'),companion:r('.room-companion'),drawCalls:document.querySelector('.room-world').dataset.drawCalls}})()");
    layoutMetrics.push(metrics);
    assert.ok(Math.abs(metrics.listening.x-metrics.scene.x)<1&&Math.abs(metrics.listening.width-metrics.scene.width)<1&&Math.abs(metrics.clock.x-metrics.scene.x)<1&&Math.abs(metrics.clock.width-metrics.scene.width)<1,'stage edges align');
    if(width>=1200) assert.ok(metrics.companion.x>=metrics.scene.x+metrics.scene.width+16&&Math.abs(metrics.companion.y-metrics.listening.y)<1,'desktop companion adjacent and top aligned');
    else assert.ok(metrics.companion.y>=metrics.clock.y+metrics.clock.height+12&&Math.abs(metrics.companion.x-metrics.scene.x)<1,'tablet/mobile companion follows aligned stage');
    if(layoutMode==='member') assert.equal(await js("document.querySelector('.room-listening__next button').disabled"),true);
    await changeTheme(true); await shot(layoutMode+'-dark-'+width+'x'+height); await alignedShot('scene-dark-'+width+'x'+height,'.room-scene');
    await people(); await shot('people-dark-'+width+'x'+height,'.room-companion'); await queue(); await changeTheme(false);
    await openMusic(); await shot('music-'+width+'x'+height,undefined,true);
    await wait("document.querySelector('.room-listening__state').textContent.includes('Đang phát')");
    assert.equal(await js("window.roomFixturePlayers.filter(p=>!p.destroyed).length"),1);
    await js("window.originalPlayer=window.roomFixturePlayers.find(p=>!p.destroyed);window.originalIframe=document.querySelector('.study-music-player iframe')");
    await closeMusic(); await js("document.querySelector('.room-listening__play').click()");
    await wait("document.querySelector('.room-listening__state').textContent.includes('tạm dừng')");
    assert.equal(await js("window.originalPlayer.state"),2);
    if(width<768) {
      await pointer("document.querySelector('[aria-label=\"Âm lượng trên thiết bị này\"]')"); await wait("!!document.querySelector('.room-volume-popover')");
      await js("new Promise(r=>setTimeout(r,200))");
      const bounds=await js("(()=>{const e=document.querySelector('.room-volume-popover'),r=e.getBoundingClientRect();return{kind:'volume',viewport:[innerWidth,innerHeight],rect:r.toJSON(),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}})()"); layoutMetrics.push(bounds);
      assert.ok(bounds.rect.left>=15&&bounds.rect.right<=width-15&&bounds.rect.top>=15&&bounds.rect.bottom<=height-15,'volume popover stays within viewport');
      await fill('.room-volume-popover input','25'); await pointer("document.querySelector('.room-volume-popover button')"); await wait("window.originalPlayer.muted"); await pointer("document.querySelector('.room-volume-popover button')"); await wait("!window.originalPlayer.muted"); await shot('volume-'+width+'x'+height,undefined,true); await escape();
    } else await fill('.room-listening__volume input','25');
    assert.equal(await js("window.originalPlayer.volume"),25);
    await openMusic(); assert.equal(await js("document.querySelector('.study-music-player iframe')===window.originalIframe"),true);
    await changeTheme(true); await shot('music-dark-'+width+'x'+height,undefined,true);
    assert.ok(await js("(()=>{const d=document.querySelector('.room-music-dialog').getBoundingClientRect(),f=document.querySelector('.study-music-player__frame').getBoundingClientRect();return d.width<=innerWidth&&d.height<=innerHeight-30&&f.width>=200&&f.height>=200})()"));
    await closeMusic(); await changeTheme(false);
    await add(); await shot('add-'+width+'x'+height,undefined,true);
    assert.ok(await js("(()=>{const r=document.querySelector('.room-track-dialog').getBoundingClientRect();return r.width<=innerWidth&&r.height<=innerHeight-30})()"));
    await escape(); await wait("!document.querySelector('.room-track-dialog')");
    assert.equal(await js("document.activeElement===document.querySelector('.room-queue-heading button')"),true);
    checks.push(width+'x'+height+': actual Three.js light/dark, People, persistent Music, local pause and bounded Add dialog');
  }
  if (interactionOnly) {
    reset('host'); await viewport(1440,900); await navigate('/study-rooms/'+roomId); await readyWorld();
    await alignedShot('raycast-room','.room-scene');
    const scenePoint = async (x,y,z) => js("(async()=>{const{Vector3,OrthographicCamera}=await import('/node_modules/.vite/deps/three.js');const r=document.querySelector('.room-world canvas').getBoundingClientRect(),a=r.width/r.height,s=Math.max(5.35,8.2/a),c=new OrthographicCamera(-s*a,s*a,s,-s,.1,100);c.position.set(9,8,13);c.lookAt(0,1,0);c.updateMatrixWorld();const p=new Vector3("+x+","+y+","+z+").project(c);return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2}})()");
    const pointClick = async point => { await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point}); await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point}); };
    await pointClick(await scenePoint(3.15,2.75,-3.65)); await wait("!!document.querySelector('.room-music-dialog[open]')"); await shot('tv-opens-music',undefined,true);
    for(let i=0;i<10;i++) { await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9}); await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9}); assert.equal(await js("document.querySelector('.room-music-dialog').contains(document.activeElement)"),true); }
    await closeMusic(); await pointClick(await scenePoint(-1.65,1.68,-1.285)); await wait("!!document.querySelector('.room-scene-member-dialog')"); await shot('character-opens-details',undefined,true); await escape(); await wait("!document.querySelector('.room-scene-member-dialog')"); await queue();
    checks.push('actual TV/character raycasts; persistent Music keyboard Tab boundary; People activation for character detail');
    await add(); await fill('#room-youtube','https://www.youtube.com/watch?v=abcdefghijk'); await fill('#room-track-title','A track kept after failure');
    failure=true; await clickText('Thêm vào hàng đợi'); await wait("document.querySelector('.room-track-dialog [role=alert]')");
    assert.equal(await js("document.querySelector('#room-track-title').value"),'A track kept after failure'); await shot('add-error',undefined,true);
    failure=false; await escape(); await clickText('Kết nối lại'); await wait("!document.querySelector('.study-room-feedback[aria-busy=true]')");
    await add(); await clickText('Thêm vào hàng đợi'); await wait("document.querySelector('.room-track-success')");
    assert.equal(state.tracks.filter(t=>t.requestedById===uid).length,1);
    assert.equal(await js("document.querySelector('#room-youtube').disabled"),true); await shot('add-success-one-outstanding',undefined,true); await escape();
    checks.push('Add error retains draft; retry success; dialog stays open; approved owner track blocks another request');
    await wait("!document.querySelector('.room-track-dialog')"); await clickText('Đổi bài tiếp');
    await wait("document.querySelector('.room-listening h2').textContent==='A track kept after failure'");
    const nextCalls=requests.filter(r=>r.path.endsWith('/next')).length;
    await openMusic(); await js("window.roomFixturePlayers.find(p=>!p.destroyed).emit(0)"); await closeMusic();
    await wait("document.querySelector('.room-listening__play').textContent.includes('Nghe lại')");
    assert.equal(requests.filter(r=>r.path.endsWith('/next')).length,nextCalls); await shot('owner-local-ended');
    await js("document.querySelector('.room-listening__play').click()"); await wait("document.querySelector('.room-listening__state').textContent.includes('Đang phát')");
    assert.equal(requests.filter(r=>r.path.endsWith('/next')).length,nextCalls);
    assert.equal(requests.findLast(r=>r.path.endsWith('/next')&&r.method==='POST').input.expectedVersion,state.playback.version-1);
    checks.push('explicit versioned owner Next selects approved track; local ended and replay produce no shared mutation');
    await people(); await js("document.querySelector('.room-scene-seat__button').focus();document.querySelector('.room-scene-seat__button').click()");
    await wait("!!document.querySelector('.room-scene-member-dialog')"); await shot('participant-details',undefined,true); await escape();
    await wait("!document.querySelector('.room-scene-member-dialog')"); assert.equal(await js("document.activeElement.classList.contains('room-scene-seat__button')"),true);
    checks.push('accessible participant detail has recorded focus/name and returns focus on Escape');
    await queue(); await js("window.dispatchEvent(new Event('offline'))"); await wait("document.querySelector('.study-room-feedback')");
    assert.equal(await js("document.querySelector('.room-listening__next button').disabled"),true);
    await js("document.querySelector('.room-listening__play').click()"); await wait("document.querySelector('.room-listening__state').textContent.includes('tạm dừng')"); await shot('offline-local-controls');
    await js("window.dispatchEvent(new Event('online'))"); await wait("!document.querySelector('.study-room-feedback')");
    checks.push('offline disables shared Next but local pause still works; reconnect restores fresh room state');
    await pointer("document.querySelector('[aria-label=\"Tùy chọn phòng\"]')"); await clickText('Quy định và quản lý'); await wait("!!document.querySelector('.room-settings-dialog')"); await shot('owner-settings',undefined,true);
    await clickText('Kết thúc buổi học'); await wait("!!document.querySelector('[role=alertdialog]')"); await shot('owner-close-confirm',undefined,true); await clickText('Học tiếp'); await wait("!document.querySelector('[role=alertdialog]')"); assert.equal(await js("document.activeElement.textContent==='Kết thúc buổi học'"),true); await escape(); await wait("!document.querySelector('.room-settings-dialog')"); assert.equal(await js("document.activeElement.getAttribute('aria-label')==='Tùy chọn phòng'"),true);
    assert.equal(state.closed,false); checks.push('owner management is discoverable; closure remains explicit/cancellable');
    for(const policy of ['OPEN','HOST_ONLY','AFTER_FOCUS']) {
      reset('member'); state.requestPolicy=policy; if(policy==='AFTER_FOCUS') state.me.remainingStudySeconds=300;
      await navigate('/study-rooms/'+roomId); await readyWorld(); await add();
      assert.equal(await js("document.querySelector('#room-youtube').disabled"),policy!=='OPEN');
      await shot('member-add-'+policy,undefined,true); await escape(); await wait("!document.querySelector('.room-track-dialog')");
      assert.equal(await js("document.querySelector('.room-listening__next button').disabled"),true);
      assert.equal(await js("document.querySelectorAll('.study-room-queue__actions').length"),0);
      await openMusic(); await closeMusic(); await js("document.querySelector('.room-listening__play').click()");
      await wait("document.querySelector('.room-listening__state').textContent.includes('tạm dừng')");
    }
    checks.push('OPEN/HOST_ONLY/AFTER_FOCUS match server permission data; members retain local controls and cannot Next/moderate');
    for(const staff of ['ADMIN','LECTURER']) {
      role=staff; reset('member'); await navigate('/study-rooms/'+roomId); await readyWorld();
      assert.equal(await js("document.querySelector('.room-listening__next button').disabled"),true);
      assert.equal(await js("document.querySelectorAll('.study-room-queue__actions').length"),0);
    }
    role='STUDENT'; checks.push('nonowner ADMIN/LECTURER gain no owner controls');
    await viewport(320,568); state.playback.title='A very long real user supplied title — keeping the selected track separate from playback and queue permissions';
    await navigate('/study-rooms/'+roomId); await readyWorld(); await openMusic(); await js("window.roomFixturePlayers.find(p=>!p.destroyed).opts.events.onError({data:150})");
    await wait("document.querySelector('.study-music-player [role=alert]')"); await shot('long-title-player-error-320',undefined,true);
    await clickText('Thử lại'); await wait("window.roomFixturePlayers.some(p=>!p.destroyed)"); await closeMusic();
    checks.push('long-title 320px player error/Retry retains room selection');
  }
  if (lifecycleOnly) {
    reset('host'); await viewport(1440,900); await navigate('/study-rooms/'+roomId); await readyWorld();
    await js("window.themeCanvas=document.querySelector('.room-world canvas')");
    await changeTheme(true); assert.equal(await js("document.querySelector('.room-world canvas')===window.themeCanvas"),true);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await wait("Number(document.querySelector('.room-world').dataset.animatedFrames)>1");
    await viewport(1440,360); await js("scrollTo(0,0);new Promise(r=>setTimeout(r,250))"); const offscreen=await js("document.querySelector('.room-world').dataset.frames"); await js("new Promise(r=>setTimeout(r,400))"); assert.equal(await js("document.querySelector('.room-world').dataset.frames"),offscreen); await viewport(1440,900);
    await js("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");
    const hidden=await js("document.querySelector('.room-world').dataset.frames"); await js("new Promise(r=>setTimeout(r,400))"); assert.equal(await js("document.querySelector('.room-world').dataset.frames"),hidden);
    await js("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))");
    await js("window.dispatchEvent(new PageTransitionEvent('pagehide'))"); const pageHidden=await js("document.querySelector('.room-world').dataset.frames"); await js("new Promise(r=>setTimeout(r,400))"); assert.equal(await js("document.querySelector('.room-world').dataset.frames"),pageHidden); await js("window.dispatchEvent(new PageTransitionEvent('pageshow'))");
    await add(); const paused=await js("document.querySelector('.room-world').dataset.animatedFrames"); await js("new Promise(r=>setTimeout(r,500))"); assert.equal(await js("document.querySelector('.room-world').dataset.animatedFrames"),paused); await escape(); await wait("!document.querySelector('.room-track-dialog')");
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await js("new Promise(r=>setTimeout(r,200))"); const reduced=await js("document.querySelector('.room-world').dataset.animatedFrames"); await js("new Promise(r=>setTimeout(r,500))"); assert.equal(await js("document.querySelector('.room-world').dataset.animatedFrames"),reduced);
    await js("document.querySelector('.room-world canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()"); await wait("document.querySelector('.room-scene').dataset.world==='fallback'");
    await people(); await shot('context-loss-fallback','.room-scene'); await clickText('Thử lại cảnh 3D'); await readyWorld();
    for(const [w,h] of [[1440,900],[768,1024],[320,360]]) {
      await viewport(w,h); await navigate('/study-rooms/'+roomId+'?noWebGL'); await wait("document.querySelector('.room-scene').dataset.world==='fallback'");
      await people(); await shot('fallback-'+w+'x'+h); await alignedShot('fallback-scene-'+w+'x'+h,'.room-scene'); await fit('fallback-'+w);
      await openMusic(); await shot('fallback-music-'+w+'x'+h,undefined,true); await closeMusic();
    }
    reset('host'); state.members=Array.from({length:50},(_,i)=>({userId:'member-'+i,displayName:'Thành viên '+i,focusSeconds:600,online:true})); state.activeMembers=50;
    await viewport(1440,900); await navigate('/study-rooms/'+roomId); await readyWorld(); await people(); await shot('fifty-member-page','.room-scene');
    assert.equal(await js("document.querySelectorAll('.room-scene-seat__button').length"),12);
    await js("document.querySelector('[aria-label=\"Bàn tiếp\"]').click()"); assert.equal(await js("document.querySelectorAll('.room-scene-seat__button').length"),12);
    await js("window.roomCanvas=document.querySelector('.room-world canvas');window.roomGL=window.roomCanvas.getContext('webgl2')");
    await openMusic(); await closeMusic(); await pointer("document.querySelector('.study-room-back')"); await wait("!document.querySelector('.room-scene')");
    assert.equal(await js("window.roomCanvas.isConnected"),false); assert.equal(await js("window.roomGL.isContextLost()"),true); assert.equal(await js("window.roomFixturePlayers.every(p=>p.destroyed)"),true);
    checks.push('theme without renderer rebuild; animation paused behind Add/reduced motion; context loss/retry; desktop/tablet/short non-WebGL usable Music/People; fifty-member pagination');
  }
  if (discoveryOnly) {
    for(const width of [1440,768,320]) {
      const joinsBefore=requests.filter(r=>r.path.endsWith('/join')&&r.method==='POST').length;
      await viewport(width,width===320?568:900); role=null; await navigate('/toolkit?tool=rooms'); await wait("!!document.querySelector('.study-room-access')"); await shot('guest-'+width);
      role='STUDENT'; reset('preview'); await navigate('/study-rooms/'+roomId); await readyWorld(); assert.equal(await js("window.roomFixturePlayers.length"),0); await shot('preview-'+width);
      assert.equal(requests.filter(r=>r.path.endsWith('/join')&&r.method==='POST').length,joinsBefore);
      await clickText('Tham gia phòng'); await wait("!!document.querySelector('.room-listening')"); await readyWorld(); await shot('joined-'+width);
    }
    checks.push('guest access and login return; explicit preview without player/join; deliberate Join across desktop/tablet/mobile');
    for(const [w,h] of [[1440,900],[320,360]]) {
      await viewport(w,h); reset('preview'); empty=true; await navigate('/toolkit?tool=rooms'); await wait("document.querySelector('.study-rooms-lobby__list-heading')"); await shot('lobby-empty-'+w);
      await clickText('Tạo phòng'); await fill('#study-room-name','A new study session'); await shot('create-'+w,undefined,true); await fit('create-'+w);
      failure=true; await clickText('Tạo phòng và vào học'); await wait("document.querySelector('.study-room-create [role=alert]')"); assert.equal(await js("document.querySelector('#study-room-name').value"),'A new study session'); await shot('create-error-'+w,undefined,true);
      failure=false; await clickText('Tạo phòng và vào học'); await wait("!!document.querySelector('.room-listening')"); await readyWorld(); assert.equal(state.name,'A new study session'); assert.equal(state.requestPolicy,'AFTER_FOCUS'); assert.equal(await js("window.roomFixturePlayers.length"),0);
    }
    checks.push('desktop/short-mobile empty discovery and create; failed creation preserves form; explicit creation joins without activating audio');
  }
  if(statesOnly) {
    for(const [w,h] of [[1440,900],[800,600],[320,360]]) {
      await viewport(w,h); reset('host'); loading=true; holdWorld=true;
      await navigate('/study-rooms/'+roomId); await wait("document.querySelector('.room-scene')?.dataset.world==='loading'"); await shot('scene-loading-'+w);
      holdWorld=false; loading=false; await readyWorld(); state.tracks=[]; await js("window.dispatchEvent(new Event('online'))"); await wait("document.querySelector('.room-companion__tabs').textContent.includes('Hàng đợi 0')");
      await shot('empty-queue-'+w); await fit('empty-queue-'+w); await add(); await shot('add-empty-'+w,undefined,true); await escape(); await wait("!document.querySelector('.room-track-dialog')");
      await js("window.holdRoomPlayerReady=true"); await clickText('Nhạc'); await wait("document.querySelector('.room-listening__state').textContent.includes('Đang kết nối')"); await shot('player-loading-'+w,undefined,true);
      await js("window.roomFixturePlayers.find(p=>!p.destroyed).opts.events.onReady({target:window.roomFixturePlayers.find(p=>!p.destroyed)})"); await wait("document.querySelector('.room-listening__state').textContent.includes('Đang phát')");
      await js("window.roomFixturePlayers.find(p=>!p.destroyed).emit(3)"); await shot('player-buffering-'+w,undefined,true);
      await js("window.roomFixturePlayers.find(p=>!p.destroyed).opts.events.onAutoplayBlocked()"); await wait("document.querySelector('.room-listening__state').textContent.includes('Bấm Bật nhạc')"); await shot('player-blocked-'+w,undefined,true);
      await js("window.roomFixturePlayers.find(p=>!p.destroyed).opts.events.onError({data:153})"); await shot('player-error-'+w,undefined,true); await closeMusic();
      await js("window.holdRoomPlayerReady=false"); await clickText('Nhạc'); await clickText('Thử lại'); await wait("document.querySelector('.room-listening__state').textContent.includes('Đang phát')"); await closeMusic();
      await js("document.querySelector('.room-listening__play').focus()"); await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32}); await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32}); await wait("document.querySelector('.room-listening__state').textContent.includes('tạm dừng')");
      assert.equal(requests.filter(r=>r.path.endsWith('/next')&&r.method==='POST').length,0);
      checks.push(w+'px: actual scene loading, empty queue, player loading/buffering/blocked/error/Retry and keyboard local pause');
    }
    await viewport(1440,900); reset('host'); await navigate('/study-rooms/'+roomId); await readyWorld();
    await pointer("document.querySelector('.study-room-queue__actions button')"); await wait("document.querySelector('.room-listening__next').textContent.includes('Một buổi chiều')");
    assert.equal(state.tracks[0].status,'APPROVED'); await shot('queue-approved');
    await pointer("[...document.querySelectorAll('.study-room-queue__actions button')].find(e=>e.textContent==='Bỏ')"); await wait("document.querySelector('.room-companion__tabs').textContent.includes('Hàng đợi 0')");
    await clickText('Chỉnh giờ'); await wait("!!document.querySelector('.room-rhythm-dialog')"); await shot('rhythm-dialog',undefined,true); await clickText('50 / 10 / 20'); await clickText('Bắt đầu nhịp mới'); await wait("!document.querySelector('.room-rhythm-dialog')"); assert.equal(state.focusMinutes,50); assert.equal(state.me.focusSeconds,1380);
    await pointer("document.querySelector('[aria-label=\"Tùy chọn phòng\"]')"); await clickText('Quy định và quản lý'); await clickText('Chọn chủ phòng mới');
    await fill('[role=dialog]:not(.room-settings-dialog) select',owner); await shot('transfer-confirm',undefined,true); await clickText('Xác nhận chuyển quyền'); await wait("document.querySelector('.room-listening__next button').disabled&&!document.querySelector('[role=dialog]:not(.room-settings-dialog)')"); assert.equal(state.ownerId,owner); await js("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"); await escape(); await wait("!document.querySelector('.room-settings-dialog')");
    checks.push('owner approved/rejected queue; versioned rhythm retains accounting; explicit transfer removes owner Next');
    reset('host'); await navigate('/study-rooms/'+roomId); await readyWorld(); await openMusic(); await closeMusic();
    await pointer("document.querySelector('[aria-label=\"Tùy chọn phòng\"]')"); await clickText('Quy định và quản lý'); await clickText('Kết thúc buổi học'); await clickText('Đóng phòng học'); await wait("document.querySelector('.study-room-page').textContent.includes('Buổi học đã khép lại')");
    assert.equal(await js("window.roomFixturePlayers.every(p=>p.destroyed)"),true); await shot('closed-room');
    reset('member'); await navigate('/study-rooms/'+roomId); await readyWorld(); await openMusic(); await closeMusic(); await pointer("document.querySelector('[aria-label=\"Tùy chọn phòng\"]')"); await clickText('Rời phòng'); await wait("!document.querySelector('.room-listening')&&location.pathname==='/toolkit'"); assert.equal(state.me,null); assert.equal(await js("window.roomFixturePlayers.every(p=>p.destroyed)"),true);
    checks.push('explicit closure and member Leave clean up player');
    reset('preview'); failure=true; await navigate('/study-rooms/'+roomId); await wait("document.querySelector('.study-room-feedback [role=alert]')"); await shot('room-request-error'); failure=false; await clickText('Thử kết nối lại'); await readyWorld();
    checks.push('room API failure is not empty; Retry restores preview without implicit Join');
  }
  assert.deepEqual(await manifest(),candidateStart,'candidate changed during run');
  assert.deepEqual(errors,[]);
  await writeFile(join(dir,'results.json'),JSON.stringify({checks,errors,layoutMetrics,requests,candidateStart,candidateEnd:await manifest(),limits:'Actual Three.js/SwiftShader. Synthetic auth/API/YouTube. Not real media, backend authorization, multiuser or device GPU proof.'},null,2));
  console.log(JSON.stringify({dir,checks:checks.length,errors}));
} catch(error) {
  if(call && js) try {
    await writeFile(join(dir,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));
    await writeFile(join(dir,'failure-dom.json'),JSON.stringify(await js("({active:document.activeElement?.outerHTML.slice(0,500),tabs:[...document.querySelectorAll('[role=tab]')].map(e=>({html:e.outerHTML,rect:e.getBoundingClientRect().toJSON()})),dialogs:[...document.querySelectorAll('[role=dialog],dialog')].map(e=>({html:e.outerHTML.slice(0,1500),animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration})),people:document.querySelector('.room-people-host')?.outerHTML,world:document.querySelector('.room-scene')?.dataset.world})"),null,2));
  } catch { /* Retain original failure if the browser itself is unavailable. */ }
  await writeFile(join(dir,'failed.json'),JSON.stringify({error:String(error),checks,errors,requests,candidateStart,candidateEnd:await manifest()},null,2)); console.error(dir); throw error;
} finally { socket?.close(); chrome.kill(); }
