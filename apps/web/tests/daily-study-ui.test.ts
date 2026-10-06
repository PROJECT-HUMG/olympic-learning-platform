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

it("completion retains both wire states without a redundant row status selector", () => {
  assert.match(day, /<fieldset disabled=\{editingLocked\}/);
  assert.match(day, /<Checkbox id=\{`daily-complete-\$\{task.key\}`\} aria-label=\{`Đánh dấu xong việc/);
  assert.match(day, /disabled=\{editingLocked\} onChange=/);
  assert.match(day, /disabled=\{disabled\} checked=\{isComplete\}/);
  assert.match(day, /checked === true \? "COMPLETED" : "TODO"/);
  assert.match(day, /querySelector<HTMLButtonElement>\('\[data-slot="checkbox"\]'/);
  assert.match(day, /onChange\(\(current\) => \(\{ \.\.\.current, status \}\)\)/);
  assert.doesNotMatch(day, /daily-status-\$\{task.key\}/);
  assert.match(day, /aria-label=\{`Đưa việc \$\{index \+ 1\} lên trước`\}/);
  assert.doesNotMatch(day, /Tùy chọn việc/);
  assert.match(day, /draft.edit\(\(\) => replaceForm\(update\(formRef.current\)\)\)/);
});

it("completion reuses the installed Radix shadcn primitive with a full focusable hit area", () => {
  const checkbox = source("components/ui/checkbox.tsx");
  const css = source("features/daily/ui/study-notebook.css");
  assert.match(checkbox, /Checkbox as CheckboxPrimitive.*from "radix-ui"/);
  assert.match(checkbox, /CheckboxPrimitive.Root/);
  assert.match(checkbox, /CheckboxPrimitive.Indicator/);
  assert.match(checkbox, /data-\[state=checked\]:bg-primary/);
  assert.match(checkbox, /disabled:opacity-50/);
  assert.match(css, /study-task__complete.*width: 44px; min-height: 44px/);
  assert.match(css, /:has\(\[data-slot="checkbox"\]:focus-visible\)/);
  assert.match(css, /\[data-slot="checkbox"\]:focus-visible \{ outline: none; \}/);
});

it("today entry and compact date controls retain day/week/history links and guards", () => {
  for (const screen of [day, week]) {
    assert.match(screen, /onNavigate=\{guardNavigation\}/);
  }
  assert.match(entry, /dailyEntryDate\(requestedDate, today\)/);
  assert.match(entry, /params.get\("view"\) === "history" \|\| params.has\("week"\)/);
  assert.match(entry, /StudyWeekList/);
  assert.doesNotMatch(week, /StudyDayList/);
  assert.match(calendar, /aria-label=\{`\$\{index === 6 \? "Chủ Nhật"/);
  assert.match(week, /\$\{ROUTES.DAILY\}\?date=\$\{chosen\}/);
  assert.doesNotMatch(week, />Tuần trước<|>Tuần sau<|>Tuần này</);
  assert.doesNotMatch(group, /StudyWeekList/);
  assert.match(group, /reviews\/\$\{m.userId\}\?date=\$\{date\}&view=week/);
  assert.doesNotMatch(review, /StudyDayList/);
  for (const screen of [day, week, group, review]) assert.match(screen, /StudyDatePicker/);
  assert.match(day, /DialogTitle>Nhìn lại ngày/);
  assert.match(week, /DailySyncStatus/);
});

it("automatic persistence and explicit Submit status remain readily available", () => {
  assert.match(day, /className="study-savebar"/);
  assert.doesNotMatch(day, /type="submit" form="daily-plan-form"|Lưu kế hoạch và nhìn lại/);
  assert.match(day, /DailySyncStatus/);
  assert.match(day, /className="study-submit-status" role="status"/);
  assert.match(day, /disabled=\{!canSubmit\}/);
  assert.match(day, /Nộp là thao tác riêng, không bật chia sẻ/);
  assert.match(day, /study-day-workspace/);
  assert.match(day, /daily-reflection-layout/);
  assert.match(day, /DropdownMenuItem disabled=\{index === 0\}/);
  assert.match(day, /DropdownMenuItem disabled=\{last\}/);
  assert.match(day, /variant="destructive" onSelect=/);
  assert.match(day, /destructive: true/);
  assert.match(day, /requestAnimationFrame\(\(\) => target\?\.focus\(\)\)/);
});

it("weekly reflection leads the workspace while all recorded figures and definitions remain available", () => {
  const ui = source("features/daily/ui/study-notebook.tsx");
  assert.match(week, /<StudyWeekStats \{\.\.\.week.data\}/);
  assert.ok(week.indexOf('id="week-review"') < week.indexOf('<StudyWeekStats'));
  for (const field of ["plannedDays", "onTimeDays", "completionRate", "mustCompleted", "mustTotal", "mustRate"]) assert.ok(ui.includes(field));
  assert.match(ui, /Cách tính số liệu/);
  assert.match(week, /DailySyncStatus/);
  assert.doesNotMatch(week, /type="submit" form="daily-week-form"/);
});

it("task entry is temporary until server-confirmed append, without saving unrelated edits", () => {
  const opening = day.slice(day.indexOf("function openAddTaskModal"), day.indexOf("async function persistTask"));
  assert.match(opening, /setActiveModalTask\(blankTask\(\)\)/);
  assert.doesNotMatch(opening, /edit\(|setForm/);
  assert.match(day, /addTask.mutateAsync/);
  assert.match(day, /rebaseAddedTask/);
  assert.match(day, /draft.finish\("save", revision, "keep"\)/);
  assert.match(day, /Thêm và lưu việc/);
  assert.match(day, /DialogContent className="daily-dialog daily-add-dialog"/);
});

it("history has distinct loading/error/success and on-demand sharing preserves selections", () => {
  assert.match(entry, /planDatesQuery.isPending/);
  assert.match(entry, /planDatesQuery.isError/);
  assert.match(entry, /planDatesQuery.isSuccess \? <StudyWeekList/);
  const consent = source("features/daily/groups/group-controls.tsx");
  assert.match(consent, /hidden=\{settings.sharingMode !== "SELECTED_MEMBERS"\}/);
  assert.match(consent, /id="group-sharing"/);
  assert.match(group, /openStudySection\("group-sharing"\)/);
});

it("nested calendars fit their container and motion has a reduced-motion override", () => {
  const css = source("features/daily/ui/study-notebook.css");
  assert.match(css, /minmax\(min\(100%, 280px\), 1fr\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation: none !important; transition: none !important/);
  assert.match(review, /openStudySection\("shared-feedback"\)/);
  assert.match(week, /title="Nhìn lại tuần" defaultOpen/);
});

it("date popover retains grid semantics, roving focus and owner-approved selection", () => {
  const picker = source("features/daily/ui/study-date-picker.tsx");
  assert.match(picker, /role="grid"/);
  assert.match(picker, /aria-selected=\{key === date\}/);
  assert.match(picker, /tabIndex=\{key === focused \? 0 : -1\}/);
  assert.match(picker, /if \(!onSelect\(next\)\)/);
  assert.match(picker, /PageUp/);
  assert.match(picker, /onOpenAutoFocus/);
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

it("evidence uses file-only dialogs and bounded authorized previews, not nested forms", () => {
  assert.match(evidence, /daily-evidence-dialog/);
  assert.match(evidence, /aria-describedby=\{prefix \+ "-file-help"\}/);
  assert.match(evidence, /images.slice\(0, 2\)/);
  assert.match(evidence, /evidenceService.download/);
  assert.match(evidence, /URL.revokeObjectURL/);
  assert.doesNotMatch(evidence, /saveLink|setStage|type="url"|Trước khi làm|Sau khi làm/);
  assert.match(evidence, /rel="noreferrer noopener"/);
  assert.doesNotMatch(evidence, /<form|<iframe|<embed/);
});
