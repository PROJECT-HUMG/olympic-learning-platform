import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { getNavigationGroups, getDrawerNavigationGroups, getWorkspaceNavigationGroups, getWorkspaceShortcuts, getActiveNavigationItem } from "../src/layouts/navigation.ts";

it("shell regrouping preserves every existing destination exactly once", () => {
  for (const role of [undefined, "STUDENT", "LECTURER", "ADMIN"]) {
    const original = getNavigationGroups(role).flatMap(g => g.items).map(i => i.href).sort();
    const regrouped = getDrawerNavigationGroups(role).flatMap(g => g.items).map(i => i.href).sort();
    assert.deepEqual(regrouped, original);
    assert.equal(new Set(regrouped).size, regrouped.length);
  }
});

it("workspace prioritizes staff work without leaking staff or admin destinations", () => {
  for (const role of [undefined, "STUDENT", "LECTURER", "ADMIN"]) {
    const groups = getWorkspaceNavigationGroups(role);
    const items = groups.flatMap(g => g.items);
    assert.equal(items.some(i => i.href.startsWith('/admin/')), role === 'ADMIN');
    assert.equal(items.some(i => i.href.startsWith('/lecturer/')), role === 'LECTURER');
    assert.equal(groups.some(g => ['Học tập', 'Thông tin'].includes(g.label)), false);
    if (role === 'ADMIN' || role === 'LECTURER') assert.equal(groups[1].label, 'Quản lý nội dung');
    if (role) assert.ok(items.some(i => i.href === '/profile'));
    assert.ok(items.every(i => !i.href.startsWith('/daily')));
  }
});

it("tablet shortcuts are labelled, omit retired Daily destinations, and are role aware", () => {
  for (const role of ['STUDENT', 'LECTURER', 'ADMIN']) {
    const shortcuts = getWorkspaceShortcuts(role);
    assert.ok(shortcuts.every(i => i.shortLabel && i.label));
    assert.ok(shortcuts.every(i => !i.href.startsWith('/daily')));
    assert.equal(shortcuts.length, role === 'STUDENT' ? 1 : 3);
    assert.equal(shortcuts.some(i => i.href.endsWith('/questions')), role !== 'STUDENT');
    if (role !== 'STUDENT') {
      assert.equal(shortcuts[1].href, `/${role.toLowerCase()}/documents`);
      assert.equal(shortcuts[2].href, `/${role.toLowerCase()}/questions`);
    }
  }
});

it("active matching chooses the deepest route and respects toolkit query selection", () => {
  const items = getDrawerNavigationGroups('ADMIN').flatMap(g => g.items);
  for (const [path, expected] of [['/profile/achievements', '/profile'], ['/admin/questions/import', '/admin/questions/import'], ['/admin/questions/example', '/admin/questions']]) {
    assert.equal(getActiveNavigationItem(items, path)?.href, expected);
  }
  assert.equal(getActiveNavigationItem(items, '/toolkit', '?tool=gpa')?.href, '/toolkit?tool=gpa');
  assert.equal(getActiveNavigationItem(items, '/toolkit')?.href, '/toolkit?tool=rooms');
  assert.equal(getActiveNavigationItem(items, '/study-rooms/example')?.href, '/toolkit?tool=rooms');
});

it("retired Daily routes are absent and existing not-found fallback remains", () => {
  const routes = readFileSync(new URL('../src/router/routes.tsx', import.meta.url), 'utf8');
  const constants = readFileSync(new URL('../src/router/route-constants.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(routes, /Daily|daily|ROUTES\.DAILY/);
  assert.doesNotMatch(constants, /DAILY|\/daily/);
  assert.match(routes, /path: "\*"/);
  for (const role of [undefined, 'STUDENT', 'LECTURER', 'ADMIN']) {
    const items = getDrawerNavigationGroups(role).flatMap(group => group.items);
    for (const path of ['/daily', '/daily/week', '/daily/groups', '/daily/groups/example/reviews/person']) {
      assert.equal(getActiveNavigationItem(items, path), undefined);
    }
  }
});

it("visible motion UI is removed, not OS accessibility or theme settings", () => {
  const source = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
  assert.doesNotMatch(source('layouts/components/public-header.tsx'), /HomeMotionToggle/);
  assert.doesNotMatch(source('layouts/components/public-display-settings.tsx'), /useHomeMotion|Nền động/);
  assert.match(source('layouts/components/public-display-settings.tsx'), /setTheme/);
  assert.match(source('features/home/hooks/use-home-motion.ts'), /prefers-reduced-motion: reduce/);
  assert.match(source('layouts/navigation.css'), /prefers-reduced-motion: reduce/);
  assert.equal(existsSync(new URL('../src/features/home/components/home-motion-toggle.tsx', import.meta.url)), false);
  assert.equal(existsSync(new URL('../src/stores/use-home-motion-store.ts', import.meta.url)), false);
});

it("exam entries reach existing role lists and contributor permission adds only own documents", () => {
  for (const role of [undefined, "STUDENT", "LECTURER", "ADMIN"]) {
    const groups = getNavigationGroups(role, ["DOCUMENT_UPLOAD"]);
    const links = groups.flatMap(group => group.items).map(item => item.href);
    assert.equal(links.includes("/exams"), role === "STUDENT");
    assert.equal(links.includes("/admin/exams"), role === "ADMIN");
    assert.equal(links.includes("/lecturer/exams"), role === "LECTURER");
    assert.equal(links.includes("/my-documents"), role === "STUDENT");
    assert.equal(new Set(links).size, links.length);
    const drawer = getDrawerNavigationGroups(role, ["DOCUMENT_UPLOAD"]).flatMap(group => group.items).map(item => item.href);
    assert.deepEqual(drawer.sort(), [...links].sort());
  }
  assert.equal(getNavigationGroups("STUDENT").flatMap(group => group.items).some(item => item.href === "/my-documents"), false);
  assert.equal(getActiveNavigationItem(getDrawerNavigationGroups("ADMIN").flatMap(group => group.items), "/admin/exams/papers/id")?.href, "/admin/exams");
});
