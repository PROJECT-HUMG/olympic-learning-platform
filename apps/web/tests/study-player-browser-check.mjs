// Deterministic component-level event/lifecycle evidence; no real YouTube/audio.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const phase = 'local'; // Timestamp-sync baseline mode is obsolete under the current product decision.
const web = process.env.PLAYER_WEB_URL ?? 'http://127.0.0.1:3000';
const dir = await mkdtemp(join(tmpdir(), `study-player-${phase}-`));
const paths = ['src/features/study-room/components/study-music-player.tsx','src/features/study-room/components/study-music-player.css','src/features/study-room/lib/playback-selection.ts','src/features/study-room/components/study-room-session.tsx','tests/fixtures/study-player.tsx','tests/study-player-browser-check.mjs','tests/study-playback-selection.test.ts'];
const manifest = async () => Object.fromEntries(await Promise.all(paths.map(async p=>[p,createHash('sha256').update(await readFile(new URL(`../${p}`,import.meta.url))).digest('hex')])));
const candidateStart = await manifest(), checks = [], errors = [];
const chrome = spawn(process.env.PLAYER_CHROME_PATH ?? '/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', ['--headless','--no-sandbox','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${dir}/profile`,'about:blank']);
let socket, call, js;
try {
  const endpoint=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Chromium timeout')),15000);chrome.stderr.on('data',b=>{const m=String(b).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});chrome.on('error',reject);});
  const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>{socket.onopen=r;});let serial=0;const pending=new Map();
  call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
    if(m.method==='Fetch.requestPaused') {const u=new URL(m.params.request.url);void call(u.origin===new URL(web).origin?'Fetch.continueRequest':'Fetch.fulfillRequest',{requestId:m.params.requestId,...(u.origin===new URL(web).origin?{}:{responseCode:404})});}
    if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);}};
  js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=async e=>{for(let n=0;n<100;n++){if(await js(e))return;await new Promise(r=>setTimeout(r,50));}throw Error(`Timeout: ${e}`);};
  const click=async label=>js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b||b.disabled)throw Error('Unavailable control');b.click()})()`);
  const count=event=>js(`fixture.snapshot().log.filter(e=>e.event===${JSON.stringify(event)}).length`);
  await call('Page.enable');await call('Runtime.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await call('Page.navigate',{url:web+'/tests/fixtures/study-player.html'});await wait("!!window.fixture&&!!document.querySelector('.study-music-player__controls button:not(:disabled)')");
  assert.equal(await js('fixture.snapshot().alive'),1); assert.equal(await js('fixture.snapshot().timers'),1); checks.push('StrictMode initializes exactly one live player/local-audio timer');
  await js('fixture.clear();fixture.rerender()');await js('new Promise(r=>setTimeout(r,100))');assert.equal(await count('create'),0);assert.equal(await count('destroy'),0);checks.push('same snapshot/parent rerender does not rebuild iframe');
  await js('fixture.tick(6000)');assert.equal(await count('seek'),0);checks.push('default live stream never seeks');
  await js('fixture.defaultVersion()');await js('new Promise(r=>setTimeout(r,100))');
  const defaultRebuilds=await count('create');
  assert.equal(defaultRebuilds,0);checks.push({defaultVersionRebuilds:defaultRebuilds});
  await js('fixture.finite()');await wait("fixture.snapshot().lastVideo==='abcdefghijk'&&fixture.snapshot().lastState===1&&document.querySelector('.study-music-player__controls button').textContent.trim()==='Tạm dừng'");
  {
    assert.equal(await js('fixture.snapshot().devices[0].start'),null);checks.push('finite video initializes without room-derived start timestamp');
    await js('fixture.clear();fixture.localSeek(17);fixture.native(1);fixture.tick(30000)');
    assert.equal(await count('seek'),0);assert.equal(await js('fixture.snapshot().devices[0].position'),47);checks.push('PLAYING and polling never correct local finite position');
    await click('Tạm dừng');await js('fixture.clear();fixture.tick(30000)');assert.equal(await count('seek'),0);checks.push('local pause is preserved; paused player does not chase server clock');
    await click('Bật nhạc');assert.ok((await count('play'))>=1);
    await js('fixture.clear();fixture.native(3);fixture.tick(30000)');assert.equal(await count('seek'),0);
    await js('fixture.native(1);fixture.tick(30000)');assert.equal(await count('seek'),0);checks.push('buffering and resume do not correct position');
    await js('fixture.clear();fixture.timestamp();fixture.rerender()');await js('new Promise(r=>setTimeout(r,50))');await js('fixture.tick(30000)');assert.equal(await count('seek'),0);assert.equal(await count('create'),0);checks.push('room timestamp/refetch changes neither reset nor seek local playback');
    await click('Tạm dừng');await js('fixture.clear();fixture.nextVideo()');await wait("fixture.snapshot().lastVideo==='lmnopqrstuv'&&fixture.snapshot().lastState===2&&document.querySelector('.study-music-player__controls button').textContent.trim()==='Bật nhạc'");
    assert.equal(await count('create'),1);assert.equal(await count('destroy'),1);assert.equal(await js('fixture.snapshot().alive'),1);assert.equal(await js('fixture.snapshot().timers'),1);checks.push('video selection replaces one player and preserves local pause; no leaked timers');
    await js('fixture.clear();fixture.staleEvent()');assert.equal(await js('fixture.snapshot().lastState'),2);
    await js('fixture.native(0);fixture.native(0)');await wait("document.querySelector('.study-music-player__status').textContent.includes('đã kết thúc trên thiết bị này')");assert.equal(await count('create'),0);assert.equal(await count('seek'),0);checks.push('stale callbacks ignored; local ended only shows local replay state');
    await js('fixture.blocked()');await wait("document.querySelector('.study-music-player__controls button').textContent.trim()==='Bật nhạc'");await click('Bật nhạc');checks.push('autoplay blocking retains user-gesture play recovery');
    for(const code of [100,153]){await js(`fixture.error(${code})`);await wait("document.querySelector('.study-music-player__status').getAttribute('role')==='alert'");await click('Thử lại');await wait("fixture.snapshot().alive===1&&fixture.snapshot().lastState===1&&document.querySelector('.study-music-player__controls button').textContent.trim()==='Tạm dừng'");assert.equal(await js('fixture.snapshot().alive'),1);assert.equal(await js('fixture.snapshot().timers'),1);}
    checks.push('embedding/identity errors clean up and allow explicit retry');
    await js('fixture.mount(false)');await js('new Promise(r=>setTimeout(r,50))');assert.equal(await js('fixture.snapshot().alive'),0);assert.equal(await js('fixture.snapshot().timers'),0);checks.push('unmount destroys player and clears local-audio timer');
    await call('Page.navigate',{url:web+'/tests/fixtures/study-player.html?pair=1'});await wait('!!window.fixture&&fixture.snapshot().alive===2&&fixture.snapshot().devices.every(p=>p.state===1)');
    await js('fixture.finite()');await wait("fixture.snapshot().devices.length===2&&fixture.snapshot().devices.every(p=>p.video==='abcdefghijk'&&p.state===1)");
    await js('fixture.clear();fixture.localSeek(70,0);fixture.localSeek(10,1);fixture.tick(30000);fixture.tick(30000);fixture.timestamp();fixture.rerender()');await js('new Promise(r=>setTimeout(r,50))');
    assert.deepEqual(await js('fixture.snapshot().devices.map(p=>p.position)'),[130,70]);assert.equal(await count('seek'),0);assert.equal(await count('create'),0);checks.push('two devices keep distinct positions for the same track after polling and room timestamp/refetch changes');
    await js('fixture.native(2,0);fixture.audio(75,true,0);fixture.audio(20,false,1);fixture.tick(30000)');
    assert.deepEqual(await js('fixture.snapshot().devices.map(p=>p.position)'),[130,100]);assert.deepEqual(await js('fixture.snapshot().devices.map(p=>[p.volume,p.muted])'),[[75,true],[20,false]]);checks.push('pause/mute/volume on one device leave the other listener independent');
    await js('fixture.localSeek(599,0);fixture.native(0,0);fixture.tick(30000)');await js('new Promise(r=>setTimeout(r,50))');
    assert.deepEqual(await js('fixture.snapshot().devices.map(p=>[p.video,p.position,p.state])'),[['abcdefghijk',599,0],['abcdefghijk',130,1]]);assert.equal(await count('create'),0);assert.equal(await count('seek'),0);checks.push('seek-to-end/ended on one device leaves shared selection and other playback untouched');
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await writeFile(join(dir,'independent-players-desktop.png'),Buffer.from((await call('Page.captureScreenshot')).data,'base64'));
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await writeFile(join(dir,'independent-players-mobile.png'),Buffer.from((await call('Page.captureScreenshot')).data,'base64'));
    await js('fixture.native(2,0);fixture.clear();fixture.nextVideo()');await wait("fixture.snapshot().devices.length===2&&fixture.snapshot().devices.every(p=>p.video==='lmnopqrstuv')");await wait('fixture.snapshot().devices[0].state===2&&fixture.snapshot().devices[1].state===1');
    assert.equal(await count('create'),2);assert.equal(await count('destroy'),2);assert.deepEqual(await js('fixture.snapshot().devices.map(p=>[p.volume,p.muted,p.start])'),[[75,true,null],[20,false,null]]);checks.push('shared selection changes load the new video while keeping each device audio/play preference');
    await call('Page.navigate',{url:web+'/tests/fixtures/study-player.html?api=fail'});await wait("!!window.fixture&&document.querySelector('.study-music-player__status')?.getAttribute('role')==='alert'");
    await js('fixture.installApi()');await click('Thử lại');await wait("fixture.snapshot().alive===1&&fixture.snapshot().lastState===1");checks.push('blocked API script reports failure and explicit retry can initialize');
    await call('Page.navigate',{url:web+'/tests/fixtures/study-player.html?ready=held'});await wait("!!window.fixture&&fixture.snapshot().alive===1");await js('fixture.mount(false)');await js('new Promise(r=>setTimeout(r,50))');await js('fixture.lateReady()');
    assert.equal(await js('fixture.snapshot().alive'),0);assert.equal(await js('fixture.snapshot().timers'),0);checks.push('late initialization callback after unmount is ignored');
    assert.equal(errors.length,0);assert.deepEqual(await manifest(),candidateStart);console.log(JSON.stringify({phase,dir,checks:checks.length,errors:errors.length}));
  }
} finally {
  await writeFile(join(dir,'results.json'),JSON.stringify({phase,checks,errors,snapshot:js?await js('window.fixture?.snapshot()'):null,candidateStart,candidateEnd:await manifest(),limits:'Deterministic component fake YouTube API/delayed seek/native events. Not actual media smoothness, live API/auth or multiuser synchronization.'},null,2));
  socket?.close();chrome.kill('SIGTERM');console.log(`Evidence: ${dir}`);
}
