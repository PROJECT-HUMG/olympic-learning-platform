import type { QueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";

// Startup only: later navigation keeps the compact route loader.
const tasks = new Map<symbol, number>();

export function isStartupPending() {
  const loader = document.getElementById("startup-loader");
  return Boolean(loader && !loader.hasAttribute("data-dismissed"));
}

export function trackStartupTask() {
  const id = Symbol();
  let finished = false;
  if (isStartupPending()) tasks.set(id, 0);

  return {
    update(progress: number) {
      if (!finished && tasks.has(id)) {
        tasks.set(id, Math.max(tasks.get(id) ?? 0, Math.min(1, progress)));
      }
    },
    finish() {
      finished = true;
      if (tasks.has(id)) tasks.set(id, 1);
    },
  };
}

export function startStartupPreloader(queryClient: QueryClient) {
  const loader = document.getElementById("startup-loader");
  const root = document.getElementById("root");
  if (!loader) {
    if (root) root.inert = false;
    return;
  }

  const startedAt = Number(loader.dataset.startedAt) || performance.now();
  const bar = loader.querySelector<HTMLElement>("[role=progressbar]");
  const percent = loader.querySelector<HTMLElement>(".loading-screen__percent");
  const message = loader.querySelector<HTMLElement>(".loading-screen__message");
  let displayed = 0;
  let revealTimer: number | undefined;
  let exit: gsap.core.Timeline | undefined;

  const display = (value: number) => {
    if (value === displayed) return;
    displayed = value;
    loader.style.setProperty("--startup-progress", String(value));
    bar?.setAttribute("aria-valuenow", String(value));
    if (percent) percent.textContent = `${value}%`;
  };

  const interval = window.setInterval(() => {
    const elapsed = performance.now() - startedAt;
    const values = [...tasks.values()];
    const assetsReady = values.every((value) => value === 1);
    const initialQueriesReady = !queryClient.getQueryCache().getAll().some(
      (query) => query.state.status === "pending" && query.state.fetchStatus !== "idle",
    );
    const fontsReady = document.fonts.status === "loaded";
    const assetProgress = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 1;

    // Percentage describes preparation stages, including streamed video bytes.
    // Never report completion while a critical task or the minimum time is pending.
    display(Math.max(displayed, Math.min(95, Math.floor(
      20 + assetProgress * 55 + Math.min(elapsed / 1500, 1) * 15 + (initialQueriesReady && fontsReady ? 5 : 0),
    ))));

    if (elapsed < 1500 || !assetsReady || !initialQueriesReady || !fontsReady) return;
    window.clearInterval(interval);
    display(100);
    if (message) message.textContent = "Sẵn sàng. Vào học thôi!";

    // Let 100% be visible before revealing the page, including reduced motion.
    revealTimer = window.setTimeout(() => {
      loader.inert = true;
      loader.setAttribute("aria-hidden", "true");
      loader.setAttribute("data-dismissed", "");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      exit = gsap.timeline({
        onComplete: () => {
          loader.remove();
          if (root) root.inert = false;
          tasks.clear();
        },
      });
      if (reducedMotion) {
        exit.to(loader, { opacity: 0, duration: 0.12, ease: "none" });
      } else {
        exit.to(loader.querySelector(".loading-screen__content"), {
          opacity: 0, y: -14, duration: 0.24, ease: "power2.in",
        }).to(loader.querySelector(".loading-screen__curtain--left"), {
          xPercent: -101, duration: 0.85, ease: "power3.inOut",
        }, 0.14).to(loader.querySelector(".loading-screen__curtain--right"), {
          xPercent: 101, duration: 0.85, ease: "power3.inOut",
        }, 0.14);
      }
    }, 250);
  }, 50);

  return () => {
    window.clearInterval(interval);
    window.clearTimeout(revealTimer);
    exit?.kill();
    tasks.clear();
  };
}
