import assert from "node:assert/strict";
import { test } from "node:test";
import { EVIDENCE_CONTRACT, EVIDENCE_MAX_BYTES, dailyEvidenceKey, evidenceHttpUrl, evidenceTargetReady, readEvidenceList, readEvidenceRecord } from "../src/features/daily/evidence/evidence-contract.ts";
import { evidenceCreationResponse, evidenceListResponse, evidenceRoom, evidenceScopeKey, evidenceUploadIssue } from "../src/features/daily/evidence/evidence-policy.ts";

const planId = "00000000-0000-0000-0000-00000000e102";
const taskId = "00000000-0000-0000-0000-00000000e103";
const userId = "00000000-0000-0000-0000-00000000e101";
const id = "00000000-0000-0000-0000-00000000e104";
const scope = { planId, taskId };
const file = { id, planId, taskId, stage: "START", kind: "FILE", originalName: "notes.txt", contentType: "text/plain", sizeBytes: 3, url: null, label: null, createdAt: "2026-10-04T12:00:00Z" };
const link = { ...file, stage: "FINISH", kind: "LINK", originalName: null, contentType: null, sizeBytes: null, url: "https://example.org/work", label: "Work notes" };

test("both 201 creation responses accept exactly one complete persisted record", () => {
  assert.deepEqual(evidenceCreationResponse(201, file, { ...scope, stage: "START", kind: "FILE" }), file);
  assert.deepEqual(evidenceCreationResponse(201, link, { ...scope, stage: "FINISH", kind: "LINK" }), link);
});

test("creation rejects arrays, envelopes, missing/extra fields, wrong status and identities", () => {
  for (const row of [[file], { data: file }, null, { ...file, extra: true }, { ...file, planId: userId }, { ...file, taskId: userId }, { ...file, stage: "FINISH" }, link]) {
    assert.throws(() => evidenceCreationResponse(201, row, { ...scope, stage: "START", kind: "FILE" }), { message: EVIDENCE_CONTRACT });
  }
  const incomplete = { ...file } as Record<string, unknown>;
  delete incomplete.url;
  assert.equal(readEvidenceRecord(incomplete, scope), null);
  for (const status of [200, 204]) assert.throws(() => evidenceCreationResponse(status, file, scope));
});

test("list accepts empty/multiple same-stage evidence but rejects duplicate IDs and excess", () => {
  assert.deepEqual(evidenceListResponse(200, [], scope), []);
  assert.equal(readEvidenceList([file, { ...file, id: userId }], scope)?.length, 2);
  assert.equal(readEvidenceList([file, file], scope), null);
  assert.equal(readEvidenceList(Array.from({ length: 11 }, () => file), scope), null);
  assert.equal(readEvidenceList({ data: [] }, scope), null);
  assert.throws(() => evidenceListResponse(201, [], scope));
});

test("kind-specific null fields, bounded bytes and explicit valid timestamps are required", () => {
  for (const row of [{ ...file, url: "https://example.org" }, { ...link, sizeBytes: 0 }, { ...file, sizeBytes: 0 }, { ...file, sizeBytes: EVIDENCE_MAX_BYTES + 1 }, { ...file, originalName: "../notes.txt" }, { ...file, createdAt: "2026-10-04T12:00" }, { ...file, createdAt: "2026-02-30T12:00:00Z" }]) assert.equal(readEvidenceRecord(row, scope), null);
});

test("unsaved tasks are not request targets; identity keys separate accounts/tasks/groups", () => {
  const ready = { userId, planId, taskId, groupId: null };
  assert.equal(evidenceTargetReady(ready), true);
  assert.equal(evidenceTargetReady({ ...ready, taskId: null }), false);
  assert.equal(evidenceTargetReady({ ...ready, planId: null }), false);
  assert.equal(evidenceTargetReady({ ...ready, groupId: "invalid" }), false);
  assert.notDeepEqual(dailyEvidenceKey(userId, planId, taskId, null), dailyEvidenceKey(id, planId, taskId, null));
  assert.notEqual(evidenceScopeKey(userId, planId, taskId, null), evidenceScopeKey(userId, planId, id, null));
  assert.notEqual(evidenceScopeKey(userId, planId, taskId, null), evidenceScopeKey(userId, planId, taskId, id));
});

test("upload validates nonempty 5 MiB and bounded sanitized names", () => {
  assert.ok(evidenceUploadIssue(null));
  assert.ok(evidenceUploadIssue({ name: "notes", size: 0 }));
  assert.ok(evidenceUploadIssue({ name: "notes", size: EVIDENCE_MAX_BYTES + 1 }));
  assert.ok(evidenceUploadIssue({ name: "x".repeat(256), size: 1 }));
  assert.equal(evidenceUploadIssue({ name: "../notes.txt", size: EVIDENCE_MAX_BYTES }), null);
});

test("links cannot contain credentials or active/relative protocols", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,x", "/relative", "https://name:secret@example.org", "https://example.org/a b"]) assert.equal(evidenceHttpUrl(value), null);
  assert.equal(evidenceHttpUrl("https://example.org/work"), "https://example.org/work");
});

test("ten total items, not unique stage/kind, govern local creation eligibility", () => {
  assert.equal(evidenceRoom(9), true);
  for (const value of [10, 11, -1, 1.5, NaN]) assert.equal(evidenceRoom(value), false);
});
