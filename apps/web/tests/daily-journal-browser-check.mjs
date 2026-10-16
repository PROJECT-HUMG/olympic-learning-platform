// Actual routed product, isolated synthetic state. Never attaches to a live API or sends mail.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck } from './browser/session.mjs';

const options = browserOptions('daily');
const dir = await evidenceDirectory(options);
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const uid = id(1), peer = id(2), gid = id(3), date = '2026-10-16';
const actor = { id: uid, fullName: 'Nguyễn Minh Anh', displayName: 'Nguyễn Minh Anh', username: 'fixture', email: 'fixture@example.invalid', role: 'STUDENT', status: 'ACTIVE', permissions: [], avatarUrl: null };
let plan = { id: id(4), ownerId: uid, planDate: date, firstSubmittedAt: null, onTime: false, reviewReasons: '', reviewWentWell: 'Đã hiểu cách đặt ẩn phụ.', reviewTomorrow: '', version: 0, createdAt: '2026-10-16T00:00:00Z', updatedAt: '2026-10-16T00:00:00Z', tasks: [{ id: id(10), title: 'Ôn phương trình và hệ phương trình', priority: 'MUST', status: 'TODO', position: 0 }, { id: id(11), title: 'Trao đổi cách giải bài hình học với nhóm', priority: 'SHOULD', status: 'COMPLETED', position: 1 }] };
let week = { id: id(60), weekStart: '2026-10-12', recurringUnfinished: '', issues: '', reflection: '', nextWeekChanges: '', plannedDays: 1, weekDays: 7, nonemptyDays: 1, completionRate: .5, mustCompleted: 0, mustTotal: 1, mustRate: 0, onTimeDays: 0, version: 0 };
let sharing = { shareDaily: false, sharingMode: 'GROUP', selectedViewerIds: [] };
let failSave = false, conflictSave = false, holdSave = false, releaseSave, denied = false, failSharing = false, failFeedback = false;
let audiences = [], sharingBusy = false, releaseSharing;
const recount = p => ({ ...p, totalCount: p.tasks.length, completedCount: p.tasks.filter(t => t.status === 'COMPLETED').length, mustTotal: p.tasks.filter(t => t.priority === 'MUST').length, mustCompleted: p.tasks.filter(t => t.priority === 'MUST' && t.status === 'COMPLETED').length });
const group = () => ({ id: gid, name: 'Cùng học Toán mỗi ngày', ownerId: uid, avatar: null, members: [{ userId: uid, displayName: actor.fullName }, { userId: peer, displayName: 'Trần Hoàng Nam' }, { userId: id(8), displayName: 'Lê Ngọc Hà' }], mySharing: sharing });
const feedback = [];
const checks = [], screenshots = [], geometry = [], requests = [], errors = [];
let session, call, js, theme = 'light';
const delay = ms => new Promise(r => setTimeout(r, ms));
try {
  session = await startBrowserCheck({ dir, options }); ({ call, js } = session);
  const reply = (e, status, body) => call('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  session.onRequest(async e => {
    const url = new URL(e.request.url), path = url.pathname.replace('/api/v1', ''), method = e.request.method;
    if (url.origin === session.web && !url.pathname.startsWith('/api/')) return call('Fetch.continueRequest', { requestId: e.requestId });
    if (!url.pathname.startsWith('/api/')) return reply(e, 404, {});
    const body = e.request.postData?.startsWith('{') ? JSON.parse(e.request.postData) : null;
    requests.push({ path, method, body });
    if (path === '/users/me') return reply(e, 200, actor);
    if (path === '/auth/refresh') return reply(e, 200, { accessToken: 'synthetic-only' });
    if (path === '/documents' || path === '/posts') return reply(e, 200, { content: [], totalPages: 0, totalElements: 0 });
    if (path === '/daily/plans/dates') return reply(e, 200, [date]);
    if (path === `/daily/plans/${plan.id}/sharing`) {
      if (method === 'PUT') {
        if (sharingBusy) await new Promise(r => { releaseSharing = r; });
        if (failSharing) return reply(e, 503, { status: 503 });
        assert.equal(body.expectedVersion, plan.version);
        audiences = body.audiences; plan = { ...plan, version: plan.version + 1 };
      }
      return reply(e, 200, { planId: plan.id, version: plan.version, audiences });
    }
    if (path === '/daily/weeks') {
      if (method === 'PUT') {
        if (failSave) return reply(e, 503, { status: 503 });
        week = { ...week, ...body, version: week.version + 1 };
      }
      return reply(e, 200, week);
    }
    if (path === '/daily/plans') {
      if (method === 'PUT') {
        if (holdSave) await new Promise(r => { releaseSave = r; });
        if (failSave) return reply(e, 503, { status: 503 });
        if (conflictSave) return reply(e, 409, { status: 409 });
        plan = { ...plan, ...body, tasks: body.tasks.map((t, position) => ({ ...t, position })), version: plan.version + 1 };
      }
      return reply(e, 200, recount(plan));
    }
    if (path === '/daily/plans/tasks') { plan = { ...plan, tasks: [...plan.tasks, { id: body.taskId, title: body.title, priority: body.priority, status: body.status, position: plan.tasks.length }], version: plan.version + 1 }; return reply(e, 201, recount(plan)); }
    if (path.endsWith('/submit')) { plan = { ...plan, firstSubmittedAt: plan.firstSubmittedAt ?? '2026-10-16T12:00:00Z', version: plan.version + 1 }; return reply(e, 200, recount(plan)); }
    if (path === '/groups') return reply(e, 200, [group()]);
    if (path === '/groups/invitations') return reply(e, 200, []);
    if (path.startsWith('/groups/') && denied) return reply(e, 403, { status: 403 });
    if (path === `/groups/${gid}`) return reply(e, 200, group());

    if (path === `/groups/${gid}/daily`) return reply(e, 200, { groupId: gid, date, members: [{ userId: uid, displayName: actor.fullName, access: 'SHARED', summary: { planId: plan.id, firstSubmittedAt: plan.firstSubmittedAt, onTime: false, completedCount: 1, totalCount: 2, mustCompleted: 0, mustTotal: 1 } }, { userId: peer, displayName: 'Trần Hoàng Nam', access: 'SHARED', summary: { planId: id(5), firstSubmittedAt: '2026-10-16T00:10:00Z', onTime: true, completedCount: 2, totalCount: 3, mustCompleted: 1, mustTotal: 1 } }, { userId: id(8), displayName: 'Lê Ngọc Hà', access: 'NOT_SHARED', summary: null }] });
    if (path.endsWith('/feedback')) {
      if (method === 'PUT') {
        if (failFeedback) return reply(e, 503, { status: 503 });
        assert.equal(body.expectedVersion, feedback.at(-1)?.version ?? null);
        const own = { id: id(50), authorId: uid, authorDisplayName: actor.fullName, text: body.text, version: (feedback.at(-1)?.version ?? -1) + 1, createdAt: '2026-10-16T12:00:00Z', updatedAt: '2026-10-16T12:00:00Z' };
        feedback.splice(0, feedback.length, own);
      }
      return reply(e, 200, method === 'PUT' ? feedback.at(-1) : { contributions: feedback, contributorCount: feedback.length });
    }
    if (path.endsWith('/plans') && path.startsWith('/groups/')) return reply(e, 200, recount({ ...plan, id: id(5), ownerId: peer, planDate: url.searchParams.get('date') ?? date }));
    if (path.includes('/evidence')) return reply(e, 200, []);
    return reply(e, 404, { status: 404 });
  });
  session.onEvent(e => { if (e.method === 'Runtime.exceptionThrown') errors.push(e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text); });
  await call('Page.enable'); await call('Page.bringToFront'); await call('Runtime.enable'); await call('Network.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const wait = async exp => { const start = performance.now(); while (performance.now() - start < options.timeout) { if (await js(`Boolean(${exp})`)) return; await delay(80); } throw Error('Timeout: ' + exp); };
  const nav = async path => { const token = await js('globalThis.dailyCheckDocument'); await call('Page.navigate', { url: session.web + path }); await wait(`globalThis.dailyCheckDocument && globalThis.dailyCheckDocument!==${JSON.stringify(token) ?? 'undefined'}`); await wait('document.querySelector("main h1") && !document.querySelector("#startup-loader")'); await js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(theme)}))`); };
  await call('Page.addScriptToEvaluateOnNewDocument', { source: 'globalThis.dailyCheckDocument=crypto.randomUUID()' });
  const size = async (width, height, next) => { theme = next; await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); };
  const shot = async name => { await delay(200); const state = await js('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.classList.contains("dark")?"dark":"light",route:location.pathname+location.search})'); assert.equal(state.theme, theme); assert.ok(state.scrollWidth <= state.width + 1, name + ' overflows'); geometry.push({ name, ...state }); await writeFile(join(dir, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')); screenshots.push(name + '.png'); };
  const set = async (selector, value) => { await wait(`document.querySelector(${JSON.stringify(selector)})`); await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`); };
  const button = async label => { await wait(`[...document.querySelectorAll('button')].some(e=>e.textContent.trim()===${JSON.stringify(label)}&&!e.disabled)`); await js(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)}&&!e.disabled);e.scrollIntoView({block:'center'});e.click()})()`); };
  for (const [width, height, t] of [[1440, 1000, 'light'], [1280, 900, 'dark'], [390, 844, 'dark'], [320, 568, 'light']]) {
    await size(width, height, t); await nav('/daily?date=' + date); await wait('document.querySelectorAll(".study-task").length===2'); await shot(`day-${width}-${t}`);
    await nav('/daily/groups/' + gid + '?date=' + date); await wait('document.querySelectorAll(".group-member-card").length===3'); await shot(`group-${width}-${t}`);
  }
  if (!options.before && !options['visual-only']) {
    await size(1280, 900, 'light'); await nav('/daily?date=' + date); await wait('document.querySelector("#daily-tomorrow")');
    failSave = true; await set('#daily-tomorrow', 'Ôn lại phương pháp đặt ẩn phụ.'); await wait('document.body.innerText.includes("Chưa đồng bộ")'); assert.equal(await js('document.querySelector("#daily-tomorrow").value'), 'Ôn lại phương pháp đặt ẩn phụ.'); assert.equal(plan.firstSubmittedAt, null);
    failSave = false; await button('Thử đồng bộ lại'); await wait('document.body.innerText.includes("Đã đồng bộ")'); assert.equal(plan.reviewTomorrow, 'Ôn lại phương pháp đặt ẩn phụ.'); assert.equal(plan.firstSubmittedAt, null);
    await set('input[id^="daily-task-"]', 'Ôn phương trình: hoàn thành phần cơ bản');
    await wait('document.body.innerText.includes("Đã đồng bộ")');
    assert.equal(plan.tasks[0].title, 'Ôn phương trình: hoàn thành phần cơ bản');
    checks.push('Inline reflection failure retains text; deliberate retry saves without submitting; Submit remains explicit.');
    holdSave = true; await set('#daily-tomorrow', 'Bản chỉnh sửa mới hơn.'); await wait('document.body.innerText.includes("Đang đồng bộ")'); assert.equal(await js("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Tải bản trên máy chủ')"), false); await set('#daily-well', 'Nội dung nhập trong khi đang lưu.'); holdSave = false; releaseSave(); await wait('document.body.innerText.includes("Đã đồng bộ")'); assert.equal(plan.reviewWentWell, 'Nội dung nhập trong khi đang lưu.');
    checks.push('Editing during pending save preserves newer input and serializes the following batch.');
    await button('Chia sẻ ngày'); await wait('document.querySelector(".daily-audience-group")');
    assert.equal(await js(`[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.trim()==='Chia sẻ').disabled`), true);
    const beforeNoop = requests.filter(r=>r.path.endsWith('/sharing')&&r.method==='PUT').length;
    await js('document.querySelectorAll(".daily-audience-group input")[1].click()');
    await js('document.querySelectorAll(".daily-audience-group input")[1].click()');
    await button('Đóng'); await wait('!document.querySelector("[role=dialog]")');
    assert.equal(await js('!!document.querySelector("[role=alertdialog]")'), false);
    assert.equal(requests.filter(r=>r.path.endsWith('/sharing')&&r.method==='PUT').length, beforeNoop);
    checks.push('Unchanged audiences disable writes and close without a false discard prompt.');
    await button('Chia sẻ ngày'); await wait('document.querySelector(".daily-audience-group")');
    await js('document.querySelectorAll(".daily-audience-group input")[1].click()');
    failSharing = true; await button('Chia sẻ'); await wait('document.querySelector("[role=dialog] [role=alert]")'); assert.equal(await js('document.querySelectorAll(".daily-audience-group input")[1].checked'), true);
    failSharing = false; sharingBusy = true; await button('Chia sẻ'); await wait('document.body.innerText.includes("Đang cập nhật")');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 }); assert.ok(await js('!!document.querySelector("[role=dialog]")'));
    sharingBusy = false; releaseSharing(); await wait('!document.querySelector("[role=dialog]")'); assert.deepEqual(audiences, [{ groupId: gid, viewerIds: [peer] }]);
    await wait('document.activeElement?.textContent.includes("Chia sẻ ngày")');
    assert.equal(plan.firstSubmittedAt, null, 'Sharing must not require submission');
    await button('Nộp kế hoạch'); await wait('document.body.innerText.includes("Đã ghi nhận lần nộp")');
    await wait('document.activeElement?.id==="daily-submit-status"'); assert.ok(plan.firstSubmittedAt);
    assert.equal(await js(`[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Nộp kế hoạch')||b.textContent.includes('Đã nộp kế hoạch'))`), false);
    checks.push('Sharing works before Submit; first submission retains its timestamp, returns focus and removes the redundant disabled action.');
    const sharedPutCount = requests.filter(r => r.path.endsWith('/sharing') && r.method === 'PUT').length;
    await set('#daily-well', 'Đã ôn xong phần cơ bản; sẽ luyện thêm bài khó.');
    await wait('document.body.innerText.includes("Đã đồng bộ")');
    assert.deepEqual(audiences, [{ groupId: gid, viewerIds: [peer] }]);
    assert.equal(requests.filter(r => r.path.endsWith('/sharing') && r.method === 'PUT').length, sharedPutCount);
    checks.push('Task/reflection edits autosave; editing a shared date needs no repeated Submit or audience selection.');
    await button('Chia sẻ ngày'); await wait('document.querySelectorAll(".daily-audience-group input")[1]?.checked');
    await js('document.querySelectorAll(".daily-audience-group input")[1].click()'); await button('Thu hồi chia sẻ'); await wait('!document.querySelector("[role=dialog]")'); assert.deepEqual(audiences, []);
    checks.push('One-date audience selection retains failed input, guards busy Escape, returns focus, reopens and revokes all; no ongoing sharing request.');
    await size(320, 280, 'dark'); await nav('/daily?date=' + date); await button('Chia sẻ ngày'); await wait('document.querySelector(".daily-audience-group")'); await shot('audience-320x280-dark');
    const closePoint = await js(`(()=>{const b=document.querySelector('[role=dialog] button[aria-label="Đóng hộp thoại"]');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),w:r.width,h:r.height}})()`);
    assert.ok(closePoint.hit && closePoint.w>=44 && closePoint.h>=44);
    await call('Emulation.setTouchEmulationEnabled',{enabled:true}); await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:closePoint.x,y:closePoint.y}]}); await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await wait('!document.querySelector("[role=dialog]")'); await call('Emulation.setTouchEmulationEnabled',{enabled:false});
    checks.push('Audience Close is touch-reachable at 320x280 and returns to the owner page.');
    await size(1280,900,'light');


    await nav('/daily/groups/' + gid + '?date=' + date); await wait('document.querySelectorAll(".group-member-card").length===3'); assert.equal(await js(`document.querySelector('[data-group-member="${id(8)}"]').textContent.includes('Xem ngày')`), false);
    checks.push('Unshared member has no counts or read action.');
    await js("document.querySelector('[role=tab][data-state=active]').focus()");
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', windowsVirtualKeyCode: 39 }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await wait("document.querySelector('[role=tab][data-state=active]').textContent.includes('Thành viên')");
    checks.push('SmoothTab delegates ArrowRight and selection to existing Radix tabs.');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await nav('/daily?date=' + date); await wait('document.querySelector(".study-task [data-slot=checkbox]")');
    const stroke = await js(`(async()=>{const b=document.querySelector('.study-task [data-slot=checkbox]');b.focus();b.click();const samples=[];for(let n=0;n<25;n++){await new Promise(requestAnimationFrame);const p=b.querySelector('path');samples.push(p?parseFloat(getComputedStyle(p).strokeDashoffset):null);}return {samples,focus:document.activeElement===b,checked:b.getAttribute('data-state')};})()`);
    await writeFile(join(dir,'task-motion.json'), JSON.stringify({stroke},null,2));
    assert.equal(stroke.checked, 'checked'); assert.equal(stroke.focus, true);
    assert.ok(stroke.samples.some(n=>n>0) && stroke.samples.at(-1)===0, 'Completion stroke moves and settles');
    await wait('document.body.innerText.includes("Đã đồng bộ")');
    assert.equal(await js(`document.querySelector('.study-task [data-slot=checkbox] path').style.strokeDashoffset`), '');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await js(`document.querySelector('.study-task [data-slot=checkbox]').click()`);
    await wait(`document.querySelector('.study-task [data-slot=checkbox]').getAttribute('data-state')==='unchecked'`);
    const staticStroke = await js(`(async()=>{const b=document.querySelector('.study-task [data-slot=checkbox]');b.click();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);return {offset:b.querySelector('path').style.strokeDashoffset,checked:b.getAttribute('data-state')}})()`);
    assert.equal(staticStroke.checked, 'checked'); assert.equal(staticStroke.offset, '');
    await wait('document.body.innerText.includes("Đã đồng bộ")');
    await writeFile(join(dir,'task-motion.json'), JSON.stringify({stroke,staticStroke},null,2));
    checks.push('Completion stroke animates only the changed checkbox; focus stays, autosave does not replay, reduced motion is static.');
    conflictSave = true; await set('#daily-tomorrow', 'Bản đang nhập cần được giữ.');
    await wait('document.body.innerText.includes("Bản máy chủ đã đổi")');
    await button('Tải bản trên máy chủ'); await wait('document.querySelector("[role=alertdialog]")');
    await button('Giữ nguyên'); await wait('!document.querySelector("[role=alertdialog]")');
    assert.equal(await js('document.querySelector("#daily-tomorrow").value'), 'Bản đang nhập cần được giữ.');
    conflictSave = false; await button('Tải bản trên máy chủ'); await button('Xác nhận');
    await wait('document.body.innerText.includes("Đã đồng bộ")');
    assert.equal(await js('document.querySelector("#daily-tomorrow").value'), plan.reviewTomorrow);
    checks.push('Server replacement appears for recovery only; cancel preserves a conflicting draft, confirmation reloads it.');
    await nav('/daily/week?weekStart=2026-10-12'); await wait('document.querySelector("#week-reflection")');
    failSave = true; await set('#week-reflection', 'Điều hữu ích nhất trong tuần.'); await wait('document.body.innerText.includes("Chưa đồng bộ")');
    failSave = false; await button('Thử đồng bộ lại'); await wait('document.body.innerText.includes("Đã đồng bộ")');
    assert.equal(week.reflection, 'Điều hữu ích nhất trong tuần.');
    assert.equal(await js(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Tải bản trên máy chủ')`), false);
    checks.push('Weekly reflection retains automatic saving/error retry without a normal Save or replacement control.');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await nav('/daily/groups/' + gid + '?date=' + date); await wait('document.querySelector("[data-smooth-indicator]")');
    await js("document.querySelector('[role=tab][data-state=active]').focus()");
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', windowsVirtualKeyCode: 39 }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await wait("document.querySelector('[role=tab][data-state=active]').textContent.includes('Thành viên')"); await delay(250);
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', windowsVirtualKeyCode: 37 }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    const motion = await js(`(async()=>{const samples=[];for(let n=0;n<30;n++){samples.push(document.querySelector('[data-smooth-indicator]').getBoundingClientRect().left);await new Promise(r=>setTimeout(r,8));}return samples})()`);
    await writeFile(join(dir, 'motion.json'), JSON.stringify({ samples: motion, state: await js('({hidden:document.hidden,reduce:matchMedia("(prefers-reduced-motion: reduce)").matches,active:document.querySelector("[role=tab][data-state=active]").textContent,style:document.querySelector("[data-smooth-indicator]").getAttribute("style")})') }, null, 2));
    assert.ok(new Set(motion.map(n=>Math.round(n))).size>1, 'Normal-motion indicator actually moves');
    await shot('group-normal-motion-settled');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await delay(100);
    assert.equal(await js("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Chia sẻ ngày')"), false);
    checks.push('Normal-motion SmoothTab indicator visibly changes position; reduced-motion paths remain static/readable.');
    await nav(`/daily/groups/${gid}/reviews/${peer}?date=${date}`); await wait('document.body.innerText.includes("Trần Hoàng Nam") && document.querySelector(".study-review-workspace")'); await shot('shared-reading-1280-light');
    await button('Góp ý');
    failFeedback = true; await set('#daily-feedback-text', 'Bạn thử thêm một bài vận dụng nhé.'); await button('Gửi góp ý');
    await wait('document.querySelector("#shared-feedback").textContent.includes("Có lỗi") || document.querySelector("#shared-feedback").textContent.includes("chưa thể") || [...document.querySelectorAll("#shared-feedback .study-context")].some(e=>e.textContent.length>0)');
    assert.equal(await js('document.querySelector("#daily-feedback-text").value'), 'Bạn thử thêm một bài vận dụng nhé.');
    assert.equal(feedback.length, 0);
    failFeedback = false; await button('Gửi góp ý'); await wait('document.querySelector("#shared-feedback").textContent.includes("Đã lưu góp ý của bạn.")');
    await set('#daily-feedback-text', 'Bạn thử thêm một bài vận dụng và ghi lại cách giải nhé.'); await button('Cập nhật góp ý');
    await wait('document.querySelector("#daily-feedback-text").value.includes("ghi lại cách giải") && !document.querySelector("#daily-feedback-text").disabled');
    assert.equal(feedback.length, 1); assert.equal(feedback[0].version, 1);
    await js(`document.querySelector('a[aria-label="Về nhóm"]').click()`);
    await wait(`location.pathname === '/daily/groups/${gid}' && location.search.includes('date=${date}')`);
    const countBefore = requests.length;
    await nav(`/daily/groups/${gid}/reviews/${peer}`);
    await wait('document.querySelector(".study-review-workspace") && document.body.innerText.includes("Trần Hoàng Nam")');
    assert.ok(requests.slice(countBefore).some(r=>r.path===`/groups/${gid}/daily/${peer}/plans`));
    assert.equal(requests.slice(countBefore).some(r=>r.path.endsWith('/weeks')), false);
    checks.push('Shared reading allows feedback failure/retry/edit, returns to the selected group/date, and defaults undated links to a day rather than a private week.');
    denied = true; await nav(`/daily/groups/${gid}/reviews/${peer}?date=${date}`); await wait('document.body.innerText.includes("quyền truy cập đã thay đổi")'); assert.equal(await js('!!document.querySelector(".study-review-workspace")'), false);
    checks.push('Denied membership/audience removes private reading and feedback.');
  }
  assert.deepEqual(errors, []); assert.deepEqual(session.requestFailures, []);
} catch (error) {
  await writeFile(join(dir, 'failure.txt'), error.stack ?? String(error)); throw error;
} finally {
  if (session) await session.cleanup();
  await writeFile(join(dir, 'results.json'), JSON.stringify({ checks, screenshots, geometry, errors, requestFailures: session?.requestFailures, requests, limits: ['Synthetic routed API interactions, not live persistence/security/provider proof.'] }, null, 2));
  console.log(dir);
}
