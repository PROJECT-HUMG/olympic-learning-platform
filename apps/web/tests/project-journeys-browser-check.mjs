// Actual mounted routes/shells, intercepted synthetic APIs only. No .env, providers or live writes.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck } from './browser/session.mjs';

const options = browserOptions('journeys');
const dir = await evidenceDirectory(options);
const uid = '00000000-0000-0000-0000-000000000101';
const subjectA = '00000000-0000-0000-0000-000000000201';
const subjectB = '00000000-0000-0000-0000-000000000202';
const topicId = '00000000-0000-0000-0000-000000000301';
const categoryId = '00000000-0000-0000-0000-000000000401';
const tagId = '00000000-0000-0000-0000-000000000501';
const paperId = '00000000-0000-0000-0000-000000000601';
let role = 'ADMIN', permissions = [], topicFailure = true, topicStatus = 409, inviteStatus = 409;
let uploadStatus = 503, saveStatus = 503, deleteStatus = 503, examFailure = false, resetStatus = 503;
let heldTopic, holdTopic = false, heldInvite, holdInvite = false;
const topics = [], accounts = [], documents = [];
const checks = [], screenshots = [], requests = [], errors = [], geometry = [];
let session, call, js, expectedTheme = "light";
const user = () => ({ id: uid, fullName: 'Tài khoản kiểm thử', username: 'synthetic-user', email: 'fixture@example.invalid', role, status: 'ACTIVE', avatarUrl: null, permissions });
const metadata = { subjects: [{ id: subjectA, name: 'Toán học', code: 'MATH' }, { id: subjectB, name: 'Vật lý', code: 'PHYS' }], categories: [{ id: categoryId, name: 'Tài liệu tham khảo', code: 'REFERENCE' }], tags: [{ id: tagId, name: 'Ôn tập', code: 'REVISION' }] };
const page = content => ({ content, totalElements: content.length, totalPages: content.length ? 1 : 0, number: 0, size: 10 });
const paper = { id: paperId, examId: 'synthetic-exam', versionNumber: 1, title: 'Đề Toán đã phát hành — dữ liệu kiểm thử', subjectId: subjectA, instructions: 'Đọc kỹ từng câu.', releaseAt: '2026-01-01T00:00:00Z', publishedAt: '2026-01-01T00:00:00Z', totalPoints: 10, items: [] };
const sourceFile = join(dir, 'synthetic-document.pdf');
await writeFile(sourceFile, '%PDF-1.4\nSynthetic browser fixture only.');
try {
  session = await startBrowserCheck({ dir, options });
  ({ call, js } = session);
  const reply = (event, status, body) => call('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  session.onRequest(async event => {
    const url = new URL(event.request.url), path = url.pathname.replace('/api/v1', ''), method = event.request.method;
    if (url.origin === session.web && !url.pathname.startsWith('/api/')) return call('Fetch.continueRequest', { requestId: event.requestId });
    if (!url.pathname.startsWith('/api/')) return reply(event, 200, {});
    let body = null;
    if (event.request.postData?.startsWith('{')) body = JSON.parse(event.request.postData);
    requests.push({ path, method, query: url.search, body });
    if (path === '/users/me') return reply(event, role === 'ANON' ? 401 : 200, role === 'ANON' ? {} : user());
    if (path === '/auth/refresh') return reply(event, role === 'ANON' ? 401 : 200, { accessToken: 'synthetic-only' });
    if (path === '/documents/metadata') return reply(event, 200, metadata);
    if (path === '/topics' && method === 'GET') return reply(event, topicFailure ? 503 : 200, topicFailure ? { detail: 'Synthetic unavailable' } : topics.filter(item => item.subjectId === url.searchParams.get('subjectId')));
    if (path === '/topics' && method === 'POST') {
      if (holdTopic) await new Promise(resolve => { heldTopic = resolve; });
      if (topicStatus !== 201) return reply(event, topicStatus, { detail: 'Synthetic conflict' });
      const topic = { id: topicId + topics.length, ...body, slug: 'synthetic-topic' }; topics.push(topic); return reply(event, 201, topic);
    }
    if (path.startsWith('/topics/') && method === 'DELETE') { const index = topics.findIndex(item => item.id === path.split('/').at(-1)); topics.splice(index, 1); return reply(event, 204, null); }
    if (path === '/admin/users' && method === 'POST') {
      if (holdInvite) await new Promise(resolve => { heldInvite = resolve; });
      if (inviteStatus !== 201) return reply(event, inviteStatus, { detail: 'Synthetic conflict' });
      const value = { ...body, id: 'synthetic-invite', status: 'PENDING', permissions: [], createdAt: '2026-10-16T00:00:00Z', avatarUrl: null };
      accounts.push(value); return reply(event, 201, { user: value, message: 'Queued, delivery not observed' });
    }
    if (path === '/admin/users/permissions') return reply(event, 200, [{ id: 'DOCUMENT_UPLOAD', description: 'Tải lên tài liệu' }]);
    if (path === '/admin/users') return reply(event, 200, page(accounts));
    if (path === '/auth/password/reset') return reply(event, resetStatus, resetStatus === 200 ? { message: 'Done', messageKey: 'auth.passwordResetSuccess' } : { detail: 'Synthetic reset failure', messageKey: resetStatus === 400 ? 'error.auth.emailTokenExpired' : 'error.internal' });
    if (path === '/storage/upload') return reply(event, uploadStatus, uploadStatus === 201 ? { id: 'synthetic-file', url: 'https://example.invalid/fixture.pdf' } : { detail: 'Synthetic upload failure' });
    if (path === '/documents' && method === 'GET') return reply(event, 200, page(documents.filter(item => !url.searchParams.get('ownerId') || item.owner.id === url.searchParams.get('ownerId'))));
    if (path === '/documents' && method === 'POST') {
      if (saveStatus !== 201) return reply(event, saveStatus, { detail: 'Synthetic save failure' });
      const value = { ...body, id: 'synthetic-document', slug: 'synthetic-document', owner: user(), category: metadata.categories[0], subject: metadata.subjects[0], tags: metadata.tags, createdAt: '2026-01-01T00:00:00Z', viewCount: 0, downloadCount: 0, thumbnailUrl: null, fileSize: 38 }; documents.push(value); return reply(event, 201, value);
    }
    if (path.startsWith('/documents/') && method === 'PUT') { if (saveStatus !== 200) return reply(event, saveStatus, { detail: 'Synthetic edit failure' }); Object.assign(documents[0], body); return reply(event, 200, documents[0]); }
    if (path.startsWith('/documents/') && method === 'DELETE') { if (deleteStatus !== 204) return reply(event, deleteStatus, { detail: 'Synthetic delete failure' }); documents.shift(); return reply(event, 204, null); }
    if (path === '/exams/papers') return reply(event, examFailure ? 503 : 200, examFailure ? { detail: 'Synthetic unavailable' } : [paper]);
    if (path === '/exams/papers/' + paperId) return reply(event, 200, paper);
    if (path === '/exams') return reply(event, 200, [{ id: 'synthetic-exam', title: 'Đề nháp kiểm thử', subjectId: subjectA, instructions: '', releaseAt: paper.releaseAt, items: [], totalPoints: 0, version: 0, latestPublishedVersion: null, createdById: uid }]);
    if (path.startsWith('/questions')) return reply(event, 200, page([]));
    if (path.startsWith('/posts')) return reply(event, 200, page([]));
    return reply(event, 200, []);
  });
  session.onEvent(event => { if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.exception?.description ?? event.params.exceptionDetails.text); });
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async expression => { const started = performance.now(); while (performance.now() - started < options.timeout) { if (await js(`Boolean(${expression})`)) return; await delay(80); } throw Error('Timeout: ' + expression); };
  const applyTheme = async () => { await js(`import('/src/stores/use-theme-store.ts').then(m=>m.useThemeStore.getState().setTheme(${JSON.stringify(expectedTheme)}))`); await wait(`document.documentElement.classList.contains(${JSON.stringify(expectedTheme)})`); };
  const nav = async path => { await call('Page.navigate', { url: session.web + path }); await wait('document.querySelector("main")'); await applyTheme(); };
  const exists = selector => `document.querySelector(${JSON.stringify(selector)})`;
  const text = value => `document.body.innerText.includes(${JSON.stringify(value)})`;
  const set = async (selector, value) => { await wait(`document.querySelector(${JSON.stringify(selector)}) && !document.querySelector(${JSON.stringify(selector)}).disabled`); await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`); };
  const click = async selector => { await wait(`document.querySelector(${JSON.stringify(selector)})`); await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`); const point = await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()`); assert.ok(point.hit, 'Reachable target: ' + selector); await call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x: point.x, y: point.y }); await call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: point.x, y: point.y }); };
  const button = async label => {
    const expression = `(()=>{const scope=document.querySelector('[role=alertdialog]')??document.querySelector('[role=dialog]')??document;return [...scope.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)})})()`;
    await wait(expression);
    await js(`${expression}.setAttribute('data-journey-target','current')`);
    await click('[data-journey-target="current"]');
    await js(`document.querySelector('[data-journey-target="current"]')?.removeAttribute('data-journey-target')`);
  };
  const key = async (name, code) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key: name, windowsVirtualKeyCode: code }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: name, windowsVirtualKeyCode: code }); };
  const size = async (width, height, theme) => {
    expectedTheme = theme;
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    if (await js(`location.origin===${JSON.stringify(session.web)}`)) await applyTheme();
  };
  const touchClose = async () => {
    await call('Emulation.setTouchEmulationEnabled', { enabled: true });
    const point = await js(`(()=>{const e=document.querySelector('[role=dialog] .creation-dialog__header button');const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),width:r.width,height:r.height}})()`);
    assert.ok(point.hit && point.width >= 44 && point.height >= 44, 'Short-screen touch Close remains reachable');
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait('document.querySelector("[role=alertdialog]")');
    await button('Tiếp tục chỉnh sửa');
    await wait('!document.querySelector("[role=alertdialog]")');
  };
  const shot = async name => { await delay(150); const state = await js(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.classList.contains('dark')?'dark':'light',route:location.pathname+location.search,focus:document.activeElement?.id})`); assert.equal(state.theme, expectedTheme, 'Actual theme matches evidence ' + name); assert.ok(state.scrollWidth <= state.width + 1, 'No page overflow ' + name); if(await js('!!document.querySelector("section[aria-labelledby=topic-heading]")')) assert.ok(await js('document.querySelector("[data-slot=tabs-list]").getBoundingClientRect().bottom <= document.querySelector("section[aria-labelledby=topic-heading]").getBoundingClientRect().top + 1'), 'Taxonomy tabs do not overlap topic controls'); geometry.push({ name, ...state }); const result = await call('Page.captureScreenshot', { format: 'png' }); await writeFile(join(dir, name + '.png'), Buffer.from(result.data, 'base64')); screenshots.push(name + '.png'); };

  await size(1280, 900, 'light'); await nav('/admin/categories?tab=topics');
  await wait('document.querySelector("section[aria-labelledby=topic-heading] select")');
  await set('section[aria-labelledby=topic-heading] select', subjectA);
  await wait(text('Chưa tải được chủ đề.')); topicFailure = false; await button('Thử tải chủ đề lại'); await wait(text('Môn này chưa có chủ đề.'));
  await shot('topics-empty-1280-light'); await button('Thêm chủ đề'); await set('#topic-name', 'Đại số và phương pháp giải phương trình');
  await button('Lưu chủ đề'); await wait(text('Tên chủ đề đã được sử dụng')); assert.equal(await js('document.querySelector("#topic-name").value'), 'Đại số và phương pháp giải phương trình');
  await key('Escape', 27); await wait('document.querySelector("[role=alertdialog]")'); await button('Tiếp tục chỉnh sửa'); await wait('!document.querySelector("[role=alertdialog]")');
  holdTopic = true; topicStatus = 201; await button('Lưu chủ đề'); await wait('document.querySelector("#topic-name").disabled'); assert.equal(await js('[...document.querySelectorAll("[role=dialog] button")].find(e=>e.textContent.trim()==="Đóng").disabled'), true); await key('Escape', 27); assert.ok(await js('!!document.querySelector("#topic-name")')); heldTopic(); holdTopic = false;
  await wait('!document.querySelector("[role=dialog]")'); await wait("document.activeElement?.textContent.trim()==='Thêm chủ đề'"); await wait(text('Đã thêm chủ đề')); await shot('topics-created-1280-light');
  const created = topics[0]; assert.equal(created.subjectId, subjectA);
  await set('section[aria-labelledby=topic-heading] select', subjectB); await wait(text('Môn này chưa có chủ đề.'));
  await set('section[aria-labelledby=topic-heading] select', subjectA); await wait(text(created.name));
  await size(390, 844, 'dark'); await shot('topics-created-390-dark');
  await nav('/admin/questions/new'); await wait('document.querySelector("#manual-subject")'); await set('#manual-subject', subjectA); await wait(`document.querySelector('#manual-topic option[value=${JSON.stringify(created.id)}]')`); await set('#manual-topic', created.id); assert.equal(await js('document.querySelector("#manual-topic").value'), created.id);
  await nav('/admin/categories?tab=topics&subjectId=' + subjectA); await wait(text(created.name)); await click('button[aria-label^="Ngừng dùng chủ đề"]'); await wait('document.querySelector("[role=alertdialog]")'); await button('Ngừng dùng'); await wait(text('Đã ngừng dùng chủ đề.')); assert.equal(topics.length, 0);
  checks.push('Topics: routed taxonomy → subject list/error retry → create conflict/value retention → dirty Escape and busy guard → subject isolation → manual-question topic selection → non-destructive disable.');

  await size(1280, 900, 'light'); await nav('/admin/users'); await button('Mời tài khoản'); await shot('invite-empty-1280-light'); await button('Tạo lời mời'); await wait(text('Vui lòng nhập họ tên'));
  await set('#invite-full-name', 'Nguyễn Giảng Viên'); await set('#invite-email', 'lecturer@example.invalid'); await set('#invite-username', 'new-lecturer');
  await button('Tạo lời mời'); await wait(text('Email hoặc tên đăng nhập đã được sử dụng')); assert.equal(await js('document.querySelector("#invite-email").value'), 'lecturer@example.invalid');
  await size(320, 568, 'dark'); await shot('invite-conflict-320-dark');
  await size(320, 280, 'dark'); await shot('invite-short-320-dark'); await touchClose(); await size(320, 568, 'dark');
  inviteStatus = 201; holdInvite = true; await button('Tạo lời mời'); await wait('document.querySelector("#invite-email").disabled'); await key('Escape', 27); assert.ok(await js('!!document.querySelector("#invite-email")')); heldInvite(); holdInvite = false;
  await wait('!document.querySelector("[role=dialog]")'); await wait("document.activeElement?.textContent.trim()==='Mời tài khoản'"); await wait(text('Chờ kích hoạt')); assert.ok(await js('location.search.includes("lecturer%40example.invalid")')); assert.equal(accounts[0].role, 'LECTURER'); await shot('invite-pending-320-dark');
  role = 'ANON'; await nav('/reset-password?token=synthetic-invite'); await wait('document.querySelector("#reset-newPassword")'); await set('#reset-newPassword', 'Synthetic-password-123'); await set('#reset-confirmPassword', 'Synthetic-password-123'); await button('Lưu mật khẩu mới'); await wait(text('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.')); resetStatus = 200; await button('Lưu mật khẩu mới'); await wait('location.pathname==="/login" && document.querySelector("#login-identifier")');
  resetStatus = 400; await nav('/reset-password?token=expired-synthetic-invite'); await wait('document.querySelector("#reset-newPassword")'); await set('#reset-newPassword', 'Synthetic-password-123'); await set('#reset-confirmPassword', 'Synthetic-password-123'); await button('Lưu mật khẩu mới'); await wait(text('Liên kết đã hết hạn')); assert.equal(await js('document.querySelector("#reset-newPassword")'), null); assert.equal(await js('[...document.querySelectorAll("a")].some(e=>e.textContent.includes("Gửi lại lời mời"))'), false); await shot('invite-expired-existing-auth-320-dark');
  checks.push('Invitations: actual admin form validation, duplicate conflict/value retention, busy Escape guard, correct LECTURER/PENDING payload and updated search/list; existing routed reset flow retries503→success/login and keeps expired-link feedback without invented reissue. APIs synthetic; no mail sent.');

  role = 'STUDENT'; permissions = ['DOCUMENT_UPLOAD']; await size(1280, 900, 'light'); await nav('/dashboard'); await wait(exists('.dashboard-shortcuts a[href="/my-documents"]')); await click('.dashboard-shortcuts a[href="/my-documents"]'); await wait(text('Tài liệu của tôi')); await wait('document.querySelector("main h1")?.textContent==="Tài liệu của tôi"'); await button('Thêm tài liệu mới'); await wait('document.querySelector(".upl input[type=file]")');
  await set('input[name=title]', 'Tài liệu đại số đóng góp thử nghiệm');
  const selects = ['Tài liệu tham khảo', 'Toán học', 'Ôn tập'];
  for (let i = 0; i < selects.length; i++) {
    await js(`[...document.querySelectorAll('[role=dialog] [role=combobox]')][${i}].setAttribute('data-journey-select', 'active')`);
    await click('[data-journey-select=active]');
    await wait(`[...document.querySelectorAll('[role=option]')].some(e=>e.textContent===${JSON.stringify(selects[i])})`);
    await js(`[...document.querySelectorAll('[role=option]')].find(e=>e.textContent===${JSON.stringify(selects[i])}).click()`);
    await js(`document.querySelector('[data-journey-select=active]')?.removeAttribute('data-journey-select')`);
  }
  const choose = async () => { const { root } = await call('DOM.getDocument', { depth: -1, pierce: true }); const { nodeId } = await call('DOM.querySelector', { nodeId: root.nodeId, selector: '.upl input[type=file]' }); await call('DOM.setFileInputFiles', { nodeId, files: [sourceFile] }); };
  await choose(); await wait(text('Chưa tải được tệp.')); uploadStatus = 201; await choose(); await wait(text('Tải lên thành công')); await shot('contributor-form-1280-light');
  await button('Tạo tài liệu'); await wait(text('Chưa xác nhận được tài liệu đã được tạo')); assert.equal(await js('document.querySelector("input[name=title]").value'), 'Tài liệu đại số đóng góp thử nghiệm');
  saveStatus = 403; await button('Tạo tài liệu'); await wait(text('Bấm Cập nhật quyền tải lên'));
  await button('Cập nhật quyền tải lên'); await wait(text('Đã cập nhật quyền.')); assert.equal(await js('document.querySelector("input[name=title]").value'), 'Tài liệu đại số đóng góp thử nghiệm');
  const uploadedCount = requests.filter(item => item.path === '/storage/upload').length;
  await size(390, 844, 'dark'); await shot('contributor-save-error-390-dark'); saveStatus = 201; await button('Tạo tài liệu'); await wait('!document.querySelector("[role=dialog]")'); await wait('document.activeElement?.hasAttribute("data-document-create")'); await wait(text('Tài liệu đại số đóng góp thử nghiệm')); assert.equal(requests.filter(item => item.path === '/storage/upload').length, uploadedCount); await shot('contributor-created-390-dark');
  await button('Sửa'); await wait('document.querySelector("input[name=title]")'); await set('input[name=title]', 'Tài liệu đã chỉnh sửa'); saveStatus = 503; await button('Lưu thay đổi'); await wait(text('Chưa lưu được tài liệu')); saveStatus = 200; await button('Lưu thay đổi'); await wait('!document.querySelector("[role=dialog]")'); await wait(text('Tài liệu đã chỉnh sửa'));
  await button('Xóa'); await wait('document.querySelector("[role=alertdialog]")'); await button('Xóa tài liệu'); await wait(text('Không thể xóa.')); deleteStatus = 204; await button('Xóa tài liệu'); await wait('!document.querySelector("[role=alertdialog]")'); await wait(text('Chưa có tài liệu nào'));
  await nav('/my-documents?ownerId=other-user'); await wait('document.querySelector("main h1")?.textContent==="Tài liệu của tôi"'); assert.ok(requests.filter(item => item.path === '/documents' && item.method === 'GET').every(item => new URLSearchParams(item.query).get('ownerId') === uid));
  permissions = []; await nav('/dashboard'); await wait('!!document.querySelector(".dashboard-shortcuts")'); assert.equal(await js(`Boolean(${exists('a[href="/my-documents"]')})`), false); await nav('/my-documents'); await wait(text('Để thêm tài liệu mới')); assert.equal(await js('[...document.querySelectorAll("main button")].some(e=>e.textContent.includes("Thêm tài liệu mới"))'), false);
  checks.push('Contribution: dashboard permission entry → fixed actor-owned list → existing real upload/form → upload503/reselection → save503/value+file retention/retry without reupload → edit503/retry → delete503/retry; forged ownerId ignored; revoked permission removes creation/entry while own management route remains.');

  examFailure = true; await nav('/dashboard'); await wait(exists('.dashboard-shortcuts a[href="/exams"]')); await click('.dashboard-shortcuts a[href="/exams"]'); await wait(text('Không thực hiện được thao tác với đề')); examFailure = false; await button('Thử lại'); await wait(text(paper.title)); await click(`main a[href="/exams/${paperId}"]`); await wait(text('Đọc kỹ từng câu.')); assert.equal(await js('[...document.querySelectorAll("main button")].some(e=>e.textContent.includes("lời giải"))'), false); await click('main a[href="/exams"]'); await wait(text(paper.title)); await shot('student-exams-390-dark');
  for (const staff of ['LECTURER', 'ADMIN']) { role = staff; const prefix = '/' + staff.toLowerCase(); await size(1280, 900, 'light'); await nav(prefix + '/dashboard'); await wait(`document.querySelector('.dashboard-shortcuts a[href="${prefix}/exams"]')`); await click(`.dashboard-shortcuts a[href="${prefix}/exams"]`); await wait(text('Đề nháp kiểm thử')); await click(`main a[href="${prefix}/exams/papers"]`); await wait(text(paper.title)); await shot(staff.toLowerCase() + '-papers-1280-light'); }
  role = 'STUDENT'; const beforeForbidden = requests.length; await nav('/admin/users'); await wait('location.pathname==="/dashboard" && document.querySelector(".dashboard-shortcuts")'); assert.equal(requests.slice(beforeForbidden).some(item => item.path.startsWith('/admin/users')), false);
  await size(390, 844, 'dark'); await nav('/dashboard'); await wait('document.querySelector(".dashboard-shortcuts")'); await click('button[aria-label="Mở menu điều hướng"]'); await wait(exists('[role=dialog] a[href="/exams"]')); await shot('student-mobile-exam-entry-390-dark'); await click('[role=dialog] a[href="/exams"]'); await wait(text(paper.title)); await wait('!document.querySelector("[role=dialog]")');
  checks.push('Exams: dashboard → student released list503/retry → paper without staff solution controls → back; lecturer/admin dashboards → own draft lists → published lists. Existing route guard redirects student before admin requests. Release/privacy enforcement remains API-test scope.');
  assert.deepEqual([...errors, ...session.requestFailures], []);
  await writeFile(join(dir, 'results.json'), JSON.stringify({ checks, screenshots, geometry, requests, errors, requestFailures: session.requestFailures, limits: ['Actual routed React UI with synthetic APIs, not live persistence/mail/storage/production authorization.', 'Reduced motion on; no new animation introduced; browser does not establish physical touch/autofill/AT behavior.'] }, null, 2));
  console.log(JSON.stringify({ evidence: dir, checks, screenshots: screenshots.length }));
} catch (error) {
  await writeFile(join(dir, 'failure.json'), JSON.stringify({ error: String(error), checks, screenshots, requests, errors, requestFailures: session?.requestFailures, body: js ? await js('document.body.innerText').catch(() => null) : null }, null, 2)); throw error;
} finally { heldTopic?.(); heldInvite?.(); await session?.cleanup(); }
