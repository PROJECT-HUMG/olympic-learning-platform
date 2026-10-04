import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import {
  beginDailyOperation,
  dailyLeaveBlocked,
  finishDailyOperation,
  idleDailyGate,
  isDailyAccountLeave,
  noteDailyEdit,
  shouldBlockDailyLeave,
  type DailyOperationGate,
  type DailyOperationName,
} from "../lib/daily-lifecycle";

const ACCOUNT_LEAVE = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.VERIFY_EMAIL, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD];

export interface DailyEditorSession {
  gate: DailyOperationGate;
  dirty: boolean;
  conflict: boolean;
}

export function useDailyEditorSession() {
  const session = useRef<DailyEditorSession>({ gate: idleDailyGate(), dirty: false, conflict: false });
  const [snapshot, setSnapshot] = useState(session.current);
  const commit = useCallback((next: DailyEditorSession) => {
    session.current = next;
    setSnapshot(next);
  }, []);
  const edit = useCallback((apply: () => void) => {
    const gate = noteDailyEdit(session.current.gate);
    if (!gate) return false;
    commit({ ...session.current, gate, dirty: true });
    apply();
    return true;
  }, [commit]);
  const begin = useCallback((operation: DailyOperationName) => {
    const started = beginDailyOperation(session.current.gate, operation);
    if (!started) return null;
    commit({ ...session.current, gate: started.gate });
    return started.revision;
  }, [commit]);
  const finish = useCallback((operation: DailyOperationName, revision: number, outcome: "apply" | "keep", conflict?: boolean) => {
    const done = finishDailyOperation(session.current.gate, operation, revision, outcome);
    if (done.unchanged) return false;
    const dirty = done.apply ? false : session.current.dirty;
    const nextConflict = done.apply ? false : (conflict ?? session.current.conflict);
    commit({ gate: done.gate, dirty, conflict: nextConflict });
    return done.apply;
  }, [commit]);
  return {
    session,
    snapshot,
    edit,
    begin,
    finish,
    busy: snapshot.gate.operation !== "idle",
    dirty: snapshot.dirty,
    conflict: snapshot.conflict,
  };
}

export function useDailyDraftLeave(session: { readonly current: DailyEditorSession }, snapshot: DailyEditorSession) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const current = session.current;
    return shouldBlockDailyLeave({
      dirty: current.dirty,
      conflict: current.conflict,
      busy: current.gate.operation !== "idle",
      accountLeave: isDailyAccountLeave(nextLocation.pathname, ACCOUNT_LEAVE),
      currentKey: currentLocation.pathname + currentLocation.search,
      nextKey: nextLocation.pathname + nextLocation.search,
    });
  });
  useEffect(() => {
    function onUnload(event: BeforeUnloadEvent) {
      const current = session.current;
      if (!dailyLeaveBlocked({ dirty: current.dirty, conflict: current.conflict, busy: current.gate.operation !== "idle", accountLeave: false })) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [session]);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const current = session.current;
    if (dailyLeaveBlocked({
      dirty: current.dirty,
      conflict: current.conflict,
      busy: current.gate.operation !== "idle",
      accountLeave: isDailyAccountLeave(blocker.location.pathname, ACCOUNT_LEAVE),
    })) return;
    blocker.proceed();
  }, [blocker, session, snapshot]);
  return blocker;
}
