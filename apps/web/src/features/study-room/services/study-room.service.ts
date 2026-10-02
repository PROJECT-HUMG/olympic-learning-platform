import { apiClient } from "@/lib/axios";
import type { CreateRoomInput, RoomAction, StudyRoomSnapshot, StudyRoomSummary } from "../types/study-room";

const base = "/study-rooms";

export const studyRoomService = {
  list: (signal?: AbortSignal) => apiClient.get<StudyRoomSummary[]>(base, { signal }).then((r) => r.data),
  create: (input: CreateRoomInput) => apiClient.post<StudyRoomSnapshot>(base, input).then((r) => r.data),
  get: (id: string, signal?: AbortSignal) => apiClient.get<StudyRoomSnapshot>(`${base}/${id}`, { signal }).then((r) => r.data),
  heartbeat: (id: string, signal?: AbortSignal) => apiClient.post<StudyRoomSnapshot>(`${base}/${id}/heartbeat`, {}, { signal }).then((r) => r.data),
  async act(id: string, action: RoomAction): Promise<StudyRoomSnapshot | null> {
    const path = `${base}/${id}`;
    switch (action.type) {
      case "leave": await apiClient.post(`${path}/leave`); return null;
      case "settings": return apiClient.patch<StudyRoomSnapshot>(`${path}/settings`, action.input).then((r) => r.data);
      case "rhythm": return apiClient.patch<StudyRoomSnapshot>(`${path}/rhythm`, action.input).then((r) => r.data);
      case "owner": return apiClient.post<StudyRoomSnapshot>(`${path}/owner`, { userId: action.userId }).then((r) => r.data);
      case "request": return apiClient.post<StudyRoomSnapshot>(`${path}/tracks`, action.input).then((r) => r.data);
      case "approve":
      case "reject": return apiClient.post<StudyRoomSnapshot>(`${path}/tracks/${action.trackId}/${action.type}`).then((r) => r.data);
      case "next": return apiClient.post<StudyRoomSnapshot>(`${path}/playback/next`, { expectedVersion: action.expectedVersion }).then((r) => r.data);
      default: return apiClient.post<StudyRoomSnapshot>(`${path}/${action.type}`).then((r) => r.data);
    }
  },
};
