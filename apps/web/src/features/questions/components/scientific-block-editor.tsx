import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import type {
  FigureGroupBlock,
  FigureResolver,
  MathBlock,
  ScientificBlock,
  ScientificFigure,
  TextBlock,
} from "../types/scientific-content";
import { MAX_SOURCE_LENGTH } from "../lib/scientific-source";
import { ScientificBlockViewer } from "./scientific-block-viewer";
import "./scientific-content.css";

export interface ScientificBlockEditorProps {
  value: ScientificBlock[];
  onChange: (blocks: ScientificBlock[]) => void;
  uploadFigure?: (file: File) => Promise<string>;
  resolveFigure?: FigureResolver;
  disabled?: boolean;
  label: string;
}

interface FigureDraft {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  pending: boolean;
  request: number;
}

const MAX_FIGURE_BYTES = 5 * 1024 * 1024;
const FIGURE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function textBlock(): TextBlock {
  return { id: crypto.randomUUID(), kind: "text", source: "" };
}

function mathBlock(): MathBlock {
  return { id: crypto.randomUUID(), kind: "math", source: "", display: false };
}

function figureBlock(): FigureGroupBlock {
  return {
    id: crypto.randomUUID(),
    kind: "figure_group",
    layout: "full_width",
    figures: [{ assetId: "", alt: "", caption: "" }],
  };
}

function kindName(block: ScientificBlock): string {
  if (block.kind === "text") return "Văn bản";
  if (block.kind === "math") return "Công thức";
  return "Nhóm hình";
}

function uploadError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Tải ảnh thất bại. Bản nháp vẫn được giữ.";
}

function localFigureError(file: File): string | null {
  if (file.size > MAX_FIGURE_BYTES) return "Ảnh vượt quá 5 MB. Chưa tạo bản xem trước.";
  if (!FIGURE_TYPES.has(file.type)) return "Chỉ nhận JPEG, PNG hoặc WebP.";
  return null;
}

function isLayout(value: string): value is FigureGroupBlock["layout"] {
  return value === "full_width" || value === "side_by_side";
}

