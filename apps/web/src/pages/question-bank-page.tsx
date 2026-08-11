import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Archive, Copy, Eye, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useArchiveQuestion, useDuplicateQuestion, useQuestions, useRestoreQuestion } from "@/features/questions/hooks/use-questions";
import type { Question } from "@/features/questions/types/question.types";

function questionText(question: Question) {
  const value = question.content.text ?? question.content.question ?? question.content.stem;
  return typeof value === "string" ? value : "Câu hỏi chưa có nội dung hiển thị";
}

export default function QuestionBankPage() {
  const [search, setSearch] = useState("");
  const query = useQuestions({ search: search || undefined, size: 20 });
  const location = useLocation();
  const duplicate = useDuplicateQuestion(); const archive = useArchiveQuestion(); const restore = useRestoreQuestion();
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="space-y-2"><p className="text-sm font-medium text-primary">Ngân hàng câu hỏi</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quản lý câu hỏi</h1><p className="text-sm text-muted-foreground">Tìm, sao chép hoặc lưu trữ câu hỏi đã được kiểm duyệt.</p></header>
    <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm nội dung câu hỏi..." /></div>
    {query.isLoading && <div className="grid gap-4 md:grid-cols-2"><div className="h-44 animate-pulse rounded-xl bg-muted" /><div className="h-44 animate-pulse rounded-xl bg-muted" /></div>}
    {query.isError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">Không thể tải ngân hàng câu hỏi.</p>}
    {!query.isLoading && query.data?.content.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Chưa có câu hỏi phù hợp.</CardContent></Card>}
    <div className="grid gap-4 md:grid-cols-2">{query.data?.content.map((question) => <Card key={question.id} className="transition-shadow hover:shadow-md"><CardContent className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{question.subjectName} · {question.topicName}</span><Badge variant={question.status === "PUBLISHED" ? "success" : question.status === "ARCHIVED" ? "secondary" : "warning"}>{question.status}</Badge></div>
      <p className="line-clamp-4 text-sm leading-6">{questionText(question)}</p>
      <div className="flex flex-wrap gap-2"><Link to={`${location.pathname}/${question.id}`}><Button size="sm" variant="outline"><Eye className="size-4" />Chi tiết</Button></Link><Button size="sm" variant="outline" loading={duplicate.isPending} onClick={() => void duplicate.mutateAsync(question.id)}><Copy className="size-4" />Sao chép</Button>{question.status === "PUBLISHED" ? <Button size="sm" variant="ghost" loading={archive.isPending} onClick={() => void archive.mutateAsync(question.id)}><Archive className="size-4" />Lưu trữ</Button> : question.status === "ARCHIVED" ? <Button size="sm" variant="ghost" loading={restore.isPending} onClick={() => void restore.mutateAsync(question.id)}><RotateCcw className="size-4" />Khôi phục</Button> : null}</div>
    </CardContent></Card>)}</div>
  </div>;
}
