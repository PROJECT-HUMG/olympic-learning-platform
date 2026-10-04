import { apiClient } from "@/lib/axios";
import { EVIDENCE_CONTRACT, evidenceHttpUrl, evidenceLabel, evidenceUploadName, requireEvidenceItem, requireEvidenceScope, type EvidenceStage } from "./evidence-contract";
import { evidenceCreationResponse, evidenceListResponse, evidenceUploadIssue } from "./evidence-policy";

export interface SavedEvidenceScope {
  userId: string;
  planId: string;
  taskId: string;
  groupId: string | null;
}

function root(scope: SavedEvidenceScope) {
  requireEvidenceScope(scope.userId, scope.planId, scope.taskId, scope.groupId);
  return `/daily/plans/${scope.planId}/tasks/${scope.taskId}/evidence`;
}

function ownedRoot(scope: SavedEvidenceScope) {
  if (scope.groupId !== null) throw new Error(EVIDENCE_CONTRACT);
  return root(scope);
}

export const evidenceService = {
  async list(scope: SavedEvidenceScope, signal: AbortSignal) {
    const response = await apiClient.get(root(scope), { signal, params: scope.groupId ? { groupId: scope.groupId } : undefined });
    return evidenceListResponse(response.status, response.data, scope);
  },
  async upload(scope: SavedEvidenceScope, stage: EvidenceStage, file: File, signal: AbortSignal) {
    const issue = evidenceUploadIssue(file);
    if (issue) throw new Error(issue);
    const body = new FormData();
    body.append("stage", stage);
    body.append("file", file, evidenceUploadName(file.name)!);
    const response = await apiClient.post(ownedRoot(scope), body, { signal, headers: { "Content-Type": undefined } });
    return evidenceCreationResponse(response.status, response.data, { ...scope, stage, kind: "FILE" });
  },
  async link(scope: SavedEvidenceScope, stage: EvidenceStage, url: string, label: string, signal: AbortSignal) {
    const validUrl = evidenceHttpUrl(url);
    const validLabel = evidenceLabel(label);
    if (!validUrl || !validLabel) throw new Error(EVIDENCE_CONTRACT);
    const response = await apiClient.post(`${ownedRoot(scope)}/links`, { stage, url: validUrl, label: validLabel }, { signal });
    return evidenceCreationResponse(response.status, response.data, { ...scope, stage, kind: "LINK" });
  },
  async remove(scope: SavedEvidenceScope, id: string, signal: AbortSignal) {
    requireEvidenceItem(scope.userId, scope.planId, scope.taskId, id, scope.groupId);
    const response = await apiClient.delete(`${ownedRoot(scope)}/${id}`, { signal });
    if (response.status !== 204) throw new Error(EVIDENCE_CONTRACT);
  },
  async download(scope: SavedEvidenceScope, id: string, signal: AbortSignal) {
    requireEvidenceItem(scope.userId, scope.planId, scope.taskId, id, scope.groupId);
    const response = await apiClient.get<Blob>(`${root(scope)}/${id}/bytes`, {
      signal, responseType: "blob", params: scope.groupId ? { groupId: scope.groupId } : undefined,
    });
    if (response.status !== 200 || !(response.data instanceof Blob)
        || response.data.size < 1 || response.data.size > 5 * 1024 * 1024) throw new Error(EVIDENCE_CONTRACT);
    return response.data;
  },
};
