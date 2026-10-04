import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/stores/use-auth-store";
import { examService } from "../services/exam.service";
import { applyPaperDownloads, isPrivateAssetId, PaperObjectUrlCache, paperFigureQueryKey, paperFigureScope, paperFigureView, type PaperDownload, type PaperFigureScope, type PaperFigureState } from "../paper-figures";

const host = { createObjectURL: (blob: Blob) => URL.createObjectURL(blob), revokeObjectURL: (url: string) => URL.revokeObjectURL(url) };

export function usePaperFigureResolver(paperId: string | null | undefined, assetIds: readonly string[]) {
  const paper = typeof paperId === "string" && paperId.length > 0 ? paperId : null;
  const current = useCurrentUser();
  const accessToken = useAuthStore((state) => state.accessToken);
  const revision = useAuthStore((state) => state.revision);
  const scope = paperFigureScope(current.data?.id, accessToken, revision);
  const client = useQueryClient();
  const cacheRef = useRef<PaperObjectUrlCache | null>(null);
  if (cacheRef.current === null) cacheRef.current = new PaperObjectUrlCache(host);
  const cache = cacheRef.current;
  cache.bind(scope, paper);
  const scopeRef = useRef<PaperFigureScope | null>(scope);
  scopeRef.current = scope;
  const idKey = Array.from(new Set(assetIds.filter(isPrivateAssetId))).join("|");
  const ids = useMemo(() => (idKey === "" ? [] : idKey.split("|")), [idKey]);
  const ready = scope !== null && paper !== null;
  const results = useQueries({ queries: ids.map((assetId) => ({
    queryKey: ready ? paperFigureQueryKey(scope, paper, assetId) : ["exams", "paper-figure", "unbound", assetId],
    enabled: ready,
    retry: false,
    staleTime: 60_000,
    queryFn: ({ signal }: { signal: AbortSignal }) => {
      if (!scope || !paper) throw new Error("Ảnh đề chưa được gắn với phiên đăng nhập.");
      return examService.downloadPaperFigure(paper, assetId, signal);
    },
  })) });
  const downloads: PaperDownload[] = results.map((result, index) => ({
    assetId: ids[index] ?? "",
    failed: result.isError,
    blob: !result.isError && result.data instanceof Blob ? result.data : undefined,
  }));
  const downloadsRef = useRef(downloads);
  downloadsRef.current = downloads;
  const stamp = results.map((result) => `${result.dataUpdatedAt}:${result.status}:${result.fetchStatus}`).join("|");
  const scopeKey = scope ? `${scope.userId}:${scope.revision}` : "";
  const [epoch, setEpoch] = useState(0);
  useLayoutEffect(() => {
    const live = scopeRef.current;
    cache.bind(live, paper);
    const generation = cache.token();
    applyPaperDownloads(cache, generation, live, paper, downloadsRef.current, cache.accepts(live, paper, generation));
    setEpoch((value) => value + 1);
  }, [stamp, scopeKey, paper, cache]);
  useLayoutEffect(() => () => cache.revokeAll(), [cache]);
  void epoch;
  const figures: PaperFigureState[] = downloads.map((download) => paperFigureView(download, cache.resolve(scope, paper, download.assetId) !== undefined, ready));
  return {
    resolveFigure: (assetId: string) => cache.resolve(scope, paper, assetId),
    figures,
    retry: (assetId: string) => {
      if (!scope || !paper || !isPrivateAssetId(assetId)) return;
      void client.refetchQueries({ queryKey: paperFigureQueryKey(scope, paper, assetId), exact: true });
    },
  };
}
