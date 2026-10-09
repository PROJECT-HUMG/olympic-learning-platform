// Actual consumers with synthetic, intercepted data. No live credentials or API.
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { PostImageUpload } from "@/features/post/components/post-image-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import DocumentsManagementPage from "@/pages/dashboard/documents/documents-management-page";
import { PostManagementFeature } from "@/features/post/components/post-management-feature";
import QuestionBankPage from "@/pages/question-bank-page";
import { DailyReflectionField } from "@/features/daily/ui/daily-reflection-field";
import { DashboardDocumentList } from "@/features/documents/components/dashboard-document-list";
import { DashboardPostList } from "@/features/post/components/dashboard-post-list";
import { InlineRetryFeedback } from "@/components/ui/inline-retry-feedback";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { AppPagination } from "@/components/ui/app-pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import "@/index.css";

function Owners() {
  const [reflection, setReflection] = useState("");
  const [event, setEvent] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [page, setPage] = useState(2);
  const category = { id: "fixture", code: "fixture", name: "Synthetic category", slug: "fixture", description: "Synthetic" };
  return <>
    <DailyReflectionField id="reflection" label="Nhìn lại ngày học" value={reflection} onChange={setReflection} />
    <output id="reflection-value">{reflection}</output>
    <section id="document-row"><DashboardDocumentList data={[{ id: "doc", title: "Tài liệu tổng hợp tiếng Việt dài để kiểm tra trên màn hình hẹp", slug: "fixture", description: "Synthetic", viewCount: 1, downloadCount: 2, category, subject: category, tags: [], owner: { id: "fixture", email: "fixture@example.test", username: "fixture", fullName: "Synthetic", avatarUrl: null, role: "STUDENT", status: "ACTIVE" }, createdAt: "2026-10-09T00:00:00Z" }]} onEditClick={doc => setEvent(`edit:${doc.id}`)} onDeleteClick={doc => setEvent(`delete:${doc.id}`)} /></section>
    <section id="post-row"><DashboardPostList data={[{ id: "post", title: "Bài viết tổng hợp tiếng Việt dài để kiểm tra trên màn hình hẹp", slug: "fixture", summary: "Synthetic", type: "NEWS", status: "DRAFT", thumbnailUrl: null, publishedAt: null, expiredAt: null, pinned: false, author: null, viewCount: 1, updatedAt: "2026-10-09T00:00:00Z" }]} onEditClick={post => setEvent(`edit:${post.id}`)} onDeleteClick={post => setEvent(`delete:${post.id}`)} /></section>
    <InlineRetryFeedback message="Synthetic cached refresh failed" actions={<Button id="inline-retry" variant="outline" size="sm" loading={retrying} onClick={() => { setEvent("retry"); setRetrying(true); }}>Thử lại</Button>} />
    <PaginationFooter pageOffset={page - 1} size={10} total={25} itemLabel="tài liệu"><AppPagination currentPage={page} totalPages={3} onPageChange={setPage} /></PaginationFooter>
    <AlertDialog><AlertDialogTrigger asChild><Button id="confirm-trigger">Synthetic confirmation</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Synthetic delete</AlertDialogTitle><AlertDialogCancel>Giữ nguyên</AlertDialogCancel><AlertDialogAction variant="destructive-solid" onClick={() => setEvent("confirmed")}>Xóa</AlertDialogAction></AlertDialogContent></AlertDialog>
    <output id="owner-event">{event}</output>
  </>;
}

const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
export function Fixture() {
  const [imageId, setImageId] = useState<string | null>(null);
  const [html, setHtml] = useState("<p>Synthetic editor draft</p>");
  const screen = new URLSearchParams(location.search).get("screen");
  const route = useLocation();
  return <main className="mx-auto max-w-5xl space-y-6 p-4">
    <h1>Synthetic three-cluster probe — no live data</h1>
    {screen === "owners" ? <Owners /> : screen === "documents" ? <DocumentsManagementPage /> : screen === "posts" ? <PostManagementFeature /> : screen === "questions" ? <QuestionBankPage /> : <>
      <section id="thumbnail" className="max-w-lg"><PostImageUpload onChange={setImageId} /><output id="image-id">{imageId}</output></section>
      <section id="editor"><RichTextEditor value={html} onChange={setHtml} /><output id="editor-html" className="block break-all">{html}</output></section>
    </>}
    <Button id="background-refetch" onClick={() => void client.refetchQueries()}>Synthetic background refetch</Button>
    <output id="route">{route.pathname + route.search}</output><Toaster />
  </main>;
}
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/fixture?search=kept&status=DRAFT&page=2"]}><Fixture /></MemoryRouter></QueryClientProvider>);
