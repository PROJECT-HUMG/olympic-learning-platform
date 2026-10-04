// Source guards complement, not replace, the disposable HTTP/browser flows.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");
const day = source("features/daily/components/daily-plan-editor.tsx");
const week = source("features/daily/components/daily-week-editor.tsx");
const calendar = source("features/daily/ui/study-calendar.tsx");
const entry = source("pages/daily-owner-page.tsx");
const group = source("pages/daily-groups-page.tsx");
const review = source("pages/daily-shared-review-page.tsx");
const feedback = source("features/daily/groups/feedback-panel.tsx");
const evidence = source("features/daily/evidence/evidence-panel.tsx");

it("completion is a labelled draft edit inside the disabled fieldset, preserving wire selectors", () => {
  assert.match(day, /<fieldset disabled=\{draft.busy\}/);
  assert.match(day, /type="checkbox" aria-label=\{`Đánh dấu xong việc/);
  assert.match(day, /event.target.checked \? "COMPLETED" : "TODO"/);
  assert.match(day, /onChange\(\(current\) => \(\{ \.\.\.current, status \}\)\)/);
  assert.match(day, /daily-status-\$\{task.key\}/);
  assert.match(day, /draft.edit\(\(\) => setForm\(update\)\)/);
});

it("week-first entry and day lists retain deep links and draft navigation guards", () => {
  for (const screen of [day, week]) {
    assert.match(screen, /onNavigate=\{guardNavigation\}/);
  }
  assert.match(entry, /if \(raw === null\)/);
  assert.match(entry, /StudyWeekList/);
  assert.match(week, /StudyDayList weekStart=\{weekStart\}/);
  assert.match(calendar, /aria-label=\{`\$\{index === 6 \? "Chủ Nhật"/);
  assert.match(week, /href=\{day => `\$\{ROUTES.DAILY\}\?date=\$\{day\}`\}/);
  assert.doesNotMatch(week, />Tuần trước<|>Tuần sau<|>Tuần này</);
  assert.match(group, /StudyDisclosure title=\{<StudyIdentity name=\{m.displayName\}/);
  assert.match(group, /reviews\/\$\{m.userId\}\?date=\$\{start\}&view=week/);
  assert.match(review, /StudyDayList weekStart=\{weekStart\}/);
  assert.match(day, /StudyDisclosure title="Nhìn lại ngày"/);
  assert.match(week, /Nhìn lại tuần · Chưa lưu/);
});

it("group avatar reuses profile crop and image controls, never profile mutations", () => {
  const avatar = source("features/daily/groups/group-avatar.tsx");
  assert.match(avatar, /features\/user\/components\/avatar-crop-dialog/);
  assert.match(avatar, /features\/user\/components\/avatar-image/);
  assert.match(avatar, /groupService.uploadAvatar/);
  assert.match(avatar, /URL.revokeObjectURL/);
  assert.doesNotMatch(avatar, /useUpdateAvatar|userService/);
});

it("shared identities use authorized group detail and hide with both access checks", () => {
  assert.match(review, /groupService.detail\(groupId,signal\)/);
  assert.match(review, /query.isFetching\|\|context.isFetching/);
  assert.match(review, /query.isError\|\|context.isError/);
  assert.match(review, /!revoked&&query.data&&context.data/);
  assert.match(review, /hidden=\{checking\|\|unavailable\}/);
  assert.doesNotMatch(review, /userService|profileService|avatarUrl/);
});

it("feedback draft survives transient checks but is hidden, and denied access unmounts it", () => {
  assert.match(feedback, /!revoked&&query.data&&props.userId!==props.ownerId/);
  assert.match(feedback, /<div hidden=\{query.isFetching\|\|query.isError\}><FeedbackEditor/);
  assert.match(feedback, /maxLength=\{4000\}/);
  assert.match(feedback, /aria-describedby="daily-feedback-guidance daily-feedback-length"/);
});

it("evidence disclosure retains visited inputs without previews or nested forms", () => {
  assert.match(evidence, /visited \? <div hidden=\{!open\}/);
  assert.match(evidence, /aria-describedby=\{`\$\{prefix\}-file-help`\}/);
  assert.match(evidence, /aria-describedby=\{`\$\{prefix\}-link-help`\}/);
  assert.match(evidence, /rel="noreferrer noopener"/);
  assert.doesNotMatch(evidence, /<form|<iframe|<embed/);
});
