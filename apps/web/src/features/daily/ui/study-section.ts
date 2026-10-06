/** Open the existing, mounted disclosure and move keyboard focus to its heading. */
export function openStudySection(id: string, focusId?: string) {
  const section = document.getElementById(id);
  if (!section) return;
  if (section instanceof HTMLDetailsElement) section.open = true;
  const region = (focusId ? document.getElementById(focusId) : null) ?? section;
  const target = region.querySelector<HTMLElement>("summary, button, textarea, input") ?? region;
  target.focus({ preventScroll: true });
  region.scrollIntoView({ block: focusId ? "center" : "start", behavior: "instant" });
}
