import { useEffect, useRef, useState } from "react";
import { advancePhaseFeedback, type PhaseFeedbackState, type PhaseNotice } from "../lib/phase-feedback";
import type { StudyRoomSnapshot } from "../types/study-room";

export function usePhaseFeedback({ room, now, synchronized, joined, serverOffsetMs, onBell }: {
  room?: StudyRoomSnapshot;
  now: number;
  synchronized: boolean;
  joined: boolean;
  serverOffsetMs: number;
  onBell: () => void;
}) {
  const machine = useRef<PhaseFeedbackState>({ stamp: null, notifiedKey: null });
  const [notice, setNotice] = useState<PhaseNotice | null>(null);
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");
  useEffect(() => {
    const onVisibility = () => {
      machine.current = { stamp: null, notifiedKey: null };
      setVisible(document.visibilityState === "visible");
      setNotice(null);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    if (!room) { machine.current = { stamp: null, notifiedKey: null }; return; }
    const next = advancePhaseFeedback(machine.current, {
      roomId: room.id, version: room.rhythmVersion ?? 0, phase: room.phase, session: room.sessionNumber,
      endsAt: Date.parse(room.phaseEndsAt), focusMinutes: room.focusMinutes, breakMinutes: room.breakMinutes,
      longBreakMinutes: room.longBreakMinutes,
    }, now + serverOffsetMs, synchronized && joined && visible && !room.closed);
    machine.current = next.state;
    if (next.notice) { setNotice(next.notice); onBell(); }
    if (!synchronized || !joined || room.closed) setNotice(null);
  }, [room, now, serverOffsetMs, synchronized, joined, visible, onBell]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return { notice, dismiss: () => setNotice(null) };
}
