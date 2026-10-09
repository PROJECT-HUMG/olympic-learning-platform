import { hasUuidFormat } from "../../../lib/uuid.ts";
import { parseApiError } from "../../../lib/api-error.ts";
import type { AvatarCrop } from "../../user/types/user.types";
export const GROUP_CONTRACT = "Dữ liệu nhóm không đúng hợp đồng.";
export function groupId(value: unknown): value is string { return typeof value === "string" && hasUuidFormat(value); }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && !!v.trim();
const count = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const instant = (v: unknown): v is string => typeof v === "string" && /T.*(Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v));
export interface GroupAvatar { id: string; crop: AvatarCrop }
export interface GroupSummary { id: string; name: string; ownerId: string; avatar: GroupAvatar | null }
export interface GroupSharing { shareDaily: boolean; sharingMode: "GROUP" | "SELECTED_MEMBERS"; selectedViewerIds: string[] }
export interface GroupDetail extends GroupSummary { members: { userId: string; displayName: string }[]; mySharing: GroupSharing }
export interface GroupInvitation { id: string; groupId: string; groupName: string; inviterId: string; inviterDisplayName: string; targetUserId: string; status: "PENDING" | "ACCEPTED" | "DECLINED"; createdAt: string }
export interface SharedMember { userId: string; displayName: string; access: "SHARED" | "NOT_SHARED"; summary: null | { planId: string; firstSubmittedAt: string | null; onTime: boolean; completedCount: number; totalCount: number; mustCompleted: number; mustTotal: number } }
export interface SharedDashboard { groupId: string; date: string; members: SharedMember[] }
export interface Contribution { id: string; authorId: string; authorDisplayName: string; text: string; createdAt: string; updatedAt: string; version: number }
export interface Feedback { contributions: Contribution[]; contributorCount: number }
export function readGroup(v: unknown): GroupSummary {
  if (!object(v) || !groupId(v.id) || !text(v.name) || !groupId(v.ownerId)) throw new Error(GROUP_CONTRACT);
  return { id:v.id, name:v.name, ownerId:v.ownerId, avatar: readGroupAvatar(v.avatar) };
}
export function readGroupAvatar(value: unknown): GroupAvatar | null {
  if (value === null || value === undefined) return null;
  if (!object(value) || !groupId(value.id) || !object(value.crop)) throw new Error(GROUP_CONTRACT);
  const { x, y, zoom } = value.crop;
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0 || x > 1
      || typeof y !== "number" || !Number.isFinite(y) || y < 0 || y > 1
      || typeof zoom !== "number" || !Number.isFinite(zoom) || zoom < 1 || zoom > 3) throw new Error(GROUP_CONTRACT);
  return { id: value.id, crop: { x, y, zoom } };
}
export function readSharing(v: unknown): GroupSharing {
  if (!object(v) || typeof v.shareDaily !== "boolean" || !["GROUP","SELECTED_MEMBERS"].includes(String(v.sharingMode))
    || !Array.isArray(v.selectedViewerIds) || !v.selectedViewerIds.every(groupId) || new Set(v.selectedViewerIds).size !== v.selectedViewerIds.length) throw new Error(GROUP_CONTRACT);
  return {shareDaily:v.shareDaily,sharingMode:v.sharingMode as GroupSharing["sharingMode"],selectedViewerIds:v.selectedViewerIds};
}
export function readGroupDetail(v: unknown, id: string): GroupDetail {
  const group = readGroup(v);
  if (group.id !== id || !object(v) || !Array.isArray(v.members)) throw new Error(GROUP_CONTRACT);
  const members = v.members.map(m => {
    if (!object(m) || !groupId(m.userId) || !text(m.displayName)) throw new Error(GROUP_CONTRACT);
    return {userId:m.userId,displayName:m.displayName};
  });
  if (new Set(members.map(m=>m.userId)).size !== members.length) throw new Error(GROUP_CONTRACT);
  return {...group,members,mySharing:readSharing(v.mySharing)};
}
export function readInvitation(v: unknown, target?: string): GroupInvitation {
  if (!object(v) || !groupId(v.id) || !groupId(v.groupId) || !text(v.groupName) || !groupId(v.inviterId)
    || !text(v.inviterDisplayName) || !groupId(v.targetUserId) || !["PENDING","ACCEPTED","DECLINED"].includes(String(v.status))
    || !instant(v.createdAt) || target && v.targetUserId !== target) throw new Error(GROUP_CONTRACT);
  return {id:v.id,groupId:v.groupId,groupName:v.groupName,inviterId:v.inviterId,inviterDisplayName:v.inviterDisplayName,targetUserId:v.targetUserId,status:v.status as GroupInvitation["status"],createdAt:v.createdAt};
}
export function readDashboard(v: unknown, id: string, date: string): SharedDashboard {
  if (!object(v) || v.groupId !== id || v.date !== date || !Array.isArray(v.members)) throw new Error(GROUP_CONTRACT);
  const members = v.members.map(m => {
    if (!object(m) || !groupId(m.userId) || !text(m.displayName) || !["SHARED","NOT_SHARED"].includes(String(m.access))) throw new Error(GROUP_CONTRACT);
    if (m.access === "NOT_SHARED" && m.summary !== null) throw new Error(GROUP_CONTRACT);
    let summary: SharedMember["summary"] = null;
    if (m.summary !== null) {
      const s = m.summary;
      if (!object(s) || !groupId(s.planId) || !(s.firstSubmittedAt === null || instant(s.firstSubmittedAt))
        || typeof s.onTime !== "boolean" || !count(s.completedCount) || !count(s.totalCount)
        || !count(s.mustCompleted) || !count(s.mustTotal) || s.completedCount > s.totalCount
        || s.mustCompleted > s.mustTotal || s.mustTotal > s.totalCount) throw new Error(GROUP_CONTRACT);
      summary={planId:s.planId,firstSubmittedAt:s.firstSubmittedAt,onTime:s.onTime,completedCount:s.completedCount,totalCount:s.totalCount,mustCompleted:s.mustCompleted,mustTotal:s.mustTotal};
    }
    return {userId:m.userId,displayName:m.displayName,access:m.access as SharedMember["access"],summary};
  });
  if (new Set(members.map(m=>m.userId)).size !== members.length) throw new Error(GROUP_CONTRACT);
  return {groupId:id,date,members};
}
export function readContribution(v: unknown): Contribution {
  if (!object(v) || !groupId(v.id) || !groupId(v.authorId) || !text(v.authorDisplayName)
    || !text(v.text) || v.text.length > 4000 || !instant(v.createdAt) || !instant(v.updatedAt) || !count(v.version)) throw new Error(GROUP_CONTRACT);
  return {id:v.id,authorId:v.authorId,authorDisplayName:v.authorDisplayName,text:v.text,createdAt:v.createdAt,updatedAt:v.updatedAt,version:v.version};
}
export function readFeedback(v: unknown): Feedback {
  if (!object(v) || !Array.isArray(v.contributions) || !count(v.contributorCount)) throw new Error(GROUP_CONTRACT);
  const contributions=v.contributions.map(readContribution);
  if (new Set(contributions.map(c=>c.authorId)).size !== contributions.length || contributions.length !== v.contributorCount) throw new Error(GROUP_CONTRACT);
  return {contributions,contributorCount:v.contributorCount};
}
export function groupAccessLost(error: unknown) { return [401,403,404].includes(parseApiError(error).status ?? 0); }
export function groupError(error: unknown) {
  if (error instanceof Error && error.message === GROUP_CONTRACT) return GROUP_CONTRACT;
  const status = parseApiError(error).status;
  if (status === 409) return "Bản trên máy chủ vừa đổi hoặc lời mời đã được xử lý. Bản đang nhập vẫn được giữ.";
  if (status === 403 || status === 404) return "Nội dung chưa được chia sẻ với bạn hoặc quyền truy cập đã thay đổi.";
  if (status === 400) return "Kiểm tra nội dung, tên đăng nhập và danh sách người xem rồi thử lại.";
  return "Không thực hiện được. Hãy thử lại.";
}
