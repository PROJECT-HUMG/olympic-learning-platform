import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useUrlListSearch } from "@/hooks/use-list-search";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSearchParams } from "react-router-dom";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDocumentMetadata } from "../hooks/use-documents";

export function DocumentFilters() {
  const [params, setParams] = useSearchParams();
  const metadata = useDocumentMetadata();
  const isPhone = useMediaQuery("(max-width: 639px)");
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTitleRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef(isPhone);
  phoneRef.current = isPhone;
  useEffect(() => {
    if (!isPhone) setSheetOpen(false);
  }, [isPhone]);
  const keyword = params.get("keyword") ?? "";
  const updateFilter = (key: string, value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      return next;
    });
  const search = useUrlListSearch(keyword, value => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set("keyword", value); else next.delete("keyword"); next.delete("page"); return next; }, { replace: true }));
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
  const hasFilters = search.input.value || filters.some(({ key }) => params.has(key));
  const secondaryFilterCount = filters.filter(({ key }) => params.has(key)).length;
  const clearSecondaryFilters = () => setParams(previous => {
    const next = new URLSearchParams(previous);
    for (const { key } of filters) next.delete(key);
    next.delete("page");
    return next;
  });
  const filterFields = (
    <div className="document-filter-fields">
      {filters.map(({ key, label, options }) => (
        <div key={key} className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Combobox
            aria-label={label}
            options={options.map((item) => ({ value: item.id, label: item.name }))}
            value={params.get(key) ?? ""}
            onChange={(value) => updateFilter(key, value)}
            placeholder={metadata.isLoading ? "Đang tải…" : "Tất cả"}
            emptyText={`Không tìm thấy ${label.toLowerCase()}`}
            disabled={metadata.isLoading || metadata.isError}
          />
        </div>
      ))}
    </div>
  );
  const metadataFeedback = metadata.isError ? (
    <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      Chưa tải được bộ lọc.
      <Button type="button" variant="ghost" disabled={metadata.isFetching} aria-busy={metadata.isFetching}
        onClick={() => void metadata.refetch()}>Thử lại bộ lọc</Button>
    </div>
  ) : metadata.isLoading ? (
    <p role="status" className="text-sm text-muted-foreground">Đang tải bộ lọc…</p>
  ) : null;
  return (
    <div className="filter-panel document-filter-bar">
      <div ref={searchRef} className="document-filter-search relative" role="search">
        <SearchInput {...search.input} aria-label="Tìm trong kho tài liệu" placeholder="Tìm tài liệu…" className={search.input.value ? "pr-12" : undefined} />
        {search.input.value && <Button type="button" variant="ghost" size="icon" aria-label="Xóa từ khóa tìm kiếm" className="absolute right-0 top-0" onClick={search.clear}><X aria-hidden="true" /></Button>}
      </div>
      {isPhone ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="document-filter-trigger">
              <SlidersHorizontal aria-hidden="true" />
              Bộ lọc{secondaryFilterCount > 0 && <span className="document-filter-count" aria-label={`${secondaryFilterCount} bộ lọc đang chọn`}>{secondaryFilterCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" showCloseButton={false} className="document-filter-sheet"
            onOpenAutoFocus={event => { event.preventDefault(); sheetTitleRef.current?.focus(); }}
            onCloseAutoFocus={event => {
              // A breakpoint change removes the phone trigger. Return to the
              // still-mounted search rather than a hidden/detached control.
              if (!phoneRef.current) { event.preventDefault(); searchRef.current?.querySelector("input")?.focus(); }
            }}>
            <header className="document-filter-sheet__header">
              <div className="min-w-0">
                <SheetTitle ref={sheetTitleRef} tabIndex={-1}>Lọc tài liệu</SheetTitle>
                <SheetDescription>Bộ lọc được áp dụng ngay khi chọn.</SheetDescription>
              </div>
              <SheetClose asChild><Button type="button" variant="ghost" size="icon" aria-label="Đóng bộ lọc"><X aria-hidden="true" /></Button></SheetClose>
            </header>
            <div className="document-filter-sheet__body">
              {metadataFeedback}
              {filterFields}
            </div>
            <footer className="document-filter-sheet__footer">
              <Button type="button" variant="ghost" disabled={secondaryFilterCount === 0} onClick={clearSecondaryFilters}>Xóa bộ lọc</Button>
              <SheetClose asChild><Button type="button">Xong</Button></SheetClose>
            </footer>
          </SheetContent>
        </Sheet>
      ) : filterFields}
      {(!isPhone || !sheetOpen) && metadataFeedback}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {keyword && (
            <Button variant="secondary" className="min-h-11 h-auto max-w-full whitespace-normal text-left"
              aria-label="Bỏ lọc từ khóa" onClick={search.clear}>
              <span className="min-w-0 [overflow-wrap:anywhere]">Từ khóa: {keyword}</span><X aria-hidden="true" className="size-3.5" />
            </Button>
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
                <span className="min-w-0 [overflow-wrap:anywhere]">{label}: {options.find((item) => item.id === params.get(key))?.name ?? "Đã chọn"}</span>
                <X aria-hidden="true" className="size-3.5" />
              </Button>
            ))}
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => { search.resetDraft();
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
              });
            }}
          >
            Xóa tất cả
          </Button>
        </div>
      )}
    </div>
  );
}
