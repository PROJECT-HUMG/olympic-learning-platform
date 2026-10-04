import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY_CURRENT_USER, useCurrentUser } from "../../auth/hooks/use-current-user.ts";
import { useAuthStore } from "../../../stores/use-auth-store.ts";
import { questionKeys } from "../hooks/use-questions.ts";
import { questionService } from "../services/question.service.ts";
import { applyFigureDownloads, canRetryPrivateFigure, FigureObjectUrlCache, figureAuthorityUserId, figureSession, figureViewState, isPrivateFigureId, withFigureAccount, type FigureAuthority, type FigureDownload, type ObjectUrlHost, type PrivateFigureState } from "./figure-resolution.ts";

const STALE = 5 * 60 * 1000;
const objectUrlHost: ObjectUrlHost = {
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
};
export interface PrivateFigureResolver {
  resolveFigure: (assetId: string) => string | undefined;
  figures: PrivateFigureState[];
  retry: (assetId: string) => void;
}
function profileId(value: unknown): string | null {
  if (value == null || typeof value !== "object" || !("id" in value)) return null;
  const id = (value as { id: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
export function usePrivateFigureResolver(questionId: string | null | undefined, assetIds: readonly string[]): PrivateFigureResolver {
  const question = typeof questionId === "string" && questionId.length > 0 ? questionId : null;
  useCurrentUser();
  const accessToken = useAuthStore((state) => state.accessToken);
  const revision = useAuthStore((state) => state.revision);
  const client = useQueryClient();
  const cacheRef = useRef<FigureObjectUrlCache | null>(null);
  if (cacheRef.current === null) cacheRef.current = new FigureObjectUrlCache(objectUrlHost);
  const cache = cacheRef.current;
  const [authority, setAuthority] = useState<FigureAuthority | null>(null);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const userId = figureAuthorityUserId(accessToken, revision, authority);
  if ((userId !== null || accessToken == null || accessToken.length === 0) && confirmFailed) setConfirmFailed(false);
  const idKey = Array.from(new Set(assetIds.filter((assetId) => isPrivateFigureId(assetId)))).join("|");
  const ids = useMemo(() => (idKey === "" ? [] : idKey.split("|")), [idKey]);
  const session = figureSession(question, userId);
  const results = useQueries({ queries: ids.map((assetId) => ({
    queryKey: session ? withFigureAccount([...questionKeys.figure(session.questionId, assetId)], session.userId) : ["questions", "figure", "unbound", assetId],
    enabled: session !== null, staleTime: STALE, retry: false,
    queryFn: () => {
      if (session === null) throw new Error("Câu hỏi chưa được lưu.");
      return questionService.downloadFigure(session.questionId, assetId);
    },
  })) });
  const downloads: FigureDownload[] = ids.map((assetId, index) => {
    const result = results[index];
    const fetching = result?.fetchStatus === "fetching";
    const failed = !fetching && (result?.isError === true || result?.error != null);
    return { assetId, failed, blob: !failed && result?.data instanceof Blob ? result.data : undefined };
  });
  const snapshotRef = useRef(downloads);
  snapshotRef.current = downloads;
  const stamp = `${question ?? ""}#${userId ?? ""}#${results.map((result) => `${result?.dataUpdatedAt ?? 0}:${result?.errorUpdatedAt ?? 0}:${result?.fetchStatus ?? ""}:${result?.status ?? ""}`).join("|")}`;
  const [, setEpoch] = useState(0);

  useEffect(() => {
    if (accessToken == null || accessToken.length === 0) return;
    let cancelled = false;
    const revisionAtStart = revision;
    const tokenAtStart = accessToken;
    void (async () => {
      await client.cancelQueries({ queryKey: QUERY_KEY_CURRENT_USER, exact: true });
      if (cancelled || useAuthStore.getState().revision !== revisionAtStart || useAuthStore.getState().accessToken !== tokenAtStart) return;
      const before = client.getQueryState(QUERY_KEY_CURRENT_USER)?.dataUpdateCount ?? 0;
      await client.refetchQueries({ queryKey: QUERY_KEY_CURRENT_USER, exact: true });
      if (cancelled || useAuthStore.getState().revision !== revisionAtStart || useAuthStore.getState().accessToken !== tokenAtStart) return;
      const state = client.getQueryState(QUERY_KEY_CURRENT_USER);
      const id = profileId(state?.data);
      if (state == null || state.status !== "success" || state.dataUpdateCount <= before || id === null) { setConfirmFailed(true); return; }
      setAuthority({ revision: revisionAtStart, userId: id });
    })();
    return () => { cancelled = true; };
  }, [accessToken, revision, client]);
  useLayoutEffect(() => {
    cache.bind(question, userId);
    const live = figureSession(question, userId);
    applyFigureDownloads(cache, cache.token(), live, snapshotRef.current, live !== null);
    setEpoch((value) => value + 1);
  }, [stamp, cache, question, userId]);
  useLayoutEffect(() => () => { cache.revokeAll(); }, [cache]);
  const figures: PrivateFigureState[] = downloads.map((download) => {
    if (!question) return figureViewState(false, download, false);
    if (userId === null) return accessToken != null && accessToken.length > 0 && !confirmFailed
      ? { assetId: download.assetId, phase: "loading", message: "Đang tải ảnh…" }
      : { assetId: download.assetId, phase: "error", message: "Không tải được ảnh. Thử lại." };
    return figureViewState(true, download, cache.resolve(session, download.assetId) !== undefined);
  });
  return {
    resolveFigure: (assetId) => cache.resolve(session, assetId),
    figures,
    retry: (assetId) => {
      if (session === null || !canRetryPrivateFigure(session.questionId, assetId)) return;
      void client.refetchQueries({ queryKey: withFigureAccount([...questionKeys.figure(session.questionId, assetId)], session.userId), exact: true });
    },
  };
}
