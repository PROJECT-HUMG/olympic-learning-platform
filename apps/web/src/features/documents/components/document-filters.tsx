import { Search, X } from "lucide-react";
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

  const currentSubjectId = searchParams.get("subjectId") || "";
  const currentCategoryId = searchParams.get("categoryId") || "";

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

  const currentSubject = metadata?.subjects.find((s) => s.id === currentSubjectId);
  const currentCategory = metadata?.categories.find((c) => c.id === currentCategoryId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card/40 border border-border/50 p-4 rounded-xl backdrop-blur-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu, đề thi, bài giảng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 pr-9 bg-background/50 border-border/60"
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-visible">
          <Combobox
            options={subjectOptions}
            value={currentSubjectId}
            onChange={handleSubjectChange}
            placeholder={isLoading ? "Đang tải..." : "Tất cả môn học"}
            emptyText="Không tìm thấy môn học"
            disabled={isLoading}
            className="w-full md:w-48 bg-background/50 border-border/60"
          />
          <Combobox
            options={categoryOptions}
            value={currentCategoryId}
            onChange={handleCategoryChange}
            placeholder={isLoading ? "Đang tải..." : "Loại tài liệu"}
            emptyText="Không tìm thấy loại tài liệu"
            disabled={isLoading}
            className="w-full md:w-48 bg-background/50 border-border/60"
          />
        </div>
      </div>

      {/* Active Filters / Dismissible Chips */}
      {(currentSubject || currentCategory || debouncedKeyword) && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-sm text-muted-foreground mr-1">Đang lọc:</span>
          
          {debouncedKeyword && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 h-7 rounded-full flex items-center gap-1 bg-secondary/50 hover:bg-secondary/70">
              <span className="max-w-[150px] truncate text-xs font-normal">"{debouncedKeyword}"</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-secondary text-muted-foreground hover:text-foreground"
                onClick={() => setKeyword("")}
                aria-label={`Xóa bộ lọc từ khóa ${debouncedKeyword}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentSubject && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 h-7 rounded-full flex items-center gap-1 bg-secondary/50 hover:bg-secondary/70">
              <span className="max-w-[150px] truncate text-xs font-normal">{currentSubject.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-secondary text-muted-foreground hover:text-foreground"
                onClick={() => handleSubjectChange("")}
                aria-label={`Xóa bộ lọc môn học ${currentSubject.name}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentCategory && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 h-7 rounded-full flex items-center gap-1 bg-secondary/50 hover:bg-secondary/70">
              <span className="max-w-[150px] truncate text-xs font-normal">{currentCategory.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-secondary text-muted-foreground hover:text-foreground"
                onClick={() => handleCategoryChange("")}
                aria-label={`Xóa bộ lọc loại tài liệu ${currentCategory.name}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 ml-2"
            onClick={() => {
              setKeyword("");
              handleSubjectChange("");
              handleCategoryChange("");
            }}
          >
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
}
