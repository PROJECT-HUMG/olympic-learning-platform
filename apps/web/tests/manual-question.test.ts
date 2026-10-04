import assert from "node:assert/strict";
import { it } from "node:test";
import {
  addPart,
  createManualDraft,
  draftIssues,
  movePart,
  persistDraft,
  publishIssues,
  questionPermissions,
  readManualAuthorHandoff,
  reopenManualDraft,
  rejectsSchemaConversion,
  removeOption,
  removePart,
  retainPendingFigures,
} from "../src/features/questions/components/manual-question.ts";
import type { ScientificBlock } from "../src/features/questions/types/scientific-content.ts";

const ASSET = "11111111-1111-4111-8111-111111111111";
function ids(): () => string {
  let n = 0;
  return () => `id${++n}`;
}
function text(id: string, source: string): ScientificBlock {
  return { id, kind: "text", source };
}
function ready(type: "single_choice" | "multiple_choice" | "written" | "written_multipart") {
  const draft = createManualDraft(type, ids());
  draft.subjectId = "subject";
  draft.topicId = "topic";
  draft.title = "Đề";
  if (type === "written_multipart") {
    draft.parts[0].prompt = [text("pa", "ý a")];
    draft.parts[1].prompt = [text("pb", "ý b")];
  } else {
    draft.stem = [text("stem", "  giữ nguyên  ")];
    if (type !== "written") {
      draft.parts[0].options[0].content = [text("oa", "A")];
      draft.parts[0].options[1].content = [text("ob", "B")];
      const optionIds = draft.parts[0].options.map((option) => option.id);
      draft.parts[0].correctOptionIds = type === "single_choice" ? [optionIds[0]] : optionIds;
    }
  }
  return draft;
}
function reopenFrom(draft: ReturnType<typeof createManualDraft>, explanation?: unknown) {
  const save = persistDraft(draft, 0);
  return reopenManualDraft({
    subjectId: draft.subjectId,
    topicId: draft.topicId,
    type: draft.type,
    difficulty: save.request.difficulty,
    content: save.request.content,
    answer: save.request.answer,
    explanation: explanation === undefined ? save.request.explanation : explanation,
  });
}

it("builds four schemaVersion 1 forms and copies source unchanged", () => {
  for (const type of ["single_choice", "multiple_choice", "written", "written_multipart"] as const) {
    const save = persistDraft(ready(type), null);
    const content = save.request.content as { schemaVersion: number; structure: string; stem: { source?: string }[]; parts: { responseType: string; options: unknown[] }[] };
    assert.equal(content.schemaVersion, 1);
    assert.equal(content.structure, type === "written_multipart" ? "MULTIPART" : "SINGLE");
    assert.equal(content.parts.length, type === "written_multipart" ? 2 : 1);
    assert.equal(content.parts[0].responseType, type === "single_choice" ? "SINGLE_CHOICE" : type === "multiple_choice" ? "MULTIPLE_CHOICE" : "WRITTEN");
    assert.equal(content.parts[0].options.length, type === "written" || type === "written_multipart" ? 0 : 2);
    assert.equal(Object.hasOwn(save.request, "expectedVersion"), false);
    if (type !== "written_multipart") assert.equal(content.stem[0].source, "  giữ nguyên  ");
    assert.equal(publishIssues(ready(type)).length, 0);
  }
});

it("denies mutation controls to a student who owns the question", () => {
  const own = { status: "DRAFT" as const, createdById: "s" };
  const student = questionPermissions({ id: "s", role: "STUDENT" }, own);
  assert.equal(student.edit || student.publish || student.archive || student.restore, false);
  assert.equal(questionPermissions({ id: "s", role: "STUDENT" }, { status: "PUBLISHED", createdById: "s" }).archive, false);
  assert.equal(questionPermissions({ id: "s", role: "STUDENT" }, { status: "ARCHIVED", createdById: "s" }).restore, false);
  assert.equal(questionPermissions({ id: "s", role: "LECTURER" }, own).edit, true);
  assert.equal(questionPermissions({ id: "s", role: "LECTURER" }, { status: "DRAFT", createdById: "other" }).publish, false);
  assert.equal(questionPermissions({ id: "admin", role: "ADMIN" }, { status: "PUBLISHED", createdById: "other" }).archive, true);
});

