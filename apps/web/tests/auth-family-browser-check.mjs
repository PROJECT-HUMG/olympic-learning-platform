// Real routes + local original MP4s, intercepted synthetic API only. No .env or live auth.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck } from './browser/session.mjs';

const options = browserOptions('auth');
const section=options.section ?? 'forms';
const turnstileFailure=section==='turnstile';
const dir = await evidenceDirectory(options);
let session, web;
const screenshots=[],geometry=[],checks=[],errors=[],requests=[];
let call,js,apiMode='fail',heldRequest;
const heldRequests=[];
try {
  session = await startBrowserCheck({ dir, options, turnstile: turnstileFailure });
  ({ web, call, js } = session);
  const reply=(e,status,body,type='application/json')=>call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(type==='application/json'?JSON.stringify(body):body).toString('base64')});
  const respond=async e=>{
    const u=new URL(e.request.url),path=u.pathname;requests.push({path,method:e.request.method,body:e.request.postData});
    if(u.origin===web&&!path.startsWith('/api/'))return call('Fetch.continueRequest',{requestId:e.requestId});
    if(path.endsWith('/users/me')&&apiMode==='hold-me'){heldRequest=e;return;}
    if(path.endsWith('/users/me'))return reply(e,401,{});
    if(path.endsWith('/auth/refresh'))return reply(e,401,{});
    if(path.includes('/auth/')) {
      if(apiMode==='hold') {heldRequest=e;heldRequests.push(e);return;}
      if(apiMode==='transient')return reply(e,503,{title:'Synthetic network failure',status:503,messageKey:'error.internal'});
      if(apiMode==='invalid-link')return reply(e,400,{status:400,messageKey:'error.auth.emailTokenInvalid'});
      if(path.endsWith('/verify-email'))return apiMode==='success'?reply(e,200,{message:'OK'}):reply(e,400,{status:400,messageKey:'error.auth.emailTokenExpired'});
      if(path.endsWith('/registration/resume'))return apiMode==='success'?reply(e,200,{verificationSession:'s'.repeat(64),email:'student@example.invalid',expiresAt:new Date(Date.now()+600000).toISOString(),resendAvailableAt:new Date(Date.now()+60000).toISOString(),sessionExpiresAt:new Date(Date.now()+3600000).toISOString()}):reply(e,400,{title:'Synthetic auth failure',messageKey:'error.auth.invalidCredentials'});
      if(apiMode==='success')return reply(e,200,{message:'OK'});
      return reply(e,400,{title:'Synthetic failure',status:400,messageKey:path.endsWith('/reset')?'error.auth.emailTokenExpired':apiMode==='unverified'?'error.auth.emailNotVerified':'error.auth.invalidCredentials'});
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
  const shot=async name=>{const path=join(dir,name+'.png');await writeFile(path,Buffer.from((await call('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));screenshots.push(path);};
  const nav=async(route,theme='light',reduced=true)=>{
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme},{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    await call('Page.navigate',{url:web+route});await wait('!!document.querySelector(".auth-route-content, .profile-page")&&!document.querySelector("#startup-loader")&&!document.querySelector("#root").inert');
    await wait(`document.documentElement.classList.contains('dark')===${theme==='dark'}`);await delay(750);
  };
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Emulation.setFocusEmulationEnabled',{enabled:true});

  const capture=async name=>{
    const g=await js(`(()=>{const content=document.querySelector('.auth-route-content'),dialog=document.querySelector('[role=dialog]');return{url:location.pathname+location.search,name:${JSON.stringify(name)},width:innerWidth,height:innerHeight,dark:document.documentElement.classList.contains('dark'),overflow:document.documentElement.scrollWidth>innerWidth+1,shared:!!document.querySelector('.welcome-layout--auth-video'),side:document.querySelector('.welcome-layout')?.dataset.contentSide,heading:document.querySelector('h1')?.innerText,content:content?.getBoundingClientRect().toJSON(),dialog:dialog?.getBoundingClientRect().toJSON(),text:(dialog??content)?.innerText,fields:[...document.querySelectorAll('input')].map(e=>({id:e.id,label:e.labels?.[0]?.innerText,autoComplete:e.autocomplete,invalid:e.getAttribute('aria-invalid'),disabled:e.disabled})),controls:[...document.querySelectorAll('.auth-route-content button,.auth-back-link,.auth-route-content a,[role=dialog] button')].map(e=>({text:e.innerText,label:e.getAttribute('aria-label'),href:e.getAttribute('href'),disabled:e.disabled,bounds:e.getBoundingClientRect().toJSON(),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}))}})()`);
    geometry.push(g);await shot(name);
  };
  const click=text=>js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.removeItem('olympic-registration-session');`});
  const mutations=path=>requests.filter(r=>r.method==='POST'&&r.path.endsWith(path));
  const setToken=token=>js(`(()=>{history.pushState({usr:null,key:Math.random().toString(36),idx:(history.state?.idx??0)+1},'',location.pathname+'?token='+${JSON.stringify(token)});dispatchEvent(new PopStateEvent('popstate'))})()`);
  const assertFit=async()=>assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'no horizontal page overflow');
  if(section==='forms') {
    for(const [route,label] of [['/login','login'],['/register','register'],['/forgot-password','forgot'],['/reset-password?token=synthetic-reset','reset'],['/register?resume=1','resume']]) {
      for(const [width,height,theme] of [[320,740,'dark'],[390,844,'light'],[1280,900,'dark']]) {
        await resize(width,height);await nav(route,theme);await assertFit();await capture(`${label}-${width}-${theme}`);
        assert.ok(await js('!!document.querySelector(".welcome-layout--auth-video .auth-route-content")'));
      }
    }
    for(const [route,label] of [['/login','login'],['/register','register']]){await resize(768,1024);await nav(route);await assertFit();await capture(label+'-768-light');}
    await resize(390,844);await nav('/login');
    assert.equal(await js('document.querySelector("#login-identifier").autocomplete'),'username');assert.equal(await js('document.querySelector("#login-password").autocomplete'),'current-password');
    await js('document.querySelector("#login-identifier").focus()');await key('Tab',9);assert.equal(await js('document.activeElement.id'),'login-password');
    await key('Tab',9);assert.equal(await js('document.activeElement.getAttribute("aria-label")'),'Hiện mật khẩu');
    await key('Enter',13);assert.equal(await js('document.querySelector("#login-password").type'),'text');
    await nav('/register');
    for(const [id,expected] of [['email','email'],['username','username'],['fullName','name'],['password','new-password'],['confirmPassword','new-password']])assert.equal(await js(`document.querySelector('#register-${id}').autocomplete`),expected);
    await fill('#register-email','student@example.invalid');assert.equal(await js('document.querySelector("#register-username").value'),'student');
    await fill('#register-username','chosen-user');await fill('#register-email','updated@example.invalid');assert.equal(await js('document.querySelector("#register-username").value'),'chosen-user');
    assert.equal(mutations('/auth/register').length,0);assert.equal(mutations('/auth/login').length,0);
    checks.push('Actual forms at320dark/390light/1280dark, login/register768light: shared shell/no overflow, field-specific autocomplete, keyboard password reveal; registration username derivation stops after manual edit; entry never auto-submits.');
  } else if(section==='recovery') {
    await resize(390,844);await nav('/forgot-password');await click('Gửi liên kết khôi phục');await wait('!!document.querySelector("#forgot-email-error")');assert.equal(mutations('/auth/password/forgot').length,0);
    await fill('#forgot-email','student@example.invalid');apiMode='hold';await click('Gửi liên kết khôi phục');await wait('document.querySelector("#forgot-email").disabled');await capture('forgot-pending-390-light');
    assert.equal(JSON.parse(mutations('/auth/password/forgot').at(-1).body).email,'student@example.invalid');
    await reply(heldRequest,503,{title:'Synthetic failure',status:503,messageKey:'error.internal'});await wait('!!document.querySelector("#forgot-request-error")&&!document.querySelector("#forgot-email").disabled');
    assert.equal(await js('document.querySelector("#forgot-email").value'),'student@example.invalid');assert.equal(await js('document.querySelector("form").getAttribute("aria-describedby")'),'forgot-request-error');
    await delay(4300);assert.ok(await js('!!document.querySelector("#forgot-request-error")'));assert.ok(await js('!document.querySelector("[data-sonner-toast]")'));await capture('forgot-persistent-error-390-light');
    apiMode='hold';await click('Gửi liên kết khôi phục');await wait('document.querySelector("#forgot-email").disabled');assert.ok(await js('!document.querySelector("#forgot-request-error")'));
    await reply(heldRequest,200,{message:'Generic privacy-safe receipt'});await wait('document.querySelector("h1")?.textContent==="Kiểm tra hộp thư"');
    assert.ok(await js('document.body.innerText.includes("Nếu có tài khoản sử dụng email")'));assert.equal(await js('document.activeElement.tagName'),'H1');
    assert.ok(await js('!document.querySelector("[data-sonner-toast],#forgot-request-error")'));await capture('forgot-receipt-390-light');
    await resize(1280,900);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]});await wait('document.documentElement.classList.contains("dark")');await delay(50);await capture('forgot-receipt-1280-dark');
    await resize(320,280);await js('document.querySelector(".auth-status a").scrollIntoView({block:"center"})');const r=await js('document.querySelector(".auth-status a").getBoundingClientRect().toJSON()');
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('location.pathname==="/login"');
    checks.push('Forgot: validation makes no request; held real service request disables input/submit; failure retains email and persistent associated alert beyond toast lifetime; retry clears own error; generic success has no stale failure/success toast and focuses receipt heading; short-screen touch return link works.');
  } else if(section==='reset') {
    await resize(390,844);await nav('/reset-password');await capture('reset-missing-token-390-light');assert.equal(await js('document.querySelector(".auth-status a").getAttribute("href")'),'/forgot-password');
    await nav('/reset-password?token=synthetic-reset');assert.equal(await js('document.querySelector("#reset-newPassword").autocomplete'),'new-password');assert.equal(await js('document.querySelector("#reset-confirmPassword").autocomplete'),'new-password');
    await fill('#reset-newPassword','short');await fill('#reset-confirmPassword','short');await click('Lưu mật khẩu mới');await wait('!!document.querySelector("#reset-newPassword-error")');assert.equal(mutations('/auth/password/reset').length,0);
    await fill('#reset-newPassword','synthetic-password');await fill('#reset-confirmPassword','different-password');await click('Lưu mật khẩu mới');await wait('!!document.querySelector("#reset-confirmPassword-error")');assert.equal(mutations('/auth/password/reset').length,0);
    await fill('#reset-confirmPassword','synthetic-password');apiMode='hold';await click('Lưu mật khẩu mới');await wait('document.querySelector("#reset-newPassword").disabled');
    assert.deepEqual(JSON.parse(mutations('/auth/password/reset').at(-1).body),{token:'synthetic-reset',newPassword:'synthetic-password'});
    await reply(heldRequest,503,{status:503,title:'Synthetic failure',messageKey:'error.internal'});await wait('!!document.querySelector("#reset-request-error")');
    assert.equal(await js('document.querySelector("#reset-newPassword").value'),'synthetic-password');assert.ok(await js('!document.querySelector("[data-sonner-toast]")'));await capture('reset-retryable-error-390-light');
    apiMode='hold';await click('Lưu mật khẩu mới');await wait('document.querySelector("#reset-newPassword").disabled');assert.ok(await js('!document.querySelector("#reset-request-error")'));
    await reply(heldRequest,400,{status:400,messageKey:'error.auth.emailTokenExpired'});await wait('document.querySelector("h1")?.textContent.trim()==="Liên kết đã hết hạn"');
    assert.ok(await js('!document.querySelector("#reset-newPassword,form")'));assert.equal(await js('document.activeElement.tagName'),'H1');assert.equal(await js('document.querySelector(".auth-status a").getAttribute("href")'),'/forgot-password');await capture('reset-expired-390-light');
    await resize(1280,900);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]});await wait('document.documentElement.classList.contains("dark")');await capture('reset-expired-1280-dark');
    await nav('/reset-password?token=synthetic-invalid');apiMode='invalid-link';await fill('#reset-newPassword','synthetic-password');await fill('#reset-confirmPassword','synthetic-password');await click('Lưu mật khẩu mới');await wait('document.querySelector("h1")?.textContent.trim()==="Liên kết chưa hợp lệ"');
    await js('document.querySelector(".auth-status a").click()');await wait('location.pathname==="/forgot-password"');
    apiMode='success';await nav('/reset-password?token=synthetic-success');await fill('#reset-newPassword','synthetic-password');await fill('#reset-confirmPassword','synthetic-password');await click('Lưu mật khẩu mới');await wait('location.pathname==="/login"');
    assert.equal(JSON.parse(mutations('/auth/password/reset').at(-1).body).token,'synthetic-success');
    checks.push('Reset: missing token has supported recovery link; min8/mismatch validation prevents request; exact token/newPassword JSON, busy input lock, transient error preserves values and retry clears feedback; server expired/invalid becomes persistent no-resubmit state with focus and existing recovery action; only confirmed success navigates to login. No token-purpose inference.');
  } else if(section==='lifecycle') {
    await resize(390,844);await nav('/reset-password?token=old-link');apiMode='hold';await fill('#reset-newPassword','synthetic-password');await fill('#reset-confirmPassword','synthetic-password');await click('Lưu mật khẩu mới');await wait('document.querySelector("#reset-newPassword").disabled');const oldReset=heldRequest;
    await setToken('new-link');await wait('!!document.querySelector("#reset-newPassword")&&!document.querySelector("#reset-newPassword").disabled');assert.equal(await js('document.querySelector("#reset-newPassword").value'),'');
    await reply(oldReset,200,{message:'Old synthetic completion'});await delay(150);assert.ok(await js('location.search.includes("new-link")&&!document.querySelector("[data-sonner-toast]")'));
    await fill('#reset-newPassword','synthetic-password');await fill('#reset-confirmPassword','synthetic-password');await click('Lưu mật khẩu mới');await wait('document.querySelector("#reset-newPassword").disabled');const abandoned=heldRequest;
    await js('document.querySelector(".auth-back-link").click()');await wait('location.pathname==="/login"');await reply(abandoned,200,{message:'Old synthetic completion'});await delay(150);assert.ok(await js('location.pathname==="/login"&&!document.querySelector("[data-sonner-toast]")'));
    apiMode='hold';await nav('/verify-email?token=email-A');await wait('!!document.querySelector(".auth-status[role=status]")&&!document.querySelector("h1")');const oldVerify=heldRequest;await capture('verify-pending-390-light');
    await setToken('email-B');await wait('!!document.querySelector(".auth-status[role=status]")');for(let i=0;i<40&&heldRequest.requestId===oldVerify.requestId;i++)await delay(25);const newVerify=heldRequest;assert.notEqual(oldVerify.requestId,newVerify.requestId);
    await reply(oldVerify,200,{message:'Old synthetic completion'});await delay(100);assert.ok(await js('!document.querySelector("h1")'));
    await reply(newVerify,200,{message:'Current synthetic completion'});await wait('document.querySelector("h1")?.textContent==="Email đã được xác thực"');await capture('verify-complete-390-light');
    const action=await js('document.querySelector(".auth-status a").getBoundingClientRect().toJSON()');assert.ok(action.height>=44);assert.equal(await js('getComputedStyle(document.querySelector(".auth-status a")).borderRadius'),'6px');
    await resize(1280,900);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]});await wait('document.documentElement.classList.contains("dark")');await capture('verify-complete-1280-dark');
    apiMode='fail';await nav('/verify-email?token=email-expired');await wait('!!document.querySelector(".auth-status[role=alert]")');await capture('verify-expired-1280-light');
    for(const token of ['email-A','email-B'])assert.equal(requests.filter(r=>r.path.endsWith('/auth/verify-email')&&JSON.parse(r.body).token===token).length,1,'one request per token under StrictMode');
    checks.push('Token identity/unmount: held reset success cannot navigate or toast after query-token replacement or leaving route; new token owns fresh enabled fields. Verify A late success cannot replace pending B; B alone completes, each token posts once under StrictMode. Terminal actions use44px existing Button, standard radius, explicit completion, expired/resume state retained.');
  } else if(section==='status-visuals') {
    for(const kind of ['receipt','expired','verified']) {
      await resize(390,844);apiMode=kind==='expired'?'fail':'success';
      if(kind==='receipt') {await nav('/forgot-password');await fill('#forgot-email','a.long.email.address.for.review@example.invalid');await click('Gửi liên kết khôi phục');await wait('document.querySelector("h1")?.textContent==="Kiểm tra hộp thư"');}
      else if(kind==='expired') {await nav('/reset-password?token=synthetic-expired');await fill('#reset-newPassword','synthetic-password');await fill('#reset-confirmPassword','synthetic-password');await click('Lưu mật khẩu mới');await wait('document.querySelector("h1")?.textContent.trim()==="Liên kết đã hết hạn"');}
      else {await nav('/verify-email?token=synthetic-verified');await wait('document.querySelector("h1")?.textContent==="Email đã được xác thực"');}
      for(const [width,height,theme] of [[320,740,'dark'],[390,844,'light'],[1280,900,'light'],[1280,900,'dark']]) {
        await resize(width,height);await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme},{name:'prefers-reduced-motion',value:'reduce'}]});await wait(`document.documentElement.classList.contains('dark')===${theme==='dark'}`);await wait(`document.querySelectorAll('.welcome-layout__scene video').length===${width>=1024?2:0}`);await delay(100);await assertFit();await capture(`${kind}-${width}-${theme}`);
      }
      if(kind!=='verified') {assert.equal(await js('getComputedStyle(document.querySelector("h1")).outlineStyle'),'none');await key('Tab',9);assert.equal(await js('document.activeElement.getAttribute("href")'),kind==='receipt'?'/login':'/forgot-password');}
    }
    checks.push('Final routed receipt/expired/completion at320/390/1280both desktop themes: long recipient wraps, no page overflow, desktop static scenes/mobile shell retained; programmatically focused headings do not masquerade as inputs and Tab reaches real primary action.');
  } else if(section==='loading') {
    for(const [width,height,theme] of [[390,844,'light'],[1280,900,'dark']]) {
      apiMode='fail';await resize(width,height);await nav('/login',theme);apiMode='hold-me';await js(`import('/src/lib/query-client.ts').then(({queryClient})=>{void queryClient.resetQueries({queryKey:['auth','currentUser']})})`);
      await wait('!!document.querySelector(".auth-route-content [aria-busy=true]")');assert.ok(await js('!document.querySelector(".auth-route-content .grid-cols-3")'));await capture(`guest-loading-${width}-${theme}`);
      apiMode='fail';await reply(heldRequest,401,{});await wait('!!document.querySelector("#login-identifier")');await capture(`guest-settled-${width}-${theme}`);
    }
    checks.push('Actual shared GuestRoute loading after startup release omits obsolete provider placeholders and settles to unchanged real login controls; anonymous guard semantics retained.');
  } else if(section==='turnstile') {
    for(const [route,label] of (options['forgot-only']?[['/forgot-password','forgot']]:[['/login','login'],['/register','register'],['/forgot-password','forgot']])) {
      await resize(390,844);await nav(route,'dark');await wait('!!document.querySelector("[role=alert]")');assert.ok(await js('document.querySelector("button[type=submit]").disabled'));await capture(label+'-challenge-failure-390-dark');
    }
    assert.equal(requests.filter(r=>r.method==='POST'&&!r.path.endsWith('/auth/refresh')).length,0);
    checks.push('Enabled synthetic config with blocked real Turnstile script retains error/retry and disabled submit on selected caller forms; --forgot-only scopes this case to recovery. No live widget/token or auth mutation.');
  } else throw Error('Unknown section '+section);
  await assertFit();
  assert.deepEqual([...errors,...session.requestFailures],[]);
  await writeFile(join(dir,'results.json'),JSON.stringify({section,turnstileFailure,checks,screenshots,geometry,requests,errors,requestFailures:session.requestFailures,cancelledRequests:session.cancelledRequests,limits:['Actual routed owners with synthetic API/auth identity; all requests intercepted; no live account/mail/password actions.','Explicit fixture Turnstile disabled or script-failure mode; operator environment remains unread. External fonts blocked/system fallback; no physical device, live widget, AT speech, WebKit or deployed proof.']},null,2));
  console.log(JSON.stringify({evidence:dir,checks:checks.length,screenshots:screenshots.length}));
}catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(e),checks,geometry,errors,requestFailures:session?.requestFailures,cancelledRequests:session?.cancelledRequests,body:js?await js('document.body.innerText').catch(()=>null):null,focus:js?await js('({tag:document.activeElement?.tagName,id:document.activeElement?.id,text:document.activeElement?.textContent?.slice(0,200)})').catch(()=>null):null},null,2));throw e;}
finally { await session?.cleanup(); }
