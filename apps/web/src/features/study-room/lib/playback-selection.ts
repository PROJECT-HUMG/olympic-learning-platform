import type { RoomPlayback } from "../types/study-room.ts";

/** The default stream is live: an empty-queue version bump must not restart it. */
export function roomPlaybackIdentity(playback: Pick<RoomPlayback, "videoId" | "version" | "isDefault">): string {
  return playback.isDefault ? `live:${playback.videoId}` : `track:${playback.videoId}:${playback.version}`;
}
