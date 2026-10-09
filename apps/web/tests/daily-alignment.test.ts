// Source contracts supplement the mounted, route-sequence browser evidence.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

it("Home owns its notebook root without styling the Daily root", () => {
  const css = source("features/home/components/home-hero-section.css");
  assert.match(css, /\.home-study-notebook \{/);
  assert.doesNotMatch(css, /\.study-notebook(?=[\s{.:])/);
  assert.match(source("features/home/components/home-study-notebook.tsx"), /className="home-study-notebook"/);
});

it("Daily uses aligned flat work regions, not compensating root padding", () => {
  const css = source("features/daily/ui/study-notebook.css");
  assert.match(css, /\.study-notebook \.study-work-surface \{[^}]*padding: 0;/);
  assert.doesNotMatch(css, /\.page-shell\.study-notebook \{[^}]*padding/);
  assert.doesNotMatch(css, /\.study-(?:reflection|review)-rail \{[^}]*padding/);
  assert.match(source("features/daily/components/daily-plan-editor.tsx"), /form.tasks.length > 0 \? <div className="study-progress-grid/);
});

it("Daily identity is primary once while navigation names and unrelated shell context remain", () => {
  const nav = source("features/daily/ui/study-notebook.tsx");
  assert.match(nav, /aria-label="Daily của tôi"/);
  assert.match(nav, /aria-label="Nhóm Daily"/);
  const shell = source("layouts/dashboard-layout.tsx");
  assert.match(shell, /location.pathname === ROUTES.DAILY \|\| location.pathname.startsWith\(`\$\{ROUTES.DAILY\}\/`\)/);
  assert.match(shell, /dailyArea \? "Góc học tập" : active\?\.label/);
});

it("invitation states are direct and retain explicit response/consent contracts", () => {
  const list = source("features/daily/groups/group-controls.tsx").split("export function Retry")[0];
  assert.doesNotMatch(list, /<StudyDisclosure|group-invite-bar/);
  for (const state of ["invites.isFetching", "invites.isError", "pendingCount > 0", "Chưa có lời mời đang chờ."]) assert.ok(list.includes(state));
  assert.match(list, /groupService.respond\(inv.id, "accept", signal\)/);
  assert.match(list, /groupService.respond\(inv.id, "decline", signal\)/);
  assert.match(list, /không bật chia sẻ/);
});

it("owner tasks use a unified header and associated evidence ribbon, not a reserved right column", () => {
  const css = source("features/daily/ui/study-notebook.css");
  assert.doesNotMatch(css, /minmax\(240px, 38%\)/);
  assert.match(css, /\.daily-task-heading \{/);
  assert.match(source("components/ui/evidence-gallery.css"), /\.evidence-previews \{ display: flex; flex-wrap: wrap/);
  assert.match(source("features/daily/evidence/evidence-panel.tsx"), /taskHeader/);
});
