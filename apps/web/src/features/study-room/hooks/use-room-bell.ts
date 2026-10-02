import { useCallback, useEffect, useRef, useState } from "react";
import { ringRoomBell } from "../lib/room-bell";

const STORAGE_KEY = "olympic-study-room-bell-v1";

export function useRoomBell() {
  const context = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "on"; } catch { return false; }
  });
  const [ready, setReady] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => {
    if (context.current) { context.current.onstatechange = null; void context.current.close().catch(() => {}); }
  }, []);

  const play = useCallback(() => {
    if (!enabled || !context.current) return;
    if (!ringRoomBell(context.current)) setReady(false);
  }, [enabled]);

  const toggle = async () => {
    if (activating) return;
    if (enabled && ready) {
      setEnabled(false);
      try { localStorage.setItem(STORAGE_KEY, "off"); } catch { /* Preference remains in memory. */ }
      return;
    }
    setActivating(true);
    try {
      context.current ??= new AudioContext();
      context.current.onstatechange = () => setReady(context.current?.state === "running");
      await context.current.resume();
      if (context.current.state !== "running") throw new Error("Audio unavailable");
      setEnabled(true);
      setReady(true);
      setError(null);
      try { localStorage.setItem(STORAGE_KEY, "on"); } catch { /* Preference remains in memory. */ }
      ringRoomBell(context.current);
    } catch {
      setReady(false);
      setError("Chưa bật được âm thanh. Bạn có thể bấm thử lại; hiệu ứng chuyển phiên vẫn hoạt động.");
    } finally { setActivating(false); }
  };
  return { enabled, ready, activating, error, play, toggle };
}
