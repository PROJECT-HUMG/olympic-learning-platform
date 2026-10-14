import type { QueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";

// Startup only: later navigation keeps the compact route loader.
const tasks = new Map<symbol, number>();
const taskListeners = new Set<() => void>();

export function isStartupPending() {
  const loader = document.getElementById("startup-loader");
  return Boolean(loader && !loader.hasAttribute("data-dismissed"));
}

export function trackStartupTask() {
  const id = Symbol();
  let finished = false;
  if (isStartupPending()) {
    tasks.set(id, 0);
    taskListeners.forEach(notify => notify());
  }

  return {
    update(progress: number) {
      if (!finished && tasks.has(id)) {
        tasks.set(id, Math.max(tasks.get(id) ?? 0, Math.min(1, progress)));
        if (progress >= 1) taskListeners.forEach(notify => notify());
      }
    },
    finish() {
      finished = true;
      if (tasks.has(id)) {
        tasks.set(id, 1);
        taskListeners.forEach(notify => notify());
      }
    },
  };
}

// The initial overlay lives outside React. A run identity lets StrictMode's
// immediate effect replacement adopt it, while a real unmount releases it.
let startupRun = 0;

export function startStartupPreloader(queryClient: QueryClient) {
  const run = ++startupRun;
  const loader = document.getElementById("startup-loader");
  const root = document.getElementById("root");
  if (!loader) {
    if (root) root.inert = false;
    return;
  }

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false;
  let resolved = false;
  let queued = false;
  const context = gsap.context(() => {
    const logo = loader.querySelector(".loading-screen__logo");
    if (!motion.matches && logo) {
      gsap.fromTo(logo, { opacity: 0.72 }, { opacity: 1, duration: 0.18, clearProps: "opacity" });
    }
  }, loader);

  const releaseFocus = () => {
    if (root) root.inert = false;
    if (!loader.contains(document.activeElement)) return;
    const target = root?.querySelector<HTMLElement>("#public-main, #workspace-content, main");
    if (!target) return;
    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    if (!hadTabIndex) target.removeAttribute("tabindex");
  };
  const remove = () => {
    unsubscribe();
    taskListeners.delete(scheduleCheck);
    motion.removeEventListener("change", motionChanged);
    loader.remove();
    tasks.clear();
  };
  const dismiss = () => {
    resolved = true;
    loader.inert = true;
    loader.setAttribute("aria-hidden", "true");
    loader.setAttribute("data-dismissed", "");
    releaseFocus();
    // Animation is visual only: content is already interactive, not gated by
    // a 100% hold, a curtain, or this tween's completion callback.
    if (motion.matches) remove();
    else context.add(() => {
      gsap.to(loader, { opacity: 0, duration: 0.18, ease: "power1.out", onComplete: remove });
    });
  };
  const check = () => {
    if (disposed || resolved) return;
    const queries = queryClient.getQueryCache().getAll();
    const failed = queries.some(query => query.state.status === "error");
    const queriesReady = !queries.some(query => query.state.status === "pending" && query.state.fetchStatus !== "idle");
    const assetsReady = [...tasks.values()].every(value => value === 1);
    // Reveal the existing route/feature error instead of masking it behind
    // unrelated fonts/assets or another outstanding initial query.
    if (failed || (assetsReady && queriesReady && document.fonts.status === "loaded")) dismiss();
  };
  function scheduleCheck() {
    if (disposed || resolved || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      check();
    });
  }
  function motionChanged() {
    if (!motion.matches) return;
    context.revert();
    if (resolved) remove();
  }
  const unsubscribe = queryClient.getQueryCache().subscribe(scheduleCheck);
  taskListeners.add(scheduleCheck);
  motion.addEventListener("change", motionChanged);
  void document.fonts.ready.then(scheduleCheck);
  scheduleCheck();

  return () => {
    disposed = true;
    unsubscribe();
    taskListeners.delete(scheduleCheck);
    motion.removeEventListener("change", motionChanged);
    context.revert();
    // React's StrictMode setup follows cleanup synchronously. Only the final
    // owner removes the overlay; an abandoned owner can never hide the root.
    queueMicrotask(() => {
      if (run !== startupRun) return;
      releaseFocus();
      loader.remove();
      tasks.clear();
    });
  };
}
