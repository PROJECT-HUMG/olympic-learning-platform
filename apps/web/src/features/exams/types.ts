import type {
  ScientificAnswer,
  ScientificExplanation,
  ScientificQuestionContent,
} from "../questions/types/scientific-content";

/** Exam placement never writes points or instructions back into reusable bank content. */
export interface ExamItemInput {
  questionId: string;
  points: number;
  partPoints: Record<string, number>;
  instructions: string;
}

export interface ExamDraftInput {
  title: string;
  subjectId: string;
  instructions: string;
  releaseAt: string | null;
  items: ExamItemInput[];
  expectedVersion?: number;
}

export interface ExamDraft extends ExamDraftInput {
  id: string;
  createdById: string;
  version: number;
  latestPublishedVersion: number | null;
  totalPoints: number;
}

export interface FrozenExamItem extends ExamItemInput {
  content: ScientificQuestionContent;
  /** Present only in authorized staff solution previews. */
  answer?: ScientificAnswer;
  /** Optional material, present only in authorized staff solution previews. */
  explanation?: ScientificExplanation;
}

/** Student projection omits answer/explanation keys, not merely their visible controls. */
export interface ExamPaper {
  id: string;
  examId: string;
  versionNumber: number;
  title: string;
  subjectId: string;
  instructions: string;
  releaseAt: string;
  publishedAt: string;
  totalPoints: number;
  items: FrozenExamItem[];
}

/** Published summary. It has no items, answers, or explanations. */
export interface ExamPaperSummary {
  id: string;
  examId: string;
  versionNumber: number;
  title: string;
  subjectId: string;
  releaseAt: string;
  publishedAt: string;
  totalPoints: number;
}

/** Staff plain or solution view. Draft preview leaves id, versionNumber, and publishedAt null. */
export interface StaffExamView {
  id: string | null;
  examId: string;
  versionNumber: number | null;
  title: string;
  subjectId: string;
  instructions: string;
  releaseAt: string | null;
  publishedAt: string | null;
  totalPoints: number;
  items: StaffExamItem[];
}

export interface StaffExamItem {
  questionId: string;
  points: number;
  partPoints: Record<string, number>;
  instructions: string;
  content: ScientificQuestionContent;
  answer?: ScientificAnswer;
  explanation?: ScientificExplanation | null;
}

/** Released student paper. The item shape has no answer or explanation. */
export interface StudentExamItem {
  questionId: string;
  points: number;
  partPoints: Record<string, number>;
  instructions: string;
  content: ScientificQuestionContent;
}

export interface StudentExamPaper {
  id: string;
  examId: string;
  versionNumber: number;
  title: string;
  subjectId: string;
  instructions: string;
  releaseAt: string;
  publishedAt: string;
  totalPoints: number;
  items: StudentExamItem[];
}
