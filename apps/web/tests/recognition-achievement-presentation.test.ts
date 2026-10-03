import assert from "node:assert/strict";
import { it } from "node:test";
import { STATUS_LABELS } from "../src/features/recognition/scoring.ts";
import type { Achievement } from "../src/features/recognition/types.ts";
import {
  EDITORIAL_HONOR_LABEL,
  isPublicAchievement,
  presentMilestones,
  presentPublicLabels,
  publicLabelControlLabel,
  PUBLIC_LABEL_PREVIEW_LIMIT,
} from "../src/features/recognition/achievement-presentation-model.ts";

const SECRET_EVIDENCE = "secret-evidence.pdf";
const SECRET_NOTE = "internal-note-should-not-render";
const SECRET_NAME = "Secret Name";

function achievement(overrides: Partial<Achievement> & Pick<Achievement, "id" | "achievedDate" | "status" | "publicVisible">): Achievement {
  return {
    userId: "user-1",
    fullName: SECRET_NAME,
    title: `Mốc ${overrides.id}`,
    description: `public-description-${overrides.id}`,
    category: "OLYMPIC_NATIONAL",
    award: "FIRST",
    includeParticipation: true,
    awardPoints: 99,
    participationPoints: 99,
    totalPoints: 16,
    reviewNote: SECRET_NOTE,
    reviewedAt: "2024-07-01T00:00:00Z",
    evidence: [{ id: "ev-1", originalName: SECRET_EVIDENCE, contentType: "application/pdf", size: 12 }],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    version: 4,
    ...overrides,
  };
}

function fixtures(): Achievement[] {
  return [
    achievement({ id: "f", achievedDate: "2025-01-01", status: "PENDING", publicVisible: true, totalPoints: 100, title: "private-title-f", description: "private-description-f", awardPoints: 77, participationPoints: 88 }),
    achievement({ id: "g", achievedDate: "2025-06-01", status: "APPROVED", publicVisible: false, totalPoints: 100, title: "private-title-g", description: "private-description-g", awardPoints: 77, participationPoints: 88 }),
    achievement({ id: "c", achievedDate: "2024-06-01", status: "APPROVED", publicVisible: true, category: "OLYMPIC_NATIONAL", award: "FIRST", totalPoints: 16 }),
    achievement({ id: "i", achievedDate: "2021-01-01", status: "REJECTED", publicVisible: true, totalPoints: 8, title: "private-title-i", description: "private-description-i", awardPoints: 77, participationPoints: 88 }),
    achievement({ id: "a", achievedDate: "2024-06-01", status: "APPROVED", publicVisible: true, category: "OLYMPIC_NATIONAL", award: "FIRST", totalPoints: 16, title: "X".repeat(80) }),
    achievement({ id: "j", achievedDate: "2020-01-01", status: "REVOKED", publicVisible: true, totalPoints: 8, title: "private-title-j", description: "private-description-j", awardPoints: 77, participationPoints: 88 }),
    achievement({ id: "z", achievedDate: "2024-02-31", status: "APPROVED", publicVisible: true, category: "RESEARCH_OTHER", award: "CONSOLATION", totalPoints: 7 }),
    achievement({ id: "b", achievedDate: "2024-01-02", status: "APPROVED", publicVisible: true, category: "OLYMPIC_SCHOOL", award: "SECOND", totalPoints: 4 }),
    achievement({ id: "h", achievedDate: "not-a-date", status: "APPROVED", publicVisible: true, category: "RESEARCH_SCHOOL", award: "NONE", totalPoints: 0 }),
    achievement({ id: "e", achievedDate: "2023-05-05", status: "APPROVED", publicVisible: true, category: "RESEARCH_MINISTRY", award: "THIRD", totalPoints: 6 }),
    achievement({ id: "d", achievedDate: "2022-12-31", status: "APPROVED", publicVisible: true, category: "RESEARCH_SCHOOL", award: "NONE", totalPoints: 3 }),
  ];
}

function milestoneIds(records: Achievement[]): string[] {
  return presentMilestones(records).flatMap(group => group.records.map(record => record.id));
}

