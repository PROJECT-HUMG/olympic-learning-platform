export type QuestionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface QuestionAsset {
  id: string;
  role: string;
  url: string;
  altText?: string | null;
  crop: unknown;
}

export interface Question {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  status: QuestionStatus;
  type: string;
  content: Record<string, unknown>;
  answer: Record<string, unknown>;
  explanation: Record<string, unknown>;
  difficulty?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
  assets: QuestionAsset[];
  createdById: string;
  version: number;
}

export interface QuestionPage {
  content: Question[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UpdateQuestionRequest {
  subjectId: string;
  topicId: string;
  type: string;
  content: Record<string, unknown>;
  answer: Record<string, unknown>;
  explanation?: Record<string, unknown> | null;
  difficulty?: string | null;
  expectedVersion?: number | null;
}

export interface TopicSummary {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
}

export interface QuestionFigureUpload {
  id: string;
  contentType: string;
  size: number;
  originalName: string;
}
