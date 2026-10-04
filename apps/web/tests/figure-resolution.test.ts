import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { applyFigureDownloads, canRetryPrivateFigure, collectFigureAssetIds, FigureObjectUrlCache, figureAuthorityUserId, figureSession, figureViewState, viewerFigureGroups, visibleToViewer, withFigureAccount } from "../src/features/questions/components/figure-resolution.ts";
import type { ScientificBlock } from "../src/features/questions/types/scientific-content.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const Q = "33333333-3333-4333-8333-333333333333";
const Q2 = "44444444-4444-4444-8444-444444444444";
const USER_A = "user-a";
const USER_B = "user-b";

function host() {
  const created: string[] = [];
  const revoked: string[] = [];
  let n = 0;
  return {
    created,
    revoked,
    createObjectURL(blob: Blob) {
      assert.equal(blob instanceof Blob, true);
      const url = `blob:local/${++n}`;
      created.push(url);
      return url;
    },
    revokeObjectURL(url: string) { revoked.push(url); },
  };
}
const blob = (text: string) => new Blob([text], { type: "image/png" });
const figure = (assetId: string): ScientificBlock => ({ id: assetId || "empty", kind: "figure_group", layout: "full_width", figures: [{ assetId, alt: "a", caption: "" }] });
function open(cache: FigureObjectUrlCache, questionId = Q, userId = USER_A) {
  cache.bind(questionId, userId);
  const session = figureSession(questionId, userId);
  if (session === null) throw Error("missing session");
  return session;
}

it("reuses a blob, revokes a replacement, and retain drops the rest", () => {
  const urls = host();
  const cache = new FigureObjectUrlCache(urls);
  const session = open(cache);
  const generation = cache.token();
  const first = blob("a");
  assert.equal(applyFigureDownloads(cache, generation, session, [{ assetId: A, blob: first }, { assetId: B, blob: blob("b") }], true), true);
  const kept = cache.resolve(session, A);
  assert.equal(cache.put(session, A, first, generation), kept);
  assert.equal(urls.created.length, 2);
  const replaced = cache.put(session, A, blob("c"), generation);
  assert.ok(kept && replaced && replaced !== kept);
  assert.equal(urls.revoked.includes(kept), true);
  assert.equal(applyFigureDownloads(cache, generation, session, [{ assetId: A, blob: blob("only") }], true), true);
  assert.equal(cache.resolve(session, B), undefined);
  assert.equal(urls.revoked.includes(urls.created[1] ?? ""), true);
  assert.equal(urls.created.every((url) => url.startsWith("blob:local/")), true);
});

it("ignores a stale generation and an inactive caller", () => {
  const urls = host();
  const cache = new FigureObjectUrlCache(urls);
  const session = open(cache);
  const generation = cache.token();
  applyFigureDownloads(cache, generation, session, [{ assetId: A, blob: blob("a") }], true);
  const url = cache.resolve(session, A);
  const revoked = urls.revoked.length;
  assert.equal(applyFigureDownloads(cache, generation, session, [{ assetId: B, blob: blob("b") }], false), false);
  assert.equal(cache.resolve(session, A), url);
  assert.equal(cache.resolve(session, B), undefined);
  assert.equal(urls.revoked.length, revoked);
  assert.equal(urls.created.length, 1);
  const stale = cache.token();
  cache.revokeAll();
  assert.ok(url);
  assert.equal(urls.revoked.includes(url), true);
  assert.equal(applyFigureDownloads(cache, stale, session, [{ assetId: A, blob: blob("late") }], true), false);
  assert.equal(cache.resolve(session, A), undefined);
  assert.equal(urls.created.length, 1);
});

it("clears an error and publishes a retry", () => {
  const urls = host();
  const cache = new FigureObjectUrlCache(urls);
  const session = open(cache);
  const generation = cache.token();
  const kept = blob("a");
  applyFigureDownloads(cache, generation, session, [{ assetId: A, blob: kept }, { assetId: B, blob: blob("b") }], true);
  const url = cache.resolve(session, A);
  assert.equal(applyFigureDownloads(cache, generation, session, [{ assetId: A, blob: kept }, { assetId: B, failed: true }], true), true);
  assert.equal(cache.resolve(session, A), url);
  assert.equal(cache.resolve(session, B), undefined);
  const error = figureViewState(true, { assetId: B, failed: true }, true);
  assert.equal(error.phase, "error");
  assert.equal(error.message, "Không tải được ảnh. Thử lại.");
  assert.equal(figureViewState(true, { assetId: A }, false).phase, "loading");
  assert.equal(canRetryPrivateFigure(Q, B), true);
  assert.equal(canRetryPrivateFigure(null, B), false);
  assert.equal(canRetryPrivateFigure(Q, "not-a-uuid"), false);
  assert.equal(applyFigureDownloads(cache, generation, session, [{ assetId: A, blob: kept }, { assetId: B, blob: blob("retry") }], true), true);
  assert.equal(cache.resolve(session, A), url);
  assert.equal(cache.resolve(session, B)?.startsWith("blob:local/"), true);
  assert.equal(visibleToViewer(false, { hidden: true }), null);
  const groups = (showAnswer: boolean) => viewerFigureGroups({
    showAnswer,
    stem: [figure(A)],
    parts: [{ prompt: [figure("")], options: [{ content: [figure("not-a-uuid")] }] }],
    explanation: { parts: [{ partId: "p", solution: [figure(B)], rubric: "secret" }] },
  });
  assert.deepEqual(collectFigureAssetIds(groups(false)), [A]);
  assert.deepEqual(collectFigureAssetIds(groups(true)), [A, B]);
});

