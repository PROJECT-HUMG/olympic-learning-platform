import assert from "node:assert/strict";
import { it } from "node:test";
import { editorFromDraft, hydratePlacementItem, movePlacement, parsePoints, placementAssetIds, replacePlacementItem, shouldLoadServerDraft, toSaveRequest, type EditorDraft } from "../src/features/exams/exam-placement.ts";
import type { ScientificExplanation, ScientificQuestionContent } from "../src/features/questions/types/scientific-content.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const content = { schemaVersion: 1, title: "Câu", structure: "SINGLE", stem: [{ id: "g", kind: "figure_group", layout: "full_width", figures: [{ assetId: A, alt: "a", caption: "" }] }], parts: [] } as ScientificQuestionContent;
const explanation = { parts: [{ partId: "p", solution: [{ id: "s", kind: "figure_group", layout: "full_width", figures: [{ assetId: B, alt: "b", caption: "" }] }], rubric: "" }] } as ScientificExplanation;

function draft(): EditorDraft {
  return { title: "Đề", subjectId: "subject", instructions: "", releaseLocal: "", version: 3, items: [
    { questionId: "q1", points: "2.00", instructions: "", structure: "MULTIPART", partIds: ["b", "a"], partPoints: { b: "1.00", a: "1.00" } },
    { questionId: "q2", points: "1.00", instructions: "", structure: "SINGLE", partIds: [], partPoints: {} },
  ] };
}

it("keeps part ids in authored order and retains a conflicting edit", () => {
  assert.equal(parsePoints("1.230"), null);
  assert.equal(parsePoints("1.20"), 1.2);
  const saved = toSaveRequest(draft(), "update");
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.deepEqual(Object.keys(saved.body.items[0].partPoints), ["b", "a"]);
  assert.equal(saved.body.expectedVersion, 3);
  const created = toSaveRequest({ ...draft(), version: null, releaseLocal: "" }, "create");
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.body.expectedVersion, undefined);
  assert.equal(created.body.releaseAt, null);
  const moved = movePlacement(draft().items, 0, 1);
  assert.deepEqual(moved.map((item) => item.questionId), ["q2", "q1"]);
  assert.deepEqual(moved[1].partIds, ["b", "a"]);
  assert.equal(shouldLoadServerDraft({ dirty: true, conflict: false }), false);
  assert.equal(shouldLoadServerDraft({ dirty: false, conflict: true }), false);
  assert.deepEqual(placementAssetIds(content, explanation, false), [A]);
  assert.deepEqual(placementAssetIds(content, explanation, true), [A, B]);
});

it("aligns each saved row from the current draft and keeps sibling weights", () => {
  const multipart = { schemaVersion: 1, title: "Nhiều ý", structure: "MULTIPART", stem: [], parts: [
    { id: "p1", responseType: "WRITTEN", prompt: [], options: [] },
    { id: "p2", responseType: "WRITTEN", prompt: [], options: [] },
  ] } as ScientificQuestionContent;
  const single = { schemaVersion: 1, title: "Một ý", structure: "SINGLE", stem: [], parts: [
    { id: "only", responseType: "WRITTEN", prompt: [], options: [] },
  ] } as ScientificQuestionContent;
  const reopened = editorFromDraft({
    id: "ece6924f-684b-42c4-880f-323c57b95cbb", createdById: "staff", version: 0, latestPublishedVersion: null, totalPoints: 8,
    title: "Browser exam", subjectId: "subject", instructions: "", releaseAt: "2026-10-02T17:00:00Z",
    items: [
      { questionId: "multi", points: 2, partPoints: { p1: 1, p2: 1 }, instructions: "" },
      { questionId: "s1", points: 2, partPoints: {}, instructions: "" },
      { questionId: "s2", points: 2, partPoints: {}, instructions: "" },
      { questionId: "s3", points: 2, partPoints: {}, instructions: "" },
    ],
  });
  assert.equal(reopened.version, 0);
  assert.equal(reopened.items[0].structure, "UNKNOWN");
  assert.deepEqual(reopened.items[0].partPoints, { p1: "1.00", p2: "1.00" });
  let current = reopened;
  current = hydratePlacementItem(current, 3, "s3", single);
  current = hydratePlacementItem(current, 1, "s1", single);
  current = hydratePlacementItem(current, 0, "multi", multipart);
  current = hydratePlacementItem(current, 2, "s2", single);
  assert.equal(current, hydratePlacementItem(current, 0, "other", multipart));
  assert.equal(current.items[0].structure, "MULTIPART");
  assert.deepEqual(current.items[0].partIds, ["p1", "p2"]);
  assert.deepEqual(current.items[0].partPoints, { p1: "1.00", p2: "1.00" });
  assert.equal(current.items[1].points, "2.00");
  assert.deepEqual(current.items.map((item) => item.questionId), ["multi", "s1", "s2", "s3"]);
  const edited = replacePlacementItem(current, 1, (item) => ({ ...item, points: "3.00" }));
  const rehydrated = hydratePlacementItem(edited, 0, "multi", multipart);
  assert.equal(rehydrated.items[0].structure, "MULTIPART");
  assert.deepEqual(rehydrated.items[0].partPoints, { p1: "1.00", p2: "1.00" });
  assert.equal(rehydrated.items[1].points, "3.00");
  assert.equal(rehydrated.version, 0);
});
