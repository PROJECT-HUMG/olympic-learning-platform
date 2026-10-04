export type DailyOperationName = "save" | "submit" | "reload" | "retry";

export interface DailyOperationGate {
  operation: "idle" | DailyOperationName;
  revision: number;
}

export function idleDailyGate(): DailyOperationGate {
  return { operation: "idle", revision: 0 };
}

export function operationBusy(gate: DailyOperationGate): boolean {
  return gate.operation !== "idle";
}

/** Starts one operation. A second call while one is open is rejected. */
export function beginDailyOperation(gate: DailyOperationGate, operation: DailyOperationName): { gate: DailyOperationGate; revision: number } | null {
  if (gate.operation !== "idle") return null;
  return { gate: { operation, revision: gate.revision }, revision: gate.revision };
}

/** Records a local edit. Edits during an operation are rejected and do not move the revision. */
export function noteDailyEdit(gate: DailyOperationGate): DailyOperationGate | null {
  if (gate.operation !== "idle") return null;
  return { operation: "idle", revision: gate.revision + 1 };
}

/**
 * Completes the operation that is still current.
 * A server snapshot is applied only when the revision is still the one captured at the start.
 */
export function finishDailyOperation(
  gate: DailyOperationGate,
  operation: DailyOperationName,
  revision: number,
  outcome: "apply" | "keep",
): { gate: DailyOperationGate; apply: boolean; unchanged: boolean } {
  if (gate.operation !== operation) return { gate, apply: false, unchanged: true };
  const apply = outcome === "apply" && gate.revision === revision;
  return { gate: { operation: "idle", revision: gate.revision }, apply, unchanged: false };
}

/** Explicit reload replaces the draft. A background retry replaces it only while the draft is still clean. */
export function shouldApplyCompletedFetch(input: { replace: boolean; dirty: boolean; conflict: boolean }): boolean {
  if (input.replace) return true;
  return !input.dirty && !input.conflict;
}

export function shouldBlockDailyLeave(input: {
  dirty: boolean;
  conflict: boolean;
  busy: boolean;
  accountLeave: boolean;
  currentKey: string;
  nextKey: string;
}): boolean {
  if (input.currentKey === input.nextKey) return false;
  return dailyLeaveBlocked(input);
}

export function dailyLeaveBlocked(input: { dirty: boolean; conflict: boolean; busy: boolean; accountLeave: boolean }): boolean {
  if (input.accountLeave) return false;
  return input.dirty || input.conflict || input.busy;
}

/** Auth exits stay unblocked so logout and session expiry can leave. */
export function isDailyAccountLeave(pathname: string, paths: readonly string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function resolveDailyAccountMount(input: {
  pending: boolean;
  error: boolean;
  activeUserId: string | null;
}): { phase: "editor"; userId: string; accountWarning: boolean } | { phase: "loading" | "error" | "inactive"; userId: null; accountWarning: false } {
  if (input.activeUserId) return { phase: "editor", userId: input.activeUserId, accountWarning: input.error };
  if (input.pending) return { phase: "loading", userId: null, accountWarning: false };
  if (input.error) return { phase: "error", userId: null, accountWarning: false };
  return { phase: "inactive", userId: null, accountWarning: false };
}

/** A ready draft stays mounted when a later fetch fails. The first failure has no draft yet. */
export function dailyDraftFailure(input: { ready: boolean; error: boolean }): "inline" | "initial" | "form" | "loading" {
  if (input.ready && input.error) return "inline";
  if (input.ready) return "form";
  if (input.error) return "initial";
  return "loading";
}
