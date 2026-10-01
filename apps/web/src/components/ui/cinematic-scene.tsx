import { useEffect, useRef } from "react";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { cn } from "@/lib/utils";
import { isStartupPending, trackStartupTask } from "@/app/startup-preloader";
import { CINEMATIC_VIDEO_SOURCES, getPreparedVideoSource, preloadCinematicVideo } from "./cinematic-media";
import "./cinematic-scene.css";

export function CinematicScene({ className, animated = true }: { className?: string; animated?: boolean }) {
  const theme = useResolvedTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);
  const themeRef = useRef(theme);
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    themeRef.current = theme;
    syncRef.current?.();
  }, [theme]);

  useEffect(() => {
    const root = rootRef.current;
    const day = dayRef.current;
    const night = nightRef.current;
    if (!root || !day || !night) return;

    const videos = [day, night];
    const failed = new Set<HTMLVideoElement>();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let disposed = false;
    const preparing = new Set<HTMLVideoElement>();
    const startupTasks: Array<ReturnType<typeof trackStartupTask>> = [];

    const selected = () => themeRef.current === "dark" ? night : day;
    const canPlay = (video: HTMLVideoElement) =>
      !disposed && animated && !motion.matches && inView && !document.hidden && video === selected() && !failed.has(video);

    const sourceFor = (video: HTMLVideoElement) => CINEMATIC_VIDEO_SOURCES[video === day ? "light" : "dark"];
    const prepare = (video: HTMLVideoElement) => {
      if (preparing.has(video) || failed.has(video)) return;
      preparing.add(video);
      const task = trackStartupTask();
      startupTasks.push(task);
      const poster = root.querySelector<HTMLImageElement>(`[data-scene="${video === day ? "day" : "night"}"] img`);
      void Promise.all([
        preloadCinematicVideo(sourceFor(video), (progress) => task.update(progress * 0.9)),
        poster?.decode().catch(() => undefined),
      ]).then(([source]) => {
        if (!disposed) video.src = source;
      }).catch(() => {
        // A failed download keeps the decoded poster; a slow one stays pending.
        failed.add(video);
      }).finally(() => {
        preparing.delete(video);
        task.finish();
        if (!disposed) sync();
      });
    };

    const sync = () => {
      root.dataset.playing = "false";
      for (const video of videos) {
        if (!canPlay(video)) {
          video.pause();
          // Keep the outgoing frame during a theme fade; static modes show posters.
          if (!animated || motion.matches) video.dataset.ready = "false";
          continue;
        }
        if (!video.hasAttribute("src")) {
          if (preparing.has(video) || isStartupPending()) {
            prepare(video);
            continue;
          }
          video.src = getPreparedVideoSource(sourceFor(video));
        }
        if (video.paused) {
          void video.play().catch(() => {
            // A blocked autoplay or interrupted request must never expose a black frame.
            if (!disposed && video.paused) video.dataset.ready = "false";
          });
        } else {
          root.dataset.playing = "true";
        }
      }
      root.dataset.ready = String(selected().dataset.ready === "true" && animated && !motion.matches);
    };

    const onPlaying = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      if (!canPlay(video)) {
        video.pause();
        return;
      }
      video.dataset.ready = "true";
      root.dataset.ready = "true";
      root.dataset.playing = "true";
    };
    const onError = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      failed.add(video);
      video.dataset.ready = "false";
      video.pause();
      if (video === selected()) {
        root.dataset.ready = "false";
        root.dataset.playing = "false";
      }
    };

    for (const video of videos) {
      video.addEventListener("playing", onPlaying);
      video.addEventListener("error", onError);
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(root);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    syncRef.current = sync;
    if (animated && !motion.matches && isStartupPending()) prepare(selected());
    sync();

    return () => {
      disposed = true;
      for (const task of startupTasks) task.finish();
      syncRef.current = null;
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      for (const video of videos) {
        video.pause();
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onError);
      }
    };
  }, [animated]);

  return (
    <div ref={rootRef} className={cn("cinematic-scene", className)} data-theme={theme} data-animated={animated} aria-hidden="true">
      <div className="cinematic-scene__layer" data-scene="day">
        <img src="/images/anime-day.webp" alt="" decoding="async" />
        <video ref={dayRef} loop muted playsInline preload="none" poster="/images/anime-day.webp" tabIndex={-1} disablePictureInPicture disableRemotePlayback />
      </div>
      <div className="cinematic-scene__layer" data-scene="night">
        <img src="/images/anime-night.webp" alt="" decoding="async" />
        <video ref={nightRef} loop muted playsInline preload="none" poster="/images/anime-night.webp" tabIndex={-1} disablePictureInPicture disableRemotePlayback />
      </div>
    </div>
  );
}
