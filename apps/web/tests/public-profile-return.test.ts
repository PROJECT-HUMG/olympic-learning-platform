import assert from "node:assert/strict";
import { it } from "node:test";
import { publicProfileReturnTarget } from "../src/features/user/lib/public-identity.ts";

it("returns to actual recognition/content entry points with filters and fragments intact", () => {
  for (const [from, label] of [
    ["/honors?year=2025&subject=To%C3%A1n&page=2", "Về vinh danh"],
    ["/honors/album-1#members", "Về album vinh danh"],
    ["/rankings?year=2024&page=3", "Về xếp hạng"],
    ["/documents/a-material?view=list", "Về tài liệu"],
    ["/news/an-article#context", "Về bảng tin"],
    ["/profile/achievements", "Về thành tích của tôi"],
  ]) assert.deepEqual(publicProfileReturnTarget(from), { to: from, label });
});

it("never returns to external, privileged, malformed or unrelated destinations", () => {
  const fallback = { to: "/rankings", label: "Xếp hạng thành tích" };
  for (const from of [undefined, null, 4, {}, "https://evil.invalid/honors", "//evil.invalid/honors", "/admin/recognition", "/login", "/news/../../admin/users", "/users/another-user", "javascript:alert(1)"])
    assert.deepEqual(publicProfileReturnTarget(from), fallback);
});