it("resolve mismatch does not mutate; bind revokes before a new account publishes", () => {
  const urls = host();
  const cache = new FigureObjectUrlCache(urls);
  const sessionA = open(cache);
  const generation = cache.token();
  applyFigureDownloads(cache, generation, sessionA, [{ assetId: A, blob: blob("a") }], true);
  const url = cache.resolve(sessionA, A);
  const token = cache.token();
  const revoked = urls.revoked.length;
  assert.equal(cache.resolve(figureSession(Q, USER_B), A), undefined);
  assert.equal(cache.token(), token);
  assert.equal(urls.revoked.length, revoked);
  cache.bind(Q, USER_A);
  assert.equal(cache.token(), token);
  cache.bind(Q, USER_B);
  assert.equal(urls.revoked.includes(url ?? ""), true);
  const sessionB = figureSession(Q, USER_B);
  assert.equal(applyFigureDownloads(cache, generation, sessionA, [{ assetId: A, blob: blob("late") }], true), false);
  assert.equal(applyFigureDownloads(cache, cache.token(), sessionB, [{ assetId: A }], true), true);
  assert.equal(cache.resolve(sessionB, A), undefined);
  assert.equal(applyFigureDownloads(cache, cache.token(), sessionB, [{ assetId: A, blob: blob("b") }], true), true);
  assert.equal(cache.resolve(sessionA, A), undefined);
  assert.ok(cache.resolve(sessionB, A)?.startsWith("blob:local/"));
  cache.bind(Q2, USER_B);
  assert.equal(cache.resolve(sessionB, A), undefined);
  const other = new FigureObjectUrlCache(urls);
  const otherSession = open(other, Q2, USER_A);
  applyFigureDownloads(other, other.token(), otherSession, [{ assetId: B, blob: blob("other") }], true);
  const otherUrl = other.resolve(otherSession, B);
  cache.revokeAll();
  assert.equal(other.resolve(otherSession, B), otherUrl);
  cache.bind(Q2, null);
  assert.equal(applyFigureDownloads(cache, cache.token(), otherSession, [{ assetId: B, blob: blob("x") }], true), false);
});

it("figure authority is the confirmed revision", () => {
  assert.equal(figureAuthorityUserId("token-b", 4, { revision: 3, userId: USER_A }), null);
  assert.equal(figureAuthorityUserId("token-b", 4, null), null);
  assert.equal(figureAuthorityUserId(null, 4, { revision: 4, userId: USER_A }), null);
  assert.equal(figureAuthorityUserId("", 4, { revision: 4, userId: USER_A }), null);
  assert.equal(figureAuthorityUserId("token-b", 4, { revision: 4, userId: "" }), null);
  assert.equal(figureAuthorityUserId("token-b", 4, { revision: 4, userId: USER_B }), USER_B);
  assert.equal(figureSession(Q, null), null);
  assert.deepEqual(figureSession(Q, USER_A), { questionId: Q, userId: USER_A });
  assert.deepEqual(withFigureAccount(["questions", "figure", Q, A], USER_B), ["questions", "figure", Q, A, USER_B]);
});

it("resolver binds in layout and confirms the profile after the live revision", () => {
  const source = readFileSync(new URL("../src/features/questions/components/figure-resolution.tsx", import.meta.url), "utf8");
  const start = source.indexOf("export function usePrivateFigureResolver");
  const bindAt = source.indexOf("useLayoutEffect(() => {\n    cache.bind(question, userId);");
  const effectAt = source.indexOf("useEffect(() => {");
  assert.ok(start >= 0 && effectAt > start && bindAt > effectAt);
  const renderSlice = source.slice(start, bindAt);
  assert.equal(renderSlice.includes("cache.bind"), false);
  assert.equal(renderSlice.includes("revokeAll"), false);
  const effect = source.slice(effectAt, bindAt);
  assert.ok(effect.indexOf("cancelQueries") < effect.indexOf("refetchQueries"));
  assert.ok(effect.indexOf("refetchQueries") < effect.indexOf("setAuthority"));
  assert.ok(effect.indexOf("dataUpdateCount") < effect.indexOf("setAuthority"));
  assert.equal(source.split("cache.bind(").length, 2);
  assert.equal(source.includes("currentUser.data"), false);
  assert.equal(source.includes("data?.id"), false);
  assert.equal(source.includes("liveFigureUserId"), false);
  assert.equal(source.includes("resetQueries"), false);
  assert.equal(source.includes("removeQueries"), false);
  assert.equal(source.includes("Infinity"), false);
  assert.equal(source.includes("Date.now"), false);
  assert.equal(source.includes("useAuthStore"), true);
  assert.equal(source.includes("exact: true"), true);
  assert.equal(source.includes("QUERY_KEY_CURRENT_USER"), true);
});
