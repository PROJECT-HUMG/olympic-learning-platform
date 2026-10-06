import { useCallback, useEffect, useRef, useState } from "react";
import { dailyErrorMessage, isDailyConflict } from "../lib/daily-contract";
import type { SaveReady } from "../lib/plan-editor";
import type { useDailyEditorSession } from "./use-daily-editor";

export const DAILY_SYNC_DELAY = 800;
export interface DailySyncIssue {
  kind: "validation" | "error" | "conflict";
  message: string;
  revision: number;
}

/** One debounced versioned batch at a time. Unknown outcomes require an explicit retry. */
export function useDailyAutoSync<Editor, Body, Saved>(options: {
  draft: ReturnType<typeof useDailyEditorSession>;
  ready: boolean;
  paused?: boolean;
  read: () => Editor;
  write: (editor: Editor) => void;
  validate: (editor: Editor) => SaveReady<Body>;
  persist: (body: Body) => Promise<Saved>;
  replace: (saved: Saved) => Editor;
  rebase: (current: Editor, saved: Saved) => Editor;
}) {
  const latest = useRef(options);
  latest.current = options;
  const mounted = useRef(false);
  const [issue, setIssue] = useState<DailySyncIssue | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const reset = useCallback(() => { setIssue(null); }, []);
  const retry = useCallback(() => { setIssue(null); setAttempt(current => current + 1); }, []);
  const sync = useCallback(async () => {
    const o = latest.current;
    const current = o.draft.session.current;
    if (!o.ready || o.paused || !current.dirty || current.conflict || current.gate.operation !== "idle") return;
    const body = o.validate(o.read());
    if (!body.ok) {
      setIssue({ kind: "validation", message: body.message, revision: current.gate.revision });
      return;
    }
    const revision = o.draft.begin("autosync");
    if (revision === null) return;
    setIssue(null);
    try {
      const saved = await o.persist(body.body);
      if (!mounted.current) return;
      // Rebase before releasing the gate. A subsequent batch sees the new version.
      const next = o.draft.session.current.gate.revision === revision
        ? o.replace(saved) : o.rebase(o.read(), saved);
      o.write(next);
      o.draft.finish("autosync", revision, "apply");
    } catch (error) {
      if (!mounted.current) return;
      const conflict = isDailyConflict(error);
      setIssue({ kind: conflict ? "conflict" : "error", message: dailyErrorMessage(error), revision });
      o.draft.finish("autosync", revision, "keep", conflict ? true : undefined);
    }
  }, []);
  const { ready, paused, draft } = options;
  const revision = draft.snapshot.gate.revision;
  const blockedIssue = issue && (issue.kind !== "validation" || issue.revision === revision);
  useEffect(() => {
    if (!ready || paused || !draft.dirty || draft.busy || draft.conflict || blockedIssue) return;
    const timer = window.setTimeout(() => { void sync(); }, DAILY_SYNC_DELAY);
    return () => window.clearTimeout(timer);
  }, [ready, paused, draft.dirty, draft.busy, draft.conflict, revision, blockedIssue, attempt, sync]);
  return { issue: blockedIssue ? issue : null, retry, reset, syncing: draft.snapshot.gate.operation === "autosync" };
}
