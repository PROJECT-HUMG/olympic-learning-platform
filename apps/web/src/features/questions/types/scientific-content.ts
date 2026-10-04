/** Editable scientific source, independent of rendering and exam placement. */
export interface TextBlock {
  id: string;
  kind: "text";
  source: string;
}

export interface MathBlock {
  id: string;
  kind: "math";
  source: string;
  display: boolean;
}

export interface ScientificFigure {
  assetId: string;
  alt: string;
  caption: string;
}

export interface FigureGroupBlock {
  id: string;
  kind: "figure_group";
  layout: "full_width" | "side_by_side";
  figures: ScientificFigure[];
}

export type ScientificBlock = TextBlock | MathBlock | FigureGroupBlock;
export type ResponseType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "WRITTEN";

export interface QuestionOption {
  id: string;
  content: ScientificBlock[];
}

export interface QuestionPart {
  id: string;
  responseType: ResponseType;
  prompt: ScientificBlock[];
  options: QuestionOption[];
}

export interface ScientificQuestionContent {
  schemaVersion: 1;
  title: string;
  structure: "SINGLE" | "MULTIPART";
  stem: ScientificBlock[];
  parts: QuestionPart[];
}

export interface ScientificAnswer {
  parts: { partId: string; correctOptionIds: string[] }[];
}

export interface ScientificExplanation {
  parts: { partId: string; solution: ScientificBlock[]; rubric: string }[];
}

/** Asset URLs are resolved by an authorized caller, never authored as raw HTML. */
export type FigureResolver = (assetId: string) => string | undefined;
