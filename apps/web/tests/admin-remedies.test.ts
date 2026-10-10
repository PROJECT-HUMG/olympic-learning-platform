import assert from "node:assert/strict";
import { it } from "node:test";
import { postDisplayStatus, postManagementStatusQuery } from "../src/features/post/post-status.ts";
import { importJobId, importAccessDenied } from "../src/features/assessment/import-session.ts";
import { replaceListParam, getPageNumber } from "../src/lib/list-navigation.ts";

it("expiry cannot disguise drafts or archived posts as published expired records", () => {
  const past = "2020-01-01T00:00:00Z", now = Date.parse("2026-10-10T00:00:00Z");
  for (const status of ["DRAFT", "ARCHIVED"]) assert.equal(postDisplayStatus({ status, expiredAt: past }, now), status);
  assert.equal(postDisplayStatus({ status: "PUBLISHED", expiredAt: past }, now), "EXPIRED");
  for (const expiredAt of [null, "invalid", "2027-01-01T00:00:00Z"]) assert.equal(postDisplayStatus({ status: "PUBLISHED", expiredAt }, now), "PUBLISHED");
});

it("management status filters use existing status/expiry predicates only", () => {
  assert.deepEqual(postManagementStatusQuery("EXPIRED"), { status: "PUBLISHED", expired: true });
  assert.deepEqual(postManagementStatusQuery("PUBLISHED"), { status: "PUBLISHED", expired: false });
  for (const status of ["DRAFT", "ARCHIVED"]) assert.deepEqual(postManagementStatusQuery(status), { status });
  for (const value of [null, "", "UNSUPPORTED"]) assert.deepEqual(postManagementStatusQuery(value), {});
});

it("changing supported filters resets page without dropping other URL context", () => {
  for (const [key, value] of [["status", "EXPIRED"], ["subjectId", "math"], ["categoryId", "book"], ["keyword", "limits"]]) {
    const before = new URLSearchParams("page=4&context=keep");
    const next = replaceListParam(before, key, value);
    assert.equal(next.get(key), value); assert.equal(next.get("context"), "keep");
    assert.equal(getPageNumber(next.get("page")), 1); assert.equal(before.get("page"), "4");
    assert.equal(replaceListParam(next, key, "").has(key), false);
  }
});

it("job restoration accepts UUIDs only, never path fragments or missing IDs", () => {
  const id = "ABCDEF00-0000-4000-8000-000000000001";
  assert.equal(importJobId(id), id.toLowerCase());
  for (const value of [null, "", "audit-import", "../other", "x?admin=true", "https://other.invalid/id", id + "/drafts", " " + id]) assert.equal(importJobId(value), undefined);
});

it("denial/expiry gates differ from recoverable service errors", () => {
  for (const code of [401, 403, 404, 410]) assert.equal(importAccessDenied(code), true);
  for (const code of [400, 409, 422, 500, 503]) assert.equal(importAccessDenied(code), false);
});
