import assert from "node:assert/strict";
import { it } from "node:test";
import {
  getListReturnPath,
  getPageNumber,
} from "../src/lib/list-navigation.ts";

it("uses valid one-based URL pages and rejects invalid API offsets", () => {
  assert.equal(getPageNumber("25"), 25);
  for (const value of [
    null,
    "",
    "NaN",
    "0",
    "-1",
    "1.5",
    "2junk",
    "Infinity",
    "2147483648",
    "9007199254740993",
  ]) {
    assert.equal(getPageNumber(value), 1);
  }
});

it("retains list search, page and view on return from a detail", () => {
  assert.equal(
    getListReturnPath("/documents?keyword=math&page=2&view=list", "/documents"),
    "/documents?keyword=math&page=2&view=list",
  );
  assert.equal(
    getListReturnPath(
      "/admin/questions?search=math&page=3",
      "/admin/questions",
    ),
    "/admin/questions?search=math&page=3",
  );
});

it("falls back to the owning list for direct, external and unrelated entry", () => {
  for (const from of [
    undefined,
    {},
    "https://example.com/documents",
    "//example.com/documents",
    "/documentary",
    "/documents/other",
    "/admin/users",
    "/\\example.com/documents",
  ]) {
    assert.equal(getListReturnPath(from, "/documents"), "/documents");
  }
});
