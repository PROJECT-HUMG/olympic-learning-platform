// Actual public routes and shared shell; synthetic API/media, no live services or .env.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserOptions, evidenceDirectory, startBrowserCheck, webRoot } from './browser/session.mjs';

const options = browserOptions('recognition');
const before = Boolean(options.before);
const dir = await evidenceDirectory(options);
const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: webRoot, encoding: 'utf8' }).trim();
const snapshots = new Map();
if (before) for (const path of [
  'src/features/recognition/public-pages.tsx', 'src/features/recognition/components.tsx',
  'src/features/recognition/recognition.css', 'src/features/recognition/ranking-presentation.tsx',
  'src/features/recognition/ranking-presentation.css', 'src/features/recognition/honor-gallery.tsx',
  'src/features/recognition/ranking-presentation-model.ts', 'src/features/user/components/user-hover-card.tsx',
]) snapshots.set(join(webRoot, path), execFileSync('git', ['show', `${base}:apps/web/${path}`], { cwd: webRoot, encoding: 'utf8' }));

// Deliberately synthetic raster: layout/decoding proof, not real team-photo quality.
const crc = bytes => { let c = -1; for (const v of bytes) { c ^= v; for (let n = 0; n < 8; n++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ -1) >>> 0; };
const chunk = (type, bytes) => { const t = Buffer.from(type), n = Buffer.alloc(4), c = Buffer.alloc(4); n.writeUInt32BE(bytes.length); c.writeUInt32BE(crc(Buffer.concat([t, bytes]))); return Buffer.concat([n, t, bytes, c]); };
const header = Buffer.alloc(13); header.writeUInt32BE(640); header.writeUInt32BE(400, 4); header[8] = 8; header[9] = 2;
const pixels = Buffer.alloc(400 * 1921);
for (let y = 0; y < 400; y++) for (let x = 0; x < 640; x++) {
  const i = y * 1921 + 1 + x * 3;
  pixels[i] = x < 320 ? 31 : 58; pixels[i + 1] = y < 200 ? 100 : 143; pixels[i + 2] = x + y > 500 ? 153 : 205;
}
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
const uid = '00000000-0000-0000-0000-000000000101';
const second = '00000000-0000-0000-0000-000000000102';
const people = [
  { userId: uid, fullName: 'Nguyễn Hoàng Minh Anh', award: 'Giải Nhất', profileAvailable: true },
  { userId: null, fullName: 'Trần Thị Thanh Huyền', award: 'Tham gia' },
  { userId: second, fullName: 'Thành viên không còn khả dụng', profileAvailable: false },
  ...Array.from({ length: 9 }, (_, i) => ({ fullName: `Thành viên thử nghiệm ${i + 4}`, award: 'Tham gia' })),
];
const photos = [1, 2, 3].map(i => ({ id: `photo-${i}`, originalName: `synthetic-${i}.png` }));
const albums = [
  { id: 'album-a', title: 'Đội tuyển Olympic Toán HUMG', subject: 'Toán học', year: 2026, photos, participants: people },
  { id: 'album-b', title: 'Những dấu mốc nghiên cứu khoa học và hành trình cùng đội tuyển sinh viên qua một mùa nhiều kỷ niệm', subject: 'Nghiên cứu khoa học', year: 2025, photos, participants: people.slice(0, 2) },
  { id: 'album-c', title: 'Gặp gỡ đội tuyển Tin học', subject: 'Tin học', year: 2025, photos: [], participants: people.slice(0, 1) },
].map(a => ({ ...a, status: 'PUBLISHED', scope: 'SCHOOL', version: 1, description: 'Nội dung album giả lập để kiểm tra bố cục. Không phải thành tích hoặc dữ liệu người dùng thật.' }));
const ranks = [
  { rank: 1, userId: uid, fullName: people[0].fullName, totalPoints: 64, approvedCount: 4, scoreTimingKnown: true },
  { rank: 2, userId: second, fullName: 'Nguyễn Thị Hồng Nhung với họ tên dài để kiểm tra khả năng đọc', totalPoints: 32, approvedCount: 3, scoreTimingKnown: true },
  { rank: 3, userId: '00000000-0000-0000-0000-000000000103', fullName: 'Lê Đức Anh', totalPoints: 32, approvedCount: 2, scoreTimingKnown: true },
  { rank: 4, userId: '00000000-0000-0000-0000-000000000104', fullName: 'Trần Minh', totalPoints: 16, approvedCount: 1, scoreTimingKnown: false },
];
const record = { id: 'record-a', title: 'Olympic Toán', category: 'OLYMPIC_NATIONAL', award: 'FIRST', includeParticipation: true, achievedDate: '2026-09-01', publicVisible: true, status: 'APPROVED', awardPoints: 10, participationPoints: 6, totalPoints: 16 };
const profile = { userId: uid, fullName: people[0].fullName, username: 'fixture-member', avatarUrl: null, rankingOptIn: true, publicPoints: 16, achievements: [record] };
const page = content => ({ content, totalElements: content.length, totalPages: content.length ? 2 : 0, number: 0, size: 12, first: true, last: false });
const checks = [], screenshots = [], geometry = [], requests = [], errors = [];
let session, call, js, listStatus = 200, empty = false, imageFailure = false, held = null;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  session = await startBrowserCheck({ dir, options, snapshots });
  ({ call, js } = session);
  const reply = (event, status, body, type = 'application/json') => call('Fetch.fulfillRequest', {
    requestId: event.requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: type }],
    body: (Buffer.isBuffer(body) ? body : Buffer.from(type === 'application/json' ? JSON.stringify(body) : body)).toString('base64'),
  });
  session.onRequest(async event => {
    const url = new URL(event.request.url), path = url.pathname;
    if (url.origin === session.web && !path.startsWith('/api/')) return call('Fetch.continueRequest', { requestId: event.requestId });
    requests.push({ path, query: url.search, method: event.request.method });
    if (!path.startsWith('/api/')) return reply(event, 404, '', 'text/plain');
    if (path.endsWith('/users/me') || path.endsWith('/auth/refresh')) return reply(event, 401, {});
    if (event.request.method !== 'GET') throw Error('Unexpected mutation ' + path);
    if (path.includes('/photos/')) return reply(event, imageFailure ? 503 : 200, imageFailure ? {} : png, imageFailure ? 'application/json' : 'image/png');
    if (path.endsWith('/recognition/honors') || path.endsWith('/recognition/rankings')) {
      if (held) await held.promise;
      return reply(event, listStatus, listStatus === 200 ? page(empty ? [] : path.endsWith('/honors') ? albums : ranks) : { detail: 'Lỗi kết nối thử nghiệm.' });
    }
    if (path.includes('/recognition/honors/')) return reply(event, 200, albums.find(a => a.id === path.split('/').at(-1)) ?? albums[0]);
    if (path.includes('/recognition/profiles/')) return reply(event, 200, profile);
    return reply(event, 200, page([]));
  });
  session.onEvent(event => { if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.exception?.description ?? event.params.exceptionDetails.text); });
  const wait = async expression => { for (let n = 0; n < 500; n++) { if (await js(`Boolean(${expression})`)) return; await delay(40); } throw Error('Timeout ' + expression); };
  const resize = (width, height = 900) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const key = async (key, code) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code, ...(key === 'Enter' ? { text: '\r' } : {}) }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code }); };
  const nav = async (route, theme = 'light', reduced = false) => {
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await call('Page.navigate', { url: session.web + route });
    await wait('!!document.querySelector("h1") && !document.querySelector("#startup-loader") && !document.querySelector("#root").inert');
    await wait(`document.documentElement.classList.contains('dark') === ${theme === 'dark'}`);
  };
  const shot = async name => {
    assert.ok(await js('document.documentElement.scrollWidth <= innerWidth + 1'), 'no horizontal overflow: ' + name);
    const path = join(dir, name + '.png');
    await writeFile(path, Buffer.from((await call('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')); screenshots.push(path);
  };
  await call('Runtime.enable'); await call('Page.enable'); await call('Network.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await call('Emulation.setFocusEmulationEnabled', { enabled: true });
  for (const width of options['interactions-only'] ? [] : before ? [390, 1280] : [320, 390, 768, 1280]) for (const theme of ['light', 'dark']) {
    await resize(width, width < 768 ? 844 : 900);
    await nav('/honors', theme); await wait('document.querySelector(".recognition-memory img")?.naturalWidth > 0');
    await shot(`honors-${width}-${theme}`);
    await js('document.querySelectorAll(".recognition-memory")[2].scrollIntoView({block:"center"})');
    await shot(`honors-no-photo-${width}-${theme}`);
    if (!before) {
      const g = await js(`(()=>{const cards=[...document.querySelectorAll('.recognition-memory')];return {width:innerWidth,theme:${JSON.stringify(theme)},cards:cards.map(c=>({frame:c.getBoundingClientRect().toJSON(),title:c.querySelector('h2').getBoundingClientRect().toJSON(),photo:c.querySelector('.recognition-memory__photo')?.getBoundingClientRect().toJSON(),links:[...c.querySelectorAll('a')].map(a=>({height:a.getBoundingClientRect().height,text:a.textContent}))}))}})()`);
      assert.ok(g.cards.every(c => Math.abs(c.frame.height - g.cards[0].frame.height) < 1), 'all cards have equal dimensions');
      const regions = await js(`[...document.querySelectorAll('.recognition-memory')].map(c=>{const top=c.getBoundingClientRect().top;return ['.recognition-memory__photo','.recognition-memory__heading','.recognition-memory__attribution','.recognition-memory__footer'].map(s=>c.querySelector(s).getBoundingClientRect().top-top)})`);
      assert.ok(regions.every(r=>r.every((top,i)=>Math.abs(top-regions[0][i])<1)), 'media/title/attribution/actions align across every card');
      assert.ok(await js('[...document.querySelectorAll(".recognition-memory")].every(c=>getComputedStyle(c).borderTopWidth==="1px"&&getComputedStyle(c).backgroundColor!=="rgba(0, 0, 0, 0)")'));
      assert.ok(await js('document.querySelector(".recognition-memory--no-photo").innerText.includes("Album chưa có ảnh")'));
      assert.equal(await js('document.querySelectorAll(".recognition-memory .user-identity__affordance").length'),0);
      assert.ok(g.cards.every(c => c.links.every(l => l.height >= 44)), '44px profile/album links');
      assert.ok(g.cards.slice(0, 2).every(c => c.title.y >= c.photo.bottom), 'full-width title follows photo');
      geometry.push(g);
      assert.equal(await js('document.querySelectorAll(".recognition-memory .recognition-participants li").length'), 5);
      assert.ok(await js('!document.querySelector(".recognition-memory__attribution").innerText.includes("Giải Nhất")'));
      const ax = await call('Accessibility.getFullAXTree');
      assert.ok(ax.nodes.some(n=>n.role?.value==='link' && n.name?.value===albums[1].title), 'full long title remains accessible');
      const nameSizes = await js('[...document.querySelectorAll(".recognition-memory__attribution .user-identity__name")].map(e=>getComputedStyle(e).fontSize)');
      assert.equal(new Set(nameSizes).size, 1, 'historical and linked attribution use the same compact type');
    }
    await nav('/honors/album-a', theme); await wait(before ? '!!document.querySelector(".depth-carousel")' : 'document.querySelector(".depth-carousel__card[aria-hidden=false] img")?.naturalWidth > 0');
    await shot(`album-arrival-${width}-${theme}`);
    if (!before) {
      assert.ok(await js('document.querySelector(".depth-carousel").getBoundingClientRect().top < document.querySelector(".recognition-album__people").getBoundingClientRect().top'), 'gallery precedes roster');
      assert.equal(await js('document.querySelector(".recognition-links a").textContent'), 'Quay lại');
      assert.equal(await js('document.querySelectorAll(".recognition-links a").length'),1);
      assert.equal(await js('document.querySelectorAll(".recognition-album__people .user-identity__affordance").length'),0);
    }
    await nav('/rankings?year=2026', theme); await wait('document.querySelectorAll(".ranking-presentation__row").length === 4');
    await shot(`rankings-${width}-${theme}`);
    if (!before) {
      assert.equal(await js('document.querySelectorAll(".ranking-presentation__columns,.ranking-presentation .user-identity__affordance").length'),0);
      assert.ok(await js('[...document.querySelectorAll(".ranking-presentation__row")].every(e=>["borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius"].every(c=>getComputedStyle(e)[c]==="0px")&&getComputedStyle(e).borderTopWidth==="1px")'));
      assert.deepEqual(await js('[...document.querySelectorAll(".ranking-presentation__row")].map(e=>e.dataset.scoreTone)'), ['teal','blue','blue','neutral']);
      assert.ok(await js('document.querySelectorAll(".ranking-presentation__row")[3].innerText.includes("Chưa có mốc điểm cũ")'));
      const contrasts = await js(`(()=>{
        const channels = color => color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
        const luminance = c => {const [r,g,b]=channels(c);return .2126*r+.7152*g+.0722*b;};
        return [...document.querySelectorAll('.ranking-presentation__row')].map(row=>{
          const fg=luminance(getComputedStyle(row.querySelector('.user-identity__name')).color),bg=luminance(getComputedStyle(row).backgroundColor);
          return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
        });
      })()`);
      assert.ok(contrasts.every(ratio=>ratio>=4.5), 'all score-name colors meet normal-text contrast');
    }
    assert.deepEqual(await js('[...document.querySelectorAll(".ranking-presentation__rank > [aria-hidden]")].map(e=>e.textContent)'), ['1', '2', '3', '4']);
    assert.deepEqual(await js('[...document.querySelectorAll(".ranking-presentation__points strong")].map(e=>e.textContent)'), ['64', '32', '32', '16']);
  }
  if (!options['interactions-only']) checks.push('Routed Honors, equal bordered long-title/no-photo cards with aligned regions, 12-person album and square-cornered horizontal Rankings cards captured across responsive themes; unique supplied ranks/points and legible score-name colors retained.');
  if (!before && !options['visual-only']) {
    await resize(390, 844); await nav('/honors?year=2026&subject=Toán&page=2&keep=value#albums');
    await wait('!!document.querySelector(".recognition-memory")');
    await js('document.querySelectorAll(".recognition-memory h2 a")[1].click()');
    await wait('location.pathname === "/honors/album-b" && !!document.querySelector(".recognition-album__header")');
    assert.equal(await js('document.querySelector("h1").textContent'), albums[1].title, 'opened album shows the complete bounded card title');
    await js('document.querySelector(".recognition-links a").click()');
    await wait('location.pathname === "/honors" && !!document.querySelector(".recognition-memory")');
    assert.equal(await js('decodeURI(location.search + location.hash)'), '?year=2026&subject=Toán&page=2&keep=value#albums');
    await js('document.querySelector(".recognition-memory a.user-identity").focus()'); await key('Enter', 13);
    await wait('!!document.querySelector(".public-profile-layout")');
    assert.equal(await js('location.pathname'), '/users/' + uid);
    await js('document.querySelector(".recognition-links a").click()'); await wait('location.pathname === "/honors"');
    await wait('!!document.querySelector(".recognition-navigation")');
    assert.equal(await js('decodeURI(location.search + location.hash)'), '?year=2026&subject=Toán&page=2&keep=value#albums');
    await js('document.querySelectorAll(".recognition-navigation a")[1].click()');
    await wait('location.pathname === "/rankings"'); assert.equal(await js('location.search'), '?year=2026');
    await wait('!!document.querySelector(".ranking-presentation__row")');
    await js('document.querySelector(".ranking-presentation a.user-identity").focus()'); await key('Enter', 13);
    await wait('!!document.querySelector(".public-profile-layout")');
    assert.ok(await js('document.querySelector(".recognition-person__totals").innerText.includes("16")'), 'profile retains its independent public total, not ranking64');
    await js('document.querySelector(".recognition-links a").click()'); await wait('location.pathname === "/rankings"');
    await wait('!!document.querySelector(".ranking-presentation__row")');
    await js('(()=>{const e=document.querySelector("select");e.value="2025";e.dispatchEvent(new Event("change",{bubbles:true}))})()');
    await wait('new URLSearchParams(location.search).get("year") === "2025"');
    await wait('document.querySelector(".ranking-toolbar__context").textContent.includes("Năm 2025")');
    assert.ok(requests.some(r => r.path.endsWith('/rankings') && r.query.includes('year=2025')));
    await js('document.querySelector(".recognition-rules summary").focus()');
    assert.ok(await js('document.activeElement.matches(".recognition-rules summary")'));
    await key('Enter', 13);
    await wait('document.querySelector(".recognition-rules").open'); await shot('ranking-rules-390-light');
    checks.push('Keyboard profile links preserve list return query/hash; cross-page navigation carries year only; period request and rules disclosure work; ranking64/profile16 remain distinct.');
    for (const route of ['/honors', '/rankings']) {
      listStatus = 503; await nav(route); await wait('!!document.querySelector(".recognition-feedback[role=alert]")'); await shot(route.slice(1) + '-error');
      listStatus = 200; await js('document.querySelector(".recognition-feedback button").click()'); await wait('!!document.querySelector(".recognition-memory,.ranking-presentation__row")');
      empty = true; await nav(route); await wait('!!document.querySelector(".recognition-feedback")'); await shot(route.slice(1) + '-empty'); empty = false;
    }
    // Later route loading belongs to the feature; cold startup has its own readiness owner.
    held = {}; held.promise = new Promise(resolve => { held.release = resolve; });
    await js('document.querySelectorAll(".recognition-navigation a")[0].click()');
    await wait('document.querySelector(".recognition-feedback")?.textContent.includes("Đang tải album")'); await shot('honors-loading'); held.release(); held = null;
    await wait('!!document.querySelector(".recognition-memory")');
    imageFailure = true; await nav('/honors'); await wait('[...document.querySelectorAll("button")].some(b=>b.textContent === "Thử tải ảnh lại")'); await shot('honors-image-error');
    imageFailure = false; await js('[...document.querySelectorAll("button")].find(b=>b.textContent === "Thử tải ảnh lại").click()'); await wait('document.querySelector(".recognition-memory img")?.naturalWidth > 0');
    checks.push('List503 retry, genuine empty, held loading and separate image503/retry observed without losing filter controls.');
    await nav('/honors/album-a', 'dark', true); await wait('!!document.querySelector(".depth-carousel__stage")');
    await js('document.querySelector(".depth-carousel__stage").focus()'); await key('ArrowRight', 39);
    await wait('document.querySelector(".depth-carousel [role=status]").textContent === "2 / 3"');
    await js('document.querySelector(".depth-carousel__stage").scrollIntoView({block:"center"})');
    const stage = await js('document.querySelector(".depth-carousel__stage").getBoundingClientRect().toJSON()');
    await call('Emulation.setTouchEmulationEnabled', { enabled: true });
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: stage.x + stage.width * .75, y: stage.y + stage.height / 2 }] });
    await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: stage.x + stage.width * .25, y: stage.y + stage.height / 2 }] });
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait('document.querySelector(".depth-carousel [role=status]").textContent === "3 / 3"');
    await call('Emulation.setTouchEmulationEnabled', { enabled: false });
    await js('[...document.querySelectorAll("button")].find(b=>b.textContent === "Mở ảnh lớn").click()'); await wait('!!document.querySelector(".honor-gallery-dialog")');
    await shot('album-dialog-reduced-390-dark'); await key('Escape', 27); await wait('!document.querySelector("[role=dialog]")');
    assert.equal(await js('document.activeElement.textContent'), 'Mở ảnh lớn');
    await nav('/honors/album-c', 'dark', true); await wait('document.body.innerText.includes("Chưa có ảnh kỷ niệm.")'); await shot('album-without-photos-390-dark');
    assert.equal(await js('!!document.querySelector(".depth-carousel")'), false);
    checks.push('Reduced-motion gallery arrows and CDP touch swipe, dialog Escape/focus return, truthful empty album and unchanged source ordering.');
  }
  assert.ok(!requests.some(r => r.path.includes('/evidence/') || r.path.includes('/admin/')), 'no private APIs on public pages');
  assert.deepEqual([...errors, ...session.requestFailures], []);
  await writeFile(join(dir, 'results.json'), JSON.stringify({ base, before, checks, screenshots, geometry, requests, errors, requestFailures: session.requestFailures, cancelledRequests: session.cancelledRequests, limits: ['Actual routed Chromium with synthetic API/identities/raster. No live backend, real team-photo quality, physical-device or AT speech proof.'] }, null, 2));
  console.log(JSON.stringify({ evidence: dir, before, checks, screenshots: screenshots.length }));
} catch (error) {
  await writeFile(join(dir, 'failure.json'), JSON.stringify({ error: String(error), checks, requests, errors, body: await js?.('document.body.innerText').catch(() => null), focus: await js?.('({tag:document.activeElement?.tagName,text:document.activeElement?.textContent})').catch(() => null), requestFailures: session?.requestFailures }, null, 2));
  throw error;
} finally { await session?.cleanup(); }
