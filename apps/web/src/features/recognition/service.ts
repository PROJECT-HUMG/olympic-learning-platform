import { apiClient } from "@/lib/axios";
import type { Achievement, AchievementInput, Honor, HonorInput, PublicProfile, Ranking, RecognitionPage, RecognitionSettings } from "./types";

const root = "/recognition";
const admin = "/admin/recognition";
const data = <T>(response: { data: T }) => response.data;
export const recognitionService = {
  honors: (params: { page?: number; size?: number; year?: number; subject?: string }, management = false) => apiClient.get<RecognitionPage<Honor>>(`${management ? admin : root}/honors`, { params }).then(data),
  honor: (id: string, management = false) => apiClient.get<Honor>(`${management ? admin : root}/honors/${id}`).then(data),
  saveHonor: (input: HonorInput, id?: string, version?: number) => id
    ? apiClient.put<Honor>(`${admin}/honors/${id}`, { ...input, expectedVersion: version }).then(data)
    : apiClient.post<Honor>(`${admin}/honors`, input).then(data),
  deleteHonor: (id: string) => apiClient.delete(`${admin}/honors/${id}`),
  addPhotos: (id: string, files: File[]) => {
    const form = new FormData(); files.forEach(file => form.append("files", file));
    return apiClient.post<Honor>(`${admin}/honors/${id}/photos`, form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120_000 }).then(data);
  },
  deletePhoto: (id: string, photoId: string) => apiClient.delete<Honor>(`${admin}/honors/${id}/photos/${photoId}`).then(data),
  photo: (id: string, photoId: string, management = false) => apiClient.get<Blob>(`${management ? admin : root}/honors/${id}/photos/${photoId}`, { responseType: "blob" }).then(data),
  rankings: (params: { year?: number; page?: number; size?: number }) => apiClient.get<RecognitionPage<Ranking>>(`${root}/rankings`, { params }).then(data),
  publicProfile: (id: string) => apiClient.get<PublicProfile>(`${root}/profiles/${id}`).then(data),
  mine: () => apiClient.get<Achievement[]>(`${root}/achievements/me`).then(data),
  settings: () => apiClient.get<RecognitionSettings>(`${root}/preferences/me`).then(data),
  saveSettings: (rankingOptIn: boolean) => apiClient.patch<RecognitionSettings>(`${root}/preferences/me`, { rankingOptIn }).then(data),
  submit: (input: AchievementInput, files: File[], userId?: string, id?: string) => {
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify({ ...input, ...(userId ? { userId } : {}) })], { type: "application/json" }));
    files.forEach(file => form.append("evidence", file));
    const options = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120_000 };
    return (id ? apiClient.put<Achievement>(`${root}/achievements/${id}`, form, options)
      : apiClient.post<Achievement>(`${userId ? admin : root}/achievements`, form, options)).then(data);
  },
  reviews: (params: { status?: string; userId?: string; page?: number; size?: number }) => apiClient.get<RecognitionPage<Achievement>>(`${admin}/achievements`, { params }).then(data),
  review: (record: Achievement, status: "APPROVED" | "REJECTED" | "REVOKED", note: string) => apiClient.post<Achievement>(`${admin}/achievements/${record.id}/review`, { status, note, expectedVersion: record.version }).then(data),
  visibility: (id: string, publicVisible: boolean) => apiClient.patch<Achievement>(`${root}/achievements/${id}/visibility`, { publicVisible }).then(data),
  evidence: (id: string, attachmentId: string) => apiClient.get<Blob>(`${root}/achievements/${id}/evidence/${attachmentId}`, { responseType: "blob" }).then(data),
};
