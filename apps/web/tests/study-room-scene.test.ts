import assert from "node:assert/strict";
import { it } from "node:test";
import { memberInitials, memberLook, reconcileSceneSeats } from "../src/features/study-room/lib/scene-seats.ts";

it("keeps desks stable when snapshots reorder or a member leaves and another joins", () => {
  const first = reconcileSceneSeats([], ["host", "a", "b"]);
  assert.deepEqual(first, ["host", "a", "b", null]);
  assert.deepEqual(reconcileSceneSeats(first, ["b", "host", "a"]), first);
  const left = reconcileSceneSeats(first, ["host", "b"]);
  assert.deepEqual(left, ["host", null, "b", null]);
  assert.deepEqual(reconcileSceneSeats(left, ["new", "b", "host"]), ["host", "new", "b", null]);
});

it("adds desks for a full room without duplicates and preserves empty desks for departure", () => {
  const ids = Array.from({ length: 50 }, (_, index) => `member-${index}`);
  const seats = reconcileSceneSeats([], [...ids, ids[0]]);
  assert.equal(seats.length, 50);
  assert.equal(new Set(seats).size, 50);
  assert.deepEqual(reconcileSceneSeats(seats, []), Array(50).fill(null));
});

it("keeps character appearance deterministic and avatar initials readable", () => {
  assert.deepEqual(memberLook("member-1"), memberLook("member-1"));
  assert.equal(memberInitials("  Nguyễn  Hoàng Long "), "HL");
  assert.equal(memberInitials("Ánh"), "Á");
  assert.equal(memberInitials(""), "?");
});