it("keeps a partial pending figure on the draft, omits it from the request, and merges it back", () => {
  const draft = ready("written");
  draft.stem.push({ id: "fig", kind: "figure_group", layout: "full_width", figures: [{ assetId: ASSET, alt: "sơ đồ", caption: "" }, { assetId: "", alt: "nháp", caption: "c" }] });
  const save = persistDraft(draft, 0);
  assert.equal(save.request.expectedVersion, 0);
  assert.equal(save.pendingFigures.length, 1);
  assert.equal(JSON.stringify(save.draft).includes("nháp"), true);
  assert.equal(JSON.stringify(save.request).includes("nháp"), false);
  const server = structuredClone(save.draft);
  const block = server.stem[1];
  if (block.kind === "figure_group") block.figures = block.figures.filter((figure) => figure.assetId === ASSET);
  const merged = retainPendingFigures(save.draft, server);
  const figures = merged.stem[1].kind === "figure_group" ? merged.stem[1].figures : [];
  assert.deepEqual(figures.map((figure) => figure.assetId), [ASSET, ""]);
  assert.equal(figures[1].alt, "nháp");
});

it("rejects empty figure groups, a blank published alt, and a malformed asset id", () => {
  const solution = ready("written");
  solution.parts[0].solution = [{ id: "g1", kind: "figure_group", layout: "full_width", figures: [] }];
  assert.equal(publishIssues(solution).some((item) => item.message.includes("Nhóm hình")), true);
  const option = ready("single_choice");
  option.parts[0].options[0].content = [{ id: "g2", kind: "figure_group", layout: "side_by_side", figures: [] }];
  assert.equal(publishIssues(option).some((item) => item.path.includes("options")), true);
  const alt = ready("single_choice");
  alt.stem.push({ id: "g3", kind: "figure_group", layout: "full_width", figures: [{ assetId: ASSET, alt: "  ", caption: "" }] });
  assert.equal(publishIssues(alt).some((item) => item.path.endsWith(".alt")), true);
  const malformed = ready("written");
  malformed.stem = [{ id: "g4", kind: "figure_group", layout: "full_width", figures: [{ assetId: "not-a-uuid", alt: "a", caption: "" }] }];
  assert.equal(draftIssues(malformed).some((item) => item.message.includes("Mã ảnh")), true);
});

it("checks correct-choice cardinality and keeps ids while moving or removing", () => {
  const single = ready("single_choice");
  single.parts[0].correctOptionIds = [];
  assert.equal(publishIssues(single).some((item) => item.path === "answer"), true);
  single.parts[0].correctOptionIds = single.parts[0].options.map((option) => option.id);
  assert.equal(publishIssues(single).some((item) => item.path === "answer"), true);
  const multiple = ready("multiple_choice");
  multiple.parts[0].correctOptionIds = [];
  assert.equal(publishIssues(multiple).some((item) => item.path === "answer"), true);
  const written = ready("written");
  written.parts[0].correctOptionIds = ["id1"];
  assert.equal(publishIssues(written).some((item) => item.path.includes("answer")), true);
  const multi = addPart(ready("written_multipart"), () => "idZ");
  const before = multi.parts.map((part) => part.id);
  assert.deepEqual(movePart(multi, 0, 1).parts.map((part) => part.id), [before[1], before[0], before[2]]);
  const kept = single.parts[0].options[1].id;
  assert.equal(removeOption(single, 0, 0).parts[0].options[0].id, kept);
  assert.equal(removePart(multi, 0).parts.some((part) => part.id === "idZ"), true);
});

it("guards schema conversion only for legacy assets", () => {
  assert.equal(rejectsSchemaConversion([{ id: "a" }], { schemaVersion: 1 }), true);
  assert.equal(rejectsSchemaConversion([], { schemaVersion: 1 }), false);
  assert.equal(rejectsSchemaConversion([{ id: "a" }], { text: "Cũ" }), false);
  assert.equal(rejectsSchemaConversion([{ id: "a" }], { schemaVersion: "1" }), false);
});

