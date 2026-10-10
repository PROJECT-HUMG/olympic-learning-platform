import assert from "node:assert/strict";
import { it } from "node:test";
import { identityInitials, publicProfilePath } from "../src/features/user/lib/public-identity.ts";
import { presentRankingList } from "../src/features/recognition/ranking-presentation-model.ts";

it("initials handle multiword Vietnamese names, one name and missing identity", () => {
  assert.equal(identityInitials("  Nguyễn   Hoàng An  "), "NA");
  assert.equal(identityInitials("Bình"), "B");
  assert.equal(identityInitials(null), "?");
  assert.equal(identityInitials(""), "?");
});
it("profile links and ranking destinations use one owner with encoded IDs", () => {
  assert.equal(publicProfilePath("a/b"), "/users/a%2Fb");
  assert.equal(presentRankingList([{ userId: "a/b", rank: 1, fullName: "An", totalPoints: 16, approvedCount: 1 }], undefined, "/rankings?page=2").rows[0].href, publicProfilePath("a/b"));
});
