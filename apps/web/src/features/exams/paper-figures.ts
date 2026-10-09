import { hasUuidFormat } from "../../lib/uuid.ts";
export interface PaperFigureScope { userId: string; revision: number }
export interface PaperObjectUrlHost { createObjectURL(blob: Blob): string; revokeObjectURL(url: string): void }
export interface PaperDownload { assetId: string; blob?: Blob; failed?: boolean }
export interface PaperFigureState { assetId: string; phase: "loading" | "ready" | "error"; message: string }

export function isPrivateAssetId(value: string): boolean { return hasUuidFormat(value); }

export function paperFigureScope(userId: string | null | undefined, accessToken: string | null | undefined, revision: number): PaperFigureScope | null {
  if (typeof userId !== "string" || userId.length === 0) return null;
  if (typeof accessToken !== "string" || accessToken.length === 0) return null;
  if (!Number.isSafeInteger(revision) || revision < 0) return null;
  return { userId, revision };
}

export function paperFigureQueryKey(scope: PaperFigureScope, paperId: string, assetId: string) {
  return ["exams", "paper-figure", scope.userId, String(scope.revision), paperId, assetId] as const;
}

interface StoredUrl { blob: Blob; url: string; userId: string; revision: number; paperId: string }

export class PaperObjectUrlCache {
  private readonly entries = new Map<string, StoredUrl>();
  private generation = 0;
  private userId: string | null = null;
  private revision: number | null = null;
  private paperId: string | null = null;
  private readonly host: PaperObjectUrlHost;
  constructor(host: PaperObjectUrlHost) { this.host = host; }
  token(): number { return this.generation; }
  bind(scope: PaperFigureScope | null, paperId: string | null): void {
    const nextUser = scope?.userId ?? null;
    const nextRevision = scope?.revision ?? null;
    const nextPaper = paperId && paperId.length > 0 ? paperId : null;
    if (this.userId === nextUser && this.revision === nextRevision && this.paperId === nextPaper) return;
    this.clear();
    this.generation += 1;
    this.userId = nextUser;
    this.revision = nextRevision;
    this.paperId = nextPaper;
  }
  accepts(scope: PaperFigureScope | null, paperId: string | null, generation: number): boolean {
    return scope !== null && paperId !== null && paperId.length > 0 && generation === this.generation && this.userId === scope.userId && this.revision === scope.revision && this.paperId === paperId;
  }
  resolve(scope: PaperFigureScope | null, paperId: string | null, assetId: string): string | undefined {
    if (!scope || !this.accepts(scope, paperId, this.generation)) return undefined;
    const entry = this.entries.get(assetId);
    if (!entry || entry.userId !== scope.userId || entry.revision !== scope.revision || entry.paperId !== paperId) return undefined;
    return entry.url;
  }
  put(scope: PaperFigureScope, paperId: string, assetId: string, blob: Blob, generation: number): string | undefined {
    if (!this.accepts(scope, paperId, generation)) return undefined;
    const current = this.entries.get(assetId);
    if (current?.blob === blob && current.userId === scope.userId && current.revision === scope.revision && current.paperId === paperId) return current.url;
    const url = this.host.createObjectURL(blob);
    if (!this.accepts(scope, paperId, generation)) { this.host.revokeObjectURL(url); return undefined; }
    if (current) this.host.revokeObjectURL(current.url);
    this.entries.set(assetId, { blob, url, userId: scope.userId, revision: scope.revision, paperId });
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
    this.clear();
    this.generation += 1;
    this.userId = null;
    this.revision = null;
    this.paperId = null;
  }
  private clear(): void {
    for (const entry of this.entries.values()) this.host.revokeObjectURL(entry.url);
    this.entries.clear();
  }
}

export function applyPaperDownloads(cache: PaperObjectUrlCache, generation: number, scope: PaperFigureScope | null, paperId: string | null, downloads: readonly PaperDownload[], active: boolean): boolean {
  if (!active || !cache.accepts(scope, paperId, generation) || scope === null || paperId === null) return false;
  for (const download of downloads) {
    if (!cache.accepts(scope, paperId, generation)) return false;
    if (download.failed) cache.drop(download.assetId);
    else if (download.blob instanceof Blob) cache.put(scope, paperId, download.assetId, download.blob, generation);
  }
  if (!cache.accepts(scope, paperId, generation)) return false;
  cache.retain(downloads.map((download) => download.assetId));
  return true;
}

export function paperFigureView(download: PaperDownload, hasUrl: boolean, ready: boolean): PaperFigureState {
  if (!ready || download.failed) return { assetId: download.assetId, phase: "error", message: "Không tải được ảnh. Thử lại." };
  if (hasUrl) return { assetId: download.assetId, phase: "ready", message: "" };
  return { assetId: download.assetId, phase: "loading", message: "Đang tải ảnh…" };
}