it("publishes only approved visible achievements, keeps their public copy, and omits evidence and review notes", () => {
  const records = fixtures();
  const originalIds = records.map(record => record.id);
  const loose = achievement({ id: "loose", achievedDate: "2024-01-01", status: "APPROVED", publicVisible: true });
  loose.publicVisible = 1 as unknown as boolean;
  assert.equal(isPublicAchievement(loose), false);
  assert.equal(isPublicAchievement(achievement({ id: "lower", achievedDate: "2024-01-01", status: "approved" as Achievement["status"], publicVisible: true })), false);

  for (const record of records) {
    assert.equal(isPublicAchievement(record), record.status === "APPROVED" && record.publicVisible === true);
  }

  const labels = presentPublicLabels(records);
  const milestones = presentMilestones(records);
  const payload = JSON.stringify({ labels, milestones });
  assert.equal(payload.includes(SECRET_EVIDENCE), false);
  assert.equal(payload.includes(SECRET_NOTE), false);
  assert.equal(payload.includes(SECRET_NAME), false);
  for (const id of ["f", "g", "i", "j"]) {
    assert.equal(payload.includes(`private-title-${id}`), false);
    assert.equal(payload.includes(`private-description-${id}`), false);
  }
  assert.equal(payload.includes("77"), false);
  assert.equal(payload.includes("88"), false);
  assert.equal(payload.includes("public-description-a"), true);
  assert.equal(payload.includes("public-description-c"), true);
  assert.equal(payload.includes("OLYMPIC_NATIONAL"), false);
  assert.equal(payload.includes("APPROVED"), false);
  assert.equal(payload.includes("16 điểm nền tảng"), true);
  assert.equal(payload.includes("4 điểm nền tảng"), true);
  assert.equal(payload.includes("0 điểm nền tảng"), true);
  assert.equal(payload.includes("Gồm 99 điểm giải và 99 điểm tham gia."), true);
  assert.deepEqual(records.map(record => record.id), originalIds);

  const national = milestones[0]?.records[0];
  assert.equal(national?.title, "X".repeat(80));
  assert.equal(national?.description, "public-description-a");
  assert.equal(national?.dateText, "01/06/2024");
  assert.equal(national?.category, "Olympic cấp quốc gia");
  assert.equal(national?.award, "Giải nhất");
  assert.equal(national?.approvedText, "Đã duyệt");
  assert.equal(national?.approvedText, STATUS_LABELS.APPROVED);
  assert.equal(national?.participationText, "Gồm 99 điểm giải và 99 điểm tham gia.");
  assert.equal(national?.pointsText, "16 điểm nền tảng");
  assert.deepEqual(Object.keys(national ?? {}).sort(), ["approvedText", "award", "category", "dateText", "description", "id", "participationText", "pointsText", "title"]);
  assert.deepEqual(Object.keys(labels.visible[0] ?? {}).sort(), ["award", "category", "id", "year"]);

  const plain = presentMilestones([
    achievement({ id: "plain", achievedDate: "2024-03-03", status: "APPROVED", publicVisible: true, includeParticipation: false, description: "public-description-plain", totalPoints: 5, awardPoints: 5, participationPoints: 1 }),
  ]);
  assert.equal(plain[0]?.records[0]?.description, "public-description-plain");
  assert.equal(plain[0]?.records[0]?.participationText, null);
  assert.equal(plain[0]?.records[0]?.pointsText, "5 điểm nền tảng");
});

