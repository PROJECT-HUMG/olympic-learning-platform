// Opt-in disposable loopback harness ONLY. Production services and PostgreSQL,
// deterministic fixture auth; no fabricated API success responses or real accounts.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

assert.equal(process.env.DAILY_HTTP_HARNESS,"disposable","Start the opt-in AuthoringBrowserHarness on8095; never use an existing/live API");
const api="http://127.0.0.1:8095/api/v1",web="http://localhost:3000",date=process.env.DAILY_HTTP_DATE??"2026-10-06";
assert.match(date,/^\d{4}-\d{2}-\d{2}$/,"Use a fresh test date; never clear existing data to rerun");
const owner="00000000-0000-0000-0000-000000000a01";
const token="authoring-lecturer";
const dir=await mkdtemp(join(tmpdir(),"daily-http-"));
const checks=[],errors=[],requests=[];
const sourcePaths=["src/features/daily/components/daily-plan-editor.tsx","src/features/daily/evidence/evidence-panel.tsx","src/features/daily/evidence/evidence-preview.ts","src/features/daily/evidence/evidence-contract.ts","src/features/daily/evidence/evidence.service.ts","src/features/daily/ui/study-notebook.css","src/features/daily/ui/use-daily-confirm.tsx","src/features/daily/hooks/use-daily.ts","src/features/daily/lib/plan-editor.ts","src/features/daily/services/daily.service.ts","tests/daily-persistence-http-browser-check.mjs",
  "src/features/daily/ui/daily-dialog-header.tsx","../api/src/main/java/me/nghlong3004/olympic/daily/service/impl/DailyServiceImpl.java","../api/src/main/java/me/nghlong3004/olympic/daily/controller/DailyController.java","../api/src/main/java/me/nghlong3004/olympic/daily/evidence/controller/EvidenceController.java","../api/src/main/resources/db/migration/V23__neutral_daily_evidence.sql"];
