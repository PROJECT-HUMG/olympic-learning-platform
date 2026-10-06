// Current UI only, synthetic API responses. No live API or external service writes.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const web = process.env.DAILY_WEB_URL ?? "http://127.0.0.1:3000";
const layoutOnly = process.env.DAILY_CHECK_SCOPE === "layout";
const interactionsOnly = process.env.DAILY_CHECK_SCOPE === "interactions";
const dir = await mkdtemp(join(tmpdir(), "daily-ux-"));
const candidatePaths = [
  "components/daily-plan-editor.tsx", "components/daily-week-editor.tsx",
  "groups/feedback-panel.tsx", "groups/group-controls.tsx", "groups/groups.css",
  "hooks/use-daily.ts", "hooks/use-daily-editor.ts", "hooks/use-daily-auto-sync.ts", "ui/daily-sync-status.tsx", "lib/daily-lifecycle.ts", "lib/calendar-presentation.ts", "lib/daily-contract.ts",
  "lib/plan-editor.ts", "services/daily.service.ts", "ui/study-calendar.tsx",
  "lib/date-selection.ts", "ui/study-date-picker.tsx", "evidence/evidence-panel.tsx", "evidence/evidence-contract.ts", "evidence/evidence-preview.ts", "evidence/evidence.service.ts", "ui/use-daily-confirm.tsx", "ui/daily-dialog-header.tsx",
  "ui/study-notebook.css", "ui/study-notebook.tsx", "ui/study-section.ts",
].map(path => `src/features/daily/${path}`).concat([
  "src/pages/daily-owner-page.tsx", "src/pages/daily-groups-page.tsx",
  "src/pages/daily-shared-review-page.tsx", "tests/daily-study-ui.test.ts",
  "src/pages/daily-week-page.tsx", "tests/daily-wire.test.ts",
  "tests/daily-calendar-presentation.test.ts", "tests/daily-ux-browser-check.mjs",
  "src/features/home/components/home-study-notebook.tsx", "src/features/home/components/home-hero-section.css",
  "src/pages/home-page.css", "src/layouts/dashboard-layout.tsx", "src/layouts/navigation.css",
  "src/components/ui/page-layout.css", "src/index.css", "tests/daily-alignment.test.ts",
  "src/components/ui/dialog.tsx", "src/components/ui/alert-dialog.tsx",
]);
const manifest = async () => Object.fromEntries(await Promise.all(candidatePaths.map(async path => [path, createHash("sha256").update(await readFile(new URL(`../${path}`, import.meta.url))).digest("hex")])));
const candidateStart = await manifest();
const uuid = n => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const owner = uuid(1), member = uuid(2), groupId = uuid(3), date = "2026-10-05";
const user = { id: owner, username: "ui-fixture", displayName: "Daily UI fixture", email: "fixture@example.test", role: "STUDENT", status: "ACTIVE", avatarUrl: null, avatarCrop: null };
let plan = { id: uuid(4), ownerId: owner, planDate: date, firstSubmittedAt: null, onTime: false, reviewReasons: "", reviewWentWell: "", reviewTomorrow: "", version: 0, createdAt: "2026-10-05T00:00:00Z", updatedAt: "2026-10-05T00:00:00Z", tasks: Array.from({ length: 12 }, (_, n) => ({ id: uuid(20 + n), title: `Ôn tập chuyên đề ${n + 1}`, priority: n < 3 ? "MUST" : "SHOULD", status: "TODO", position: n })) };
const recount = value => ({ ...value, totalCount: value.tasks.length, completedCount: value.tasks.filter(t => t.status === "COMPLETED").length, mustTotal: value.tasks.filter(t => t.priority === "MUST").length, mustCompleted: value.tasks.filter(t => t.priority === "MUST" && t.status === "COMPLETED").length });
let sharing = { shareDaily: false, sharingMode: "GROUP", selectedViewerIds: [] };
const group = () => ({ id: groupId, name: "Nhóm học mỗi ngày", ownerId: owner, avatar: null, members: [{ userId: owner, displayName: user.displayName }, ...Array.from({ length: 5 }, (_, n) => ({ userId: n === 0 ? member : uuid(100 + n), displayName: `Bạn học ${n + 1}` }))], mySharing: sharing });
const week = { id: uuid(5), weekStart: date, recurringUnfinished: "", issues: "", reflection: "Nhìn lại bản đã lưu", nextWeekChanges: "", plannedDays: 1, weekDays: 7, nonemptyDays: 1, completionRate: 0, mustCompleted: 0, mustTotal: 3, mustRate: 0, onTimeDays: 0, version: 0 };
let historyMode = "loading", failSave = false, heldSave = false, acceptDialog = false;
let heldAdd=false, failAdd=false, failUpload=false, releaseAdd;
let evidenceItems=[];
let evidenceVariants=false;
let previewBytes=Buffer.from("");
const initialPlan = structuredClone(plan);
let emptyGroups = false, missingPlan = false, invitationMode = "empty", invitationItems = [];
let releaseInvitations;
const layoutMetrics = [];
let releaseHistory, releaseSave;
const requests = [], checks = [], errors = [], canceledRequests = [], dialogFocusTrace = [];
const chrome = spawn(process.env.DAILY_CHROME_PATH ?? "/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${dir}/profile`, "about:blank"]);
let socket, call, js;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Chromium startup timeout")), 15000);
    chrome.stderr.on("data", data => { const match = String(data).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    chrome.on("error", reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => { socket.onopen = resolve; });
  let serial = 0;
  const pending = new Map();
  call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const fulfill = async event => {
    const url = new URL(event.request.url);
    if (!url.pathname.startsWith("/api/v1/")) {
      // No external navigation/assets: keep the rendered assessment local.
      return url.origin === new URL(web).origin && !/\.(mp4|webm)$/.test(url.pathname) ? call("Fetch.continueRequest", { requestId: event.requestId }) : call("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: 404 });
    }
    const path = url.pathname.slice(7), method = event.request.method;
    let body = {}, status = 200;
    const input = event.request.postData && !event.request.postData.startsWith("--") ? JSON.parse(event.request.postData) : {};
    requests.push({ path, method, query: Object.fromEntries(url.searchParams), input });
    if (method === "OPTIONS") body = {};
    else if (path === "/users/me") body = user;
    else if (path === "/auth/refresh") body = { accessToken: "local-synthetic-fixture" };
    else if (path === "/daily/plans/dates") {
      if (historyMode === "loading") await new Promise(resolve => { releaseHistory = resolve; });
      if (historyMode === "error") { status = 503; body = { status: 503, detail: "Synthetic history failure" }; }
      else body = historyMode === "empty" ? [] : ["2026-09-21", "2026-09-14", "2026-09-07", "2026-08-31", "2026-08-24", "2026-08-17", "2026-08-10"];
    }
    else if (path === "/daily/plans/tasks") {
      if (heldAdd) await new Promise(resolve=>{releaseAdd=resolve});
      if (failAdd) {status=503;body={status:503};}
      else if (failSave) {status=409;body={status:409,messageKey:"error.resource.stateConflict"};}
      else {missingPlan=false;plan={...plan,version:plan.version+1,tasks:[...plan.tasks,{id:input.taskId,title:input.title,priority:input.priority,status:input.status,position:plan.tasks.length}]};body=recount(plan);}
    }
    else if (path === "/daily/plans") {
      if (method === "PUT") {
        if (heldSave) await new Promise(resolve => { releaseSave = resolve; });
        if (failSave) { status = 409; body = { status: 409, messageKey: "error.resource.stateConflict" }; }
        else { status = missingPlan ? 201 : 200; missingPlan = false; plan = { ...plan, planDate:url.searchParams.get('date'), ...input, version: plan.version + 1, tasks: input.tasks.map((t, n) => ({ ...t, id: t.id ?? uuid(80 + n), position: n })) }; body = recount(plan); }
      } else if(missingPlan){status=404;body={status:404,messageKey:"error.resource.notFound"};}
      else body = recount({ ...plan, planDate: url.searchParams.get("date") });
    }
    else if (path === `/daily/plans/${plan.id}/submit`) { plan = { ...plan, firstSubmittedAt: plan.firstSubmittedAt ?? "2026-10-05T00:00:00Z", onTime: true, version: plan.version + 1 }; body = recount(plan); }
    else if (path === "/daily/weeks") { if (method === "PUT") Object.assign(week, input, { version: week.version + 1 }); body = { ...week, weekStart: url.searchParams.get("weekStart") ?? input.weekStart }; }
    else if (path === "/documents" || path === "/posts") body = {content:[],totalElements:0,totalPages:0,number:0,size:3,last:true};
    else if (path === "/groups") body = emptyGroups ? [] : [group()];
    else if (path === "/groups/invitations") {
      if (invitationMode === "loading") await new Promise(resolve => { releaseInvitations = resolve; });
      if (invitationMode === "error") { status = 503; body = { status:503, detail:"Không tải được lời mời trong fixture." }; }
      else body = invitationItems;
    }
    else if (path.startsWith("/groups/invitations/") && method === "POST") {
      invitationItems = invitationItems.filter(i => !path.includes(i.id));
      if (path.endsWith("/accept")) emptyGroups = false;
      status = 204;
    }
    else if (path === `/groups/${groupId}`) body = group();
    else if (path === `/groups/${groupId}/sharing`) { sharing = input; body = sharing; }
    else if (path === `/groups/${groupId}/daily`) body = { groupId, date: url.searchParams.get("date"), members: [{ userId: owner, displayName: user.displayName, access: "NOT_SHARED", summary: null }, ...Array.from({ length: 5 }, (_, n) => ({ userId: n === 0 ? member : uuid(100 + n), displayName: `Bạn học ${n + 1}`, access: "SHARED", summary: { planId: plan.id, firstSubmittedAt: null, onTime: false, completedCount: 0, totalCount: 12, mustCompleted: 0, mustTotal: 3 } }))] };
    else if (path.endsWith("/feedback")) body = { contributions: [], contributorCount: 0 };
    else if (path.includes("/daily/") && path.endsWith("/plans")) body = recount({ ...plan, ownerId: member, planDate: url.searchParams.get("date") });
    else if (path.includes("/daily/") && path.endsWith("/weeks")) body = { ...week, weekStart: url.searchParams.get("weekStart") };
    else if (path.includes("/evidence")) {
      if (path.endsWith("/bytes")) return call("Fetch.fulfillRequest",{requestId:event.requestId,responseCode:200,responseHeaders:[{name:"Content-Type",value:"application/octet-stream"},{name:"Cache-Control",value:"no-store"},{name:"Access-Control-Allow-Origin",value:new URL(web).origin},{name:"Access-Control-Allow-Credentials",value:"true"}],body:previewBytes.toString("base64")});
      if(method==="POST") {
        if(failUpload){status=503;body={status:503};}
        else { const row={...evidenceItems[0],id:uuid(600),stage:"GENERAL",originalName:"icons.png"};evidenceItems.push(row);body=row;status=201; }
      } else if(method==="DELETE"){evidenceItems=evidenceItems.filter(item=>!path.endsWith(item.id));status=204;}
      else body=path.includes(plan.tasks[0]?.id) ? evidenceItems : evidenceVariants && path.includes(plan.tasks[1]?.id) ? evidenceItems.slice(0,1).map(item=>({...item,taskId:plan.tasks[1].id})) : evidenceVariants && path.includes(plan.tasks[2]?.id) ? evidenceItems.filter(item=>item.kind==='LINK'||item.contentType==='application/pdf').map(item=>({...item,taskId:plan.tasks[2].id})) : [];
    }
    else { status = 404; body = { status: 404 }; }
    return call("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: new URL(web).origin }, { name: "Access-Control-Allow-Credentials", value: "true" }, { name: "Access-Control-Allow-Headers", value: "authorization,content-type" }, { name: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" }], body: Buffer.from(JSON.stringify(body)).toString("base64") });
  };
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === "Fetch.requestPaused") void fulfill(message.params).catch(e => {
      // Navigating away or the startup asset owner aborting its request can invalidate
      // a paused interception. Preserve the diagnostic rather than report a JS defect.
      if (e.message.includes("Invalid InterceptionId")) canceledRequests.push(message.params.request.url);
      else errors.push(e.message);
    });
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    if (message.method === "Page.javascriptDialogOpening") void call("Page.handleJavaScriptDialog", { accept: acceptDialog });
    if (!message.id) return;
    const result = pending.get(message.id); pending.delete(message.id);
    if (message.error) result.reject(Error(JSON.stringify(message.error))); else result.resolve(message.result);
  };
  js = async expression => { const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const wait = async expression => { for (let n = 0; n < 150; n++) { if (await js(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw Error(`Timeout: ${expression}`); };
  const click = text => js(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e||e.disabled)throw Error('Missing or disabled '+${JSON.stringify(text)});e.click()})()`);
  const fill = (selector, value) => js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing field');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`);
  const navigate = async (path, initial = false) => {
    // Page.navigate acknowledges before the new document mounts. Never accept the
    // previous document's page-shell/loader state as proof of route readiness.
    const previous = await js("globalThis.dailyDocumentId");
    await call("Page.navigate", { url: web + path });
    await wait(`!!globalThis.dailyDocumentId && globalThis.dailyDocumentId!==${JSON.stringify(previous) ?? "undefined"}`);
    await wait("!!document.querySelector('.page-shell')");
    if (!initial) await wait("!document.querySelector('#root[inert]') && !document.querySelector('#startup-loader')");
  };
  const shot = async name => { await js("new Promise(r=>setTimeout(r,300))"); await writeFile(join(dir, name + ".png"), Buffer.from((await call("Page.captureScreenshot", { captureBeyondViewport: false })).data, "base64")); };
  const fit = async name => { assert.ok(await js("document.documentElement.scrollWidth<=innerWidth"), `${name}: horizontal overflow`); checks.push(name); };
  const viewport = (width, height = 900) => call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  const key = async (key, code, virtual, text) => {
    // Chromium activation needs the actual Enter character, not a literal \\r.
    if (key === "Enter" && text === undefined) text = "\r";
    await call("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode: virtual, nativeVirtualKeyCode: virtual, ...(text ? { text, unmodifiedText: text } : {}) });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtual, nativeVirtualKeyCode: virtual });
  };
  const openCalendar = async () => {
    // Wait for the previous modal's focus-return handoff before opening another surface.
    await wait("!document.querySelector('[role=alertdialog], [role=dialog]')");
    await js("new Promise(r=>setTimeout(r,150))");
    await js("document.querySelector('.study-date-trigger').focus();document.querySelector('.study-date-trigger').click()");
    await wait("!!document.querySelector('.study-date-popover')");
  };
  const selectDate = async value => js(`document.querySelector('[data-calendar-date="${value}"]').click()`);
  const calendarFit = async name => { await fit(name); assert.ok(await js("(()=>{const r=document.querySelector('.study-date-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()")); await shot(name); };
  await call("Page.enable"); await call("Runtime.enable");
  await call("Emulation.setTimezoneOverride", { timezoneId: "America/Los_Angeles" });
  await call("Page.addScriptToEvaluateOnNewDocument", { source: `globalThis.dailyDocumentId=crypto.randomUUID();const RealDate=Date;const clockStart=RealDate.now();globalThis.dailyClock='2026-10-04T17:05:00Z';globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[new RealDate(globalThis.dailyClock).getTime()+RealDate.now()-clockStart]));}static now(){return new RealDate(globalThis.dailyClock).getTime()+RealDate.now()-clockStart;}};` });
  await call("Page.bringToFront");
  await call("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (!layoutOnly) {
    await viewport(1440);
    previewBytes=Buffer.from(await js(`(()=>{const c=document.createElement('canvas');c.width=640;c.height=440;const x=c.getContext('2d');x.fillStyle='#f4f7fa';x.fillRect(0,0,640,440);x.strokeStyle='#cbd5e1';for(let y=90;y<420;y+=38){x.beginPath();x.moveTo(32,y);x.lineTo(608,y);x.stroke()}x.fillStyle='#294c70';x.font='26px serif';x.fillText('Study notes · Daily',32,50);x.font='22px serif';x.fillText('f(x) = x² + 2x + 1',48,128);x.fillText('Question → method → reflection',48,204);x.fillText('One clear step at a time.',48,280);return c.toDataURL('image/png').split(',')[1]})()`),"base64");
    evidenceItems=Array.from({length:4},(_,i)=>({id:uuid(500+i),planId:plan.id,taskId:plan.tasks[0].id,stage:i?"GENERAL":"START",kind:"FILE",originalName:"Ghi chú học tập "+(i+1)+".png",contentType:"image/png",sizeBytes:previewBytes.length,url:null,label:null,createdAt:"2026-10-05T00:00:00Z"}));
    evidenceItems.push({...evidenceItems[0],id:uuid(510),originalName:"Bài giải có ghi chú.pdf",contentType:"application/pdf",sizeBytes:42});
    evidenceItems.push({...evidenceItems[0],id:uuid(511),kind:"LINK",stage:"FINISH",originalName:null,contentType:null,sizeBytes:null,url:"https://example.test/legacy",label:"Tài liệu đã lưu từ trước"});
    await navigate("/daily",true);
    await wait("document.querySelectorAll('.study-task').length===12&&!document.querySelector('#startup-loader')");
    assert.equal(await js("document.querySelector('.study-date-trigger').getAttribute('aria-label')"),"Chọn ngày: "+date);
    assert.equal(await js("document.querySelectorAll('.study-date-popover,input[type=date]').length"),0);
    await click("Thêm việc");await wait("!!document.querySelector('.daily-add-dialog input')");
    await fill("#daily-task-modal-input","Canceled");await key("Escape","Escape",27);
    await wait("!document.querySelector('.daily-add-dialog')");
    assert.equal(requests.filter(r=>r.path==="/daily/plans/tasks").length,0);
    assert.equal(await js("document.activeElement.id"),"daily-add-task");
    checks.push("Add cancel/Escape performs no persistence and returns focus");

    await fill(".study-task__main > input","Unrelated unsaved task title");
    await click("Nhìn lại ngày");await wait("!!document.querySelector('#daily-tomorrow')");
    await fill("#daily-tomorrow","Unrelated unsaved reflection");await key("Escape","Escape",27);
    await wait("document.querySelector('.study-savebar').textContent.includes('Đã đồng bộ')");
    await click("Thêm việc");await wait("!!document.querySelector('.daily-add-dialog')");
    await fill("#daily-task-modal-input","Immediately saved task");
    failAdd=true;await click("Thêm và lưu việc");await wait("document.querySelector('.daily-add-dialog')?.textContent.includes('Chưa xác nhận')");
    const retryId=requests.findLast(r=>r.path==="/daily/plans/tasks"&&r.method==="POST").input.taskId;
    failAdd=false;heldAdd=true;await click("Thử lưu lại");await new Promise(resolve=>setTimeout(resolve,200));assert.equal(typeof releaseAdd,"function");
    await shot("add-pending-desktop");assert.equal(await js("document.querySelector('.daily-add-dialog').textContent.includes('Đang lưu việc')"),true);
    await key("Escape","Escape",27);assert.ok(await js("!!document.querySelector('.daily-add-dialog')"));
    heldAdd=false;releaseAdd();
    await wait("document.querySelectorAll('.study-task').length===13&&!document.querySelector('.daily-add-dialog')");
    assert.equal(requests.findLast(r=>r.path==="/daily/plans/tasks"&&r.method==="POST").input.taskId,retryId);
    assert.equal(plan.tasks[0].title,"Unrelated unsaved task title");assert.equal(plan.reviewTomorrow,"Unrelated unsaved reflection");
    assert.equal(plan.firstSubmittedAt,null);assert.equal(await js("document.querySelector('.study-task__main > input').value"),"Unrelated unsaved task title");
    await click("Nhìn lại ngày");await wait("!!document.querySelector('#daily-tomorrow')");
    assert.equal(await js("document.querySelector('#daily-tomorrow').value"),"Unrelated unsaved reflection");await key("Escape","Escape",27);
    await wait("document.querySelector('.study-savebar').textContent.includes('Đã đồng bộ')");
    assert.equal(plan.reviewTomorrow,"Unrelated unsaved reflection");assert.equal(plan.firstSubmittedAt,null);
    await click("Nộp kế hoạch");await wait("document.querySelector('.study-submit-status').textContent.includes('Đúng hạn')");
    checks.push("append failure/pending/retry uses stable UUID, retains automatically saved edits, and sync remains separate from Submit");
    await navigate("/daily?date="+date);await wait("document.querySelectorAll('.study-task').length===13");
    assert.equal(await js("document.querySelector('.study-task__main > input').value"),"Unrelated unsaved task title");
    checks.push("synthetic add/save/reopen roundtrip; no real server persistence claim");
    await wait("document.querySelectorAll('.daily-evidence-photo img').length===2");
    assert.equal(await js("document.querySelector('.daily-evidence-photo__more').textContent"),"+2");
    await shot("day-gallery-desktop-light");
    await js("document.querySelector('.daily-evidence-photo').click()");await wait("!!document.querySelector('.daily-gallery-dialog img')");
    await shot("gallery-desktop-light");
    await click("Sau");await wait("document.querySelector('.daily-gallery-caption').textContent.includes('2 / 6')");
    await js("document.querySelectorAll('.daily-gallery-index button')[4].click()");
    await wait("document.querySelector('.daily-gallery-dialog').textContent.includes('không tạo hình xem trước giả')");
    assert.equal(await js("document.querySelectorAll('.daily-gallery-view img').length"),0);
    await shot("gallery-document-desktop");
    await js("document.querySelectorAll('.daily-gallery-index button')[5].click()");
    assert.ok(await js("!!document.querySelector('.daily-legacy-link')"));
    await key("Escape","Escape",27);await wait("!document.querySelector('.daily-gallery-dialog')");
    await wait("document.activeElement.classList.contains('daily-evidence-photo')");
    checks.push("two image previews +N, all six peers, document cards and retained legacy links; gallery focus/Escape");

    await js("document.querySelector('.daily-evidence-add').click()");await wait("!!document.querySelector('.daily-evidence-dialog input[type=file]')");
    assert.equal(await js("document.querySelectorAll('.daily-evidence-dialog input[type=url], .daily-evidence-dialog select').length"),0);
    const fileNode=await call("DOM.getDocument");
    const found=await call("DOM.querySelector",{nodeId:fileNode.root.nodeId,selector:".daily-evidence-dialog input[type=file]"});
    await call("DOM.setFileInputFiles",{nodeId:found.nodeId,files:[process.cwd()+"/public/social-icons/youtube.png"]});
    await wait("!document.querySelector('.daily-evidence-dialog button:last-child').disabled");
    failUpload=true;await click("Lưu tệp minh chứng");await wait("document.querySelector('.daily-evidence-dialog').textContent.includes('Chưa xác nhận')");
    await shot("evidence-upload-error");
    failUpload=false;await click("Lưu tệp minh chứng");await wait("document.querySelector('.daily-evidence-dialog').textContent.includes('Đã lưu tệp')");
    assert.equal(evidenceItems.at(-1).stage,"GENERAL");
    await key("Escape","Escape",27);
    checks.push("file-only upload dialog honest failure/retry and neutral metadata; synthetic storage only");

    evidenceVariants=true;await navigate('/daily?date='+date);
    await wait("document.querySelectorAll('.study-task')[1].querySelectorAll('.daily-evidence-photo img').length===1");
    await shot('task-ribbon-desktop-variants');
    const taskMetrics=await js("[...document.querySelectorAll('.study-task')].slice(0,4).map(e=>{const r=e.getBoundingClientRect(),t=e.querySelector('.study-task__main > input').getBoundingClientRect(),node=e.querySelector('.daily-evidence-previews'),p=node?.getBoundingClientRect();return {height:r.height,titleX:t.x+parseFloat(getComputedStyle(e.querySelector('.study-task__main > input')).paddingLeft),previewX:node?p.x+parseFloat(getComputedStyle(node).paddingLeft):null,photos:e.querySelectorAll('.daily-evidence-photo').length,files:e.querySelectorAll('.daily-evidence-file').length}})");
    assert.ok(taskMetrics[0].height<230,'Evidence no longer inflates a detached split row');
    assert.ok(taskMetrics[3].height<90,'Empty evidence has no reserved split column/row');
    assert.ok(Math.abs(taskMetrics[0].titleX-taskMetrics[0].previewX)<1,'Preview ribbon aligned with its task title');
    assert.equal(taskMetrics[1].photos,1);assert.equal(taskMetrics[2].files,2);assert.equal(taskMetrics[3].photos,0);
    layoutMetrics.push({name:'task-ribbon-desktop-variants',taskMetrics});
    checks.push('one/many/no images and non-image/legacy cards grouped with their own task header; compact empty row and aligned previews');

    for(const [width,height] of [[1440,900],[1024,900],[768,1024],[390,844],[320,568],[320,360]]) {
      await viewport(width,height);await js("scrollTo(0,0)");
      await fit("day-"+width+"x"+height);await shot("day-"+width+"x"+height+"-light");
      await js("scrollTo(0,scrollY+document.querySelector('.study-task').getBoundingClientRect().top-80)");
      await shot("task-ribbon-"+width+"x"+height+"-light");
      await js("scrollTo(0,0)");
      await click("Nhìn lại ngày");await wait("!!document.querySelector('.daily-reflection-dialog')");
      await fit("reflection-"+width+"x"+height);await shot("reflection-"+width+"x"+height+"-light");
      assert.ok(await js("(()=>{const r=document.querySelector('.daily-reflection-dialog').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()"));
      assert.equal(await js("document.querySelector('#daily-tomorrow').value"),"Unrelated unsaved reflection");
      assert.equal(await js("document.querySelectorAll('.daily-reflection-context li').length"),13);
      await key("Escape","Escape",27);await wait("!document.querySelector('.daily-reflection-dialog')");
      await js("document.querySelector('.daily-evidence-photo').click()");await wait("!!document.querySelector('.daily-gallery-dialog')");
      await fit("gallery-"+width+"x"+height);await shot("gallery-"+width+"x"+height+"-light");
      await js("(()=>{const d=document.querySelector('.daily-gallery-dialog');d.scrollTop=d.scrollHeight;d.querySelector('.daily-gallery-controls button').focus()})()");
      await shot("gallery-controls-"+width+"x"+height+"-light");
      assert.ok(await js("(()=>{const r=document.querySelector('.daily-dialog-close').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()"));
      await key("Escape","Escape",27);await wait("!document.querySelector('.daily-gallery-dialog')");
      await wait("document.activeElement.classList.contains('daily-evidence-photo')");
    }
    await viewport(1440);await js("document.documentElement.classList.add('dark')");
    await shot("day-desktop-dark");await click("Nhìn lại ngày");await wait("!!document.querySelector('.daily-reflection-dialog')");await shot("reflection-desktop-dark");
    assert.equal(await js("getComputedStyle(document.querySelector('.daily-reflection-dialog')).animationName"),"none");
    await key("Escape","Escape",27);
    failSave=true;await fill(".study-task__main > input","Keep local before reload");
    await wait("document.querySelector('.daily-sync-status').textContent.includes('Bản máy chủ đã đổi')");
    await click("Tải bản trên máy chủ");await wait("!!document.querySelector('[role=alertdialog]')");
    await click("Giữ nguyên");assert.equal(await js("document.querySelector('.study-task__main > input').value"),"Keep local before reload");
    await click("Tải bản trên máy chủ");await wait("!!document.querySelector('[role=alertdialog]')");
    await shot("custom-reload-confirmation");await click("Xác nhận");
    await wait("document.querySelector('.study-task__main > input').value==='Unrelated unsaved task title'&&!document.querySelector('[role=alertdialog]')");
    failSave=false;
    checks.push("custom reload confirmation cancel retains drafts; explicit confirmation reloads");
    await openCalendar();await calendarFit("calendar-desktop-keyboard");
    await key("ArrowRight","ArrowRight",39);await wait("document.activeElement.dataset.calendarDate==='2026-10-06'");
    await key("Enter","Enter",13);await wait("!document.querySelector('.study-date-popover')");
    await wait("document.querySelector('.study-date-trigger')?.getAttribute('aria-label')==='Chọn ngày: 2026-10-06'");
    await navigate("/daily?date=invalid");await wait("document.body.innerText.includes('Ngày không hợp lệ')");
    assert.equal(await js("document.querySelectorAll('.study-task').length"),0);
    await navigate("/daily?date=2026-09-21");await wait("!!document.querySelector('.study-date-trigger')");
    assert.equal(await js("document.querySelector('.study-date-trigger').getAttribute('aria-label')"),"Chọn ngày: 2026-09-21");
    checks.push("today default, explicit historic date, invalid date and keyboard compact picker retained");
    await fill(".study-task__main > input","Keep when choosing another date");
    await openCalendar();await selectDate('2026-09-22');
    await wait("document.querySelector('.study-date-popover [role=alert]')?.textContent.includes('chưa đồng bộ')");
    assert.equal(await js("document.querySelector('.study-task__main > input').value"),"Keep when choosing another date");
    assert.equal(await js("new URLSearchParams(location.search).get('date')"),'2026-09-21');
    await key('Escape','Escape',27);await wait("document.querySelector('.study-savebar').textContent.includes('Đã đồng bộ')");
    heldSave=true;await fill('.study-task__main > input','Keep during auto-sync');await wait("document.querySelector('.study-savebar').textContent.includes('Đang đồng bộ')");
    assert.equal(await js("document.querySelector('.study-date-trigger').disabled"),true);
    heldSave=false;releaseSave();await wait("!document.querySelector('.study-date-trigger').disabled");
    checks.push('dirty and pending synchronization prevent date changes without losing task edits');
    await openCalendar();await js("[...document.querySelectorAll('.study-calendar-links a')].find(a=>a.textContent==='Các tuần đã lưu').click()");await wait("document.body.innerText.includes('Đang tải lịch sử')");
    assert.equal(await js("document.querySelectorAll('.study-week-card').length"),0);await shot('history-loading-desktop');
    historyMode='error';releaseHistory();await wait("document.body.innerText.includes('Thử lại lịch sử')");
    assert.equal(await js("document.querySelectorAll('.study-week-card').length"),0);await shot('history-error-desktop');
    historyMode='empty';await click('Thử lại lịch sử');await wait("document.body.innerText.includes('Chưa có tuần nào có kế hoạch')");await shot('history-empty-desktop');
    historyMode='success';await navigate('/daily?view=history');await wait("document.querySelectorAll('.study-week-card').length===6");
    await click('Xem tất cả 7 tuần');assert.equal(await js("document.querySelectorAll('.study-week-card').length"),7);await shot('history-populated-desktop');
    checks.push('saved-week pending/error/empty/history truthful; no invented weeks during request failure');
    for(const width of [1440,768,320]) {
      await viewport(width,width===768?1024:width===320?568:900);
      await navigate('/daily/week?weekStart='+date);await wait("!!document.querySelector('.study-week-editor textarea')");await fit('week-context-'+width);await shot('week-context-'+width);
      await navigate('/daily/groups/'+groupId);await wait("document.querySelectorAll('.group-member-card').length===6");
      assert.equal(await js("document.querySelectorAll('.study-week-card').length"),0);await fit('group-members-'+width);await shot('group-members-'+width);
      await click('Quản lý chia sẻ');await wait("document.querySelector('#group-sharing')?.open");
      await js("document.querySelector('#group-sharing-mode').value='SELECTED_MEMBERS';document.querySelector('#group-sharing-mode').dispatchEvent(new Event('change',{bubbles:true}))");
      await js("(()=>{const audience=document.querySelector('#group-sharing input[aria-label]');if(!audience.checked) audience.click()})()");
      await js("document.querySelector('#group-sharing input[type=checkbox]').click()");await click('Lưu chia sẻ');await wait("document.querySelector('#group-sharing').textContent.includes('Chia sẻ đã lưu đang bật')");
      assert.equal(sharing.shareDaily,true);assert.equal(sharing.selectedViewerIds.length,1);
      await js("document.querySelector('#group-sharing input[type=checkbox]').click()");await click('Lưu chia sẻ');await wait("document.querySelector('#group-sharing').textContent.includes('Chia sẻ đã lưu đang tắt')");
      assert.equal(sharing.shareDaily,false);assert.equal(sharing.selectedViewerIds.length,1);await shot('group-sharing-off-'+width);
      await navigate(`/daily/groups/${groupId}/reviews/${member}?date=${date}`);await wait("document.querySelectorAll('.study-task--read-only').length===13");
      await fit('shared-evidence-'+width);await shot('shared-evidence-'+width);
      assert.equal(await js("document.querySelectorAll('.study-shared-review .daily-evidence-add').length"),0);
      checks.push(`${width}: weekly/group/shared presentation; explicit sharing ON/OFF retains audience, read-only evidence has no upload`);
    }
  }
  // Route-history and empty-state composition are separate from populated flow checks.
  if (!interactionsOnly) {
  sharing = {shareDaily:false,sharingMode:"GROUP",selectedViewerIds:[]};
  const spa = async path => {
    await js("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
    const pathname=path.split('?')[0];
    if (!await js(`[...document.querySelectorAll('a[href]')].some(a=>a.getAttribute('href').split('?')[0]===${JSON.stringify(pathname)})`)) {
      await js(`document.querySelector('[aria-label="Mở menu điều hướng"]')?.click()`);
      await wait("!!document.querySelector('.navigation-drawer')");
    }
    await js(`(()=>{const a=[...document.querySelectorAll('a[href]')].find(a=>a.getAttribute('href').split('?')[0]===${JSON.stringify(pathname)});if(!a)throw Error('Missing mounted route link');a.click()})()`);
    await wait(`location.pathname===${JSON.stringify(path.split('?')[0])}`);
    await wait("!document.querySelector('.loading-screen--route, .navigation-drawer')");
    await js("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
  };
  const composition = async (name, kind, isEmpty) => {
    await wait(kind === 'day' ? "!!document.querySelector('#daily-plan-form')&&!!document.querySelector('.study-savebar')" : "!!document.querySelector('.group-invitations__empty')");
    await js('scrollTo(0,0)');
    const metrics = await js(`(() => {
      const rect=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,border:s.borderWidth,radius:s.borderRadius,padding:s.padding,display:s.display};};
      const one=s=>{const e=document.querySelector(s);return e?rect(e):null;};
      return {width:innerWidth,page:one('.page-shell.study-notebook'),title:one('.page-heading__title'),nav:one('.study-area-nav'),status:one('.study-submit-status'),date:one('.study-date-trigger'),work:one('.study-work-surface'),taskHeading:one('.study-work-surface h2'),reflection:one('.study-reflection-rail'),reflectionHeading:one('#day-review summary'),empty:one('.study-empty'),invitations:one('#invitations-section'),progress:!!document.querySelector('.study-progress-grid'),overflow:document.documentElement.scrollWidth>innerWidth,shellTitle:document.querySelector('.workspace-topbar__context p').textContent,primaryTitle:document.querySelector('h1').textContent,navTitle:document.querySelector('.study-area-nav [aria-current]').textContent};
    })()`);
    layoutMetrics.push({name,...metrics});
    assert.equal(metrics.page.border,'0px',name+': no leaked Home frame');
    assert.equal(metrics.page.radius,'0px'); assert.equal(metrics.page.padding,'0px');
    assert.equal(metrics.overflow,false); assert.equal(metrics.shellTitle,'Góc học tập');
    assert.notEqual(metrics.navTitle,metrics.primaryTitle);
    assert.ok(Math.abs(metrics.title.x-metrics.page.x)<1);
    if (metrics.nav.display!=='none') assert.ok(Math.abs(metrics.nav.x-metrics.page.x)<1);
    if (kind==='day') {
      for(const key of ['taskHeading','status']) assert.ok(Math.abs(metrics[key].x-metrics.page.x)<1,name+': '+key+' alignment');
      assert.equal(metrics.work.border,'0px'); assert.equal(metrics.progress,!isEmpty);
      assert.equal(metrics.reflection,null,'Reflection fields moved to a task-context dialog, not a competing rail');
      if(metrics.date.y>=metrics.title.bottom) assert.ok(Math.abs(metrics.date.x-metrics.page.x)<1);
    } else {
      assert.ok(Math.abs(metrics.invitations.x-metrics.page.x)<1);
      if(isEmpty) assert.ok(metrics.invitations.y-metrics.empty.bottom<=24,'No accumulated disclosure spacing');
    }
    await shot(name); checks.push(name+': aligned composition, distinct identity, appropriate empty/progress state');
  };
  for (const [width,height] of JSON.parse(process.env.DAILY_VIEWPORTS ?? '[[1440,900],[1024,900],[768,1024],[491,850],[390,844],[320,568],[320,360]]')) {
    for(const theme of width===1440||width===390?['light','dark']:['light']) {
      await viewport(width,height);
      plan={...structuredClone(initialPlan),tasks:[]}; emptyGroups=true; missingPlan=false; invitationMode='empty'; invitationItems=[];
      await navigate('/daily?date='+date); await js(`document.documentElement.classList.toggle('dark',${theme==='dark'})`);
      await wait("!!document.querySelector('.study-empty')");
      await composition(`aligned-direct-empty-day-${width}x${height}-${theme}`,'day',true);
      await navigate('/daily/groups'); await js(`document.documentElement.classList.toggle('dark',${theme==='dark'})`);
      await composition(`aligned-direct-empty-groups-${width}x${height}-${theme}`,'group',true);
      await spa('/'); await wait("!!document.querySelector('.home-study-notebook')");
      const homeBefore=await js("(()=>{const e=document.querySelector('.home-study-notebook'),s=getComputedStyle(e);return {border:s.borderWidth,radius:s.borderRadius,width:e.getBoundingClientRect().width}})()");
      assert.equal(homeBefore.border,'1px');assert.equal(homeBefore.radius,'14px');
      await js("document.querySelector('.home-study-notebook').scrollIntoView({block:'center'})"); await shot(`home-notebook-${width}x${height}-${theme}`);
      await spa('/daily/groups'); await composition(`aligned-spa-empty-groups-${width}x${height}-${theme}`,'group',true);
      await spa('/daily?date='+date); await composition(`aligned-spa-empty-day-${width}x${height}-${theme}`,'day',true);
      plan=structuredClone(initialPlan);emptyGroups=false;
      await js("import('/src/lib/query-client.ts').then(({queryClient})=>queryClient.removeQueries({queryKey:['daily']}))");
      await spa('/daily/groups');await composition(`aligned-spa-populated-groups-${width}x${height}-${theme}`,'group',false);
      await spa('/daily?date='+date);await wait("document.querySelectorAll('.study-task').length===12");
      await composition(`aligned-spa-populated-day-${width}x${height}-${theme}`,'day',false);
      await spa('/');await wait("!!document.querySelector('.home-study-notebook')");
      assert.deepEqual(await js("(()=>{const e=document.querySelector('.home-study-notebook'),s=getComputedStyle(e);return {border:s.borderWidth,radius:s.borderRadius,width:e.getBoundingClientRect().width}})()"),homeBefore);
      await js("document.querySelector('.home-study-notebook').scrollIntoView({block:'center'});document.querySelector('.home-study-notebook [role=tab]').focus()");
      await key('ArrowRight','ArrowRight',39);await wait("document.activeElement.textContent.includes('Thông báo')");
      checks.push(`${width}x${height}-${theme}: Home appearance/keyboard retained across Daily stylesheet load`);
    }
  }
  // Visiting creates no plan; explicit empty Submit creates then submits it.
  await viewport(390,844);plan={...structuredClone(initialPlan),tasks:[]};missingPlan=true;
  await navigate('/daily');await wait("!!document.querySelector('.study-empty')&&document.querySelector('.study-savebar').textContent.includes('Tự động lưu khi chỉnh sửa')");
  assert.equal(await js("document.querySelector('.study-date-trigger').getAttribute('aria-label')"),`Chọn ngày: ${date}`);
  await click('Nộp kế hoạch');await wait("document.querySelector('.study-submit-status').textContent.includes('Đúng hạn')");
  assert.equal(requests.findLast(r=>r.path==='/daily/plans'&&r.method==='PUT').input.tasks.length,0);
  assert.ok(plan.firstSubmittedAt);
  assert.equal(await js("!!document.querySelector('.study-progress-grid')"),false);await shot('aligned-empty-saved-submitted-390');
  checks.push('fresh missing plan defaults to today; explicit empty Submit retained without zero/N/A metrics');
  emptyGroups=true;invitationMode='loading';await js("import('/src/lib/query-client.ts').then(({queryClient})=>queryClient.removeQueries({queryKey:['daily-groups']}))");await spa('/daily/groups');await wait("document.querySelector('#invitations-section')?.textContent.includes('Đang kiểm tra')");
  await new Promise(resolve=>setTimeout(resolve,100));assert.equal(typeof releaseInvitations,'function');
  await shot('invitations-loading-390');invitationMode='error';releaseInvitations();
  await wait("!!document.querySelector('#invitations-section [role=alert]')");await shot('invitations-error-390');
  invitationMode='empty';await js("document.querySelector('#invitations-section button').click()");await wait("!!document.querySelector('.group-invitations__empty')");
  invitationMode='pending';invitationItems=[1,2].map(n=>({id:uuid(400+n),groupId,groupName:`Nhóm được mời ${n}`,inviterId:member,inviterDisplayName:'Bạn học',targetUserId:owner,status:'PENDING',createdAt:'2026-10-05T00:00:00Z'}));
  await click('Tải lại');await wait("document.querySelectorAll('[data-group-invitation]').length===2");
  await viewport(320,568);await shot('invitations-pending-320');
  assert.ok(await js("(()=>{const i=document.querySelector('#invitations-section').getBoundingClientRect(),e=document.querySelector('.study-empty').getBoundingClientRect();return i.y<e.y&&[...document.querySelectorAll('.group-invite-card button')].every(b=>b.getBoundingClientRect().height>=44)})()"));
  await click('Từ chối');await wait("document.querySelectorAll('[data-group-invitation]').length===1");
  const responseStart=requests.length;
  await click('Chấp nhận');await wait("!!document.querySelector('.group-card__link')&&!!document.querySelector('.group-invitations__empty')");
  assert.ok(requests.some(r=>r.path.endsWith('/decline')&&r.method==='POST'));
  assert.ok(requests.slice(responseStart).some(r=>r.path.endsWith('/accept')&&r.method==='POST'));
  assert.equal(requests.slice(responseStart).some(r=>r.path.endsWith('/sharing')&&r.method==='PUT'),false);
  await shot('invitations-accepted-320');checks.push('invitation loading/error/retry/pending/empty explicit; decline/accept remain direct and do not enable sharing');
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(await manifest(), candidateStart, "Candidate changed during rendered verification");
} catch (error) {
  errors.push(error.stack);
  if (call && js) { try { await writeFile(join(dir, "failure.png"), Buffer.from((await call("Page.captureScreenshot")).data, "base64")); await writeFile(join(dir, "failure.txt"), await js("document.body.innerText")); } catch {} }
  process.exitCode = 1;
} finally {
  await writeFile(join(dir, "results.json"), JSON.stringify({ scope:layoutOnly?'layout':interactionsOnly?'interactions':'full', layoutMetrics, checks, errors, requests, canceledRequests, dialogFocusTrace, candidateStart, candidateEnd: await manifest(), limits: ["Synthetic API fixtures, not backend persistence/auth/revocation proof", "External media blocked; Chromium only, not physical mobile or WebKit"] }, null, 2));
  console.log(JSON.stringify({ dir, checks, errors }, null, 2));
  socket?.close(); chrome.kill();
}
