import type { Page } from "@/types/api.types";

export type Category = "OLYMPIC_NATIONAL" | "OLYMPIC_SCHOOL" | "RESEARCH_MINISTRY" | "RESEARCH_SCHOOL" | "RESEARCH_OTHER";
export type Award = "NONE" | "FIRST" | "SECOND" | "THIRD" | "CONSOLATION";
export type AchievementStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
export interface Participant { userId?: string | null; fullName: string; award?: string | null }
export interface HonorPhoto { id: string; url: string; originalName: string }
export interface Honor { id: string; title: string; subject: string; year: number; description: string | null; scope: "SCHOOL" | "NATIONAL" | "INTERNATIONAL" | "OTHER"; status: "DRAFT" | "PUBLISHED"; participants: Participant[]; photos: HonorPhoto[]; version: number; createdAt: string; updatedAt: string }
export type HonorInput = Pick<Honor, "title" | "subject" | "year" | "scope" | "status" | "participants"> & { description: string };
export interface Evidence { id: string; originalName: string; contentType: string; size: number }
export interface Achievement { id: string; userId: string; fullName: string; title: string; description: string | null; category: Category; award: Award; includeParticipation: boolean; achievedDate: string; publicVisible: boolean; status: AchievementStatus; awardPoints: number; participationPoints: number; totalPoints: number; reviewNote?: string | null; reviewedAt?: string | null; evidence?: Evidence[]; createdAt: string; updatedAt: string; version: number }
export type AchievementInput = Pick<Achievement, "title" | "category" | "award" | "includeParticipation" | "achievedDate" | "publicVisible"> & { description: string };
export interface Ranking { rank: number; userId: string; fullName: string; username: string; totalPoints: number; approvedCount: number }
export interface PublicProfile { userId: string; fullName: string; username: string; rankingOptIn: boolean; publicPoints: number; achievements: Achievement[] }
export interface RecognitionSettings { rankingOptIn: boolean }
export type RecognitionPage<T> = Page<T>;
