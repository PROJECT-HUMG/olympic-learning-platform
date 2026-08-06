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
    if (data && data.totalPages > 0) {
      if (currentPage > data.totalPages) {
        setSearchParams((prev) => {
          prev.set("page", data.totalPages.toString());
          return prev;
        }, { replace: true });
      }
    }
  }, [data?.totalPages, currentPage, setSearchParams]);

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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 min-h-[80vh] flex flex-col">
      <div className="mb-10 text-center sm:text-left">
        <PublicPageHeader 
          title="Tin Tức & Thông Báo" 
          description="Cập nhật những tin tức mới nhất, bài viết blog và thông báo về các kỳ thi Olympic." 
        />
      </div>
      
      <div className="mb-12 flex justify-start sm:justify-center overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <Tabs value={type} onValueChange={handleTypeChange}>
          <TabsList className="inline-flex h-12 items-center justify-center rounded-full bg-muted/80 p-1 text-muted-foreground">
            <TabsTrigger value="ALL" className="rounded-full px-6 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Tất cả</TabsTrigger>
            <TabsTrigger value="NEWS" className="rounded-full px-6 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Tin tức</TabsTrigger>
            <TabsTrigger value="ANNOUNCEMENT" className="rounded-full px-6 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Thông báo</TabsTrigger>
            <TabsTrigger value="BLOG" className="rounded-full px-6 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Blog</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 space-y-12">
        <section>
          <NewsList 
            posts={data?.content} 
            isLoading={isLoading} 
            isError={isError}
            isEmpty={!data || data.content.length === 0}
          />
        </section>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-16 flex justify-center pb-8 border-t border-border/50 pt-8">
          <AppPagination
            currentPage={currentPage}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
