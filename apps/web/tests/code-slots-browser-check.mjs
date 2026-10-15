// Real RegistrationVerification + authService/Axios; only synthetic API responses. No env/live auth.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

const before = process.argv.includes('--before');
// Fixed synthetic wall clock: host adjustments must not turn an eligible resend into cooldown.
const clock = Date.parse('2026-10-15T00:00:00Z');
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = await mkdtemp(join(tmpdir(), `humg-code-slots-${before ? 'before' : 'after'}-`));
const fixture = `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';
import{RegistrationVerification}from'/src/features/auth/components/registration-verification.tsx';import'/src/index.css';import'/src/layouts/welcome-layout.css';
const make=(mode='normal')=>({verificationSession:'s'.repeat(64),email:'student@example.invalid',expiresAt:new Date(Date.now()+(mode==='expired'? -1000:600000)).toISOString(),resendAvailableAt:new Date(Date.now()+(mode==='cooldown'?60000:-1000)).toISOString(),sessionExpiresAt:new Date(Date.now()+3600000).toISOString()});
function App(){const[c,S]=useState(make()),[key,K]=useState(0);window.resetOtp=(mode)=>{S(make(mode));K(x=>x+1)};return <main style={{maxWidth:416,margin:'24px auto',padding:24}}><RegistrationVerification key={key} challenge={c} onUpdate={v=>{window.updated=v;if(v)S(v)}} onResume={()=>{window.resumed=true}} onStateChange={s=>{window.otpState=s}}/></main>};const root=createRoot(document.getElementById('root'));window.unmountOtp=()=>root.unmount();root.render(<React.StrictMode><MemoryRouter><App/></MemoryRouter></React.StrictMode>);`;
const old = before ? execFileSync('git', ['show', '97554cd:apps/web/src/features/auth/components/registration-verification.tsx'], { cwd: root, encoding: 'utf8' }) : null;
const host = await createServer({ root, configFile: false, envDir: false, cacheDir: join(dir, 'vite-cache'),
  define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api/v1') }, resolve: { alias: { '@': join(root, 'src') } },
  plugins: [{ name: 'code-slots-fixture', enforce: 'pre',
    configureServer(server) { server.middlewares.use('/code-slots-proof', async (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(await server.transformIndexHtml('/code-slots-proof','<html><head><script type="module" src="/code-slots-fixture.tsx"></script></head><body><div id="root"></div></body></html>')); }); },
    resolveId(id) { if (id === '/code-slots-fixture.tsx') return id; },
    load(id) { if (id === '/code-slots-fixture.tsx') return fixture; if (old && id === join(root, 'src/features/auth/components/registration-verification.tsx')) return old; }
  }, react(), tailwind()], server: { host: '127.0.0.1', port: 0 } });
