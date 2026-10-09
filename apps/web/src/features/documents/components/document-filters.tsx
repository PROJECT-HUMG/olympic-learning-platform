import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { useDocumentMetadata } from "../hooks/use-documents";

function KeywordSearch({
  keyword,
  onApply,
}: {
  keyword: string;
  onApply: (value: string) => void;
}) {
  const [draft, setDraft] = useState(keyword);
  return (
    <form
      role="search"
      className="flex w-full items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft.trim());
      }}
    >
      <div className="relative min-w-0 flex-1">
        <SearchInput
          type="text"
          aria-label="Tìm trong kho tài liệu"
          placeholder="Tìm trong kho tài liệu"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="bg-background pr-12"
        />
        {draft && (
          <button
            type="button"
            aria-label="Xóa từ khóa tìm kiếm"
            className="absolute right-0 top-0 size-11 rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => {
              setDraft("");
              onApply("");
            }}
          >
            <X aria-hidden="true" className="mx-auto size-4" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="px-4"
      >
        Tìm
      </Button>
    </form>
  );
}

export function DocumentFilters() {
  const [params, setParams] = useSearchParams();
  const metadata = useDocumentMetadata();
  const keyword = params.get("keyword") ?? "";
  const updateFilter = (key: string, value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      return next;
    });
  const filters = [
    {
      key: "subjectId",
      label: "Môn học",
      options: metadata.data?.subjects ?? [],
    },
    {
      key: "categoryId",
      label: "Loại tài liệu",
      options: metadata.data?.categories ?? [],
    },
    { key: "tagId", label: "Thẻ", options: metadata.data?.tags ?? [] },
  ];
  const hasFilters = keyword || filters.some(({ key }) => params.has(key));
  return (
    <div className="flex w-full flex-col gap-3">
      <KeywordSearch
        key={keyword}
        keyword={keyword}
        onApply={(value) => updateFilter("keyword", value)}
      />
      <div className="page-toolbar !justify-start !gap-2">
        <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Bộ lọc
        </span>
        {filters.map(({ key, label, options }) => (
          <div key={key} className="min-w-0 flex-[1_1_12rem]">
            <Combobox
              aria-label={label}
              options={options.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              value={params.get(key) ?? ""}
              onChange={(value) => updateFilter(key, value)}
              placeholder={metadata.isLoading ? "Đang tải…" : label}
              emptyText={`Không tìm thấy ${label.toLowerCase()}`}
              disabled={metadata.isLoading || metadata.isError}
            />
          </div>
        ))}
      </div>
      {metadata.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          Chưa tải được bộ lọc.
          <Button
            variant="ghost"
            disabled={metadata.isFetching}
            onClick={() => void metadata.refetch()}
          >
            Thử lại bộ lọc
          </Button>
        </div>
      )}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {keyword && (
            <span className="break-all text-muted-foreground">
              Từ khóa: {keyword}
            </span>
          )}
          {filters
            .filter(({ key }) => params.has(key))
            .map(({ key, label, options }) => (
              <Button
                key={key}
                variant="secondary"
                className="min-h-11 h-auto max-w-full whitespace-normal text-left"
                aria-label={`Bỏ lọc ${label.toLowerCase()}`}
                onClick={() => updateFilter(key, "")}
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">{options.find((item) => item.id === params.get(key))?.name ?? label}</span>
                <X aria-hidden="true" className="size-3.5" />
              </Button>
            ))}
          <Button
            variant="ghost"
            className="h-11"
            onClick={() =>
              setParams((previous) => {
                const next = new URLSearchParams(previous);
                for (const key of [
                  "keyword",
                  "subjectId",
                  "categoryId",
                  "tagId",
                  "page",
                ])
                  next.delete(key);
                return next;
              })
            }
          >
            Xóa tất cả
          </Button>
        </div>
      )}
    </div>
  );
}
