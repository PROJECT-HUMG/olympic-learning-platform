import assert from "node:assert/strict";
import { it } from "node:test";
import { frozenPaperId, readStaffExamView, readStudentExamPaper } from "../src/features/exams/exam-contract.ts";

const content = { schemaVersion: 1, title: "Câu", structure: "SINGLE", stem: [], parts: [{ id: "p1", responseType: "WRITTEN", prompt: [], options: [] }] };

it("keeps preview publication fields null and drops student answers", () => {
  const preview = readStaffExamView({ id: null, examId: "e", versionNumber: null, title: "Đề", subjectId: "s", instructions: "", releaseAt: null, publishedAt: null, totalPoints: 1, items: [{ questionId: "q", points: 1, partPoints: {}, instructions: "", content }] });
  assert.ok(preview);
  assert.equal(preview?.id, null);
  assert.equal(preview?.versionNumber, null);
  assert.equal(preview?.releaseAt, null);
  assert.equal(preview?.publishedAt, null);
  assert.equal(frozenPaperId(preview!), null);
  const student = readStudentExamPaper({ id: "p", examId: "e", versionNumber: 1, title: "Đề", subjectId: "s", instructions: "", releaseAt: "2026-10-04T01:30:00Z", publishedAt: "2026-10-03T01:00:00Z", totalPoints: 1, items: [{ questionId: "q", points: 1, partPoints: { p1: 1 }, instructions: "", content, answer: { parts: [] }, explanation: { parts: [] } }] });
  assert.ok(student);
  assert.equal(Object.hasOwn(student!.items[0], "answer"), false);
  assert.equal(Object.hasOwn(student!.items[0], "explanation"), false);
  assert.deepEqual(Object.keys(student!.items[0].partPoints), ["p1"]);
});