it("reopens four saved forms without rewriting source", () => {
  for (const type of ["single_choice", "multiple_choice", "written", "written_multipart"] as const) {
    const draft = ready(type);
    draft.difficulty = "MEDIUM";
    draft.stem = [
      text("keep", "  giữ nguyên  "),
      { id: "m", kind: "math", source: "  x^2  ", display: true },
      { id: "g", kind: "figure_group", layout: "side_by_side", figures: [{ assetId: ASSET, alt: "  sơ đồ  ", caption: "chú thích" }] },
    ];
    draft.parts[0].solution = [text("sol", "  lời  ")];
    draft.parts[0].rubric = "  rubric  ";
    const opened = reopenFrom(draft);
    assert.equal(opened.lossy, false);
    assert.deepEqual(opened.draft, draft);
  }
});

it("treats a stored empty explanation object as no solution", () => {
  const draft = ready("single_choice");
  const opened = reopenFrom(draft, {});
  assert.equal(opened.lossy, false);
  assert.deepEqual(opened.draft, draft);
});

it("reopens stored figures only and drops pending figures that were never uploaded", () => {
  const draft = ready("written");
  draft.stem.push({ id: "g", kind: "figure_group", layout: "full_width", figures: [{ assetId: ASSET, alt: "sơ đồ", caption: "" }, { assetId: "", alt: "nháp", caption: "c" }] });
  const opened = reopenFrom(draft, {});
  assert.equal(opened.lossy, false);
  const stem = opened.draft.stem[0];
  assert.equal(stem?.kind === "text" && stem.source, "  giữ nguyên  ");
  const group = opened.draft.stem[1];
  assert.equal(group?.kind === "figure_group" && group.figures.map((figure) => figure.assetId).join(), ASSET);
  assert.equal(JSON.stringify(opened.draft).includes("nháp"), false);
});

it("marks unknown, mistyped, and unloadable figure documents lossy", () => {
  const save = persistDraft(ready("written"), null);
  const base = {
    subjectId: "subject",
    topicId: "topic",
    type: "written" as const,
    difficulty: save.request.difficulty,
    answer: save.request.answer,
    explanation: save.request.explanation,
  };
  assert.equal(reopenManualDraft({ ...base, content: { ...save.request.content, extra: true } }).lossy, true);
  assert.equal(reopenManualDraft({ ...base, content: { ...save.request.content, schemaVersion: "1" } }).lossy, true);
  assert.equal(reopenManualDraft({ ...base, content: { ...save.request.content, structure: "MULTIPART" } }).lossy, true);
  const content = structuredClone(save.request.content) as { stem: ScientificBlock[] };
  content.stem = [{ id: "g", kind: "figure_group", layout: "full_width", figures: [{ assetId: "pending", alt: "nháp", caption: "" }] }];
  const pending = reopenManualDraft({ ...base, content });
  assert.equal(pending.lossy, true);
  assert.equal(JSON.stringify(pending.draft).includes("nháp"), true);
  content.stem = [{ id: "empty", kind: "figure_group", layout: "full_width", figures: [] }];
  const empty = reopenManualDraft({ ...base, content });
  assert.equal(empty.lossy, true);
  assert.equal(empty.draft.stem[0]?.kind, "figure_group");
  const orphan = reopenManualDraft({
    ...base,
    content: save.request.content,
    explanation: { parts: [{ partId: "missing", solution: [text("s", "giữ")], rubric: "" }] },
  });
  assert.equal(orphan.lossy, true);
});

it("keeps a handoff draft, including a pending figure and version 0", () => {
  const draft = ready("written");
  draft.stem.push({ id: "g", kind: "figure_group", layout: "full_width", figures: [{ assetId: "", alt: "nháp", caption: "" }] });
  const handoff = readManualAuthorHandoff({
    from: "/lecturer/questions",
    manualHandoff: { questionId: "q1", draft, version: 0, status: "DRAFT", notice: null, lossy: false },
  });
  assert.ok(handoff);
  assert.equal(handoff.version, 0);
  assert.equal(handoff.lossy, false);
  assert.equal(JSON.stringify(handoff.draft).includes("nháp"), true);
  handoff.draft.title = "đổi";
  assert.equal(draft.title, "Đề");
  assert.equal(readManualAuthorHandoff({ manualHandoff: { questionId: "q1", draft, version: 0, status: "DRAFT", notice: null } }), null);
  assert.equal(readManualAuthorHandoff(null), null);
});
