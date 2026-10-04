import { apiClient } from "@/lib/axios";
import { alignedDailyPlan, alignedDailyWeek, readDailyPlan, readDailyWeek } from "../lib/daily-contract";
import { GROUP_CONTRACT, groupId, readGroup, readGroupDetail, readSharing, readInvitation, readDashboard, readFeedback, readContribution, readGroupAvatar, type GroupSharing } from "./group-contract";
import type { AvatarCrop } from "@/features/user/types/user.types";
function root(id: string) { if(!groupId(id))throw new Error(GROUP_CONTRACT); return `/groups/${id}`; }
function reviewRoot(id:string,owner:string,kind:"plans"|"weeks",review:string) {
  if(!groupId(owner)||!groupId(review))throw new Error(GROUP_CONTRACT);
  return `${root(id)}/daily/${owner}/${kind}/${review}/feedback`;
}
export const groupService = {
  async avatarBytes(id: string, avatarId: string, signal: AbortSignal) {
    if (!groupId(avatarId)) throw new Error(GROUP_CONTRACT);
    const { data } = await apiClient.get<Blob>(`${root(id)}/avatar/${avatarId}`, { signal, responseType: "blob" });
    if (!(data instanceof Blob) || !["image/jpeg", "image/png", "image/webp"].includes(data.type)
        || data.size < 1 || data.size > 5 * 1024 * 1024) throw new Error(GROUP_CONTRACT);
    return data;
  },
  async uploadAvatar(id: string, image: File, crop: AvatarCrop, signal: AbortSignal) {
    const body = new FormData();
    body.append("image", image);
    body.append("crop", new Blob([JSON.stringify(crop)], { type: "application/json" }));
    const { data } = await apiClient.post(`${root(id)}/avatar`, body, { signal, headers: { "Content-Type": undefined } });
    const avatar = readGroupAvatar(data);
    if (!avatar) throw new Error(GROUP_CONTRACT);
    return avatar;
  },
  async cropAvatar(id: string, avatarId: string, crop: AvatarCrop, signal: AbortSignal) {
    if (!groupId(avatarId)) throw new Error(GROUP_CONTRACT);
    const avatar = readGroupAvatar((await apiClient.put(`${root(id)}/avatar/${avatarId}/crop`, crop, { signal })).data);
    if (!avatar || avatar.id !== avatarId) throw new Error(GROUP_CONTRACT);
    return avatar;
  },
  async removeAvatar(id: string, avatarId: string, signal: AbortSignal) {
    if (!groupId(avatarId)) throw new Error(GROUP_CONTRACT);
    await apiClient.delete(`${root(id)}/avatar/${avatarId}`, { signal });
  },
  async list(signal?:AbortSignal) {
    const {data}=await apiClient.get("/groups",{signal});
    if(!Array.isArray(data))throw new Error(GROUP_CONTRACT);
    return data.map(readGroup);
  },
  async create(name:string,signal?:AbortSignal) { return readGroup((await apiClient.post("/groups",{name},{signal})).data); },
  async detail(id:string,signal?:AbortSignal) { return readGroupDetail((await apiClient.get(root(id),{signal})).data,id); },
  async sharing(id:string,body:GroupSharing,signal?:AbortSignal) { return readSharing((await apiClient.put(`${root(id)}/sharing`,body,{signal})).data); },
  async leave(id:string,signal?:AbortSignal) { await apiClient.post(`${root(id)}/leave`,undefined,{signal}); },
  async invite(id:string,username:string,signal?:AbortSignal) { return readInvitation((await apiClient.post(`${root(id)}/invitations`,{username},{signal})).data); },
  async invitations(userId:string,signal?:AbortSignal) {
    const {data}=await apiClient.get("/groups/invitations",{signal});
    if(!Array.isArray(data))throw new Error(GROUP_CONTRACT);
    return data.map(v=>readInvitation(v,userId));
  },
  async respond(id:string,action:"accept"|"decline",signal?:AbortSignal) {
    if(!groupId(id))throw new Error(GROUP_CONTRACT);
    await apiClient.post(`/groups/invitations/${id}/${action}`,undefined,{signal});
  },
  async dashboard(id:string,date:string,signal?:AbortSignal) { return readDashboard((await apiClient.get(`${root(id)}/daily`,{params:{date},signal})).data,id,date); },
  async plan(id:string,owner:string,date:string,signal?:AbortSignal) {
    if(!groupId(owner))throw new Error(GROUP_CONTRACT);
    const read=readDailyPlan((await apiClient.get(`${root(id)}/daily/${owner}/plans`,{params:{date},signal})).data);
    const plan=read&&alignedDailyPlan(read,owner,date);
    if(!plan)throw new Error(GROUP_CONTRACT);
    return plan;
  },
  async week(id:string,owner:string,weekStart:string,signal?:AbortSignal) {
    if(!groupId(owner))throw new Error(GROUP_CONTRACT);
    const read=readDailyWeek((await apiClient.get(`${root(id)}/daily/${owner}/weeks`,{params:{weekStart},signal})).data);
    const week=read&&alignedDailyWeek(read,weekStart);
    if(!week)throw new Error(GROUP_CONTRACT);
    return week;
  },
  async feedback(id:string,owner:string,kind:"plans"|"weeks",review:string,signal?:AbortSignal) {
    return readFeedback((await apiClient.get(reviewRoot(id,owner,kind,review),{signal})).data);
  },
  async saveFeedback(id:string,owner:string,kind:"plans"|"weeks",review:string,text:string,expectedVersion:number|null,signal?:AbortSignal) {
    return readContribution((await apiClient.put(reviewRoot(id,owner,kind,review),{text,expectedVersion},{signal})).data);
  },
  async removeFeedback(id:string,owner:string,kind:"plans"|"weeks",review:string,expectedVersion:number,signal?:AbortSignal) {
    await apiClient.delete(reviewRoot(id,owner,kind,review),{params:{expectedVersion},signal});
  }
};
