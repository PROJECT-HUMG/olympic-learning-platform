export interface PhaseStamp {
  roomId: string;
  version: number;
  phase: "FOCUS" | "BREAK" | "LONG_BREAK";
  session: number;
  endsAt: number;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
}

export interface PhaseNotice {
  id: string;
  kind: "focus-complete" | "rest-complete";
  title: string;
  description: string;
}

export interface PhaseFeedbackState {
  stamp: PhaseStamp | null;
  notifiedKey: string | null;
}

const keyOf = (stamp: PhaseStamp) => `${stamp.roomId}:${stamp.version}:${stamp.phase}:${stamp.session}:${stamp.endsAt}`;

/** One notice per boundary, including the local countdown before the next poll arrives. */
export function advancePhaseFeedback(state: PhaseFeedbackState, current: PhaseStamp, now: number, eligible: boolean) {
  const previous = state.stamp;
  const key = keyOf(current);
  let notifiedKey = state.notifiedKey;
  let notice: PhaseNotice | null = null;
  if (!eligible || !previous || previous.roomId !== current.roomId || previous.version !== current.version) {
    return { state: { stamp: current, notifiedKey: now >= current.endsAt ? key : null }, notice };
  }
  const transitioned = previous.phase !== current.phase || previous.session !== current.session;
  const completed = transitioned ? previous : current;
  const completedKey = keyOf(completed);
  const lateness = now - completed.endsAt;
  if (Number.isFinite(lateness) && lateness >= 0 && lateness <= 10_000 && notifiedKey !== completedKey) {
    const focus = completed.phase === "FOCUS";
    const restMinutes = completed.session % 4 === 0 ? completed.longBreakMinutes : completed.breakMinutes;
    notice = {
      id: completedKey,
      kind: focus ? "focus-complete" : "rest-complete",
      title: focus ? "Một phiên tập trung đã hoàn thành!" : "Sẵn sàng cho phiên học mới",
      description: focus ? `Phòng vừa đi qua một nhịp học. Nghỉ ${restMinutes} phút, thả lỏng một chút nhé.`
        : `Giờ nghỉ đã kết thúc. Cùng dành ${completed.focusMinutes} phút cho việc tiếp theo.`,
    };
    notifiedKey = completedKey;
  } else if (lateness > 10_000) notifiedKey = completedKey;
  return { state: { stamp: current, notifiedKey }, notice };
}
