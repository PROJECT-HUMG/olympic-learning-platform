import assert from "node:assert/strict";
import { it } from "node:test";
import { formatRelease, localInputToOffsetDateTime, offsetDateTimeToLocalInput, zoneLabel } from "../src/features/exams/exam-time.ts";

it("converts a browser-local release and shows that zone", () => {
  const local = "2026-10-04T08:30";
  const offset = localInputToOffsetDateTime(local);
  assert.equal(offset?.startsWith(`${local}:00`), true);
  assert.match(offset ?? "", /[+-]\d{2}:\d{2}$/);
  assert.equal(offsetDateTimeToLocalInput(offset), local);
  assert.equal(localInputToOffsetDateTime(""), null);
  assert.equal(localInputToOffsetDateTime("2026-10-04"), null);
  assert.equal(formatRelease(null), "Chưa đặt giờ mở");
  assert.match(zoneLabel("Asia/Ho_Chi_Minh"), /Asia\/Ho_Chi_Minh/);
});
