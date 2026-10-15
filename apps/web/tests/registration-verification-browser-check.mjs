// Real routes + local original MP4s, intercepted synthetic API only. No .env or live auth.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck, webRoot } from './browser/session.mjs';

const options = browserOptions('otp');
const baseline=Boolean(options.before);
const visualOnly=Boolean(options['visual-only']);
const interactionsOnly=Boolean(options['interactions-only']);
const dir = await evidenceDirectory(options);
const root = webRoot;
const old=new Map();
if(baseline) {
  const path='src/features/auth/components/registration-verification.tsx';
  old.set(join(root,path),execFileSync('git',['show',`2c8b313:apps/web/${path}`],{cwd:root,encoding:'utf8'}));
}
let session, web;
const screenshots=[],geometry=[],checks=[],errors=[],requests=[],playback=[],contrast=[];
let call,js,authMode='invalid',heldVerify,seed;
const clock=Date.parse('2026-10-15T08:00:00Z');
const makeChallenge=(mode='normal',email='student@example.invalid')=>({verificationSession:'s'.repeat(64),email,expiresAt:new Date(clock+(mode==='expired'?-1000:600000)).toISOString(),resendAvailableAt:new Date(clock+(mode==='normal'?60000:-1000)).toISOString(),sessionExpiresAt:new Date(clock+(mode==='session'?-1000:3600000)).toISOString()});
try {
  session = await startBrowserCheck({ dir, options, snapshots: old });
  ({ web, call, js } = session);
  const reply=(e,status,body,type='application/json')=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(type==='application/json'?JSON.stringify(body):body).toString('base64')});
  const respond=async e=>{
    const u=new URL(e.request.url),path=u.pathname;requests.push({path,method:e.request.method,body:e.request.postData});
    if(u.origin===web&&!path.startsWith('/api/'))return call('Fetch.continueRequest',{requestId:e.requestId});
    if(path.endsWith('/users/me')||path.endsWith('/auth/refresh'))return reply(e,401,{});
    if(path.includes('/auth/registration/')) {
      if(authMode==='hold') { heldVerify=e; return; }
      if(authMode==='network') return reply(e,503,{title:'Service unavailable',status:503,detail:'Không thể kết nối. Vui lòng thử lại.'});
      if(path.endsWith('/resend')||path.endsWith('/email'))return reply(e,200,makeChallenge('normal',path.endsWith('/email')?JSON.parse(e.request.postData).email:'student@example.invalid'));
      if(authMode==='success')return reply(e,200,{message:'OK'});
      return reply(e,400,{status:400,messageKey:authMode==='locked'?'error.auth.registrationOtpLocked':authMode==='session'?'error.auth.registrationSessionInvalid':'error.auth.registrationOtpInvalid',detail:'Mã xác thực chưa đúng. Vui lòng thử lại.'});
    }
    if(e.request.method!=='GET')return reply(e,503,{title:'Synthetic auth failure',detail:'Synthetic failure; no real account action.'});
    if(path.endsWith('/documents/metadata'))return reply(e,200,{subjects:[],categories:[],tags:[]});
    if(path.startsWith('/api/'))return reply(e,200,{content:[],totalElements:0,totalPages:0,number:0,size:10});
    return reply(e,404,'','text/plain');
  };
  session.onRequest(respond);
  session.onEvent(m => {if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const wait=async expression=>{for(let n=0;n<500;n++){if(await js(`Boolean(${expression})`))return;await delay(30);}throw Error('Timeout '+expression);};
  const resize=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const key=async(key,code,text=key==='Enter'?'\r':undefined)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code,text});await call('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});};
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

  const seedChallenge=async(mode='normal',email='student@example.invalid')=>{
    if(seed)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:seed.identifier});
    seed=await call('Page.addScriptToEvaluateOnNewDocument',{source:`const started=performance.now();Date.now=()=>${clock}+performance.now()-started;if(location.pathname==='/register')sessionStorage.setItem('olympic-registration-session',JSON.stringify(${JSON.stringify(makeChallenge(mode,email))}));`});
  };
  await seedChallenge();
  if(!interactionsOnly)for(const [width,height] of [[320,740],[390,844],[768,1024],[1280,900]])for(const theme of ['light','dark']){
    await resize(width,height);await nav('/register',theme);await wait('!!document.querySelector("#registration-code")');
    const g=await js(`(()=>{const h=document.querySelector('.welcome-layout'),content=document.querySelector('.welcome-layout__content'),code=document.querySelector('#registration-code');return{route:location.pathname,theme:${JSON.stringify(theme)},width:innerWidth,side:h.dataset.contentSide,sharedLayout:!!code.closest('.welcome-layout--auth-video .auth-route-content'),brand:!!document.querySelector('.welcome-layout__header .welcome-layout__brand'),themeControl:!!document.querySelector('.welcome-layout__header button'),videos:document.querySelectorAll('.welcome-layout__scene video').length,content:content.getBoundingClientRect().toJSON(),code:code.getBoundingClientRect().toJSON()}})()`);
    assert.ok(g.sharedLayout&&g.brand&&g.themeControl);assert.equal(g.side,'right');assert.equal(g.videos,width>=1024?2:0);assert.ok(g.code.x>=0&&g.code.right<=width+1);if(width>=1024)assert.ok(g.content.x>width/2);geometry.push(g);
    if(width>=1024){await wait(`!${selected}.paused&&${selected}.videoWidth>0`);playback.push(await media(selected));}
    if(!baseline) {
      const c=await js(`(()=>{const ctx=document.createElement('canvas').getContext('2d',{willReadFrequently:true});const lum=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const v=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};const ratio=(a,b)=>{a=lum(a);b=lum(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};const bg=getComputedStyle(document.querySelector('.welcome-layout')).backgroundColor;const button=getComputedStyle(document.querySelector('.registration-verification__submit')),slot=getComputedStyle(document.querySelector('.code-slots__slot'));return{theme:${JSON.stringify(theme)},width:innerWidth,body:ratio(getComputedStyle(document.querySelector('.auth-description')).color,bg),eyebrow:ratio(getComputedStyle(document.querySelector('.registration-verification__eyebrow')).color,bg),button:ratio(button.color,button.backgroundColor),slot:ratio(slot.borderColor,slot.backgroundColor)}})()`);
      assert.ok(c.body>=4.5&&c.eyebrow>=4.5&&c.button>=4.5&&c.slot>=3,JSON.stringify(c));contrast.push(c);
    }
    await shot(`routed-otp-${width}-${theme}`);
  }
  if(!interactionsOnly)checks.push('Actual /register route with synthetic stored RegistrationChallenge renders CodeSlots inside AuthCardLayout/WelcomeLayout. Shared static brand/theme header exists both sizes/themes; right desktop form rail plus2theme videos, mobile single form/no scene, no horizontal overflow.');
  if(baseline)assert.ok(!requests.some(r=>r.method==='POST'&&!r.path.endsWith('/auth/refresh')),'no registration/verification mutation');
  if(!baseline&&!visualOnly) {
    const clickText=text=>js(`[...document.querySelectorAll('.registration-verification button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
    const submit=()=>js(`document.querySelector('#registration-code').closest('form').requestSubmit()`);
    const verifyCalls=()=>requests.filter(r=>r.path.endsWith('/auth/registration/verify'));
    const reset=async(mode='ready',email)=>{await seedChallenge(mode,email);await nav('/register','light');};
    await resize(390,844);await reset();
    await fill('#registration-code','012345');await delay(350);
    assert.equal(verifyCalls().length,0,'code completion never auto-submits');
    assert.equal(await js('document.querySelector("#registration-code").inputMode'),'numeric');
    assert.equal(await js('document.querySelector("#registration-code").autocomplete'),'one-time-code');
    const tree=await call('Accessibility.getFullAXTree');assert.ok(tree.nodes.some(n=>n.role?.value==='textbox'&&n.name?.value==='Mã xác thực'&&n.value?.value==='012345'));
    await js(`document.querySelector('#registration-code').setSelectionRange(2,2)`);await key('Backspace',8);
    assert.equal(await js('document.querySelector("#registration-code").value'),'02345');
    await key('ArrowLeft',37);assert.equal(await js('document.querySelector("#registration-code").selectionStart'),0);
    await js(`(()=>{const e=document.querySelector('#registration-code'),d=new DataTransfer();d.setData('text','001 234');e.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:d}))})()`);
    assert.equal(await js('document.querySelector("#registration-code").value'),'001234');
    await shot('routed-filled-code-390-light');
    authMode='hold';await key('Enter',13);await wait('!!document.querySelector(".registration-verification[aria-busy=true]")');
    assert.equal(JSON.parse(verifyCalls().at(-1).body).code,'001234');
    assert.equal(JSON.parse(verifyCalls().at(-1).body).verificationSession,'s'.repeat(64));
    assert.ok(await js('document.querySelector("#registration-code").disabled'));
    const count=verifyCalls().length;await submit();await delay(100);assert.equal(verifyCalls().length,count,'pending request single-flight');
    await shot('routed-pending-390-light');
    await reply(heldVerify,400,{status:400,messageKey:'error.auth.registrationOtpInvalid',detail:'Mã xác thực chưa đúng. Vui lòng thử lại.'});
    await wait('!!document.querySelector("#registration-code-error")&&!document.querySelector("#registration-code").disabled');
    assert.equal(await js('document.querySelector("#registration-code").value'),'001234');
    assert.equal(await js('document.querySelector("#registration-code").getAttribute("aria-invalid")'),'true');
    assert.ok(await js(`document.querySelector('#registration-code-error').getBoundingClientRect().bottom<document.querySelector('.registration-verification__submit').getBoundingClientRect().top`));
    const errorContrast=await js(`(()=>{const e=getComputedStyle(document.querySelector('#registration-code-error')),ctx=document.createElement('canvas').getContext('2d',{willReadFrequently:true});const lum=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const v=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};const a=lum(e.color),b=lum(e.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)})()`);assert.ok(errorContrast>=4.5,String(errorContrast));contrast.push({theme:'light',state:'error',ratio:errorContrast});
    await shot('routed-invalid-code-390-light');
    authMode='locked';await submit();await wait('document.querySelector("#registration-code").disabled&&!document.querySelector(".registration-verification[aria-busy=true]")');
    assert.equal(await js('document.body.innerText.split("Đã nhập sai 5 lần").length-1'),1,"single visible lock warning");await shot('routed-locked-390-light');
    authMode='network';await clickText('Gửi lại mã');await wait('document.body.innerText.includes("Không thể kết nối")');
    assert.equal(await js('document.querySelector("#registration-code").value'),'001234');
    authMode='invalid';await clickText('Gửi lại mã');await wait('!document.querySelector("#registration-code").disabled&&document.activeElement.id==="registration-code"');
    assert.equal(await js('document.querySelector("#registration-code").value'),'');
    assert.ok(await js(`[...document.querySelectorAll('button')].some(b=>b.disabled&&b.textContent.includes('Gửi lại sau'))`));
    assert.ok(await js('!!document.querySelector(".registration-verification [role=status]")'));
    await shot('routed-resend-success-390-light');
    checks.push('Real /register CodeSlots: AX label/value, numeric/autocomplete, leading zeros, formatted full-code paste, arrow/backspace, Enter explicit submit; JSON session/code preserved, no auto-submit. Held verify is single-flight/busy; invalid retains code and inline associated error; lock then failed/successful resend retains/reset code, cooldown and code focus.');

    await reset();await clickText('Sửa email');await wait('document.activeElement.id==="registration-new-email"');
    await fill('#registration-new-email','invalid');await clickText('Lưu và gửi mã');
    await wait('!!document.querySelector("#registration-email-error")');
    assert.equal(await js('document.querySelector("#registration-new-email").getAttribute("aria-invalid")'),'true');
    assert.equal(await js('document.querySelector("#registration-code").getAttribute("aria-invalid")'),'false');
    assert.ok(await js('document.querySelector("#registration-new-email").getAttribute("aria-describedby").includes("registration-email-error")'));
    await shot('routed-email-invalid-390-light');
    await clickText('Hủy');assert.ok(await js('document.activeElement.id==="registration-code"'));
    await clickText('Sửa email');await fill('#registration-new-email','updated@example.invalid');
    authMode='hold';await clickText('Lưu và gửi mã');await wait('!!document.querySelector(".registration-verification[aria-busy=true]")');
    assert.ok(await js('document.querySelector("#registration-new-email").disabled'));
    await reply(heldVerify,503,{title:'Service unavailable',status:503,detail:'Không thể kết nối. Vui lòng thử lại.'});await wait('!!document.querySelector("#registration-email-error")&&!document.querySelector("#registration-new-email").disabled');
    assert.equal(await js('document.querySelector("#registration-new-email").value'),'updated@example.invalid');
    authMode='invalid';await clickText('Lưu và gửi mã');await wait('!document.querySelector("#registration-new-email")&&document.activeElement.id==="registration-code"');
    assert.ok(await js('document.querySelector(".registration-verification__address").innerText.includes("updated@example.invalid")'));
    assert.equal(JSON.parse(requests.findLast(r=>r.path.endsWith('/auth/registration/email')).body).email,'updated@example.invalid');
    checks.push('Routed email editing receives focus; validation/server failure stays associated with email, does not mark OTP invalid; busy disables editor; Cancel restores code focus; successful service response replaces actual recipient, resets code/cooldown and focuses code.');

    await reset('expired');assert.ok(await js('document.querySelector(".registration-verification__submit").disabled'));assert.ok(await js('document.body.innerText.includes("Mã đã hết hạn")'));await shot('routed-expired-code-390-light');
    await reset();authMode='session';await fill('#registration-code','123456');await submit();await wait('!document.querySelector("#registration-code")');
    await shot('routed-session-expired-390-light');await clickText('Tiếp tục xác thực');await wait('document.querySelector("h1")?.textContent==="Tiếp tục xác thực"');
    assert.ok(await js('!!document.querySelector(".welcome-layout--auth-video .auth-route-content")'));
    await reset();authMode='success';await fill('#registration-code','000001');await submit();await wait('document.body.innerText.includes("Email đã được xác thực")');
    assert.equal(await js('sessionStorage.getItem("olympic-registration-session")'),null);await shot('routed-verified-390-light');
    checks.push('Expired code disables verification and retains resend; server-invalid session offers existing resume form within the same shell; only synthetic successful verify clears stored challenge and displays verified/login state.');

    await resize(320,280);await reset('ready','a.long.email.address.for.layout.review@example.invalid');
    await clickText('Sửa email');await wait('document.activeElement.id==="registration-new-email"');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',windowsVirtualKeyCode:9});
    await wait(`document.activeElement.textContent.includes('Lưu và gửi mã')`);
    await clickText('Hủy');await wait('document.activeElement.id==="registration-code"');
    await key('Tab',9);await wait('document.activeElement.classList.contains("registration-verification__submit")');
    const tap=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);const g=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:g.x+g.width/2,y:g.y+g.height/2}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
    await tap('.registration-verification__recipient button');await wait('!!document.querySelector("#registration-new-email")');
    await shot('routed-short-email-editor-320-light');
    await resize(320,740);await nav('/register','dark',true);await fill('#registration-code','001234');await delay(75);
    assert.ok(await js('[...document.querySelectorAll(".code-slots__digit")].every(e=>getComputedStyle(e).transform==="none"&&getComputedStyle(e).opacity==="1")'));
    assert.equal(await js('getComputedStyle(document.querySelector(".code-slots__caret")??document.querySelector(".code-slots__digit")).animationName'),'none');
    const controls=await js(`[...document.querySelectorAll('.registration-verification button,.registration-verification__back')].map(e=>({label:e.innerText,h:e.getBoundingClientRect().height}))`);assert.ok(controls.every(c=>c.h>=44),JSON.stringify(controls));
    await shot('routed-long-email-reduced-320-dark');
    await resize(1280,900);await nav('/register','light',true);await fill('#registration-code','001234');await shot('routed-long-email-reduced-1280-light');
    assert.ok(await js('document.querySelector(".welcome-layout__scene video").paused'));
    await call('Page.navigate',{url:'about:blank'});await delay(100);
    checks.push('320x280 actual route scrolls editor/controls into view, keyboard Tab order and Cancel return checked; real CDP touch opens email editor. Long address wraps without page overflow; all OTP actions >=44px. Reduced-motion digits static/visible and desktop ambient video paused; route unmount leaves no runtime exception.');
  }
  await nav('/verify-email');assert.ok(await js('!!document.querySelector(".welcome-layout")&&!document.querySelector("#registration-code")&&document.body.innerText.includes("Mã xác thực không tồn tại")'));await shot('legacy-token-link-no-token-1280-light');
  checks.push('/verify-email is the separate token-link VerifyEmailCard route inside same shared auth layout; it is not RegistrationVerification OTP.');
  assert.deepEqual([...errors,...session.requestFailures],[]);
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:seed.identifier});
  await writeFile(join(dir,'results.json'),JSON.stringify({baseline,visualOnly,interactionsOnly,checks,screenshots,geometry,playback,contrast,requests,errors,requestFailures:session.requestFailures,cancelledRequests:session.cancelledRequests,limits:['Actual routed product owner with synthetic browser session challenges, advancing synthetic clock and intercepted API responses; no live mutations.','No live registration/OTP/mail,physical device,AT speech or deployed-state proof;previous CodeSlots fixture deliberately omits the shared layout.']},null,2));
  console.log(JSON.stringify({evidence:dir,checks:checks.length,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,screenshots,geometry,playback,contrast,errors,requestFailures:session?.requestFailures,cancelledRequests:session?.cancelledRequests,body:js?await js('document.body.innerText').catch(()=>null):null,focus:js?await js('({tag:document.activeElement?.tagName,id:document.activeElement?.id,text:document.activeElement?.textContent?.slice(0,200)})').catch(()=>null):null},null,2));throw e;}
finally { await session?.cleanup(); }