await host.listen(); const origin = 'http://127.0.0.1:' + host.httpServer.address().port;
const chrome = spawn('/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', ['--headless', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, 'about:blank']);
let socket, js; const checks = [], shots = [], errors = [], calls = []; let mode = 'invalid', held;
try {
  const endpoint = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Chrome timeout')), 30000); chrome.stderr.on('data', chunk => { const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } }); chrome.on('error', reject); });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise(resolve => socket.onopen = resolve);
  let serial = 0; const pending = new Map();
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const reply = (event, code, body) => call('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: code, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  const respond = async event => {
    if (!event.request.url.includes('/api/')) return call('Fetch.continueRequest', { requestId: event.requestId });
    calls.push({ path: new URL(event.request.url).pathname, body: event.request.postData });
    if (mode === 'hold') { held = event; return; }
    if (event.request.url.endsWith('/resend') || event.request.url.endsWith('/email')) return reply(event, 200, { verificationSession: 's'.repeat(64), email: 'student@example.invalid', expiresAt: new Date(clock+600000).toISOString(), resendAvailableAt: new Date(clock+60000).toISOString(), sessionExpiresAt: new Date(clock+3600000).toISOString() });
    if (mode === 'success') return reply(event, 200, { message: 'OK' });
    return reply(event, 400, { status: 400, messageKey: mode === 'locked' ? 'error.auth.registrationOtpLocked' : mode === 'session' ? 'error.auth.registrationSessionInvalid' : 'error.auth.registrationOtpInvalid' });
  };
  socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { const p = pending.get(message.id); pending.delete(message.id); if (message.error) p?.reject(Error(message.error.message)); else p?.resolve(message.result); } else if (message.method === 'Fetch.requestPaused') void respond(message.params).catch(error => errors.push(String(error))); else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description); };
  js = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description); return r.result.value; };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { for (let i=0;i<400;i++) { if (await js(expression)) return; await sleep(25); } throw Error('Timeout '+expression); };
  const fill = value => js(`(()=>{const e=document.querySelector('#registration-code');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  const key = async (key, code) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key, windowsVirtualKeyCode: code }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: code }); };
  const submit = () => js(`document.querySelector('button[type=submit]').click()`);
  const reset = async kind => { await js(`window.resetOtp(${JSON.stringify(kind ?? 'normal')})`); await sleep(50); };
  const shot = async name => { const path = join(dir, name+'.png'); await writeFile(path, Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); shots.push(path); };
  await call('Page.enable'); await call('Runtime.enable'); await call('Page.addScriptToEvaluateOnNewDocument',{source:`Date.now=()=>${clock}`}); await call('Fetch.enable', { patterns: [{ urlPattern: '*'}] });
  await call('Page.navigate', { url: origin+'/code-slots-proof' }); await wait(`!!document.querySelector('#registration-code')`);
  for (const [width,height] of [[320,700],[390,844],[1280,900]]) for (const theme of ['light','dark']) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await js(`document.documentElement.classList.toggle('dark',${theme==='dark'})`); await fill('012345'); await sleep(400);
    assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'));
    if (!before) assert.equal(await js('document.querySelectorAll(".code-slots__slot").length'), 6);
    await shot(`${width}-${theme}`);
  }
  if (!before) {
    assert.equal(calls.length, 0, 'entry never auto-submits');
    const tree = await call('Accessibility.getFullAXTree'); assert.ok(tree.nodes.some(node => node.role?.value==='textbox' && node.name?.value==='Mã xác thực' && node.value?.value==='012345'));
    assert.equal(await js('document.querySelector("#registration-code").inputMode'), 'numeric'); assert.equal(await js('document.querySelector("#registration-code").autocomplete'), 'one-time-code');
    await js(`document.querySelector('#registration-code').setSelectionRange(2,2)`); await key('Backspace',8); assert.equal(await js('document.querySelector("#registration-code").value'), '02345');
    await key('ArrowLeft',37); assert.equal(await js('document.querySelector("#registration-code").selectionStart'),0);
    await js(`(()=>{const e=document.querySelector('#registration-code');const d=new DataTransfer();d.setData('text','001 234');e.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:d}))})()`); await sleep(50);
    assert.equal(await js('document.querySelector("#registration-code").value'),'001234');
    checks.push('Native AX textbox exposes six-digit value/label; leading zeros, arrow/backspace and complete formatted-code paste retained; no auto-submit.');
    mode='hold'; await submit(); await wait('window.otpState.busy');
    assert.ok(await js('document.querySelector("#registration-code").disabled')); assert.equal(JSON.parse(calls.at(-1).body).code,'001234');
    await reply(held,400,{status:400,messageKey:'error.auth.registrationOtpInvalid'}); await wait('!window.otpState.busy&&!!document.querySelector("[role=alert]")'); await sleep(450);
    assert.equal(await js('document.querySelector("#registration-code").value'),'001234'); assert.ok(await js('document.querySelector("#registration-code").getAttribute("aria-invalid")==="true"')); await shot('invalid-retained-code');
    mode='locked'; await submit(); await wait('!window.otpState.busy&&document.querySelector("#registration-code").disabled'); assert.ok(await js('document.body.innerText.includes("Đã nhập sai 5 lần")'));
    await js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Gửi lại mã').click()`); await wait('!document.querySelector("#registration-code").disabled');
    assert.equal(await js('document.querySelector("#registration-code").value'),''); await wait('document.activeElement.id==="registration-code"');
    assert.ok(await js(`[...document.querySelectorAll('button')].some(b=>b.disabled&&b.textContent.includes('Gửi lại sau'))`));
    checks.push('Actual authService/Axios multipart-free JSON request preserves OTP/session; held request busy disables editing/submit; failure retains code; lock, resend reset/cooldown/focus preserved.');
    await reset('expired'); assert.ok(await js('document.querySelector("button[type=submit]").disabled')); assert.ok(await js('document.body.innerText.includes("Mã đã hết hạn")'));
    await reset(); mode='session'; await fill('123456'); await submit(); await wait('!document.querySelector("#registration-code")'); await js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Tiếp tục xác thực').click()`); assert.ok(await js('window.resumed'));
    await reset('cooldown'); assert.ok(await js(`[...document.querySelectorAll('button')].some(b=>b.disabled&&b.textContent.includes('Gửi lại sau'))`));
    await reset(); mode='success'; await fill('000001'); await submit(); await wait('document.body.innerText.includes("Email đã được xác thực")'); assert.equal(await js('window.updated'),null);
    checks.push('Expired OTP prevents verification; invalid session offers resume; resend deadline retained; only actual synthetic server success clears challenge and shows verified state.');
    await reset(); await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]}); await fill('001234'); await sleep(50);
    assert.ok(await js('[...document.querySelectorAll(".code-slots__digit")].every(e=>getComputedStyle(e).transform==="none"&&getComputedStyle(e).opacity==="1")')); await shot('reduced-static');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]}); await reset(); await fill(''); await wait('document.querySelector("#registration-code").value===""');
    await js(`window.otpMotionSamples=[];window.sampleOtpMotion=()=>{const start=performance.now();const tick=()=>{window.otpMotionSamples.push({ms:performance.now()-start,fill:getComputedStyle(document.querySelector('.code-slots__fill')).transform});if(performance.now()-start<500)requestAnimationFrame(tick)};requestAnimationFrame(tick)};window.sampleOtpMotion()`);
    const frames=[];await call('Input.insertText',{text:'5'}); await wait('document.querySelector("#registration-code").value==="5"');
    for(let i=0;i<8;i++){const path=join(dir,`motion-${i}.png`);await writeFile(path,Buffer.from((await call('Page.captureScreenshot')).data,'base64'));frames.push({path,fill:await js('getComputedStyle(document.querySelector(".code-slots__fill")).transform')});await sleep(40);}
    const samples=await js('window.otpMotionSamples');assert.ok(new Set(samples.map(frame=>frame.fill)).size>1,'actual fill spring changes across animation frames');
    await writeFile(join(dir,'motion.json'),JSON.stringify({frames,samples},null,2));
    await js('window.unmountOtp()'); await sleep(150); assert.deepEqual(errors,[]);
    checks.push('Reduced motion renders static visible digits; actual spring motion frames captured; StrictMode mount and removal produce no runtime errors.');
  }
  assert.deepEqual(errors,[]); await writeFile(join(dir,'results.json'),JSON.stringify({before,checks,shots,calls,errors,limits:['Synthetic real-component/service harness, not complete registration route or live mail/OTP/physical device/AT speech proof.']},null,2));
  console.log(JSON.stringify({evidence:dir,checks:checks.length,shots:shots.length}));
} catch(error) { await writeFile(join(dir,'failure.json'),JSON.stringify({error:String(error),checks,errors,calls,body:js?await js('document.body.innerText').catch(()=>null):null},null,2)); throw error; }
finally { socket?.close();chrome.kill('SIGTERM');setTimeout(()=>{if(chrome.exitCode===null)chrome.kill('SIGKILL');},1000).unref();await host.close(); }
