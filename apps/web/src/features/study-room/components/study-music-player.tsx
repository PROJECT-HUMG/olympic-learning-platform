import { useEffect, useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { ExternalLink, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { roomPlaybackIdentity } from "../lib/playback-selection";
import type { LocalMusicStatus } from "../lib/room-world-layout";
import "./study-music-player.css";

type Playback = {
  videoId: string;
  title: string;
  version: number;
  isDefault: boolean;
};

type YouTubePlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getIframe: () => HTMLIFrameElement;
};

type PlayerEvent = { target: YouTubePlayer; data: number };
type YouTubeApi = {
  Player: new (element: HTMLElement, options: {
    width: string;
    height: string;
    videoId: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady: (event: { target: YouTubePlayer }) => void;
      onStateChange: (event: PlayerEvent) => void;
      onError: (event: PlayerEvent) => void;
      onAutoplayBlocked: () => void;
    };
  }) => YouTubePlayer;
};

type YouTubeWindow = Window & {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};

let apiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  const apiWindow = window as YouTubeWindow;
  if (apiWindow.YT?.Player) return Promise.resolve(apiWindow.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previousCallback = apiWindow.onYouTubeIframeAPIReady;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.onerror = null;
      if (apiWindow.onYouTubeIframeAPIReady === onReady) {
        apiWindow.onYouTubeIframeAPIReady = previousCallback;
      }
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      script.remove();
      apiPromise = null;
      reject(new Error("Chưa kết nối được với YouTube. Bạn có thể thử lại."));
    };
    const onReady = () => {
      try {
        previousCallback?.();
      } finally {
        if (!settled && apiWindow.YT?.Player) {
          settled = true;
          cleanup();
          resolve(apiWindow.YT);
        } else if (!settled) {
          fail();
        }
      }
    };
    const timeout = window.setTimeout(fail, 15_000);
    apiWindow.onYouTubeIframeAPIReady = onReady;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return apiPromise;
}

type PlayerStatus = Exclude<LocalMusicStatus, "idle">;
export interface LocalPlayerState { status: PlayerStatus; ready: boolean; muted: boolean; volume: number }
export interface LocalPlayerControls { togglePlayback: () => void; toggleMute: () => void; setVolume: (value: number) => void }

