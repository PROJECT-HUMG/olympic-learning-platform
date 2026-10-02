import assert from "node:assert/strict";
import { it } from "node:test";
import { getPostDeadline } from "../src/features/post/lib/post-deadline.ts";
import { getListReturnPath } from "../src/lib/list-navigation.ts";

it("keeps news filters, page and anchor but rejects unrelated return destinations", () => {
  const from = "/news?q=olympic&type=ANNOUNCEMENT&page=3#board";
  assert.equal(getListReturnPath(from, "/news"), from);
  for (const path of ["https://example.com/news", "/news/other", "/documents", null]) {
    assert.equal(getListReturnPath(path, "/news"), "/news");
  }
});

it("marks any past deadline expired and distinguishes imminent and future notices", () => {
  const now = Date.parse("2026-10-02T00:00:00Z");
  assert.equal(getPostDeadline("2026-09-01T00:00:00Z", now), "expired");
  assert.equal(getPostDeadline("2026-10-02T00:00:00Z", now), "expired");
  assert.equal(getPostDeadline("2026-10-05T00:00:00Z", now), "urgent");
  assert.equal(getPostDeadline("2026-10-06T00:00:00Z", now), "future");
  assert.equal(getPostDeadline("invalid", now), null);
  assert.equal(getPostDeadline(null, now), null);
});
