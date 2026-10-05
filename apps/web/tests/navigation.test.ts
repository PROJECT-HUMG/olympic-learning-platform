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
    if (role) assert.ok(items.some(i => i.href === '/daily') && items.some(i => i.href === '/profile'));
  }
});

it("tablet shortcuts are labelled, preserve direct Daily/group access, and are role aware", () => {
  for (const role of ['STUDENT', 'LECTURER', 'ADMIN']) {
    const shortcuts = getWorkspaceShortcuts(role);
    assert.ok(shortcuts.every(i => i.shortLabel && i.label));
    assert.ok(shortcuts.some(i => i.href === '/daily') && shortcuts.some(i => i.href === '/daily/groups'));
    assert.equal(shortcuts.some(i => i.href.endsWith('/questions')), role !== 'STUDENT');
    if (role !== 'STUDENT') {
      assert.equal(shortcuts[1].href, `/${role.toLowerCase()}/documents`);
      assert.ok(shortcuts.findIndex(i => i.href.endsWith('/questions')) < shortcuts.findIndex(i => i.href === '/daily'));
    }
  }
});

it("active matching chooses the deepest route and respects toolkit query selection", () => {
  const items = getDrawerNavigationGroups('ADMIN').flatMap(g => g.items);
  for (const [path, expected] of [['/daily/week', '/daily'], ['/daily/groups/example/reviews/person', '/daily/groups'], ['/profile/achievements', '/profile'], ['/admin/questions/import', '/admin/questions/import'], ['/admin/questions/example', '/admin/questions']]) {
    assert.equal(getActiveNavigationItem(items, path)?.href, expected);
  }
  assert.equal(getActiveNavigationItem(items, '/toolkit', '?tool=gpa')?.href, '/toolkit?tool=gpa');
  assert.equal(getActiveNavigationItem(items, '/toolkit')?.href, '/toolkit?tool=rooms');
  assert.equal(getActiveNavigationItem(items, '/study-rooms/example')?.href, '/toolkit?tool=rooms');
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