export function StudyMusicPlayer({ playback, onStatusChange, onLocalStateChange, controlsRef }: {
  playback: Playback;
  onStatusChange?: (status: PlayerStatus) => void;
  onLocalStateChange?: (state: LocalPlayerState) => void;
  controlsRef?: Ref<LocalPlayerControls>;
}) {
  const volumeId = useId();
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const latestRef = useRef({ playback });
  const identity = roomPlaybackIdentity(playback);
  const preferencesRef = useRef({ wantsPlay: true, muted: false, volume: 40 });
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(40);

  useEffect(() => { onStatusChange?.(status); }, [status, onStatusChange]);
  useEffect(() => { onLocalStateChange?.({ status, ready, muted, volume }); }, [status, ready, muted, volume, onLocalStateChange]);

  useEffect(() => {
    latestRef.current = { playback };
    if (playerRef.current) playerRef.current.getIframe().title = `YouTube: ${playback.title}`;
  }, [playback]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const preferences = preferencesRef.current;
    let disposed = false;
    let failed = false;
    let player: YouTubePlayer | null = null;
    let interval: number | undefined;
    let readyTimeout: number | undefined;
    const isCurrent = () => !disposed && !failed
      && roomPlaybackIdentity(latestRef.current.playback) === identity;
    const fail = (message: string) => {
      if (!isCurrent()) return;
      failed = true;
      setError(message);
      setStatus("error");
      setReady(false);
      window.clearTimeout(readyTimeout);
      window.clearInterval(interval);
      playerRef.current = null;
      player?.destroy();
      player = null;
      mount.replaceChildren();
    };

    setReady(false);
    setError("");
    setStatus("loading");

    void loadYouTubeApi().then((api) => {
      if (!isCurrent()) return;
      const slot = document.createElement("div");
      mount.replaceChildren(slot);
      const current = latestRef.current;
      readyTimeout = window.setTimeout(() => fail("YouTube đang mất nhiều thời gian phản hồi. Hãy thử tải lại trình phát."), 15_000);
      player = new api.Player(slot, {
        width: "100%",
        height: "100%",
        videoId: current.playback.videoId,
        playerVars: {
          autoplay: preferencesRef.current.wantsPlay ? 1 : 0,
          controls: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: ({ target }) => {
            if (!isCurrent()) return;
            window.clearTimeout(readyTimeout);
            playerRef.current = target;
            target.getIframe().title = `YouTube: ${latestRef.current.playback.title}`;
            target.setVolume(preferencesRef.current.volume);
            if (preferencesRef.current.muted) target.mute();
            else target.unMute();
            setReady(true);
            setStatus("ready");
            if (preferencesRef.current.wantsPlay) target.playVideo();
            else target.pauseVideo();

            interval = window.setInterval(() => {
              if (!isCurrent()) return;
              // Only mirror native audio controls. Position always belongs to this device.
              preferencesRef.current.volume = target.getVolume();
              preferencesRef.current.muted = target.isMuted();
              setVolume(preferencesRef.current.volume);
              setMuted(preferencesRef.current.muted);
            }, 3000);
          },
          onStateChange: ({ data }) => {
            if (!isCurrent()) return;
            if (data === 1) {
              preferencesRef.current.wantsPlay = true;
              setStatus("playing");
            } else if (data === 2) {
              preferencesRef.current.wantsPlay = false;
              setStatus("paused");
            } else if (data === 3) {
              setStatus("buffering");
            } else if (data === 0) {
              setStatus("ended");
            }
          },
          onAutoplayBlocked: () => {
            if (isCurrent()) setStatus("blocked");
          },
          onError: ({ data }) => fail(data === 153
            ? "YouTube chưa xác thực được trình phát này. Thử tải lại trang hoặc mở video trên YouTube."
            : data === 100 || data === 101 || data === 150
            ? "Video này không còn khả dụng hoặc không cho phát trong phòng. Bạn vẫn có thể mở trên YouTube."
            : "Chưa phát được video từ YouTube. Bạn có thể thử lại hoặc mở trên YouTube."),
        },
      });
    }).catch((reason: unknown) => {
      fail(reason instanceof Error ? reason.message : "Chưa tải được YouTube. Hãy thử lại.");
    });

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.clearTimeout(readyTimeout);
      if (player && playerRef.current === player) {
        preferences.volume = player.getVolume();
        preferences.muted = player.isMuted();
      }
      playerRef.current = null;
      player?.destroy();
      mount.replaceChildren();
    };
  }, [identity, retry]);

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (status === "playing" || status === "buffering") {
      preferencesRef.current.wantsPlay = false;
      player.pauseVideo();
    } else {
      preferencesRef.current.wantsPlay = true;
      player.playVideo();
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player || !ready) return;
    const shouldMute = !muted && volume > 0;
    preferencesRef.current.muted = shouldMute;
    setMuted(shouldMute);
    if (shouldMute) player.mute();
    else {
      if (volume === 0) {
        preferencesRef.current.volume = 40;
        setVolume(40);
        player.setVolume(40);
      }
      player.unMute();
    }
  };

  const setLocalVolume = (value: number) => {
    if (!playerRef.current || !ready) return;
    const nextVolume = Math.min(100, Math.max(0, value));
    preferencesRef.current.volume = nextVolume;
    preferencesRef.current.muted = false;
    setVolume(nextVolume); setMuted(false);
    playerRef.current.setVolume(nextVolume); playerRef.current.unMute();
  };
  // Multiple DOM control surfaces, exactly one player and one local audio state.
  useImperativeHandle(controlsRef, () => ({ togglePlayback, toggleMute, setVolume: setLocalVolume }));

  const isPlaying = status === "playing" || status === "buffering";
  const statusText = status === "loading" ? "Đang kết nối YouTube…"
    : status === "playing" ? "Đang phát bài phòng chọn trên thiết bị này."
    : status === "buffering" ? "Đang tải nhạc…"
    : status === "paused" ? "Bạn đã tạm dừng trên thiết bị này."
    : status === "ended" ? "Bài nhạc đã kết thúc trên thiết bị này. Bấm “Bật nhạc” để nghe lại."
    : "Bấm “Bật nhạc” nếu trình duyệt chưa cho phép tự phát.";

  return (
    <section className="study-music-player" aria-label="Nhạc trong phòng học">
      <div>
        <h3 className="study-music-player__title">{playback.title}</h3>
      </div>
      <div ref={mountRef} className="study-music-player__frame" hidden={status === "error"} />
      <div className="study-music-player__feedback">
        <p className="study-music-player__status" role={status === "error" ? "alert" : "status"}>
          {status === "error" ? error : statusText}
        </p>
        <div className="study-music-player__controls">
          {status === "error" ? (
            <Button type="button" variant="outline" onClick={() => setRetry((attempt) => attempt + 1)}>
              <RotateCcw aria-hidden="true" /> Thử lại
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={togglePlayback} disabled={!ready}>
              {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {isPlaying ? "Tạm dừng" : "Bật nhạc"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={toggleMute} disabled={!ready} aria-label={muted || volume === 0 ? "Bật âm thanh" : "Tắt âm thanh"} aria-pressed={muted || volume === 0}>
            {muted || volume === 0 ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
            {muted || volume === 0 ? "Bật tiếng" : "Tắt tiếng"}
          </Button>
          <a className="study-music-player__external" href={`https://www.youtube.com/watch?v=${encodeURIComponent(playback.videoId)}`} target="_blank" rel="noopener noreferrer">
            YouTube <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only"> (mở trong tab mới)</span>
          </a>
        </div>
      </div>
      <div className="study-music-player__volume">
        <label htmlFor={volumeId}>Âm lượng</label>
        <input id={volumeId} type="range" min="0" max="100" step="1" value={volume} disabled={!ready} aria-valuetext={`${volume}%`} onChange={(event) => setLocalVolume(Number(event.target.value))} />
        <output htmlFor={volumeId}>{volume}%</output>
      </div>
      <p className="study-music-player__hint">Phòng chọn bài chung. Phát, tạm dừng, tua và âm lượng chỉ áp dụng cho bạn.</p>
    </section>
  );
}