function FigureFields({
  block,
  figure,
  index,
  draft,
  disabled,
  label,
  onFigure,
  onUpload,
  onRetry,
  onAdd,
  onRemove,
}: {
  block: FigureGroupBlock;
  figure: ScientificFigure;
  index: number;
  draft: FigureDraft | undefined;
  disabled: boolean;
  label: string;
  onFigure: (figure: ScientificFigure) => void;
  onUpload: (file: File) => void;
  onRetry: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const altId = useId();
  const captionId = useId();
  const fileId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const position = index + 1;

  return (
    <div className="scientific-figure" aria-busy={draft?.pending || undefined}>
      <label className="scientific-field" htmlFor={altId}>
        <span>Văn bản thay thế</span>
        <input
          id={altId}
          value={figure.alt}
          disabled={disabled}
          onChange={(event) => onFigure({ ...figure, alt: event.target.value })}
        />
      </label>
      <label className="scientific-field" htmlFor={captionId}>
        <span>Chú thích</span>
        <textarea
          id={captionId}
          className="scientific-editor__caption"
          rows={2}
          value={figure.caption}
          disabled={disabled}
          onChange={(event) => onFigure({ ...figure, caption: event.target.value })}
        />
      </label>
      <label className="scientific-field" htmlFor={fileId}>
        <span>Tải ảnh {position}</span>
        <input
          ref={inputRef}
          id={fileId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || draft?.pending}
          aria-invalid={draft?.error ? true : undefined}
          aria-describedby={draft?.error ? errorId : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </label>
      {draft?.error ? (
        <p id={errorId} className="scientific-unsupported__message" role="alert">
          {draft.error}
        </p>
      ) : null}
      {draft?.previewUrl ? (
        <p className="scientific-draft">
          <img src={draft.previewUrl} alt={figure.alt || "Ảnh đang chọn"} />
          <span>{draft.pending ? "Ảnh đang chọn, đang tải." : "Ảnh đang chọn."}</span>
        </p>
      ) : null}
      <div className="scientific-figure__actions">
        {draft?.file && !draft.pending ? (
          <Button
            type="button"
            variant="outline"
            className="scientific-editor__button"
            disabled={disabled}
            onClick={() => onRetry()}
          >
            Thử tải lại
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="scientific-editor__button"
          disabled={disabled || block.figures.length >= 2}
          aria-label={`${label}, thêm ảnh vào nhóm hình`}
          onClick={onAdd}
        >
          Thêm ảnh
        </Button>
        <Button
          type="button"
          variant="outline"
          className="scientific-editor__button"
          disabled={disabled || block.figures.length <= 1}
          aria-label={`${label}, xóa ảnh ${position}`}
          onClick={onRemove}
        >
          Xóa ảnh
        </Button>
      </div>
    </div>
  );
}

export function ScientificBlockEditor({
  value,
  onChange,
  uploadFigure,
  resolveFigure,
  disabled = false,
  label,
}: ScientificBlockEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, FigureDraft>>({});
  const draftsRef = useRef(drafts);
  const valueRef = useRef(value);
  const keysRef = useRef(new Map<string, string[]>());
  const alive = useRef(true);
  const editorId = useId();
  const instructionsId = `${editorId}-help`;
  draftsRef.current = drafts;
  valueRef.current = value;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      for (const draft of Object.values(draftsRef.current)) {
        if (draft.previewUrl !== null) URL.revokeObjectURL(draft.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    const live = new Set<string>();
    for (const block of value) {
      if (block.kind !== "figure_group") continue;
      for (const key of keysRef.current.get(block.id) ?? []) live.add(`${block.id}:${key}`);
    }
    const stale = Object.keys(draftsRef.current).filter((key) => !live.has(key));
    if (stale.length === 0) return;
    const next = { ...draftsRef.current };
    for (const key of stale) {
      const previewUrl = next[key]?.previewUrl;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      delete next[key];
    }
    draftsRef.current = next;
    setDrafts(next);
  }, [value]);

  function keysFor(block: FigureGroupBlock): string[] {
    const existing = keysRef.current.get(block.id) ?? [];
    const next = existing.slice(0, block.figures.length);
    while (next.length < block.figures.length) next.push(crypto.randomUUID());
    keysRef.current.set(block.id, next);
    return next;
  }

  function replace(index: number, block: ScientificBlock) {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? block : item)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    onChange(next);
  }

  function clearDraft(key: string) {
    const draft = draftsRef.current[key];
    if (!draft) return;
    if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    const next = { ...draftsRef.current };
    delete next[key];
    draftsRef.current = next;
    setDrafts(next);
  }

  function writeDraft(draftKey: string, draft: FigureDraft) {
    const previous = draftsRef.current[draftKey];
    if (previous?.previewUrl && previous.previewUrl !== draft.previewUrl) {
      URL.revokeObjectURL(previous.previewUrl);
    }
    const next = { ...draftsRef.current, [draftKey]: draft };
    draftsRef.current = next;
    setDrafts(next);
  }

  function commitAsset(blockId: string, figureKey: string, assetId: string) {
    const figureIndex = (keysRef.current.get(blockId) ?? []).indexOf(figureKey);
    if (figureIndex === -1) return;
    onChange(
      valueRef.current.map((block) => {
        if (block.id !== blockId || block.kind !== "figure_group") return block;
        return {
          ...block,
          figures: block.figures.map((figure, index) =>
            index === figureIndex ? { ...figure, assetId } : figure,
          ),
        };
      }),
    );
  }

  function beginUpload(draftKey: string, file: File) {
    const request = (draftsRef.current[draftKey]?.request ?? 0) + 1;
    const previewUrl = URL.createObjectURL(file);
    writeDraft(draftKey, { file, previewUrl, error: null, pending: true, request });
    return { request, previewUrl };
  }

  async function upload(blockId: string, figureKey: string, file: File) {
    const draftKey = `${blockId}:${figureKey}`;
    const rejected = localFigureError(file);
    if (rejected) {
      writeDraft(draftKey, {
        file: null,
        previewUrl: null,
        error: rejected,
        pending: false,
        request: (draftsRef.current[draftKey]?.request ?? 0) + 1,
      });
      return;
    }
    const { request, previewUrl } = beginUpload(draftKey, file);
    const ownsRequest = () => alive.current && draftsRef.current[draftKey]?.request === request;
    const ownsKey = () => (keysRef.current.get(blockId) ?? []).includes(figureKey);
    if (!uploadFigure) {
      const draft = draftsRef.current[draftKey];
      if (!draft || draft.request !== request) return;
      writeDraft(draftKey, { ...draft, pending: false, error: "Chưa có đường tải ảnh. Bản nháp vẫn được giữ." });
      return;
    }
    try {
      const assetId = (await uploadFigure(file)).trim();
      if (!assetId) throw new Error("Tải ảnh không trả về mã tài sản.");
      if (!ownsRequest() || !ownsKey()) return;
      const next = { ...draftsRef.current };
      delete next[draftKey];
      draftsRef.current = next;
      setDrafts(next);
      URL.revokeObjectURL(previewUrl);
      if (!alive.current || !ownsKey()) return;
      commitAsset(blockId, figureKey, assetId);
    } catch (error) {
      if (!ownsRequest()) return;
      const draft = draftsRef.current[draftKey];
      if (!draft) return;
      writeDraft(draftKey, { ...draft, pending: false, error: uploadError(error) });
    }
  }

  return (
    <PageSection title={label} className="scientific-editor">
      <p id={instructionsId} className="scientific-note">
        Trong văn bản, \(...\) và $...$ là công thức cùng dòng; \[...\] và $$...$$ là dòng riêng. \$ giữ dấu đô la. TeX đầy đủ, TikZ, chemfig, liên kết và ảnh nhúng không được kết xuất. Giữ nguyên nguồn và tải ảnh JPEG, PNG hoặc WebP, tối đa 5 MB.
      </p>
      {value.length === 0 ? <p className="scientific-empty">Chưa có khối nào.</p> : null}
      <div className="scientific-editor__blocks">
        {value.map((block, index) => {
          const position = index + 1;
          const name = kindName(block);
          const sourceId = `${editorId}-${block.id}-source`;
          const previewId = `${editorId}-${block.id}-preview`;
          return (
            <div key={block.id} className="scientific-block" role="group" aria-label={`${label}, ${name} ${position}`}>
              <p className="scientific-block__kind">
                {name} {position}
              </p>
              <div className="scientific-toolbar">
                <Button
                  type="button"
                  variant="outline"
                  className="scientific-editor__button"
                  disabled={disabled || index === 0}
                  aria-label={`${label}, ${name} ${position}, chuyển lên`}
                  onClick={() => move(index, -1)}
                >
                  Lên
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="scientific-editor__button"
                  disabled={disabled || index === value.length - 1}
                  aria-label={`${label}, ${name} ${position}, chuyển xuống`}
                  onClick={() => move(index, 1)}
                >
                  Xuống
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="scientific-editor__button"
                  disabled={disabled}
                  aria-label={`${label}, xóa ${name} ${position}`}
                  onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                >
                  Xóa
                </Button>
              </div>
              {block.kind === "figure_group" ? (
                <>
                  <label className="scientific-field">
                    <span>Bố cục</span>
                    <select
                      value={block.layout}
                      disabled={disabled}
                      aria-label={`${label}, bố cục nhóm hình ${position}`}
                      onChange={(event) => {
                        if (!isLayout(event.target.value)) return;
                        replace(index, { ...block, layout: event.target.value });
                      }}
                    >
                      <option value="full_width">Toàn chiều rộng</option>
                      <option value="side_by_side">Hai cột</option>
                    </select>
                  </label>
                  {keysFor(block).map((figureKey, figureIndex) => {
                    const figure = block.figures[figureIndex];
                    if (!figure) return null;
                    const draftKey = `${block.id}:${figureKey}`;
                    return (
                      <FigureFields
                        key={figureKey}
                        block={block}
                        figure={figure}
                        index={figureIndex}
                        draft={drafts[draftKey]}
                        disabled={disabled}
                        label={label}
                        onFigure={(next) =>
                          replace(index, {
                            ...block,
                            figures: block.figures.map((item, itemIndex) =>
                              itemIndex === figureIndex ? next : item,
                            ),
                          })
                        }
                        onUpload={(file) => void upload(block.id, figureKey, file)}
                        onRetry={() => {
                          const draft = draftsRef.current[draftKey];
                          if (draft?.file) void upload(block.id, figureKey, draft.file);
                        }}
                        onAdd={() => {
                          if (block.figures.length >= 2) return;
                          const keys = keysRef.current.get(block.id) ?? [];
                          keys.push(crypto.randomUUID());
                          keysRef.current.set(block.id, keys);
                          replace(index, {
                            ...block,
                            figures: [...block.figures, { assetId: "", alt: "", caption: "" }],
                          });
                        }}
                        onRemove={() => {
                          if (block.figures.length <= 1) return;
                          const keys = keysRef.current.get(block.id);
                          const removed = keys?.splice(figureIndex, 1)[0];
                          if (removed) clearDraft(`${block.id}:${removed}`);
                          replace(index, {
                            ...block,
                            figures: block.figures.filter((_, itemIndex) => itemIndex !== figureIndex),
                          });
                        }}
                      />
                    );
                  })}
                </>
              ) : (
                <>
                  <label className="scientific-field" htmlFor={sourceId}>
                    <span>Nguồn</span>
                    <textarea
                      id={sourceId}
                      className="scientific-editor__source"
                      value={block.source}
                      disabled={disabled}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      aria-describedby={instructionsId}
                      aria-invalid={block.source.length > MAX_SOURCE_LENGTH || undefined}
                      onChange={(event) => replace(index, { ...block, source: event.target.value })}
                    />
                  </label>
                  {block.kind === "math" ? (
                    <label className="scientific-check">
                      <input
                        type="checkbox"
                        checked={block.display}
                        disabled={disabled}
                        onChange={(event) => replace(index, { ...block, display: event.target.checked })}
                      />
                      Công thức trên dòng riêng
                    </label>
                  ) : null}
                </>
              )}
              <div className="scientific-preview" aria-labelledby={previewId}>
                <h3 id={previewId} className="scientific-subhead">
                  Xem trước
                </h3>
                <ScientificBlockViewer blocks={[block]} resolveFigure={resolveFigure} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="scientific-add" role="group" aria-label={`${label}, thêm khối`}>
        <Button
          type="button"
          variant="outline"
          className="scientific-editor__button"
          disabled={disabled}
          onClick={() => onChange([...value, textBlock()])}
        >
          Thêm văn bản
        </Button>
        <Button
          type="button"
          variant="outline"
          className="scientific-editor__button"
          disabled={disabled}
          onClick={() => onChange([...value, mathBlock()])}
        >
          Thêm công thức
        </Button>
        <Button
          type="button"
          variant="outline"
          className="scientific-editor__button"
          disabled={disabled}
          onClick={() => onChange([...value, figureBlock()])}
        >
          Thêm nhóm hình
        </Button>
      </div>
    </PageSection>
  );
}
