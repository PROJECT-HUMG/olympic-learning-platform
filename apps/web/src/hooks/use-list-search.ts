import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CompositionEvent, type KeyboardEvent } from "react";
import { useLocation } from "react-router-dom";
import { useDebounce } from "./use-debounce";

/** List-only draft lifecycle. The feature owns matching, query keys and URL fields. */
export function useListSearch(source: string, commit: (value: string) => void, identity: string) {
  const echo = useRef<{ from: string; value: string; identity: string } | null>(null);
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const [state, setState] = useState({ source, identity, value: source, composing: false });
  let current = state;
  if (state.source !== source || state.identity !== identity) {
    // Echo is written only on commit, never consumed during a concurrent render.
    // Own URL acknowledgements must not overwrite newer typing. External
    // navigation/scope changes cancel the old draft before an effect can commit it.
    const ownEcho = state.identity === identity && echo.current?.identity === identity && state.source === echo.current.from && source === echo.current.value;
    current = { source, identity, value: ownEcho ? state.value : source, composing: ownEcho && state.composing };
    setState(current);
  }
  const snapshot = useMemo(() => ({ value: current.value, identity, composing: current.composing }), [current.value, identity, current.composing]);
  const settled = useDebounce(snapshot, 350);
  useEffect(() => {
    if (settled !== snapshot || snapshot.composing || snapshot.value.trim() === source.trim()) return;
    echo.current = { from: source, value: snapshot.value.trim(), identity };
    commitRef.current(echo.current.value);
  }, [settled, snapshot, source, identity]);
  const resetDraft = () => {
    setState(previous => ({ ...previous, value: "", composing: false }));
    echo.current = { from: source, value: "", identity };
  };
  const clear = () => { resetDraft(); commitRef.current(""); };
  return {
    clear,
    resetDraft,
    pending: current.value.trim() !== source.trim(),
    input: {
      value: current.value,
      onChange: (event: ChangeEvent<HTMLInputElement>) => { const value = event.target.value; setState(previous => previous.identity === identity ? ({ ...previous, value }) : previous); },
      onCompositionStart: () => setState(previous => previous.identity === identity ? ({ ...previous, composing: true }) : previous),
      onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => { const value = event.currentTarget.value; setState(previous => previous.identity === identity ? ({ ...previous, value, composing: false }) : previous); },
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        // A chooser inside an editor must never submit its enclosing save form.
        if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); }
      },
    },
  };
}

/** POP (including an identical keyword) cancels pending typing; REPLACE is its acknowledgement. */
export function useUrlListSearch(source: string, commit: (value: string) => void, scope = "") {
  const location = useLocation();
  const [popRevision, setPopRevision] = useState(0);
  useEffect(() => {
    // POP can precede a concurrent/lazy Router render, even for the same keyword.
    // Reset this mounted draft immediately rather than wait for URL acknowledgement.
    const reset = () => setPopRevision(value => value + 1);
    window.addEventListener("popstate", reset);
    return () => window.removeEventListener("popstate", reset);
  }, []);
  return useListSearch(source, value => {
    // Browser navigation can lead React while a lazy destination is mounting.
    // A leaving list must not write its captured parameters into that destination.
    if (window.location.pathname !== location.pathname || window.location.search !== location.search) return;
    commit(value);
  }, `${location.pathname}:${scope}:${popRevision}`);
}
