# Study rooms: membership, rhythm and playback

[StudyRoomController](../../apps/api/src/main/java/me/nghlong3004/olympic/studyroom/controller/StudyRoomController.java), [StudyRoomServiceImpl](../../apps/api/src/main/java/me/nghlong3004/olympic/studyroom/service/impl/StudyRoomServiceImpl.java), [timeline](../../apps/api/src/main/java/me/nghlong3004/olympic/studyroom/service/StudyRoomTimeline.java) and [request/response types](../../apps/api/src/main/java/me/nghlong3004/olympic/studyroom) own exact API/payloads. [Room session](../../apps/web/src/features/study-room/components/study-room-session.tsx) and [hooks](../../apps/web/src/features/study-room/hooks) own client lifecycle. [Named room entry](../README.md#rooms) links current routes and checks; GPA remains a separate local tool.

## Membership and accounting

- All room APIs require JWT and an active account. Snapshot preview is not Join and credits no time. Only one joined room/account; switching rooms preserves recorded time but deliberately changes membership. Open rooms have no password/private-room model, max50 leased members, max3 open rooms/owner.
- Server Clock counts only focus overlap between heartbeats at most30seconds apart, never client-reported duration or a long disconnected interval. Online grace is30seconds; membership lease is120seconds. Rejoin after expiry is deliberate. Leaving/rejoining preserves accumulated time; no auto-transfer when owner disconnects.
- Mutations lock user before room; switch/transfer locks use stable ID ordering. Transfer requires a joined owner/open room and active recipient online within30seconds, joined and below the ownership cap. Concurrent transfers cannot both succeed. Do not derive roles, attendance or completed tasks from seats/posture.
- Client polls joined snapshot/heartbeat every5seconds, lobby every15seconds; no WebSocket. Offline/reconnect/error/snapshot age over30seconds disables authoritative countdown/management and shows last server-recorded state. Refresh on tab/network return;403/409 heartbeat falls back to snapshot/rejoin/closed handling. Closure stops polling/player; browser background throttling is not compensated study time.

## Shared rhythm and queue

Creation starts the room timeline, not each Join. Current defaults25/5/15minutes; request bounds focus15–90, short break3–30, long break10–45 and at least short break; long break every fourth cycle. Joined owner changes rhythm with expectedVersion/rhythmVersion under room lock: starts FOCUS/session1 at server time, preserves recorded focus, members and music. Stale dialog/version conflicts require fresh values, not overwrite.

Request policy OPEN/AFTER_FOCUS/HOST_ONLY remains server-enforced; owner may request and is auto-approved. One outstanding queued track/account includes owner and approved entries; max50 tracks. Failed/cancelled Add retains input; only success clears it. Queue/People/controls use real snapshot identity, no invented artwork/artist/listening/chat/reorder/repeat capabilities.

**Only joined owner's explicit Next advances shared selection** through the versioned endpoint: oldest approved track or default stream. Local ENDED/seek-to-end never advances anyone else's selection. Server locks/version/active-account/member checks still gate changes; no scheduler replaces the explicit action.

## Device-local listening and scene lifecycle

The room shares selected video, not playback position. [Music player](../../apps/web/src/features/study-room/components/study-music-player.tsx) never seeks to server `startedAt`; native seek/play/pause/mute/volume are device-local. Audio mirroring is not time synchronization. Default-stream version-only updates retain its iframe; a changed finite version/video replaces it once with existing local pause/mute/volume settings. Retry is local and cannot promise position restoration. YouTube may block autoplay/embed or remove media; retain error153/retry/open-on-YouTube and origin/referrer behavior. Server parses allowed HTTPS YouTube IDs, never downloads submitted URLs; no API key is required.

[RoomMusicDialog](../../apps/web/src/features/study-room/components/room-music-dialog.tsx) initializes on deliberate first open and remains mounted through close/reopen. Header/DOM/in-scene controls operate that one player. Preserve native modal inertness/Escape/Close, parent-control Tab wrapping and exact opener focus; cross-origin YouTube controls retain native behavior. Leave/identity loss/closure/navigation/selection replacement clean old timers/callbacks/player state.

Scene seats/appearance are presentation only. [Scene owner](../../apps/web/src/features/study-room/components/study-room-scene.tsx) lazily owns rendering/disposal, frame/DPR bounds, theme updates and pause offscreen/hidden/behind dialogs/stale/no participants/reduced motion. On-demand redraw remains allowed under reduced motion. Context loss/init failure leaves usable timer/music/People fallback with retry. Software-WebGL fixtures are not physical FPS/battery/audio proof.

## Migration and verification

The [V1 baseline](../../apps/api/src/main/resources/db/migration/V1__baseline.sql) creates room/member/queue tables with timeline/rhythm version directly. Upgrade every API instance before enabling rhythm edits; mixing old createdAt timing and new timelines is unsafe after edits. Preserve applied migrations; rollback needs coordinated versions/data review, not dropped tables or rewritten SQL. Avatar/crop follows [shared identity contract](../ui/owners/identity-and-recognition.md#avatar-crop-and-storage-contract).

[StudyRoomRulesTest](../../apps/api/src/test/java/me/nghlong3004/olympic/studyroom/StudyRoomRulesTest.java), [integration](../../apps/api/src/test/java/me/nghlong3004/olympic/studyroom/StudyRoomIntegrationTest.java) and controller tests own timeline/security/locking proof. [Listening](../../apps/web/tests/study-room-listening-browser-check.mjs), [player](../../apps/web/tests/study-player-browser-check.mjs) and room lifecycle runners use synthetic API/YouTube/identity; current host/scope usage is in source and [frontend harness guidance](frontend-architecture.md#focused-verification-and-safe-harnesses). No live multiuser/YouTube/physical-device guarantee follows.
