import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import AssessmentImportPage from "@/pages/assessment-import-page";
import ProfilePage from "@/pages/profile-page";
import QuestionDetailPage from "@/pages/question-detail-page";
import QuestionBankPage from "@/pages/question-bank-page";
import DocumentDetailPage from "@/pages/document-detail-page";
import NewsDetailPage from "@/pages/news-detail-page";
import { ProtectedRoute } from "@/router/guards/protected-route";
import { RoleGuard } from "@/router/guards/role-guard";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { DocumentCard } from "@/features/documents/components/document-card";
import { DocumentCardSkeleton } from "@/features/documents/components/document-card-skeleton";
import { SystemCategoryDataTable } from "@/features/system-categories/components/system-category-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/query-client";
import { QUERY_KEY_CURRENT_USER } from "@/lib/auth-session";
import { useAuthStore } from "@/stores/use-auth-store";
import type { DocumentResponse } from "@/features/documents/types/documents.types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import "@/index.css";

declare global {
  interface Window {
    loadingChecks: {
      refetchUser: () => Promise<void>;
      login?: () => Promise<void>;
      cachedUserId: () => string | undefined;
      rotateToken: () => void;
      refetchAssessment: () => Promise<void>;
    };
  }
}

// Test-only bridge mounts the actual login hook. No production backdoor.
useAuthStore.getState().setAccessToken("synthetic-loading-only");
window.loadingChecks = {
  refetchUser: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_CURRENT_USER }),
  cachedUserId: () => queryClient.getQueryData<{ id: string }>(QUERY_KEY_CURRENT_USER)?.id,
  rotateToken: () => useAuthStore.getState().setAccessToken("synthetic-rotated-token"),
  refetchAssessment: () => queryClient.invalidateQueries({ queryKey: ["assessment-imports"] }),
};

export function AuthBridge() {
  const { login } = useAuth();
  useEffect(() => {
    window.loadingChecks.login = () => login("synthetic-b", "synthetic-only");
    return () => { delete window.loadingChecks.login; };
  }, [login]);
  return null;
}

const uid = "00000000-0000-0000-0000-000000000001";
const sample = {
  id: uid, title: "Synthetic document with optional description", slug: "fixture",
  description: "Synthetic description, not a live record.", thumbnailUrl: null,
  createdAt: "2026-10-01T00:00:00Z", owner: { id: uid, username: "fixture", fullName: "Synthetic owner", avatarUrl: null },
  category: { id: uid, name: "Synthetic category" }, subject: { id: uid, name: "Synthetic subject" }, tags: [],
} as DocumentResponse;

export function Compositions() {
  return <main className="page-shell">
    <div id="motion" role="status" aria-label="Synthetic pending" aria-busy="true"><Skeleton className="h-8 w-32" /></div>
    <div id="cards" className="grid gap-4 sm:grid-cols-3">
      <div id="card-skeleton"><DocumentCardSkeleton /></div>
      <div id="card-actual"><DocumentCard document={sample} onDownload={() => undefined} /></div>
      <div id="card-no-description"><DocumentCard document={{ ...sample, description: "" }} /></div>
    </div>
    <SystemCategoryDataTable data={undefined} isLoading columns={[{ key: "name", header: "Tên", cell: (item: { id: string }) => item.id }]}
      onEdit={() => undefined} onDelete={() => undefined} />
  </main>;
}

const route = new URLSearchParams(location.search).get("route") ?? "/compositions";
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <p className="px-4 py-2 text-xs">Synthetic loading checks — no live data</p>
    <MemoryRouter initialEntries={[{ pathname: route, state: { from: route } }]}>
      <AuthBridge />
      <Routes>
        <Route path="/compositions" element={<Compositions />} />
        <Route path="/documents/:slug" element={<DocumentDetailPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/login" element={<p id="login-fallback">Synthetic login destination</p>} />
        <Route path="/" element={<p id="public-fallback">Synthetic public destination</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} fallbackPath="/" />}>
            <Route path="/admin/assessment-import" element={<AssessmentImportPage />} />
            <Route path="/admin/questions/:id" element={<QuestionDetailPage />} />
            <Route path="/admin/questions" element={<QuestionBankPage />} />
            <Route element={<DashboardLayout />}><Route path="/admin/guard-secret" element={<p id="guard-secret">Authorized synthetic content</p>} /></Route>
          </Route>
        </Route>
        <Route element={<RoleGuard allowedRoles={["ADMIN"]} fallbackPath="/" />}>
          <Route path="/role-only" element={<Outlet />}><Route index element={<p id="role-secret">Authorized synthetic role content</p>} /></Route>
        </Route>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);
