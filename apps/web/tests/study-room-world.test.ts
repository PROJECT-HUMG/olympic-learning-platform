import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { deskPosition, LOCAL_MUSIC_LABELS } from "../src/features/study-room/lib/room-world-layout.ts";

it("bounds twelve presentation desks without overlapping or inventing reservations", () => {
  for (const count of [4, 6, 12]) {
    const positions = Array.from({ length: count }, (_, i) => deskPosition(i, count));
    assert.equal(new Set(positions.map(p => p.join(","))).size, count);
    assert.ok(positions.every(([x, z]) => Math.abs(x) <= 4 && z > -3 && z < 4));
  }
});
it("local music labels distinguish unloaded, playing, buffering, ended and error", () => {
  assert.match(LOCAL_MUSIC_LABELS.idle, /Mở nhạc/);
  assert.match(LOCAL_MUSIC_LABELS.playing, /thiết bị này/);
  assert.match(LOCAL_MUSIC_LABELS.ended, /thiết bị này/);
  assert.notEqual(LOCAL_MUSIC_LABELS.buffering, LOCAL_MUSIC_LABELS.playing);
});
it("world resources and automatic motion/visibility lifecycle are explicitly bounded", () => {
  const source = readFileSync(new URL("../src/features/study-room/lib/room-world.ts", import.meta.url), "utf8");
  assert.match(source, /Math\.min\(window\.devicePixelRatio \|\| 1, 1\.5\)/);
  assert.match(source, /1000 \/ 24/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /geometries\.forEach\(g => g\.dispose\(\)\)/);
  assert.match(source, /renderer\.dispose\(\); renderer\.forceContextLoss\(\)/);
});
it("music uses one persistent modal player with explicit focus return", () => {
  const session = readFileSync(new URL("../src/features/study-room/components/study-room-session.tsx", import.meta.url), "utf8");
  const dialog = readFileSync(new URL("../src/features/study-room/components/room-music-dialog.tsx", import.meta.url), "utf8");
  assert.equal((session.match(/<StudyMusicPlayer\b/g) ?? []).length, 1);
  assert.match(session, /musicVisited && <StudyMusicPlayer/);
  assert.doesNotMatch(session, /href="#room-music-heading"/);
  assert.match(dialog, /node\.showModal\(\)/);
  assert.match(dialog, /returnTarget\.focus/);
});
