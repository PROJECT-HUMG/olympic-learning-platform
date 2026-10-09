import assert from "node:assert/strict";
import { it } from "node:test";
import { validatePostImage } from "../src/features/post/lib/post-image-validation.ts";
import { explicitInstant } from "../src/features/daily/lib/explicit-instant.ts";
import { readDailyPlan } from "../src/features/daily/lib/daily-contract.ts";
import { readEvidenceRecord } from "../src/features/daily/evidence/evidence-contract.ts";

it("POST image validation preserves MIME family, inclusive 5MiB and error precedence", () => {
  for (const type of ["image/png", "image/jpeg", "image/gif", "image/svg+xml"]) {
    assert.equal(validatePostImage({ type, size: 5 * 1024 * 1024 }), null);
    assert.equal(validatePostImage({ type, size: 5 * 1024 * 1024 + 1 }), "size");
  }
  for (const type of ["", "text/plain", "application/pdf", "IMAGE/PNG"]) {
    assert.equal(validatePostImage({ type, size: 1 }), "type");
    assert.equal(validatePostImage({ type, size: 10 * 1024 * 1024 }), "type");
  }
  assert.equal(validatePostImage({ type: "image/png", size: 0 }), null, "server validation remains authoritative for content");
});

const id = "00000000-0000-0000-0000-000000000001";
const plan = { id, ownerId: id, planDate: "2026-10-05", firstSubmittedAt: null, onTime: false, reviewReasons: null, reviewWentWell: null, reviewTomorrow: null, tasks: [], completedCount: 0, totalCount: 0, mustCompleted: 0, mustTotal: 0, createdAt: "2026-10-05T00:00:00Z", updatedAt: "2026-10-05T00:00:00Z", version: 0 };
const evidence = { id, planId: id, taskId: id, stage: "GENERAL", kind: "FILE", originalName: "notes.txt", contentType: "text/plain", sizeBytes: 3, url: null, label: null, createdAt: "2026-10-05T00:00:00Z" };
const expected = { planId: id, taskId: id };

it("shared explicit instant rejects malformed dates, missing zones and invalid ranges through both contracts", () => {
  for (const value of [undefined, null, 42, "", "2026-10-05", "2026-10-05T00:00:00", "2026-10-05 00:00:00Z", "2026-02-29T00:00:00Z", "2026-04-31T00:00:00Z", "2026-13-01T00:00:00Z", "2026-10-05T24:00:00Z", "2026-10-05T00:60:00Z", "2026-10-05T00:00:60Z", "2026-10-05T00:00:00+24:00", "2026-10-05T00:00:00+07:60", "2026-10-05T00:00:00.1234567890Z"]) {
    assert.equal(explicitInstant(value), null, String(value));
    for (const key of ["createdAt", "updatedAt", "firstSubmittedAt"]) {
      // firstSubmittedAt alone is explicitly nullable; all absent fields still reject.
      if (key === "firstSubmittedAt" && value === null) continue;
      assert.equal(readDailyPlan({ ...plan, [key]: value }), null, `${key}: ${String(value)}`);
    }
    assert.equal(readEvidenceRecord({ ...evidence, createdAt: value }, expected), null, String(value));
  }
  assert.ok(readDailyPlan(plan), "existing nullable submission contract retained");
});

it("shared explicit instant preserves valid wire values and offset equivalence through both contracts", () => {
  const values = ["2026-10-05T00:00:00Z", "2026-10-05T07:00:00+07:00", "2026-10-04T19:00:00-05:00"];
  assert.equal(new Set(values.map(Date.parse)).size, 1);
  for (const value of [...values, "2024-02-29T23:59:59.123456789Z", "2026-10-05T00:00:00.1+00:00"]) {
    assert.equal(explicitInstant(value), value);
    const parsed = readDailyPlan({ ...plan, createdAt: value, updatedAt: value, firstSubmittedAt: value });
    assert.equal(parsed?.createdAt, value); assert.equal(parsed?.updatedAt, value); assert.equal(parsed?.firstSubmittedAt, value);
    assert.equal(readEvidenceRecord({ ...evidence, createdAt: value }, expected)?.createdAt, value);
  }
  assert.equal(readEvidenceRecord({ ...evidence, extra: true }, expected), null, "separate exact evidence DTO unchanged");
  assert.equal(readDailyPlan({ ...plan, ownerId: "wrong" }), null, "separate plan identity contract unchanged");
});
