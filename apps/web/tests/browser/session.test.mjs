import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { browserOptions, evidenceDirectory, startBrowserCheck, webRoot } from './session.mjs';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(condition) {
  const start = performance.now();
  while (!condition()) {
    if (performance.now() - start > 15000) throw Error('Timed out waiting for browser test event');
    await delay(20);
  }
}
const readRecord = async dir => JSON.parse(await readFile(join(dir, 'lifecycle.json'), 'utf8'));
async function assertClosed(dir) {
  const record = await readRecord(dir);
  assert.equal(record.status, 'closed');
  await assert.rejects(access(record.runtime), { code: 'ENOENT' });
  if (record.pid) assert.throws(() => process.kill(record.pid, 0), { code: 'ESRCH' });
  if (record.web) await assert.rejects(fetch(record.web, { signal: AbortSignal.timeout(1000) }));
  return record;
}

test('strict options and output ownership reject accidental no-op/overwrite', async () => {
  assert.throws(() => browserOptions('otp', ['--typo']), /Unknown option/);
  assert.throws(() => browserOptions('auth', ['--section=typo']), /--section must be/);
  assert.throws(() => browserOptions('otp', ['--visual-only', '--interactions-only']), /Choose/);
  assert.throws(() => browserOptions('home', ['--timeout-ms=NaN']), /integer/);
  const dir = await mkdtemp(join(tmpdir(), 'humg-browser-options-'));
  try { await assert.rejects(evidenceDirectory({ output: dir }), { code: 'EEXIST' }); }
  finally { await rm(dir, { recursive: true }); }
});

test('startup failure after Vite starts closes only owned resources', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'humg-browser-startup-failure-'));
  // A real executable that exits before providing CDP; no browser/network work.
  const options = browserOptions('home', ['--browser', '/usr/bin/false', '--timeout-ms=1000']);
  await assert.rejects(startBrowserCheck({ dir, options }), /Chromium exited/);
  const record = await assertClosed(dir);
  assert.ok(record.pid && record.web, 'failure occurred after the host and child were created');
  console.log(`Startup-failure evidence: ${dir}`);
});

test('real CDP timeout, socket closure and failed assertion clean up; env and profile are isolated', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'humg-browser-runtime-failure-'));
  const options = browserOptions('home', ['--no-sandbox']);
  let session;
  const envKey = 'VITE_BROWSER_TEST_SENTINEL';
  // Synthetic sentinel, not an operator credential; do not inspect other env values.
  const prior = process.env[envKey]; process.env[envKey] = 'synthetic-value-must-not-appear';
  try {
    session = await startBrowserCheck({ dir, options,
      snapshots: new Map([[join(webRoot, 'src/features/home/components/home-hero-section.tsx'), 'export default import.meta.env;']]) });
    const source = await (await fetch(session.web + '/src/features/home/components/home-hero-section.tsx')).text();
    assert.ok(!source.includes('synthetic-value-must-not-appear'));
    assert.equal(await session.js('location.href'), 'about:blank');
    let paused, release, replaced = false;
    session.onRequest(async event => {
      if (event.request.url.endsWith('/cancel-me')) { paused = event; await new Promise(resolve => { release = resolve; }); }
      const response = { requestId: event.requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html' }], body: Buffer.from('<html><body>Synthetic shell</body></html>').toString('base64') };
      await session.call('Fetch.fulfillRequest', response);
      if (event.request.url.endsWith('/duplicate-reply')) await session.call('Fetch.fulfillRequest', response);
    });
    session.onEvent(message => {
      if (message.method === 'Page.frameNavigated' && message.params.frame.id === paused?.frameId) replaced = true;
    });
    await session.call('Runtime.enable'); await session.call('Network.enable'); await session.call('Page.enable');
    await session.call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await session.call('Page.navigate', { url: session.web + '/synthetic-shell' });
    await session.js('void fetch("/duplicate-reply").catch(()=>null)');
    await until(() => session.requestFailures.length > 0);
    assert.equal(session.requestFailures[0].path, '/duplicate-reply');
    assert.match(session.requestFailures[0].error, /Invalid InterceptionId/);
    await session.js('void fetch("/cancel-me").catch(()=>null)');
    await until(() => !!paused);
    await session.call('Page.navigate', { url: 'about:blank' });
    await until(() => replaced);
    // Chrome may retain a paused request after navigation; explicitly abort it before the late fixture reply.
    await session.call('Fetch.failRequest', { requestId: paused.requestId, errorReason: 'Aborted' });
    release();
    await until(() => session.cancelledRequests.length > 0 || session.requestFailures.length > 1);
    assert.equal(session.requestFailures.length, 1, 'only the deliberate same-frame duplicate is a failure');
    assert.equal(session.cancelledRequests[0].path, '/cancel-me');
    options.timeout = 300; // Bound the deliberately stalled RPC, not real browser startup.
    await assert.rejects(session.call('Runtime.evaluate', { expression: 'new Promise(()=>{})', awaitPromise: true }), /timed out/);
    options.timeout = 5000;
    const waiting = session.call('Runtime.evaluate', { expression: 'new Promise(()=>{})', awaitPromise: true });
    const rejected = assert.rejects(waiting, /CDP socket (closed|failed)|Owned Chromium exited/);
    process.kill((await readRecord(dir)).pid, 'SIGTERM'); // this test's exact owned child
    await rejected;
    await assert.rejects(async () => {
      try { assert.fail('deliberate assertion failure'); }
      finally { await session.cleanup(); }
    }, /deliberate assertion/);
    await session.cleanup(); // idempotent after failure
    await assertClosed(dir);
    console.log(`Runtime-failure evidence: ${dir}`);
  } finally {
    if (prior === undefined) delete process.env[envKey]; else process.env[envKey] = prior;
    await session?.cleanup();
  }
});

test('SIGTERM closes owned host/browser without touching an independent listener', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'humg-browser-signal-'));
  const script = join(dir, 'child.mjs');
  await writeFile(script, `import { startBrowserCheck, browserOptions } from ${JSON.stringify(new URL('./session.mjs', import.meta.url).href)};
    await startBrowserCheck({dir:${JSON.stringify(dir)},options:browserOptions('home',['--no-sandbox'])});
    setInterval(()=>{},1000);`);
  const child = spawn(process.execPath, [script], { stdio: ['ignore', 'ignore', 'pipe'] });
  const exited = once(child, 'exit');
  let diagnostics = ''; child.stderr.on('data', data => { diagnostics += data; });
  const { createServer } = await import('node:http');
  const independent = createServer((_, response) => response.end('independent'));
  await new Promise(resolve => independent.listen(0, '127.0.0.1', resolve));
  try {
    let ready = false;
    for (let n = 0; n < 300; n++) {
      if (child.exitCode !== null) throw Error(`Child exited: ${diagnostics}`);
      if (await readRecord(dir).then(record => record.status === 'ready').catch(() => false)) { ready = true; break; }
      await delay(100);
    }
    assert.ok(ready, 'child became ready');
    child.kill('SIGTERM');
    assert.equal((await exited)[0], 143);
    assert.equal((await assertClosed(dir)).receivedSignal, 'SIGTERM');
    assert.equal(await (await fetch(`http://127.0.0.1:${independent.address().port}`)).text(), 'independent');
    console.log(`Signal-cleanup evidence: ${dir}`);
  } finally {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      const escalation = setTimeout(() => child.kill('SIGKILL'), 5000);
      try { await exited; } finally { clearTimeout(escalation); }
    }
    independent.closeAllConnections(); await new Promise(resolve => independent.close(resolve));
  }
});
