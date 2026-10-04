import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { bankSearchKey, bankSearchQuery, publishEligibility, SAVE_BEFORE_PUBLISH } from "../src/features/exams/exam-editor-policy.ts";
import type { EditorDraft } from "../src/features/exams/exam-placement.ts";

const ready: EditorDraft = {
  title: "Đề",
  subjectId: "subject",
  instructions: "",
  releaseLocal: "2026-10-04T08:30",
  version: 3,
  items: [{ questionId: "q", points: "1.00", instructions: "", structure: "SINGLE", partIds: [], partPoints: {} }],
};

function persistedVersion(input: { dirty: boolean; conflict: boolean; examId: string | undefined; draft: EditorDraft }): number | null {
  const decision = publishEligibility(input);
  if (!decision.enabled) return null;
  return input.draft.version;
}

it("does not publish a dirty draft and keeps the unsaved editor", () => {
  const local: EditorDraft = { ...ready, title: "Chưa lưu" };
  const decision = publishEligibility({ dirty: true, conflict: false, examId: "exam-1", draft: local });
  assert.deepEqual(decision, { enabled: false, notice: SAVE_BEFORE_PUBLISH });
  assert.equal(Object.hasOwn(decision, "version"), false);
  assert.equal(local.title, "Chưa lưu");
  assert.equal(persistedVersion({ dirty: true, conflict: false, examId: "exam-1", draft: local }), null);
  assert.equal(persistedVersion({ dirty: true, conflict: true, examId: "exam-1", draft: local }), null);
  assert.deepEqual(publishEligibility({ dirty: false, conflict: true, examId: "exam-1", draft: ready }), { enabled: false, notice: null });
  assert.equal(persistedVersion({ dirty: false, conflict: false, examId: "exam-1", draft: ready }), 3);
  assert.equal(publishEligibility({ dirty: false, conflict: false, examId: "exam-1", draft: { ...ready, title: " " } }).enabled, false);

  const editor = readFileSync(new URL("../src/features/exams/components/exam-editor.tsx", import.meta.url), "utf8");
  const publishBody = editor.slice(editor.indexOf("async function publishDraft()"), editor.indexOf("async function loadServer()"));
  const gateAt = publishBody.indexOf("publishEligibility({ dirty, conflict, examId, draft: form })");
  const stopAt = publishBody.indexOf("if (!decision.enabled)");
  assert.ok(gateAt >= 0 && stopAt > gateAt && stopAt < publishBody.indexOf("toSaveRequest"));
  assert.ok(publishBody.indexOf("toSaveRequest") < publishBody.indexOf("mutateAsync"));
  assert.ok(publishBody.indexOf("const version = form.version") > publishBody.indexOf("toSaveRequest"));
  assert.ok(publishBody.indexOf("if (version === null)") < publishBody.indexOf("mutateAsync(version)"));
  assert.equal(publishBody.includes("mutateAsync(form.version)"), false);
  assert.equal(publishBody.includes("setForm"), false);
  assert.equal(publishBody.includes("setDirty"), false);
  assert.equal(publishBody.includes("setConflict(true)"), true);
  assert.equal(editor.includes("Đề vừa được sửa ở nơi khác. Bản bạn đang nhập vẫn được giữ."), true);
  assert.equal(editor.includes("disabled={busy || !eligibility.enabled}"), true);
  assert.equal(editor.includes("{eligibility.notice}"), true);
  assert.equal(editor.split("publishEligibility({ dirty, conflict, examId, draft: form })").length - 1, 2);
  const hydrateBody = editor.slice(editor.indexOf("const hydratePlacement"), editor.indexOf("function edit"));
  assert.equal(hydrateBody.includes("setDirty"), false);
  assert.equal(hydrateBody.includes("hydratePlacementItem"), true);
  const placementEffect = editor.slice(editor.indexOf("function PlacementEditor"), editor.indexOf("return <li"));
  const effect = placementEffect.slice(placementEffect.indexOf("useEffect"), placementEffect.indexOf("}, ["));
  assert.equal(effect.includes("onHydrate(content)"), true);
  assert.equal(effect.includes("onChange"), false);
  assert.equal(editor.includes("replacePlacementItem"), true);
  assert.equal(editor.includes("edit({ ...form, items:"), false);
});

it("keeps bank search from submitting the save form", () => {
  const calls: string[] = [];
  assert.equal(bankSearchKey({
    key: "Enter",
    preventDefault() { calls.push("preventDefault"); },
    stopPropagation() { calls.push("stopPropagation"); },
  }), true);
  assert.deepEqual(calls, ["preventDefault", "stopPropagation"]);
  const ignored: string[] = [];
  assert.equal(bankSearchKey({
    key: "a",
    preventDefault() { ignored.push("preventDefault"); },
    stopPropagation() { ignored.push("stopPropagation"); },
  }), false);
  assert.deepEqual(ignored, []);
  const query = bankSearchQuery("  axit  ");
  assert.deepEqual(query, { page: 0, search: "axit" });
  assert.equal(Object.hasOwn(query, "items"), false);
  assert.equal(Object.hasOwn(query, "expectedVersion"), false);

  const editor = readFileSync(new URL("../src/features/exams/components/exam-editor.tsx", import.meta.url), "utf8");
  const formOpen = editor.indexOf("<form");
  const formClose = editor.indexOf("</form>");
  const bankCall = editor.indexOf("<PublishedBank");
  const bank = editor.slice(editor.indexOf("function PublishedBank"));
  assert.ok(formOpen >= 0 && formOpen < bankCall && bankCall < formClose);
  assert.equal(editor.split("<form").length - 1, 1);
  assert.equal(bank.includes("<form"), false);
  assert.equal(bank.includes("onSubmit"), false);
  assert.equal(bank.includes('type="submit"'), false);
  assert.equal(bank.includes("onKeyDown"), true);
  assert.equal(bank.includes("bankSearchKey"), true);
  assert.equal(bank.includes('type="button"'), true);
  assert.equal(bank.includes("preventDefault"), true);
  assert.equal(bank.includes("stopPropagation"), true);
});
