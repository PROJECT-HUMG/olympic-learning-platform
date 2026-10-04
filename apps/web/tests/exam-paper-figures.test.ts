import assert from "node:assert/strict";
import { it } from "node:test";
import { PaperObjectUrlCache, paperFigureQueryKey, paperFigureScope } from "../src/features/exams/paper-figures.ts";

const PAPER = "33333333-3333-4333-8333-333333333333";
const ASSET = "44444444-4444-4444-8444-444444444444";

function host() {
  const created: string[] = [];
  const revoked: string[] = [];
  let n = 0;
  return { created, revoked, createObjectURL(blob: Blob) { assert.equal(blob instanceof Blob, true); const url = `blob:paper/${++n}`; created.push(url); return url; }, revokeObjectURL(url: string) { revoked.push(url); } };
}

it("scopes paper bytes by account revision and drops a stale completion", () => {
  assert.equal(paperFigureScope("user", "", 1), null);
  assert.equal(paperFigureScope(null, "token", 1), null);
  const scope = paperFigureScope("user-a", "token", 4);
  assert.ok(scope);
  assert.deepEqual(paperFigureQueryKey(scope!, PAPER, ASSET), ["exams", "paper-figure", "user-a", "4", PAPER, ASSET]);
  const urls = host();
  const cache = new PaperObjectUrlCache(urls);
  cache.bind(scope, PAPER);
  const generation = cache.token();
  const blob = new Blob(["a"], { type: "image/png" });
  const url = cache.put(scope!, PAPER, ASSET, blob, generation);
  assert.equal(cache.resolve(scope, PAPER, ASSET), url);
  cache.bind({ userId: "user-b", revision: 5 }, PAPER);
  assert.equal(cache.resolve(scope, PAPER, ASSET), undefined);
  assert.equal(cache.put(scope!, PAPER, ASSET, blob, generation), undefined);
  assert.equal(urls.created.length, 1);
  assert.deepEqual(urls.revoked, [url]);
});
