import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";
import { Combobox } from "@/components/ui/combobox";

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

  // Demo options for Combobox
  const subjectOptions = [
    { value: "toan", label: "Toán học" },
    { value: "ly", label: "Vật lý" },
    { value: "hoa", label: "Hóa học" },
    { value: "sinh", label: "Sinh học" },
    { value: "tin", label: "Tin học" },
  ];

  const typeOptions = [
    { value: "de-thi", label: "Đề thi" },
    { value: "giao-trinh", label: "Giáo trình" },
    { value: "bai-tap", label: "Bài tập" },
    { value: "chuyen-de", label: "Chuyên đề" },
  ];

  return (
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
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex gap-2 w-full md:w-auto overflow-x-visible">
        <Combobox
          options={subjectOptions}
          placeholder="Tất cả môn học"
          className="w-full md:w-48 bg-background/50 border-border/60"
        />
        <Combobox
          options={typeOptions}
          placeholder="Loại tài liệu"
          className="w-full md:w-48 bg-background/50 border-border/60"
        />
      </div>
    </div>
  );
}