const manifest=async()=>Object.fromEntries(await Promise.all(sourcePaths.map(async p=>[p,createHash("sha256").update(await readFile(p)).digest("hex")])));
const candidateStart=await manifest();
async function request(path,method="GET",body,actor=token) {
  const r=await fetch(api+path,{method,headers:{Authorization:"Bearer "+actor,...(body&&! (body instanceof FormData)?{"Content-Type":"application/json"}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
  return {status:r.status,headers:Object.fromEntries(r.headers),bytes:Buffer.from(await r.arrayBuffer())};
}
const json=r=>JSON.parse(r.bytes.toString());
const identity=await request("/users/me");
assert.equal(identity.status,200);assert.equal(json(identity).id,owner,"Wrong harness identity");
assert.equal((await request("/daily/plans?date="+date)).status,404,"Use a fresh disposable harness, not pre-existing plan data");
const chrome=spawn(process.env.DAILY_CHROME_PATH??"/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",["--headless","--no-sandbox","--disable-gpu","--remote-debugging-port=0","--user-data-dir="+dir+"/profile","about:blank"]);
let socket,call,js;
try {
  const endpoint=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("Browser startup timeout")),15000);chrome.stderr.on("data",d=>{const m=String(d).match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1])}});chrome.on("error",reject)});
  const target=await(await fetch("http://127.0.0.1:"+new URL(endpoint).port+"/json/new?about:blank",{method:"PUT"})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>{socket.onopen=r});let serial=0;const pending=new Map();
  call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==="Fetch.requestPaused"){
    const e=m.params,u=new URL(e.request.url);
    if(u.pathname.startsWith("/api/v1/")){
      requests.push({path:u.pathname,method:e.request.method});
      // Redirect only local API requests to the disposable server. Chromium sends
      // original multipart bytes/auth and performs the real CORS checks.
      const refresh=u.pathname.endsWith("/auth/refresh");
      // The opt-in harness has no refresh-cookie endpoint. Use its real fixture
      // login response at this auth boundary only; never claim production auth proof.
      void call("Fetch.continueRequest",{requestId:e.requestId,url:refresh?api+"/auth/login":api+u.pathname.slice(7)+u.search,...(refresh&&e.request.method!=="OPTIONS"?{postData:Buffer.from(JSON.stringify({identifier:"authoring-lecturer",password:"authoring-browser"})).toString("base64")}: {})}).catch(x=>errors.push(x.message));
    }else if(u.origin===web)void call("Fetch.continueRequest",{requestId:e.requestId});
    else void call("Fetch.fulfillRequest",{requestId:e.requestId,responseCode:404});
  }if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.text);
    if(m.method==="Page.javascriptDialogOpening"){errors.push("Unexpected native dialog");void call("Page.handleJavaScriptDialog",{accept:false})}
    if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result)}
  };
  js=async expression=>{const r=await call("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
  const wait=async expression=>{for(let i=0;i<250;i++){if(await js(expression))return;await new Promise(r=>setTimeout(r,100))}throw Error("Timeout: "+expression)};
  const fill=(selector,value)=>js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing field');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  const click=label=>js(`(()=>{const e=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!e||e.disabled)throw Error('Missing/disabled button '+${JSON.stringify(label)});e.click()})()`);
  const escape=async()=>{await call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});await call("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27})};
  const shot=async name=>{await writeFile(join(dir,name+".png"),Buffer.from((await call("Page.captureScreenshot")).data,"base64"))};
  await call("Page.enable");await call("Runtime.enable");await call("Fetch.enable",{patterns:[{urlPattern:"*"}]});
  await call("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await call("Page.navigate",{url:web+"/daily?date="+date});await wait("!!document.querySelector('#daily-plan-form')&&!document.querySelector('#startup-loader')");
  await click("Thêm việc");await wait("!!document.querySelector('#daily-task-modal-input')");
  await fill("#daily-task-modal-input","Task persisted without extra Save");await click("Thêm và lưu việc");
  await wait("document.querySelectorAll('.study-task').length===1");
  let saved=json(await request("/daily/plans?date="+date));
  assert.equal(saved.tasks[0].title,"Task persisted without extra Save");assert.equal(saved.firstSubmittedAt,null);
  const firstId=saved.tasks[0].id;
  checks.push("mounted Add confirms real server/SQL persistence without extra Save or Submit");
  await fill(".study-task__main > input","Unrelated local edit");
  await click("Nhìn lại ngày");await wait("!!document.querySelector('#daily-tomorrow')");await fill("#daily-tomorrow","Unsaved reflection preserved");await escape();
  await click("Thêm việc");await wait("!!document.querySelector('#daily-task-modal-input')");await fill("#daily-task-modal-input","Second persisted task");await click("Thêm và lưu việc");await wait("document.querySelectorAll('.study-task').length===2");
  saved=json(await request("/daily/plans?date="+date));
  assert.equal(saved.tasks.length,2);assert.equal(saved.tasks[0].title,"Task persisted without extra Save");assert.equal(saved.reviewTomorrow,null);assert.equal(saved.firstSubmittedAt,null);
  assert.equal(await js("document.querySelector('.study-task__main > input').value"),"Unrelated local edit");
  await click("Nhìn lại ngày");await wait("!!document.querySelector('#daily-tomorrow')");assert.equal(await js("document.querySelector('#daily-tomorrow').value"),"Unsaved reflection preserved");
  await click("Lưu kế hoạch và nhìn lại");await wait("!document.querySelector('.daily-reflection-dialog')");
  saved=json(await request("/daily/plans?date="+date));assert.equal(saved.reviewTomorrow,"Unsaved reflection preserved");assert.equal(saved.tasks[0].title,"Unrelated local edit");assert.equal(saved.firstSubmittedAt,null);
  await call("Page.reload");await wait("document.querySelectorAll('.study-task').length===2&&!document.querySelector('#startup-loader')");
  assert.equal(await js("document.querySelector('.study-task__main > input').value"),"Unrelated local edit");
  checks.push("real append preserves unrelated task/reflection drafts; explicit reflection Save and full reload reopen");
  const root="/daily/plans/"+saved.id+"/tasks/"+firstId+"/evidence",planBefore=saved;
  const png=await readFile("public/social-icons/youtube.png");
  for(let i=0;i<4;i++){const body=new FormData();body.append("file",new Blob([png],{type:"image/png"}),"notes-"+i+".png");if(i===0)body.append("stage","START");const r=await request(root,"POST",body);assert.equal(r.status,201);assert.equal(json(r).stage,i===0?"START":"GENERAL")}
  let body=new FormData();body.append("file",new Blob(["Real PDF fixture bytes"],{type:"application/pdf"}),"notes.pdf");assert.equal((await request(root,"POST",body)).status,201);
  assert.equal((await request(root+"/links","POST",{stage:"FINISH",url:"https://example.test/legacy",label:"Legacy saved link"})).status,201);
  await call("Page.reload");await wait("document.querySelectorAll('.daily-evidence-photo img').length===2");
  assert.equal(await js("document.querySelector('.daily-evidence-photo__more').textContent"),"+2");
  await shot("real-http-gallery-desktop");
  await js("document.querySelector('.daily-evidence-photo').click()");await wait("!!document.querySelector('.daily-gallery-dialog img')");
  await shot("real-http-viewer");await escape();
  const items=json(await request(root));assert.equal(items.length,6);
  const bytes=await request(root+"/"+items[0].id+"/bytes");assert.equal(bytes.status,200);assert.deepEqual(bytes.bytes,png);assert.equal(bytes.headers["cache-control"],"no-store");
  assert.deepEqual(json(await request("/daily/plans?date="+date)),planBefore,"Evidence changed plan/version/submission");
  const denied=await request(root+"/"+items[0].id+"/bytes","GET",undefined,"authoring-student");assert.equal(denied.status,403);
  checks.push("real neutral/legacy uploads, original private bytes, bounded gallery and unrelated-account denial");
  await js("document.querySelector('.daily-evidence-add').click()");await wait("!!document.querySelector('.daily-evidence-dialog input[type=file]')");
  const document=await call("DOM.getDocument"),input=await call("DOM.querySelector",{nodeId:document.root.nodeId,selector:".daily-evidence-dialog input[type=file]"});
  await call("DOM.setFileInputFiles",{nodeId:input.nodeId,files:[process.cwd()+"/public/social-icons/youtube.png"]});
  await wait("![...document.querySelectorAll('.daily-evidence-dialog button')].find(b=>b.textContent.trim()==='Lưu tệp minh chứng').disabled");
  await click("Lưu tệp minh chứng");await wait("document.querySelector('.daily-evidence-dialog').textContent.includes('Đã lưu tệp')");
  assert.equal(json(await request(root)).length,7);assert.deepEqual(json(await request("/daily/plans?date="+date)),planBefore);
  await escape();await call("Page.reload");await wait("document.querySelector('.daily-evidence-all')?.textContent.includes('(7)')");
  await call("Emulation.setDeviceMetricsOverride",{width:320,height:568,deviceScaleFactor:1,mobile:true});await shot("real-http-reopen-320");
  checks.push("mounted file upload uses actual multipart endpoint; private SQL bytes survive full reload");
  assert.equal(requests.some(r=>r.path.endsWith("/sharing")&&r.method==="PUT"),false);
  assert.deepEqual(errors,[]);assert.deepEqual(await manifest(),candidateStart);
}catch(error){errors.push(error.stack);process.exitCode=1;if(call&&js){try{await writeFile(join(dir,"failure.txt"),await js("document.body.innerText"));await writeFile(join(dir,"failure.png"),Buffer.from((await call("Page.captureScreenshot")).data,"base64"))}catch{}}}
finally{await writeFile(join(dir,"results.json"),JSON.stringify({checks,errors,requests,candidateStart,candidateEnd:await manifest(),limits:["Disposable loopback PostgreSQL and production Daily/evidence services; fixture login responses adapt refresh requests because harness has no cookie refresh route. Not production auth/cookie/token/provider proof","No remote media/external coordination; Chromium software-rendered, not physical-device/WebKit proof"]},null,2));console.log(JSON.stringify({dir,checks,errors},null,2));socket?.close();chrome.kill()}
