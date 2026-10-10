import assert from "node:assert/strict";
import { it } from "node:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { createSessionRefresh } from "../src/lib/session-refresh.ts";
import { expireAuthSession, QUERY_KEY_CURRENT_USER } from "../src/lib/auth-session.ts";

function setup(requestToken: () => Promise<string>) {
  let session = { accessToken: "old-token" as string | null, revision: 0 };
  let expired = 0;
  const setToken = (token: string | null) => { session = { accessToken: token, revision: session.revision + 1 }; };
  const refresh = createSessionRefresh({ getSession: () => session, requestToken,
    setToken, expire: () => { expired++; setToken(null); },
    normalizeError: (error) => error as Error & { status?: number },
    expiredError: () => Object.assign(new Error("Expired"), { status: 401 }),
  });
  return { refresh, setToken, session: () => session, expired: () => expired };
}

it("shares a refresh across concurrent failed requests and permits a later refresh", async () => {
  let calls = 0;
  let resolve!: (token: string) => void;
  const test = setup(() => { calls++; return new Promise((done) => { resolve = done; }); });
  const requests = [test.refresh(), test.refresh(), test.refresh()];
  assert.equal(calls, 1);
  resolve("new-token");
  assert.deepEqual(await Promise.all(requests), ["new-token", "new-token", "new-token"]);
  const later = test.refresh();
  assert.equal(calls, 2);
  resolve("next-token");
  assert.equal(await later, "next-token");
});

it("preserves the session after network, timeout or server failure and allows retry", async () => {
  for (const status of [undefined, 500, 503]) {
    let fail = true;
    const test = setup(async () => { if (fail) throw Object.assign(new Error("Temporary failure"), { status }); return "recovered"; });
    await assert.rejects(test.refresh());
    assert.equal(test.session().accessToken, "old-token");
    assert.equal(test.expired(), 0);
    fail = false;
    assert.equal(await test.refresh(), "recovered");
  }
});

it("expires one shared session after terminal refresh rejection", async () => {
  for (const status of [401, 403]) {
    const test = setup(async () => { throw Object.assign(new Error("Expired"), { status }); });
    await Promise.all([assert.rejects(test.refresh()), assert.rejects(test.refresh())]);
    assert.equal(test.session().accessToken, null);
    assert.equal(test.expired(), 1);
  }
});

it("does not restore a logged-out session or overwrite a newer login", async () => {
  for (const token of [null, "new-login"] as const) {
    let resolve!: (token: string) => void;
    const test = setup(() => new Promise((done) => { resolve = done; }));
    const pending = test.refresh();
    test.setToken(token);
    resolve("stale-response");
    if (token) assert.equal(await pending, token);
    else await assert.rejects(pending);
    assert.equal(test.session().accessToken, token);
  }
});

it("does not expire a newer login when an earlier refresh rejects", async () => {
  let reject!: (error: Error) => void;
  const test = setup(() => new Promise((_, fail) => { reject = fail; }));
  const pending = test.refresh();
  test.setToken("new-login");
  reject(Object.assign(new Error("Old session expired"), { status: 401 }));
  await assert.rejects(pending);
  assert.equal(test.session().accessToken, "new-login");
  assert.equal(test.expired(), 0);
});

it("notifies mounted account observers and clears data belonging to an expired user", async () => {
  const client = new QueryClient();
  client.setQueryData(QUERY_KEY_CURRENT_USER, { id: "old-user", role: "ADMIN" });
  client.setQueryData(["admin-users"], ["private-user"]);
  let observed: unknown = "unset";
  let cleared = false;
  const observer = new QueryObserver(client, { queryKey: QUERY_KEY_CURRENT_USER, enabled: false });
  const unsubscribe = observer.subscribe((result) => { observed = result.data; });
  expireAuthSession(client, () => { cleared = true; });
  assert.equal(cleared, true);
  assert.equal(observed, null);
  assert.equal(client.getQueryData(QUERY_KEY_CURRENT_USER), null);
  assert.equal(client.getQueryData(["admin-users"]), undefined);
  unsubscribe();
  client.clear();
});

it("clears observed data without disconnecting a pending screen or leaving it loading", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const key = ["documents", "list"];
  let resolve!: (data: string[]) => void;
  const observer = new QueryObserver(client, { queryKey: key,
    queryFn: () => new Promise<string[]>((done) => { resolve = done; }) });
  const unsubscribe = observer.subscribe(() => {});
  expireAuthSession(client, () => {});
  resolve(["stale private data"]);
  await new Promise((done) => setTimeout(done, 0));
  assert.equal(observer.getCurrentResult().isPending, false);
  assert.equal(observer.getCurrentResult().isError, true);
  assert.equal(observer.getCurrentResult().data, undefined);
  client.setQueryData(key, ["new data"]);
  assert.deepEqual(observer.getCurrentResult().data, ["new data"]);
  expireAuthSession(client, () => {});
  assert.equal(observer.getCurrentResult().data, undefined);
  assert.equal(observer.getCurrentResult().isError, true);
  unsubscribe();
  client.clear();
});

it("anonymous expiry preserves explicitly public reads while clearing private observed data", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const publicKey = ["recognition", "profile", "public-user"];
  const privateKey = ["recognition", "mine"];
  const publicObserver = new QueryObserver(client, { queryKey: publicKey, queryFn: async () => ({ publicPoints: 16 }), meta: { publicRead: true }, enabled: false });
  const privateObserver = new QueryObserver(client, { queryKey: privateKey, queryFn: async () => ["private evidence"], enabled: false });
  const stopPublic = publicObserver.subscribe(() => {});
  const stopPrivate = privateObserver.subscribe(() => {});
  client.setQueryData(publicKey, { publicPoints: 16 });
  client.setQueryData(privateKey, ["private evidence"]);
  expireAuthSession(client, () => {});
  assert.deepEqual(publicObserver.getCurrentResult().data, { publicPoints: 16 });
  assert.equal(privateObserver.getCurrentResult().data, undefined);
  assert.equal(privateObserver.getCurrentResult().isError, true);
  stopPublic(); stopPrivate(); client.clear();
});