it("orders milestone years descending and records chronologically with a deterministic tie-break", () => {
  const records = fixtures();
  const expectedIds = ["a", "c", "b", "e", "d", "h", "z"];
  const expectedYears = [2024, 2023, 2022, null];
  const firstOrder = ["z", "f", "a", "j", "c", "g", "b", "i", "e", "d", "h"];
  const secondOrder = ["h", "d", "e", "i", "b", "g", "c", "j", "a", "f", "z"];
  const byId = (ids: string[]) => ids.map(id => records.find(record => record.id === id)!);

  const first = presentMilestones(byId(firstOrder));
  const second = presentMilestones(byId(secondOrder));
  assert.deepEqual(first.map(group => group.year), expectedYears);
  assert.deepEqual(second.map(group => group.year), expectedYears);
  assert.deepEqual(milestoneIds(byId(firstOrder)), expectedIds);
  assert.deepEqual(milestoneIds(byId(secondOrder)), expectedIds);
  assert.deepEqual(first[0]?.records.map(record => record.id), ["a", "c", "b"]);
  assert.equal(first[0]?.records[2]?.category, "Olympic cấp trường");
  assert.equal(first[0]?.records[2]?.award, "Giải nhì");
  assert.equal(first[0]?.records[2]?.pointsText, "4 điểm nền tảng");
  assert.equal(first[0]?.records[2]?.participationText, "Gồm 99 điểm giải và 99 điểm tham gia.");
  assert.deepEqual(first[3]?.records.map(record => record.id), ["h", "z"]);
  assert.equal(first[3]?.records[0]?.dateText, "Ngày chưa rõ");
  assert.equal(first[3]?.records[0]?.year, undefined);
  assert.equal(first[3]?.records[1]?.dateText, "Ngày chưa rõ");
  assert.equal(presentPublicLabels(byId(secondOrder)).visible.map(label => label.id).concat(presentPublicLabels(byId(secondOrder)).overflow.map(label => label.id)).join(), expectedIds.join());
});

it("shows two public labels and counts only the filtered overflow", () => {
  const hidden = presentPublicLabels([
    achievement({ id: "p", achievedDate: "2024-01-01", status: "PENDING", publicVisible: true, totalPoints: 50 }),
    achievement({ id: "r", achievedDate: "2024-01-02", status: "APPROVED", publicVisible: false, totalPoints: 50 }),
  ]);
  assert.deepEqual(hidden, { visible: [], overflow: [], hiddenCount: 0 });

  const one = presentPublicLabels([
    achievement({ id: "p", achievedDate: "2024-01-01", status: "PENDING", publicVisible: true }),
    achievement({ id: "a", achievedDate: "2020-01-01", status: "APPROVED", publicVisible: true }),
  ]);
  assert.deepEqual(one.visible.map(label => label.id), ["a"]);
  assert.equal(one.hiddenCount, 0);

  const two = presentPublicLabels([
    achievement({ id: "b", achievedDate: "2021-01-01", status: "APPROVED", publicVisible: true }),
    achievement({ id: "a", achievedDate: "2022-01-01", status: "APPROVED", publicVisible: true }),
  ]);
  assert.deepEqual(two.visible.map(label => label.id), ["a", "b"]);
  assert.deepEqual(two.overflow, []);
  assert.equal(two.hiddenCount, 0);

  const three = presentPublicLabels([
    achievement({ id: "c", achievedDate: "2019-01-01", status: "APPROVED", publicVisible: true }),
    achievement({ id: "a", achievedDate: "2022-01-01", status: "APPROVED", publicVisible: true }),
    achievement({ id: "revoked", achievedDate: "2023-01-01", status: "REVOKED", publicVisible: true, totalPoints: 80 }),
    achievement({ id: "b", achievedDate: "2021-01-01", status: "APPROVED", publicVisible: true }),
  ]);
  assert.equal(PUBLIC_LABEL_PREVIEW_LIMIT, 2);
  assert.deepEqual(three.visible.map(label => label.id), ["a", "b"]);
  assert.deepEqual(three.overflow.map(label => label.id), ["c"]);
  assert.equal(three.hiddenCount, 1);

  const filtered = presentPublicLabels(fixtures());
  assert.deepEqual(filtered.visible.map(label => label.id), ["a", "c"]);
  assert.equal(filtered.hiddenCount, 5);
  assert.equal(filtered.overflow.length, 5);
  assert.equal(publicLabelControlLabel(filtered.hiddenCount, false), "Xem thêm 5 nhãn thành tích công khai");
  assert.equal(publicLabelControlLabel(filtered.hiddenCount, true), "Thu gọn nhãn thành tích");
});

it("keeps the editorial honor label exact and separate from approval and points", () => {
  assert.equal(EDITORIAL_HONOR_LABEL, "Được vinh danh");
  assert.notEqual(EDITORIAL_HONOR_LABEL, STATUS_LABELS.APPROVED);
  assert.equal(EDITORIAL_HONOR_LABEL.includes("điểm"), false);
  assert.equal(EDITORIAL_HONOR_LABEL.includes("duyệt"), false);
});
