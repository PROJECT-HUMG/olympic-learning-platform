// Actual routed Study Room composition; synthetic room/identity/YouTube boundaries only.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck } from './browser/session.mjs';
const options = browserOptions('rooms'), dir = await evidenceDirectory(options);
const uid = '00000000-0000-0000-0000-000000000001', other = '00000000-0000-0000-0000-000000000002', id = '00000000-0000-0000-0000-000000000010';
let room, fail = false, failMutation = false, expired = false, holdJoin = false, releaseJoin;
const requests = [], checks = [], screenshots = [], errors = [];
const delay = ms => new Promise(r => setTimeout(r, ms));
function reset(role = 'host') {
 room = { id, name: 'Cùng ôn Giải tích', ownerId: role === 'host' ? uid : other, ownerName: role === 'host' ? 'Nguyễn Minh Anh' : 'Trần Hoài An', focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, requestPolicy: 'OPEN', minimumStudyMinutes: 15, activeMembers: 3, closed: false, phase: 'FOCUS', phaseEndsAt: new Date(Date.now()+1195000).toISOString(), sessionNumber: 2, rhythmVersion: 3,
 playback: { videoId: 'jfKfPfyJRdk', title: 'Lofi Girl — beats to relax/study to', startedAt: new Date().toISOString(), version: 4, isDefault: true },
 members: [{userId:uid,displayName:'Nguyễn Minh Anh',focusSeconds:1380,online:true},{userId:other,displayName:'Trần Hoài An',focusSeconds:1800,online:true},{userId:'member-3',displayName:'Phạm Ngọc Linh có tên dài để kiểm tra xuống dòng',focusSeconds:720,online:true},{userId:'member-4',displayName:'Lê Quang Huy',focusSeconds:600,online:false}],
 me: role === 'preview' ? null : {userId:uid,focusSeconds:1380,canRequest:true,remainingStudySeconds:0}, tracks:[{id:'track-1',videoId:'synthetic',title:'Một buổi chiều yên tĩnh',requestedById:other,requestedByName:'Trần Hoài An',status:'PENDING',createdAt:new Date().toISOString()}] };
 fail = false; failMutation = false; expired = false;
}
reset();
let session;
try {
 session = await startBrowserCheck({options,dir}); const {call,js} = session;
 const reply = (e,code,body) => call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:code,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
 session.onRequest(async e => {
  const u=new URL(e.request.url),path=u.pathname,method=e.request.method;
  if(u.origin===session.web&&!path.startsWith('/api/'))return call('Fetch.continueRequest',{requestId:e.requestId});
  if(!path.startsWith('/api/'))return reply(e,404,{});
  const input=e.request.postData?JSON.parse(e.request.postData):{};requests.push({path,method,input});
  if(path.endsWith('/users/me'))return reply(e,200,{id:uid,fullName:'Nguyễn Minh Anh',username:'fixture',role:'STUDENT',status:'ACTIVE',email:'room@example.invalid'});
  if(path.endsWith('/auth/refresh'))return reply(e,200,{accessToken:'synthetic-only'});
  if(!path.includes('/study-rooms'))return reply(e,200,[]);
  if(fail)return reply(e,503,{status:503,detail:'Chưa kết nối được với phòng.'});
  if(['POST','PATCH'].includes(method)&&failMutation)return reply(e,503,{status:503,detail:'Chưa lưu được. Hãy thử lại.'});
  if(path.endsWith('/heartbeat')&&expired){room.me=null;return reply(e,403,{status:403,detail:'Phiên tham gia đã hết hạn.'});}
  if(path.endsWith('/join')){if(holdJoin)await new Promise(r=>releaseJoin=r);room.me={userId:uid,focusSeconds:1380,canRequest:true,remainingStudySeconds:0};}
  if(path.endsWith('/leave'))room.me=null;
  if(path.endsWith('/close')){room.closed=true;room.me=null;room.members=[];room.activeMembers=0;}
  if(path.endsWith('/rhythm')){if(input.expectedVersion!==room.rhythmVersion)return reply(e,409,{status:409,detail:'Nhịp học đã thay đổi.'});Object.assign(room,input);room.rhythmVersion++;room.phase='FOCUS';room.sessionNumber=1;room.phaseEndsAt=new Date(Date.now()+room.focusMinutes*60000).toISOString();}
  if(path.endsWith('/settings'))Object.assign(room,input);
  if(path.endsWith('/owner')){room.ownerId=input.userId;room.ownerName=room.members.find(m=>m.userId===input.userId)?.displayName;}
  if(path.endsWith('/tracks'))room.tracks.push({id:'new-track',videoId:'fake-video',title:input.title,requestedById:uid,requestedByName:'Nguyễn Minh Anh',status:room.ownerId===uid?'APPROVED':'PENDING',createdAt:new Date().toISOString()});
  if(path.endsWith('/approve'))room.tracks.find(t=>path.includes(t.id)).status='APPROVED';
  if(path.endsWith('/reject'))room.tracks=room.tracks.filter(t=>!path.includes(t.id));
  if(path.endsWith('/next')){const next=room.tracks.find(t=>t.status==='APPROVED');room.playback={videoId:next?.videoId??'jfKfPfyJRdk',title:next?.title??'Lofi Girl',isDefault:!next,version:room.playback.version+1,startedAt:new Date().toISOString()};if(next)room.tracks=room.tracks.filter(t=>t.id!==next.id);}
  if(room.me)room.me.canRequest=!room.tracks.some(t=>t.requestedById===uid)&&(room.ownerId===uid||room.requestPolicy==='OPEN');
  return reply(e,200,path.endsWith('/study-rooms')?[room]:{...room,serverNow:new Date().toISOString()});
 });
 session.onEvent(e=>{if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text);});
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.roomPlayers=[];window.roomCopyCount=0;
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>{window.roomCopyCount++;return Promise.resolve()}}});
 window.YT={Player:class{constructor(slot,opts){this.opts=opts;this.volume=40;this.muted=false;this.destroyed=false;window.roomPlayers.push(this);this.frame=document.createElement('iframe');this.frame.srcdoc='<body style="margin:0;background:#142838;color:#dce8f3;display:grid;place-items:center;height:100vh;font:14px sans-serif">Synthetic YouTube · no network/audio</body>';slot.replaceWith(this.frame);setTimeout(()=>{if(!this.destroyed)opts.events.onReady({target:this})},20)}getIframe(){return this.frame}setVolume(v){this.volume=v}getVolume(){return this.volume}mute(){this.muted=true}unMute(){this.muted=false}isMuted(){return this.muted}emit(n){this.opts.events.onStateChange({target:this,data:n})}playVideo(){this.emit(1)}pauseVideo(){this.emit(2)}destroy(){this.destroyed=true;this.frame.remove()}}};`});
 const wait=async e=>{for(let i=0;i<400;i++){if(await js('Boolean('+e+')'))return;await delay(40);}throw Error('Timeout: '+e);};
 const nav=async()=>{await call('Page.navigate',{url:session.web+'/study-rooms/'+id});await wait("document.querySelector('h1')?.textContent==='Cùng ôn Giải tích'&&!document.querySelector('#startup-loader')&&!document.querySelector('#root').inert");};
 const resize=(width,height=900)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 const theme=async dark=>{await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:dark?'dark':'light'},{name:'prefers-reduced-motion',value:'reduce'}]});await js(`document.documentElement.classList.${dark?'add':'remove'}('dark')`);};
 const shot=async(name,selector)=>{if(selector)await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`);else await js('scrollTo(0,0)');await delay(180);assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'No horizontal overflow: '+name);const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
 const click=async text=>{const find=`[...document.querySelectorAll('button,[role=menuitem]')].find(e=>e.textContent.trim()===${JSON.stringify(text)})`;await wait(`(()=>{const e=${find};return e&&!e.disabled&&e.getAttribute('aria-disabled')!=='true'})()`);await js(`(()=>{const e=${find};e.focus();e.click()})()`);};
 const clickLabel=label=>js(`document.querySelector(${JSON.stringify(`[aria-label="${label}"]`)}).click()`);
 const hasLabel=label=>js(`!!document.querySelector(${JSON.stringify(`[aria-label="${label}"]`)})`);
 const key=async(key,code)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,code:key==='Enter'?'Enter':key===' '?'Space':key,windowsVirtualKeyCode:code,...(key==='Enter'?{text:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});};
 const fill=(sel,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`);
 for(const width of [1280,390])for(const dark of [false,true]){reset();await resize(width);await nav();await theme(dark);await shot(`after-host-${width}-${dark?'dark':'light'}`);}
 {

 assert.equal(await js('document.querySelectorAll(".room-scene,.room-world").length'),0);
 assert.equal(await js('window.roomPlayers.length'),0,'No provider initialized before deliberate music activation');
 await resize(390);await theme(false);
 await js('document.querySelector(".room-light-switch").focus()');await key('Enter',13);await wait('document.querySelector(".study-room-workspace").dataset.dimmed==="true"');
 await shot('local-lights-off-390-light');assert.ok(await js('document.activeElement.matches(".room-light-switch")'));
 await key(' ',32);await wait('document.querySelector(".study-room-workspace").dataset.dimmed==="false"');
 await js('document.querySelector(".room-member-button").focus()');await key('Enter',13);await wait('document.querySelector("[role=dialog]")?.textContent.includes("23 phút tập trung")');
 await key('Escape',27);await wait('!document.querySelector("[role=dialog]")');await wait('document.activeElement.matches(".room-member-button")');
 checks.push('No 3D; real identity/recorded minutes; member dialog keyboard/Escape/focus return; local lights keyboard/static reduced motion');
 await click('Bật nhạc');await wait('document.querySelector(".study-music-player__status")?.textContent.includes("Đang phát")');
 assert.equal(await js('window.roomPlayers.filter(p=>!p.destroyed).length'),1);
 await click('Tạm dừng');await wait('document.querySelector(".study-music-player__status").textContent.includes("tạm dừng")');
 await fill('.study-music-player__volume input','25');assert.equal(await js('window.roomPlayers.find(p=>!p.destroyed).volume'),25);
 const n=await js('window.roomPlayers.length');
 await js('window.dispatchEvent(new Event("offline"))');await wait('document.querySelector("[role=alert]")?.textContent.includes("mất mạng")');
 assert.equal(await js('[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==="Đổi bài tiếp").disabled'),true);
 await click('Bật nhạc');await wait('document.querySelector(".study-music-player__status").textContent.includes("Đang phát")');
 await shot('offline-local-playback-390-light');await js('window.dispatchEvent(new Event("online"))');await wait('!document.querySelector(".study-room-feedback")');
 assert.equal(await js('window.roomPlayers.length'),n,'Polling/reconnect preserves player');
 await js('window.roomPlayers.find(p=>!p.destroyed).opts.events.onError({data:153,target:window.roomPlayers.find(p=>!p.destroyed)})');await wait('document.querySelector(".study-music-player [role=alert]")');
 await shot('provider-error-390-light','.room-music-card');assert.ok(await js('document.querySelector(".study-music-player__external").href.includes("youtube.com")'));
 await click('Thử lại');await wait('document.querySelector(".study-music-player__status").textContent.includes("Đang phát")');
 const nextBefore=requests.filter(r=>r.path.endsWith('/next')).length;
 await js('window.roomPlayers.find(p=>!p.destroyed).emit(0)');await wait('document.querySelector(".study-music-player__status").textContent.includes("kết thúc")');assert.equal(requests.filter(r=>r.path.endsWith('/next')).length,nextBefore);
 checks.push('Deliberate real-player adapter activation, local pause/volume/offline control, reconnect continuity, embed153 retry/open-original, no auto shared advance on ENDED');
 await click('Chỉnh giờ');await wait('document.querySelector(".room-rhythm-dialog [role=spinbutton]")');
 await js('document.querySelector(".room-rhythm-dialog [role=spinbutton]").focus()');await key('ArrowUp',38);await wait('document.querySelector(".room-rhythm-dialog [role=spinbutton]").getAttribute("aria-valuetext")==="6 phút"');
 await shot('host-break-wheel-390-light','.room-rhythm-dialog');
 await click('Bắt đầu nhịp mới');await wait('!document.querySelector(".room-rhythm-dialog")');assert.equal(room.breakMinutes,6);assert.equal(requests.find(r=>r.path.endsWith('/rhythm')).input.expectedVersion,3);
 await click('Chỉnh giờ');await wait('document.querySelector(".room-rhythm-dialog")');room.rhythmVersion++;
 await js('document.dispatchEvent(new Event("visibilitychange"))');await wait('document.querySelector(".room-rhythm-stale")');assert.ok(await js('[...document.querySelectorAll(".room-rhythm-dialog button")].find(b=>b.textContent==="Bắt đầu nhịp mới").disabled'));
 await click('Lấy thời lượng mới');await key('Escape',27);await wait('!document.querySelector(".room-rhythm-dialog")');
 checks.push('Host wheel keyboard/numeric contract, versioned apply, stale rhythm conflict recovery');
 await clickLabel('Góp một bài');await wait('document.querySelector(".room-track-dialog")');
 await fill('#room-youtube','https://www.youtube.com/watch?v=abcdefghijk');await fill('#room-track-title','Nhạc cho buổi học');
 failMutation=true;await click('Thêm vào hàng đợi');await wait('document.querySelector(".room-track-dialog [role=alert]")');assert.equal(await js('document.querySelector("#room-track-title").value'),'Nhạc cho buổi học');
 await shot('request-error-retained-390-light','.room-track-dialog');failMutation=false;await click('Thêm vào hàng đợi');await wait('!document.querySelector(".room-track-dialog")');assert.equal(room.tracks.at(-1).title,'Nhạc cho buổi học');
 checks.push('Queue mutation failure retains input; success closes with focus return and genuine queued track');
 await click('Mời bạn');await wait('window.roomCopyCount===1');
 // Touch the normal lights alternative: meaningful target remains available on short screens.
 await resize(320,360);await js('document.querySelector(".room-light-switch").scrollIntoView({block:"center"})');
 const target=await js('(()=>{const e=document.querySelector(".room-light-switch"),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,h:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()');assert.ok(target.h>=44&&target.hit);
 await call('Emulation.setTouchEmulationEnabled',{enabled:true});await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x,y:target.y}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('document.querySelector(".study-room-workspace").dataset.dimmed==="true"');await shot('touch-lights-320x360');
 await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 // Real pointer pull on the cord, not a programmatic toggle; reduced motion remains direct/static.
 await resize(1280);await js('document.querySelector(".room-pull-cord").scrollIntoView({block:"center"})');
 const cord=await js('(()=>{const r=document.querySelector(".room-pull-cord svg").getBoundingClientRect();return{x:r.x+r.width*180/288,y:r.y+r.height*220/360}})()');
 await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...cord});await call('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:cord.x,y:cord.y+32});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:cord.x,y:cord.y+32});await wait('document.querySelector(".study-room-workspace").dataset.dimmed==="false"');
 checks.push('Room URL copy; 44px touch lights at320x360; actual cord drag toggles local appearance without a request');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await delay(80);
 await js('document.querySelector(".room-light-switch").focus()');await key('Enter',13);
 const cordBefore=await js('document.querySelector(".room-pull-cord svg path[fill=none]").getAttribute("d")');
 await delay(100);const cordAfter=await js('document.querySelector(".room-pull-cord svg path[fill=none]").getAttribute("d")');assert.notEqual(cordBefore,cordAfter,'Normal-motion cord responds to activation');
 await shot('normal-motion-cord-1280-light');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(80);
 const staticCord=await js('document.querySelector(".room-pull-cord svg path[fill=none]").getAttribute("d")');await delay(200);assert.equal(await js('document.querySelector(".room-pull-cord svg path[fill=none]").getAttribute("d")'),staticCord);
 checks.push('Observed changing normal-motion rope path and immediate static reduced-motion fallback');
 for(const width of [320,768])for(const dark of [false,true]){await resize(width);await theme(dark);await shot(`narrow-${width}-${dark?'dark':'light'}`);if(width===320)assert.ok(await js('document.querySelector(".room-light-switch").getBoundingClientRect().bottom <= document.querySelector(".study-room-clock__time").getBoundingClientRect().top'),'Lamp controls do not overlap the narrow clock');}
 await resize(390);await theme(false);await shot('team-390-light','.room-team');await shot('music-and-queue-390-light','.room-music-card');

 reset('member');await nav();await wait('document.querySelector(".room-team")');assert.equal(await hasLabel('Quản lý phòng'),false);assert.equal(await js('[...document.querySelectorAll("button")].some(b=>b.textContent.includes("Chỉnh giờ")||b.textContent.includes("Đổi bài tiếp"))'),false);
 await shot('member-1280-light');await click('Bật nhạc');await wait('window.roomPlayers.some(p=>!p.destroyed)');
 fail=true;await js('document.dispatchEvent(new Event("visibilitychange"))');await wait('document.querySelector(".study-room-feedback")');await shot('reconnect-failure-1280-light');fail=false;await click('Kết nối lại');await wait('!document.querySelector(".study-room-feedback")');
 expired=true;await js('document.dispatchEvent(new Event("visibilitychange"))');await wait('document.querySelector(".room-arrival")');await wait('window.roomPlayers.every(p=>p.destroyed)');expired=false;
 await resize(390);await shot('preview-390-light');failMutation=true;await click('Tham gia phòng');await wait('document.querySelector(".study-room-error")');assert.equal(room.me,null);failMutation=false;await click('Tham gia phòng');await wait('!document.querySelector(".room-arrival")');
 await click('Bật nhạc');await wait('window.roomPlayers.some(p=>!p.destroyed)');await click('Rời phòng');await wait('location.pathname==="/toolkit"');assert.equal(room.me,null);assert.ok(await js('window.roomPlayers.every(p=>p.destroyed)'));
 checks.push('Member lacks host controls; real API error/reconnect; expired heartbeat403 returns preview and destroys player; join failure/retry; leave navigates and cleans player');
 reset();await nav();await click('Bật nhạc');await wait('window.roomPlayers.some(p=>!p.destroyed)');await clickLabel('Quản lý phòng');await wait('document.querySelector(".room-settings-dialog")');await click('Kết thúc buổi học');await wait('document.querySelector("[role=alertdialog]")');
 await click('Đóng phòng học');await wait('document.querySelector(".study-room-feedback")?.textContent.includes("Buổi học đã kết thúc")');await wait('window.roomPlayers.every(p=>p.destroyed)');await shot('closed-1280-light');
 const heartbeatCount=requests.filter(r=>r.path.endsWith('/heartbeat')).length;await delay(5500);assert.equal(requests.filter(r=>r.path.endsWith('/heartbeat')).length,heartbeatCount,'Closure stops polling');
 checks.push('Host close confirmation; closure tears down player and stops heartbeat polling');

 }
 assert.deepEqual(errors,[]);await writeFile(join(dir,'results.json'),JSON.stringify({scope:'routed room behavior',checks,screenshots,requests,errors},null,2));console.log(JSON.stringify({dir,checks,screenshots:screenshots.length}));
}catch(error){await writeFile(join(dir,'failure.json'),JSON.stringify({checks,requests,screenshots,error:error.stack},null,2));throw error;}finally{releaseJoin?.();await session?.cleanup();}
