import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { roomPlaybackIdentity } from "../src/features/study-room/lib/playback-selection.ts";

const live = { videoId: "jfKfPfyJRdk", version: 1, isDefault: true };
it("default live selection ignores an empty-queue version-only advance", () => {
  assert.equal(roomPlaybackIdentity(live), roomPlaybackIdentity({ ...live, version: 2 }));
});
it("an explicit finite replay/version change is a new shared selection", () => {
  assert.notEqual(roomPlaybackIdentity({ ...live, isDefault: false }), roomPlaybackIdentity({ ...live, isDefault: false, version: 2 }));
});
it("changing video or switching live/finite replaces the selection", () => {
  assert.notEqual(roomPlaybackIdentity(live), roomPlaybackIdentity({ ...live, videoId: "abcdefghijk" }));
  assert.notEqual(roomPlaybackIdentity(live), roomPlaybackIdentity({ ...live, isDefault: false }));
});
it("the local player has no room-clock offset, start position, correction or ended mutation callback", () => {
  const source = readFileSync(new URL("../src/features/study-room/components/study-music-player.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /serverOffsetMs|startedAt|seekTo|playbackCorrection|onEnded|expectedVersion|apiClient/);
  assert.doesNotMatch(source, /\bstart\s*:/);
  assert.match(source, /data === 0[\s\S]*?setStatus\("ended"\)/);
});
it("mounted Next remains owner-only and versioned; no local-ended advance remains", () => {
  const source = readFileSync(new URL("../src/features/study-room/components/study-room-session.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /endedVersion|trackEnded|onEnded=/);
  assert.match(source, /room\?\.me && !room.closed && room.ownerId === user.data\?\.id/);
  assert.match(source, /next=\{\(\) => nextTrack\(room.playback.version\)\}/);
  const bar = readFileSync(new URL("../src/features/study-room/components/room-listening-bar.tsx", import.meta.url), "utf8");
  assert.match(bar, /disabled=\{!isHost \|\| !canAct\}/);
  assert.match(source, /run\(\{ type: "next", expectedVersion: version \}\)/);
});
