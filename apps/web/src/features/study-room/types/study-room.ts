import type { AvatarCrop } from "@/features/user/types/user.types";
export type RequestPolicy = "AFTER_FOCUS" | "OPEN" | "HOST_ONLY";

export interface RoomSettings {
  requestPolicy: RequestPolicy;
  minimumStudyMinutes: number;
}

export interface CreateRoomInput extends RoomSettings {
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
}

export interface RoomRhythm {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  expectedVersion: number;
}

export interface StudyRoomSummary extends CreateRoomInput {
  id: string;
  ownerId: string;
  ownerName: string;
  activeMembers: number;
}

export interface RoomPlayback {
  videoId: string;
  title: string;
  startedAt: string;
  version: number;
  isDefault: boolean;
}

export interface StudyRoomMember {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  avatarCrop?: AvatarCrop | null;
  focusSeconds: number;
  online: boolean;
}

export interface StudyRoomSnapshot extends StudyRoomSummary {
  closed: boolean;
  serverNow: string;
  phase: "FOCUS" | "BREAK" | "LONG_BREAK";
  phaseEndsAt: string;
  sessionNumber: number;
  rhythmVersion?: number;
  playback: RoomPlayback;
  members: StudyRoomMember[];
  me: { userId: string; focusSeconds: number; canRequest: boolean; remainingStudySeconds: number } | null;
  tracks: {
    id: string;
    videoId: string;
    title: string;
    requestedById: string;
    requestedByName: string;
    status: "PENDING" | "APPROVED";
    createdAt: string;
  }[];
}

export type RoomAction =
  | { type: "join" | "leave" | "close" }
  | { type: "settings"; input: RoomSettings }
  | { type: "rhythm"; input: RoomRhythm }
  | { type: "owner"; userId: string }
  | { type: "request"; input: { youtubeUrl: string; title: string } }
  | { type: "approve" | "reject"; trackId: string }
  | { type: "next"; expectedVersion: number };
