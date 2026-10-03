import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTurnstile, turnstileConfig, usableTurnstileToken } from "../src/features/auth/lib/turnstile.ts";

test("Turnstile is enabled only by explicit configuration and needs a public key", () => {
  assert.equal(turnstileConfig(undefined, undefined).enabled, false);
  assert.equal(turnstileConfig("false", "key").enabled, false);
  assert.equal(turnstileConfig("true", " ").invalid, true);
  assert.deepEqual(turnstileConfig("true", " public-key "), { enabled: true, siteKey: "public-key", invalid: false });
});

test("tokens expire at five minutes, reset to empty, and reject oversized or future values", () => {
  assert.equal(usableTurnstileToken("token", 1000, 300999), true);
  assert.equal(usableTurnstileToken("token", 1000, 301000), false);
  assert.equal(usableTurnstileToken("", 1000, 1001), false);
  assert.equal(usableTurnstileToken("x".repeat(2049), 1000, 1001), false);
  assert.equal(usableTurnstileToken("token", 1000, 999), false);
});

test("script loading is shared, fails closed, and can retry without any network", async t => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument); else Reflect.deleteProperty(globalThis, "document");
  });
  const scripts: Array<{ onload?: () => void; onerror?: () => void; remove: () => void }> = [];
  let removed = 0;
  const fakeWindow = { setTimeout, clearTimeout, turnstile: undefined as unknown };
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement: () => ({ remove: () => removed++ }),
    head: { appendChild: (script: typeof scripts[number]) => scripts.push(script) },
  } });
  const first = loadTurnstile();
  assert.equal(first, loadTurnstile());
  assert.equal(scripts.length, 1);
  scripts[0].onerror?.();
  await assert.rejects(first, /Không tải được/);
  assert.equal(removed, 1);
  const retry = loadTurnstile();
  assert.equal(scripts.length, 2);
  const api = { render: () => "fake", remove: () => {}, reset: () => {} };
  fakeWindow.turnstile = api;
  scripts[1].onload?.();
  assert.equal(await retry, api);
});
