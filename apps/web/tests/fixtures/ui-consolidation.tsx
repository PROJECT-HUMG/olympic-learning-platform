import { createRoot } from "react-dom/client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AppPagination } from "@/components/ui/app-pagination";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { FigureNotices } from "@/features/questions/components/figure-notices";
import { ManualQuestionViewer } from "@/features/questions/components/manual-question-viewer";
import { DocumentForm } from "@/features/documents/components/document-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { ScientificBlockEditor } from "@/features/questions/components/scientific-block-editor";
import { RoomPolicyFields } from "@/features/study-room/components/room-policy-fields";
import type { ScientificBlock } from "@/features/questions/types/scientific-content";
import type { RoomSettings } from "@/features/study-room/types/study-room";
import type { DocumentResponse } from "@/features/documents/types/documents.types";
import "@/index.css";
import "@/features/study-room/components/study-room.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const initial = { title: "", description: "", category: { id: "" }, subject: { id: "" }, tags: [] } as DocumentResponse;
const figures = [{ assetId: "ready", phase: "ready", message: "Ready must be hidden" }, { assetId: "pending", phase: "loading", message: "Synthetic figure loading" }, { assetId: "failed", phase: "error", message: "Synthetic figure failed" }] as const;

export function Fixture() {
  const [loading, setLoading] = useState(true), [disabled, setDisabled] = useState(false);
  const [clicks, setClicks] = useState(0), [submits, setSubmits] = useState(0), [page, setPage] = useState(1);
  const [native, setNative] = useState("a"), [choice, setChoice] = useState("a"), [combo, setCombo] = useState("");
  const [retry, setRetry] = useState(""), [saved, setSaved] = useState(0);
  const [creating, setCreating] = useState(false), [saving, setSaving] = useState(false);
  const [payload, setPayload] = useState(""), [cancelled, setCancelled] = useState(0);
  const [policy, setPolicy] = useState<RoomSettings>({ requestPolicy: "OPEN", minimumStudyMinutes: 15 });
  const [blocks, setBlocks] = useState<ScientificBlock[]>([{ id: "group", kind: "figure_group", layout: "side_by_side", figures: [{ assetId: "synthetic", alt: "Synthetic figure" }] }]);
  return <main className="mx-auto max-w-5xl space-y-6 p-4">
    <h1>Synthetic UI fixtures — no live data</h1>
    <section id="buttons" className="flex flex-wrap gap-2">
      <Button id="pending-button" loading={loading} disabled={disabled} onClick={() => setClicks(clicks + 1)}>Save fixture</Button>
      <Button id="toggle-loading" onClick={() => setLoading(!loading)}>Toggle loading</Button>
      <Button id="toggle-disabled" onClick={() => setDisabled(!disabled)}>Toggle disabled</Button>
      <output id="clicks">{clicks}</output>
    </section>
    <form id="paging" className="space-y-4" onSubmit={e => { e.preventDefault(); setSubmits(submits + 1); }}>
      <div id="full-pager"><AppPagination currentPage={page} totalPages={4} onPageChange={setPage} /></div>
      <div id="compact-pager"><AppPagination variant="compact" currentPage={page} totalPages={4} onPageChange={setPage} /></div>
      <output id="page">{page}</output><output id="submits">{submits}</output>
    </form>
    <section id="controls" className="grid min-w-0 gap-4 sm:grid-cols-2">
      <Input id="standard-input" aria-label="Ordinary input" />
      <Select value={choice} onValueChange={setChoice}><SelectTrigger id="standard-select" aria-label="Standard select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Alpha</SelectItem><SelectItem value="b">Beta</SelectItem></SelectContent></Select>
      <Select value={choice} onValueChange={setChoice}><SelectTrigger size="sm" id="compact-select" aria-label="Compact select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Alpha</SelectItem><SelectItem value="b">Beta</SelectItem></SelectContent></Select>
      <NativeSelect id="native" aria-label="Native select" value={native} onChange={e => setNative(e.target.value)}><option value="a">Alpha</option><option value="b">Beta</option></NativeSelect>
      <NativeSelect id="native-sm" controlSize="sm" aria-label="Compact native select"><option>Compact</option></NativeSelect>
      <FormField id="floating" label="Floating input" />
      <Combobox aria-label="Fixture combobox" value={combo} onChange={setCombo} options={[{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }]} inputClassName="rounded-full" />
      <SearchInput id="search-fixture" aria-label="Search fixture" />
      <output id="native-value">{native}</output><output id="select-value">{choice}</output><output id="combo-value">{combo}</output>
    </section>
    <section id="figures"><FigureNotices figures={figures} onRetry={setRetry} /><output id="retried">{retry}</output></section>
    <section id="student-view"><ManualQuestionViewer stem={[]} parts={[{ id: "part", responseType: "SINGLE_CHOICE", prompt: [], options: [{ id: "a", content: [] }] }]} answer={{ parts: [{ partId: "part", correctOptionIds: ["a"] }] }} explanation={{ parts: [{ partId: "part", solution: [{ id: "solution", kind: "text", source: "PRIVATE SOLUTION" }], rubric: "PRIVATE RUBRIC" }] }} showAnswer={false} /></section>
    <EmptyState title="Synthetic empty list" icon={null}>No live records.</EmptyState>
    <section id="feature-selects">
      <div className="study-room-page"><RoomPolicyFields prefix="fixture" value={policy} onChange={setPolicy} /></div>
      <ScientificBlockEditor label="Synthetic figure editor" value={blocks} onChange={setBlocks} />
      <output id="room-policy">{policy.requestPolicy}</output><output id="figure-layout" className="block break-all">{JSON.stringify(blocks)}</output>
    </section>
    <section id="document">
      <Button id="create-mode" onClick={() => setCreating(!creating)}>Toggle create mode</Button>
      <Button id="save-pending" onClick={() => setSaving(!saving)}>Toggle save pending</Button>
      <DocumentForm key={String(creating)} initialData={creating ? undefined : initial} isLoading={saving}
        onSubmit={data => { setSaved(saved + 1); setPayload(JSON.stringify(data)); }} onCancel={() => setCancelled(cancelled + 1)} />
      <output id="saved">{saved}</output><output id="payload" className="block break-all">{payload}</output><output id="cancelled">{cancelled}</output>
    </section>
  </main>;
}
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><Fixture /></QueryClientProvider>);
