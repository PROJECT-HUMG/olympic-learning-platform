// Disposable AuthoringBrowserHarness only. UI writes use real HTTP and PostgreSQL.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const apiRoot = process.env.DAILY_API_URL || "http://127.0.0.1:18080/api/v1";
const webRoot = process.env.DAILY_WEB_URL || "http://localhost:3000";
const day = "2026-10-05";
const mode = process.env.DAILY_MODE ?? "default";
if (!["default", "lifecycle", "operations", "history", "aggregate"].includes(mode)) throw Error(`Unknown Daily browser mode: ${mode}`);
const expectedPlannedDays = Number(process.env.DAILY_EXPECTED_PLANNED_DAYS ?? 1);
if (!Number.isInteger(expectedPlannedDays) || expectedPlannedDays < 1 || expectedPlannedDays > 7) throw Error("Expected planned days must be 1–7");
const dir = `/tmp/daily-http-${Date.now()}`;
await mkdir(dir);
const checks = [];
const errors = [];
const unloadDialogs = [];
const chrome = spawn("/home/nghlong3004/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${dir}/profile`, "about:blank"]);
let socket;
let js;
let call;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Chromium startup timeout")), 15000);
    chrome.stderr.on("data", data => {
      const match = String(data).match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    chrome.on("error", reject);
  });
  const target = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => { socket.onopen = resolve; });
  let id = 0;
  let held;
  let failPath = null;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === "Page.javascriptDialogOpening") {
      unloadDialogs.push(message.params.type);
      void call("Page.handleJavaScriptDialog", { accept: false });
    }
    if (message.method === "Fetch.requestPaused") {
      const paused = message.params;
      if (paused.responseStatusCode && failPath && new URL(paused.request.url).pathname === failPath) {
        void call("Fetch.failRequest", { requestId: paused.requestId, errorReason: "ConnectionReset" });
      } else if (!paused.responseStatusCode && paused.request.url.startsWith("http://127.0.0.1:18080/api/v1") && apiRoot !== "http://127.0.0.1:18080/api/v1") {
        void call("Fetch.continueRequest", { requestId: paused.requestId, url: paused.request.url.replace("http://127.0.0.1:18080/api/v1", apiRoot) });
      } else held = paused;
    }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params);
    if (!message.id) return;
    const result = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) result.reject(Error(JSON.stringify(message.error)));
    else result.resolve(message.result);
  };
  call = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
  js = async expression => {
    const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async expression => {
    for (let n = 0; n < 200; n++) {
      if (await js(expression)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw Error(`Timeout: ${expression}`);
  };
  const assert = (value, message) => { if (!value) throw Error(message); };
  const fill = (selector, value) => js(`(() => {
    const e=document.querySelector(${JSON.stringify(selector)});
    if(!e) throw Error('Missing control');
    const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)p.querySelector(':scope > summary').click();
    Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});
    e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));
  })()`);
  const click = label => js(`(() => {
    const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)});
    if(!e||e.disabled||e.closest('fieldset[disabled]')) throw Error('Missing/disabled button '+${JSON.stringify(label)});
    for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)p.querySelector(':scope > summary').click();
    e.click();
  })()`);
  const api = async (path, method = "GET", body) => {
    const response = await fetch(apiRoot + path, { method, headers: { Authorization: "Bearer authoring-lecturer", "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw Error(`${method} ${path}: ${response.status}`);
    return response.json();
  };
  const savedPlan = () => api(`/daily/plans?date=${day}`);
  const link = path => js(`(() => {const e=[...document.querySelectorAll('a')].find(e=>e.getAttribute('href')===${JSON.stringify(path)});if(!e)throw Error('Missing link');e.click()})()`);
  await api(`/daily/weeks?weekStart=${day}`); // Readiness before opening UI.
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const redirectPattern = apiRoot === "http://127.0.0.1:18080/api/v1" ? [] : [{ urlPattern: "http://127.0.0.1:18080/api/v1/*", requestStage: "Request" }];
  if (redirectPattern.length) await call("Fetch.enable", { patterns: redirectPattern });
  // The fixture has explicit login, not production refresh-token support.
  await call("Page.navigate", { url: `${webRoot}/login` });
  await wait("!!document.querySelector('#login-identifier')");
  await fill("#login-identifier", "authoring-lecturer");
  await fill("#login-password", "authoring-browser");
  await js("document.querySelector('#login-identifier').closest('form').requestSubmit()");
  await wait("!location.pathname.includes('login')");
  await wait("!!document.querySelector('a[href=\"/daily\"]')");
  await link("/daily");
  await wait("!!document.querySelector('.study-calendar-list a')");
  assert(await js("!document.querySelector('#daily-date')"), "Daily root skipped week list");
  await js("scrollTo(0,0)");
  await writeFile(`${dir}/weeks-entry-desktop.png`, Buffer.from((await call("Page.captureScreenshot", { captureBeyondViewport: true })).data,"base64"));
  await fill("#daily-calendar-week", day);
  await wait(`!!document.querySelector('a[href="/daily/week?weekStart=${day}"]')`);
  await link(`/daily/week?weekStart=${day}`);
  await wait("document.querySelectorAll('.study-week-days a').length===7");
  await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  await js("scrollTo(0,0);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
  assert(await js("!document.querySelector('#week-reflection').closest('details').open && document.querySelectorAll('.study-week-days a').length===7"), "Week flow did not prioritize the compact day list");
  await writeFile(`${dir}/week-days-mobile.png`, Buffer.from((await call("Page.captureScreenshot", { captureBeyondViewport: true })).data,"base64"));
  await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await link(`/daily?date=${day}`);
  await wait("!!document.querySelector('#daily-date') && !!document.querySelector('#daily-reasons')");
  await fill("#daily-date", day);
  await wait(`location.pathname==='/daily' && location.search==='?date=${day}' && document.querySelector('#daily-date')?.value==='${day}' && !!document.querySelector('#daily-reasons')`);
  await js("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
  const priorResponse = await fetch(`${apiRoot}/daily/plans?date=${day}`, { headers: { Authorization: "Bearer authoring-lecturer" } });
  if (priorResponse.ok) {
    const prior = await priorResponse.json();
    if (prior.firstSubmittedAt) await wait(`document.querySelector('#daily-reasons').closest('details').textContent.includes(${JSON.stringify(prior.firstSubmittedAt)})`);
  }
  if (process.env.DAILY_MODE === "lifecycle") {
    const refresh = key => js(`import('/src/lib/query-client.ts').then(({queryClient})=>queryClient.refetchQueries({queryKey:${JSON.stringify(key)},exact:true})).then(()=>true)`);
    const owner = "00000000-0000-0000-0000-000000000a01";
    await fill("#daily-tomorrow", "Retained through background transport error");
    failPath = "/api/v1/daily/plans";
    await call("Fetch.enable", { patterns: [...redirectPattern, { urlPattern: "*/api/v1/daily/plans?*", requestStage: "Response" }] });
    await refresh(["daily", "plan", owner, day]);
    assert(await js("!!document.querySelector('#daily-tomorrow') && document.querySelector('#daily-tomorrow').value==='Retained through background transport error'"), "Background error unmounted/erased plan");
    await wait("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Thử lại')");
    failPath = null;
    await call("Fetch.disable");
    if (redirectPattern.length) await call("Fetch.enable", { patterns: redirectPattern });
    await click("Thử lại");
    await wait("!document.querySelector('fieldset').disabled && ![...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Thử lại')");
    assert(await js("document.querySelector('#daily-tomorrow').value==='Retained through background transport error'"), "Retry replaced dirty plan");
    await link("/profile");
    await wait("document.body.innerText.includes('Ở lại trang')");
    assert(await js("location.pathname==='/daily'"), "Sidebar bypassed blocker");
    await click("Ở lại trang");

    failPath = "/api/v1/users/me";
    await call("Fetch.enable", { patterns: [...redirectPattern, { urlPattern: "*/api/v1/users/me", requestStage: "Response" }] });
    await refresh(["auth", "currentUser"]);
    await wait("document.body.innerText.includes('Không tải lại được tài khoản.')");
    assert(await js("document.querySelector('#daily-tomorrow')?.value==='Retained through background transport error'"), "Account transport error erased plan");
    failPath = null;
    await call("Fetch.disable");
    if (redirectPattern.length) await call("Fetch.enable", { patterns: redirectPattern });
    await click("Thử lại");
    await wait("!document.body.innerText.includes('Không tải lại được tài khoản.')");
    await click("Tải bản trên máy chủ");
    await wait("!document.querySelector('fieldset').disabled && document.querySelector('#daily-tomorrow').value!=='Retained through background transport error'");
    checks.push({ planBackgroundTransportErrorRetainsDraft: true, dirtyRetryRetainsDraft: true, sidebarBlocked: true, cachedActiveAccountTransportErrorRetainsDraft: true, accountRetry: true });

    await link(`/daily/week?weekStart=${day}`);
    await wait("!!document.querySelector('#week-reflection')");
    await fill("#week-issues", "Retained week error draft");
    failPath = "/api/v1/daily/weeks";
    await call("Fetch.enable", { patterns: [...redirectPattern, { urlPattern: "*/api/v1/daily/weeks?*", requestStage: "Response" }] });
    await refresh(["daily", "week", owner, day]);
    assert(await js("document.querySelector('#week-issues')?.value==='Retained week error draft'"), "Background week error lost draft");
    failPath = null;
    await call("Fetch.disable");
    if (redirectPattern.length) await call("Fetch.enable", { patterns: redirectPattern });
    await click("Thử lại");
    await wait("!document.querySelector('fieldset').disabled && ![...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Thử lại')");
    assert(await js("document.querySelector('#week-issues').value==='Retained week error draft'"), "Week retry lost draft");
    await click("Tải bản trên máy chủ");
    await wait("!document.querySelector('fieldset').disabled && document.querySelector('#week-issues').value!=='Retained week error draft'");
    checks.push({ weekBackgroundTransportErrorRetainsDraft: true, dirtyWeekRetryRetainsDraft: true, faultMethod: "Abort actual HTTP response at browser transport; trigger mounted QueryClient refetch, no fabricated response" });
  } else if (process.env.DAILY_MODE === "operations") {
    const hold = async (urlPattern, action) => {
      held = null;
      await call("Fetch.enable", { patterns: [...redirectPattern, { urlPattern, requestStage: "Response" }] });
      await action();
      for (let n = 0; !held && n < 100; n++) await new Promise(resolve => setTimeout(resolve, 100));
      assert(held, "Missing real delayed response");
      assert(await js("document.querySelector('fieldset').disabled && [...document.querySelectorAll('input[type=date]')].every(e=>e.disabled)"), "Operation did not lock controls");
    };
    const release = async () => {
      await call("Fetch.continueRequest", { requestId: held.requestId });
      await call("Fetch.disable");
      if (redirectPattern.length) await call("Fetch.enable", { patterns: redirectPattern });
    };
    const before = await savedPlan();
    await hold("*/api/v1/daily/plans/*/submit", () => click("Nộp lại"));
    await js("document.querySelector('form').requestSubmit()");
    await release();
    await wait("!document.querySelector('fieldset').disabled");
    assert((await savedPlan()).firstSubmittedAt === before.firstSubmittedAt, "Delayed submit changed first timestamp");
    await fill("#daily-tomorrow", "Reload must replace this local draft");
    await hold("*/api/v1/daily/plans?*", () => click("Tải bản trên máy chủ"));
    await js("document.querySelector('form').requestSubmit()");
    await release();
    await wait(`!document.querySelector('fieldset').disabled && document.querySelector('#daily-tomorrow').value===${JSON.stringify(before.reviewTomorrow ?? "")}`);
    checks.push({ realDelayedSubmit: true, realDelayedExplicitReload: true, overlappingSaveRejected: true });
    await link(`/daily/week?weekStart=${day}`);
    await wait("!!document.querySelector('#week-reflection')");
    const reflection = "Delayed week save persists";
    await fill("#week-reflection", reflection);
    await hold("*/api/v1/daily/weeks?*", () => click("Lưu nhìn lại"));
    await js("document.querySelector('form').requestSubmit();history.back()");
    await wait("document.body.innerText.includes('Ở lại trang')");
    assert(await js("location.pathname==='/daily/week'"), "Busy week escaped history blocker");
    await release();
    await wait("location.pathname==='/daily' && !!document.querySelector('#daily-tomorrow')");
    assert((await api(`/daily/weeks?weekStart=${day}`)).reflection === reflection, "Delayed week save lost reflection");
    checks.push({ realDelayedWeekSave: true, busyBackBlockedThenProceedsAfterSave: true });

    // Logout's real fixture endpoint is absent; local finally-path is the promised boundary.
    await fill("#daily-tomorrow", "Private draft to clear on local logout");
    await js("document.querySelector('[aria-label=\"Mở menu tài khoản\"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse'}))");
    await wait("[...document.querySelectorAll('[role=menuitem]')].some(e=>e.textContent.includes('Đăng xuất'))");
    await js("[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.includes('Đăng xuất')).click()");
    await wait("!!document.querySelector('#login-identifier')");
    assert(await js("!document.querySelector('#daily-tomorrow')"), "Logout retained private editor");
    await fill("#login-identifier", "authoring-student");
    await fill("#login-password", "authoring-browser");
    await js("document.querySelector('#login-identifier').closest('form').requestSubmit()");
    await wait("!!document.querySelector('a[href=\"/daily\"]')");
    await link("/daily");
    await wait("!!document.querySelector('.study-calendar-list a')");
    await fill("#daily-calendar-week", day);
    await wait(`!!document.querySelector('a[href="/daily/week?weekStart=${day}"]')`);
    await link(`/daily/week?weekStart=${day}`);
    await wait("document.querySelectorAll('.study-week-days a').length===7");
    await link(`/daily?date=${day}`);
    await wait("!!document.querySelector('#daily-date') && !!document.querySelector('#daily-reasons')");
    await fill("#daily-date", day);
    await js("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
    await wait(`location.search==='?date=${day}' && !!document.querySelector('#daily-tomorrow')`);
    await wait("document.querySelector('#daily-tomorrow').value==='' && document.querySelectorAll('input[id^=daily-task-]').length===0");
    assert(await js("!document.body.innerText.includes('Private draft to clear') && !document.body.innerText.includes('Concurrent server draft')"), "Previous account draft leaked");
    checks.push({ localLogoutDropsDirtyEditor: true, newStudentAccountIsolated: true, serverLogoutNotProven: true });
  } else if (process.env.DAILY_MODE === "history") {
    await fill("#daily-date", "2026-10-04");
    await wait("document.querySelector('#daily-date')?.value==='2026-10-04' && !!document.querySelector('#daily-tomorrow')");
    await fill("#daily-date", day);
    await wait(`document.querySelector('#daily-date')?.value==='${day}' && !!document.querySelector('#daily-tomorrow')`);
    await js("history.back()");
    await wait("location.search!=='?date=2026-10-05'");
    await js("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
    await wait("!!document.querySelector('#daily-tomorrow')");
    await fill("#daily-tomorrow", "Dirty forward draft");
    const from = await js("location.search");
    await js("history.forward()");
    await wait("document.body.innerText.includes('Ở lại trang')");
    assert(await js(`location.search===${JSON.stringify(from)} && document.querySelector('#daily-tomorrow').value==='Dirty forward draft'`), "Forward lost dirty draft");
    await click("Ở lại trang");
    await js("history.forward()");
    await wait("document.body.innerText.includes('Ở lại trang')");
    await click("Tải bản trên máy chủ");
    await wait(`location.search==='?date=${day}' && !!document.querySelector('#daily-tomorrow')`);
    await js("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
    assert(await js("document.querySelector('#daily-tomorrow')?.value!=='Dirty forward draft'"), "Reload/forward carried old draft");
    checks.push({ dirtyForwardBlocked: true, stayResetsForwardBlock: true, explicitReloadAllowsPendingForward: true });
    await js("document.querySelector('#daily-tomorrow').closest('details').querySelector('summary').click()");
    const box = await js("(() => {const e=document.querySelector('#daily-tomorrow');e.scrollIntoView();const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await call("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...box });
    await call("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...box });
    await fill("#daily-tomorrow", "Draft protected by beforeunload");
    await call("Page.navigate", { url: `${webRoot}/profile` });
    await wait("document.querySelector('#daily-tomorrow')?.value==='Draft protected by beforeunload'");
    assert(unloadDialogs.includes("beforeunload") && await js("location.pathname==='/daily'"), "Dirty full-page leave not protected");
    await click("Tải bản trên máy chủ");
    await wait("!document.querySelector('fieldset').disabled && document.querySelector('#daily-tomorrow').value!=='Draft protected by beforeunload'");
    checks.push({ trustedGestureBeforeunloadDialogDismissedKeepsDraft: true });
  } else if (process.env.DAILY_MODE === "aggregate") {
    await link(`/daily/week?weekStart=${day}`);
    await wait("!!document.querySelector('#week-reflection')");
    const before = await api(`/daily/weeks?weekStart=${day}`);
    assert(before.plannedDays === 1, "Aggregate scenario expects one saved plan in this disposable fixture");
    await link("/daily?date=2026-10-06");
    await wait("location.search==='?date=2026-10-06'");
    await js("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
    await wait("!!document.querySelector('#daily-date') && document.querySelector('#daily-date').value==='2026-10-06' && !!document.querySelector('#daily-reasons')");
    assert(await js("document.querySelectorAll('input[id^=daily-task-]').length===0"), "Empty day contains tasks");
    await click("Lưu kế hoạch");
    await wait("document.body.innerText.includes('Đã lưu kế hoạch.') && !document.querySelector('fieldset').disabled");
    await link(`/daily/week?weekStart=${day}`);
    await wait("!!document.querySelector('#week-reflection')");
    await js("[...document.querySelectorAll('summary')].find(e=>e.textContent==='Số liệu tuần đã ghi nhận').click();document.querySelector('#week-reflection').closest('details').querySelector('summary').click()");
    await wait("document.body.innerText.includes('Đã lập 2/7')");
    const after = await api(`/daily/weeks?weekStart=${day}`);
    assert(after.plannedDays === 2 && after.nonemptyDays === 1 && after.completionRate === before.completionRate && after.mustTotal === before.mustTotal, "Empty-plan aggregate denominator changed");
    await js("document.querySelector('#week-reflection').focus()");
    assert(await js("document.activeElement.id==='week-reflection'"), "Reflection not focusable");
    await call("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    assert(await js("document.activeElement.id==='week-next'"), "Keyboard focus order wrong");
    checks.push({ cachedWeekInvalidatedAfterPlanSave: true, savedEmptyPlanCountsWithoutDilutingCompletion: true, keyboardReflectionOrder: true });
  } else {
  // Reruns keep the fixture's saved row; use the same task rather than duplicating it.
  if (await js("document.querySelectorAll('input[id^=daily-task-]').length===0")) await click("Thêm việc");
  await fill("input[id^=daily-task-]", "Browser Daily task");
  await fill("select[id^=daily-priority-]", "MUST");
  await fill("select[id^=daily-status-]", "COMPLETED");
  await wait("document.querySelector('input[id^=daily-complete-]')?.checked===true");
  await js("document.querySelector('input[id^=daily-complete-]').focus()");
  await call("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
  await call("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
  await wait("document.querySelector('select[id^=daily-status-]')?.value==='TODO'");
  await js("document.querySelector('label.study-task__complete').click()");
  await wait("document.querySelector('select[id^=daily-status-]')?.value==='COMPLETED'");
  assert(await js("document.querySelector('label.study-task__complete').getBoundingClientRect().height>=44"), "Completion touch target too small");
  await click("Hôm nay");
  assert(await js(`location.search==='?date=${day}' && document.body.innerText.includes('Hãy lưu hoặc tải lại trước khi đổi ngày.')`), "Today shortcut bypassed dirty guard");
  await js("document.querySelector('.study-area-nav a[href=\"/daily/groups\"]').click()");
  assert(await js("location.pathname==='/daily'"), "Area switch bypassed dirty guard");
  checks.push({ keyboardCompletion: true, labelledTouchCompletion: true, todayDirtyGuard: true, areaSwitchDirtyGuard: true });
  const review = "Dòng một\nDòng hai  giữ khoảng";
  await fill("#daily-reasons", review);
  await click("Lưu kế hoạch");
  await wait("document.body.innerText.includes('Đã lưu kế hoạch.')");
  let plan = await savedPlan();
  assert(plan.tasks.length === 1 && plan.tasks[0].status === "COMPLETED" && plan.reviewReasons === review, "Saved plan differs from UI draft");
  const taskId = plan.tasks[0].id;
  await wait("!document.querySelector('fieldset').disabled && [...document.querySelectorAll('button')].some(e=>['Nộp kế hoạch','Nộp lại'].includes(e.textContent.trim())&&!e.disabled)");
  await click(plan.firstSubmittedAt ? "Nộp lại" : "Nộp kế hoạch");
  await wait("document.body.innerText.includes('Đã ghi nhận lần nộp.')");
  plan = await savedPlan();
  const first = plan.firstSubmittedAt;
  assert(first, "Missing first submit timestamp");
  await wait("!document.querySelector('fieldset').disabled && [...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Nộp lại'&&!e.disabled)");
  await click("Nộp lại");
  await wait("!document.querySelector('fieldset').disabled");
  assert((await savedPlan()).firstSubmittedAt === first, "Repeat changed first submit");
  checks.push({ saveAndSubmit: true, taskId, firstSubmittedAt: first, fixtureLoginNotProductionJwtProof: true });

  // Hold a real successful PUT response: no fabricated server result.
  await fill("#daily-tomorrow", "Delayed save draft");
  held = null;
  await call("Fetch.enable", { patterns: [...redirectPattern, { urlPattern: "*/api/v1/daily/plans?*", requestStage: "Response" }] });
  await click("Lưu kế hoạch");
  for (let n = 0; !held && n < 100; n++) await new Promise(resolve => setTimeout(resolve, 100));
  assert(held?.request.method === "PUT", "Did not hold actual save response");
  assert(await js("document.querySelector('#daily-tomorrow').matches(':disabled') && document.querySelector('#daily-date').disabled"), "Pending controls editable");
  assert(await js("document.querySelector('input[id^=daily-complete-]').matches(':disabled')"), "Pending completion checkbox editable");
  await fill("#daily-tomorrow", "Rejected during save"); // Synthetic event must also hit the synchronous gate.
  await js("document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit()");
  await call("Fetch.continueRequest", { requestId: held.requestId });
  await call("Fetch.disable");
  if (redirectPattern.length) await call("Fetch.enable", { patterns: redirectPattern });
  await wait("!document.querySelector('fieldset').disabled && document.querySelector('#daily-tomorrow').value==='Delayed save draft'");
  assert((await savedPlan()).reviewTomorrow === "Delayed save draft", "Pending edit/duplicate Enter changed saved draft");
  checks.push({ realDelayedSave: true, pendingControlsDisabled: true, duplicateEnterGated: true });

  // Actual concurrent HTTP update produces 409; dirty UI must survive it.
  await fill("#daily-tomorrow", "Local conflict draft");
  const current = await savedPlan();
  await api(`/daily/plans?date=${day}`, "PUT", { expectedVersion: current.version, tasks: current.tasks.map(({ id, title, priority, status }) => ({ id, title, priority, status })), reviewReasons: review, reviewWentWell: "", reviewTomorrow: "Concurrent server draft" });
  await click("Lưu kế hoạch");
  await wait("document.body.innerText.includes('Bản bạn đang nhập vẫn được giữ')");
  assert(await js("document.querySelector('#daily-tomorrow').value==='Local conflict draft'"), "409 lost draft");
  await link(`/daily/week?weekStart=${day}`);
  assert(await js("location.pathname==='/daily'"), "Dirty local link escaped");
  await click("Tải bản trên máy chủ");
  await wait("document.querySelector('#daily-tomorrow')?.value==='Concurrent server draft'");
  await link(`/daily/week?weekStart=${day}`);
  await wait("!!document.querySelector('#week-reflection')");
  await js("[...document.querySelectorAll('summary')].find(e=>e.textContent==='Số liệu tuần đã ghi nhận').click()");
  assert(await js("document.querySelectorAll('.study-week-days a').length===7 && document.querySelector('.study-week-days a').textContent.includes('Thứ 2')"), "Weekday navigation incomplete");
  assert((await api(`/daily/weeks?weekStart=${day}`)).plannedDays === expectedPlannedDays, "Fixture planned-day count differs from explicit expectation");
  assert(await js(`document.body.innerText.includes('Đã lập ${expectedPlannedDays}/7') && document.body.innerText.includes('Mức hoàn thành 100')`), "Week aggregate stale/wrong");
  await fill("#week-reflection", review);
  await click("Lưu nhìn lại");
  await wait("document.body.innerText.includes('Đã lưu nhìn lại tuần.')");
  assert((await api(`/daily/weeks?weekStart=${day}`)).reflection === review, "Week reflection not persisted");
  await fill("#week-issues", "Dirty history draft");
  await fill("#daily-week", "2026-10-12");
  assert(await js(`location.search==='?weekStart=${day}' && document.querySelector('#week-issues').value==='Dirty history draft'`), "Calendar chooser bypassed draft guard");
  await js("document.querySelector('#week-issues').closest('details').querySelector('summary').click()");
  assert(await js("document.querySelector('#week-issues').value==='Dirty history draft' && !document.querySelector('#week-issues').closest('details').open"), "Collapsing discarded week draft");
  await js("document.querySelector('#week-issues').closest('details').querySelector('summary').click()");
  await js("history.back()");
  await wait("document.body.innerText.includes('Ở lại trang')");
  assert(await js("location.pathname==='/daily/week' && document.querySelector('#week-issues').value==='Dirty history draft'"), "Back lost dirty week");
  await click("Ở lại trang");
  await click("Tải bản trên máy chủ");
  await wait("document.querySelector('#week-issues').value===''");
  await js("history.back()");
  await wait("!!document.querySelector('#daily-tomorrow')");
  assert(await js("document.querySelector('#daily-reasons').value===" + JSON.stringify(review)), "Reopen lost review");
  assert((await savedPlan()).tasks[0].id === taskId && (await savedPlan()).firstSubmittedAt === first, "Stable identity/timestamp lost");
  checks.push({ conflictRetainsDraft: true, explicitReload: true, weeklyReflection: true, dirtyBackBlocked: true, cleanBackAndReopen: true });
  }

  for (const [width, theme] of [[390, "light"], [1440, "dark"]]) {
    await wait("!!document.querySelector('#daily-reasons') || !!document.querySelector('#week-reflection')");
    await call("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await js(`if(document.documentElement.style.colorScheme!==${JSON.stringify(theme)}) document.querySelector('button[aria-label="Đổi giao diện"]').click()`);
    await wait(`document.documentElement.style.colorScheme===${JSON.stringify(theme)}`);
    await js("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
    await new Promise(resolve => setTimeout(resolve, 500));
    await js("scrollTo(0,0);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
    assert(await js("document.documentElement.scrollWidth<=innerWidth"), "Horizontal overflow");
    assert(await js("[...document.querySelectorAll('.study-progress__track > span')].every(e=>getComputedStyle(e).transitionDuration==='0s')"), "Progress transition ignores reduced motion");
    const capture = await call("Page.captureScreenshot", { captureBeyondViewport: true });
    await writeFile(`${dir}/${width}-${theme}.png`, Buffer.from(capture.data, "base64"));
  }
  assert(errors.length === 0, "Browser runtime exceptions");
  await writeFile(`${dir}/results.json`, JSON.stringify({ checks, errors, limits: "Disposable fixture login only, not production JWT/refresh/server logout. No group/evidence/privacy acceptance. Query refresh faults abort actual responses; refetch triggered directly on mounted QueryClient." }, null, 2));
  console.log(JSON.stringify({ ok: true, dir, checks }));
} catch (error) {
  if (js) await writeFile(`${dir}/failure.json`, JSON.stringify({ error: String(error), checks, errors, diagnostic: await js("({url:location.href,text:document.body.innerText})").catch(() => null) }, null, 2));
  console.error(JSON.stringify({ ok: false, dir, error: String(error) }));
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill();
}
