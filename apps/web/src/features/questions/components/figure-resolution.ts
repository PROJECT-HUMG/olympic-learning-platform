import { hasUuidFormat } from "../../../lib/uuid.ts";
import type { ScientificBlock, ScientificExplanation } from "../types/scientific-content.ts";

export interface ObjectUrlHost {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export interface FigureDownload {
  assetId: string;
  blob?: Blob;
  failed?: boolean;
}

export interface PrivateFigureState {
  assetId: string;
  phase: "loading" | "ready" | "error";
  message: string;
}


export function isPrivateFigureId(value: string): boolean {
  return hasUuidFormat(value);
}

export function canRetryPrivateFigure(questionId: string | null | undefined, assetId: string): boolean {
  return typeof questionId === "string" && questionId.length > 0 && isPrivateFigureId(assetId);
}

export function visibleToViewer<T>(showAnswer: boolean, value: T | null | undefined): T | null {
  if (!showAnswer || value == null) return null;
  return value;
}

export function figureViewState(questionReady: boolean, download: FigureDownload, hasUrl: boolean): PrivateFigureState {
  if (!questionReady) return { assetId: download.assetId, phase: "error", message: "Lưu bản nháp trước khi tải ảnh riêng." };
  if (download.failed) return { assetId: download.assetId, phase: "error", message: "Không tải được ảnh. Thử lại." };
  if (hasUrl) return { assetId: download.assetId, phase: "ready", message: "" };
  return { assetId: download.assetId, phase: "loading", message: "Đang tải ảnh…" };
}

export interface FigureSession { questionId: string; userId: string }
export interface FigureAuthority { revision: number; userId: string }

export function figureSession(questionId: string | null, userId: string | null): FigureSession | null {
  if (questionId == null || questionId.length === 0 || userId == null || userId.length === 0) return null;
  return { questionId, userId };
}

/** A profile id confirmed for this auth revision. A cached id alone is not authority. */
export function figureAuthorityUserId(accessToken: string | null, revision: number, authority: FigureAuthority | null): string | null {
  if (accessToken == null || accessToken.length === 0 || authority == null || authority.revision !== revision || authority.userId.length === 0) return null;
  return authority.userId;
}

export function withFigureAccount(figureKey: readonly string[], userId: string): readonly string[] {
  return [...figureKey, userId];
}

interface StoredFigureUrl { blob: Blob; url: string; questionId: string; userId: string }

export class FigureObjectUrlCache {
  private readonly entries = new Map<string, StoredFigureUrl>();
  private generation = 0;
  private questionId: string | null = null;
  private userId: string | null = null;
  private readonly host: ObjectUrlHost;

  constructor(host: ObjectUrlHost) {
    this.host = host;
  }

  token(): number { return this.generation; }

  bind(questionId: string | null, userId: string | null): void {
    const nextQuestion = questionId == null || questionId.length === 0 ? null : questionId;
    const nextUser = userId == null || userId.length === 0 ? null : userId;
    if (this.questionId === nextQuestion && this.userId === nextUser) return;
    this.clearEntries();
    this.generation += 1;
    this.questionId = nextQuestion;
    this.userId = nextUser;
  }

  accepts(session: FigureSession | null, generation: number): boolean {
    return session !== null && generation === this.generation && this.questionId === session.questionId && this.userId === session.userId;
  }

  resolve(session: FigureSession | null, assetId: string): string | undefined {
    if (session === null || this.questionId !== session.questionId || this.userId !== session.userId) return undefined;
    const entry = this.entries.get(assetId);
    if (entry?.questionId !== session.questionId || entry.userId !== session.userId) return undefined;
    return entry.url;
  }

  put(session: FigureSession, assetId: string, blob: Blob, generation: number): string | undefined {
    if (!this.accepts(session, generation)) return undefined;
    const current = this.entries.get(assetId);
    if (current?.blob === blob && current.questionId === session.questionId && current.userId === session.userId) return current.url;
    const url = this.host.createObjectURL(blob);
    if (!this.accepts(session, generation)) { this.host.revokeObjectURL(url); return undefined; }
    if (current) this.host.revokeObjectURL(current.url);
    this.entries.set(assetId, { blob, url, questionId: session.questionId, userId: session.userId });
    return url;
  }

  drop(assetId: string): void {
    const current = this.entries.get(assetId);
    if (!current) return;
    this.host.revokeObjectURL(current.url);
    this.entries.delete(assetId);
  }

  retain(assetIds: readonly string[]): void {
    const keep = new Set(assetIds);
    for (const [assetId, entry] of this.entries) {
      if (keep.has(assetId)) continue;
      this.host.revokeObjectURL(entry.url);
      this.entries.delete(assetId);
    }
  }

  revokeAll(): void {
    this.clearEntries();
    this.generation += 1;
    this.questionId = null;
    this.userId = null;
  }

  private clearEntries(): void {
    for (const entry of this.entries.values()) this.host.revokeObjectURL(entry.url);
    this.entries.clear();
  }
}

export function applyFigureDownloads(cache: FigureObjectUrlCache, generation: number, session: FigureSession | null, downloads: readonly FigureDownload[], active: boolean): boolean {
  if (!active || !cache.accepts(session, generation)) return false;
  for (const download of downloads) {
    if (!cache.accepts(session, generation) || session === null) return false;
    if (download.failed) cache.drop(download.assetId);
    else if (download.blob instanceof Blob) cache.put(session, download.assetId, download.blob, generation);
  }
  if (!cache.accepts(session, generation)) return false;
  cache.retain(downloads.map((download) => download.assetId));
  return true;
}

export function collectFigureAssetIds(groups: readonly (readonly ScientificBlock[])[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const blocks of groups) {
    for (const block of blocks) {
      if (block.kind !== "figure_group") continue;
      for (const figure of block.figures) {
        if (!isPrivateFigureId(figure.assetId) || seen.has(figure.assetId)) continue;
        seen.add(figure.assetId);
        ids.push(figure.assetId);
      }
    }
  }
  return ids;
}

export function viewerFigureGroups(input: {
  showAnswer: boolean;
  stem: readonly ScientificBlock[];
  parts: readonly { prompt: readonly ScientificBlock[]; options: readonly { content: readonly ScientificBlock[] }[] }[];
  explanation?: ScientificExplanation | null;
}): ScientificBlock[][] {
  const groups: ScientificBlock[][] = [[...input.stem]];
  for (const part of input.parts) {
    groups.push([...part.prompt]);
    for (const option of part.options) groups.push([...option.content]);
  }
  const explanation = visibleToViewer(input.showAnswer, input.explanation);
  if (explanation) for (const part of explanation.parts) groups.push([...part.solution]);
  return groups;
}
