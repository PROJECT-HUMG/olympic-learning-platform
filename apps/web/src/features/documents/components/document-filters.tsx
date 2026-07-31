import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";
import { Combobox } from "@/components/ui/combobox";
import { useDocumentMetadata } from "../hooks/use-documents";
import { Badge } from "@/components/ui/badge";

export function DocumentFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";
  
  const [keyword, setKeyword] = useState(initialKeyword);
  const debouncedKeyword = useDebounce(keyword, 500);

  useEffect(() => {
    if (debouncedKeyword !== (searchParams.get("keyword") || "")) {
      if (debouncedKeyword) {
        searchParams.set("keyword", debouncedKeyword);
      } else {
        searchParams.delete("keyword");
      }
      // Reset page to 0 when search changes
      searchParams.delete("page");
      setSearchParams(searchParams);
    }
  }, [debouncedKeyword, searchParams, setSearchParams]);

  const { data: metadata, isLoading } = useDocumentMetadata();

  const subjectOptions =
    metadata?.subjects.map((sub) => ({
      value: sub.id,
      label: sub.name,
    })) || [];

  const categoryOptions =
    metadata?.categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [];

  const tagOptions =
    metadata?.tags.map((t) => ({
      value: t.id,
      label: t.name,
    })) || [];

  const currentSubjectId = searchParams.get("subjectId") || "";
  const currentCategoryId = searchParams.get("categoryId") || "";
  const currentTagId = searchParams.get("tagId") || "";

  const handleSubjectChange = (val: string) => {
    if (val) {
      searchParams.set("subjectId", val);
    } else {
      searchParams.delete("subjectId");
    }
    searchParams.delete("page");
    setSearchParams(searchParams);
  };

  const handleCategoryChange = (val: string) => {
    if (val) {
      searchParams.set("categoryId", val);
    } else {
      searchParams.delete("categoryId");
    }
    searchParams.delete("page");
    setSearchParams(searchParams);
  };

  const handleTagChange = (val: string) => {
    if (val) {
      searchParams.set("tagId", val);
    } else {
      searchParams.delete("tagId");
    }
    searchParams.delete("page");
    setSearchParams(searchParams);
  };

  const currentSubject = metadata?.subjects.find((s) => s.id === currentSubjectId);
  const currentCategory = metadata?.categories.find((c) => c.id === currentCategoryId);
  const currentTag = metadata?.tags.find((t) => t.id === currentTagId);

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full mb-6">
      {/* Search Bar - Google Drive Style */}
      <div className="relative w-full max-w-3xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          placeholder="Tìm trong Kho Tài Liệu"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-11 pr-11 h-14 bg-accent/50 border-transparent hover:bg-accent hover:shadow-sm focus-visible:bg-background focus-visible:shadow-md focus-visible:ring-0 focus-visible:border-transparent rounded-full text-base transition-all"
        />
        {keyword && (
          <button
            onClick={() => setKeyword("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Chips Container */}
      <div className="flex flex-wrap items-center gap-2 max-w-3xl mx-auto w-full justify-center sm:justify-start">
        <div className="flex items-center text-sm font-medium text-muted-foreground mr-2 hidden sm:flex">
          <SlidersHorizontal className="w-4 h-4 mr-1" />
          Bộ lọc:
        </div>
        
        <div className="min-w-[140px]">
          <Combobox
            options={subjectOptions}
            value={currentSubjectId}
            onChange={handleSubjectChange}
            placeholder={isLoading ? "Đang tải..." : "Môn học"}
            emptyText="Không tìm thấy môn học"
            disabled={isLoading}
            className="w-full bg-background border-border/60 hover:bg-accent rounded-full h-9 text-sm"
          />
        </div>
        
        <div className="min-w-[140px]">
          <Combobox
            options={categoryOptions}
            value={currentCategoryId}
            onChange={handleCategoryChange}
            placeholder={isLoading ? "Đang tải..." : "Loại tài liệu"}
            emptyText="Không tìm thấy loại tài liệu"
            disabled={isLoading}
            className="w-full bg-background border-border/60 hover:bg-accent rounded-full h-9 text-sm"
          />
        </div>

        <div className="min-w-[140px]">
          <Combobox
            options={tagOptions}
            value={currentTagId}
            onChange={handleTagChange}
            placeholder={isLoading ? "Đang tải..." : "Thẻ (Tags)"}
            emptyText="Không tìm thấy thẻ"
            disabled={isLoading}
            className="w-full bg-background border-border/60 hover:bg-accent rounded-full h-9 text-sm"
          />
        </div>
      </div>

      {/* Active Filters Summary (Optional, but good for UX) */}
      {(currentSubject || currentCategory || currentTag || debouncedKeyword) && (
        <div className="flex flex-wrap items-center gap-2 max-w-3xl mx-auto w-full justify-center sm:justify-start">
          {debouncedKeyword && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 h-7 rounded-full flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium">
              <span className="max-w-[150px] truncate text-xs">Từ khóa: {debouncedKeyword}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-background/20"
                onClick={() => setKeyword("")}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentSubject && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 h-7 rounded-full flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium">
              <span className="max-w-[150px] truncate text-xs">{currentSubject.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-background/20"
                onClick={() => handleSubjectChange("")}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentCategory && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 h-7 rounded-full flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium">
              <span className="max-w-[150px] truncate text-xs">{currentCategory.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-background/20"
                onClick={() => handleCategoryChange("")}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentTag && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 h-7 rounded-full flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium">
              <span className="max-w-[150px] truncate text-xs">{currentTag.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-background/20"
                onClick={() => handleTagChange("")}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline ml-2"
            onClick={() => {
              setKeyword("");
              handleSubjectChange("");
              handleCategoryChange("");
              handleTagChange("");
            }}
          >
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
}
