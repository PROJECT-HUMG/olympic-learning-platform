export type AssessmentImportStatus = "QUEUED" | "PROCESSING" | "REVIEW_REQUIRED" | "PUBLISHED" | "FAILED";
export type AssessmentImportPhase =
  | "QUEUED"
  | "RENDERING_PAGES"
  | "EXTRACTING_TEXT"
  | "PARSING_QUESTIONS"
  | "CROPPING_ASSETS"
  | "SAVING_DRAFTS"
  | "REVIEW_REQUIRED"
  | "PUBLISHED"
  | "FAILED";

export interface AssessmentImportStatusResponse {
  id: string;
  status: AssessmentImportStatus;
  phase: AssessmentImportPhase;
  progress: number;
  totalPages: number;
  processedPages: number;
  draftCount: number;
  warningCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDraftAsset {
  id: string;
  role: string;
  url: string;
  altText?: string | null;
  crop: unknown;
}

export interface AssessmentQuestionDraft {
  id: string;
  ordinal: number;
  status: "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
  content: Record<string, unknown>;
  answer: Record<string, unknown>;
  confidence?: number | null;
  warnings: string[];
  sourcePage?: number | null;
  sourceBbox?: unknown;
  sourcePageUrl?: string | null;
  assets: AssessmentDraftAsset[];
}

export interface Topic { id: string; subjectId: string; name: string; slug: string }
