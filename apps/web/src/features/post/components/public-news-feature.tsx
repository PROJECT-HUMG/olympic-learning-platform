import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PublicPageHeader } from "@/components/ui/public-page-header";
import { usePosts } from "@/features/post/hooks/use-posts";
import { NewsList } from "@/features/post/components/news-list";
import { AppPagination } from "@/components/ui/app-pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PublicNewsFeature() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState<string>(searchParams.get("type") || "ALL");
  
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const apiPageOffset = Math.max(0, currentPage - 1);

  const { data, isLoading, isError } = usePosts({
    page: apiPageOffset,
    size: 9,
    status: "PUBLISHED",
    type: type !== "ALL" ? type : undefined,
  });

  useEffect(() => {
    if (data && data.page.totalPages > 0) {
      if (currentPage > data.page.totalPages) {
        setSearchParams((prev) => {
          prev.set("page", data.page.totalPages.toString());
          return prev;
        }, { replace: true });
      }
    }
  }, [data?.page.totalPages, currentPage, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setSearchParams((prev) => {
      if (value !== "ALL") {
        prev.set("type", value);
      } else {
        prev.delete("type");
      }
      prev.set("page", "1");
      return prev;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[80vh] flex flex-col">
      <div className="mb-8">
        <PublicPageHeader 
          title="Tin Tức & Thông Báo" 
          description="Cập nhật những tin tức mới nhất, bài viết blog và thông báo về các kỳ thi Olympic." 
        />
      </div>
      
      <div className="mb-8">
        <Tabs value={type} onValueChange={handleTypeChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            <TabsTrigger value="NEWS">Tin tức</TabsTrigger>
            <TabsTrigger value="ANNOUNCEMENT">Thông báo</TabsTrigger>
            <TabsTrigger value="BLOG">Blog</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1">
        <NewsList 
          posts={data?.content} 
          isLoading={isLoading} 
          isError={isError}
          isEmpty={!data || data.content.length === 0}
        />
      </div>

      {data && data.page.totalPages > 1 && (
        <div className="mt-12 flex justify-center pb-8">
          <AppPagination
            currentPage={currentPage}
            totalPages={data.page.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
