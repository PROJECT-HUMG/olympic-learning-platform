import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

interface AppPaginationProps {
  currentPage: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: AppPaginationProps) {
  if (totalPages <= 1) return null;

  // Generate pagination range
  const paginationRange = () => {
    const totalPageNumbers = siblingCount + 5; // siblingCount + first + last + current + 2*ellipsis

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1,
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    if (showLeftEllipsis && showRightEllipsis) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i,
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  };

  const pages = paginationRange();

  return (
    <Pagination aria-label="Phân trang">
      <PaginationContent className="max-w-full flex-wrap">
        <PaginationItem>
          <Button
            variant="ghost"
            className="min-h-11 min-w-11"
            aria-label="Trang trước"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="hidden sm:inline">Trước</span>
          </Button>
        </PaginationItem>
        <PaginationItem
          className="px-3 text-sm text-muted-foreground sm:hidden"
          aria-current="page"
        >
          {currentPage} / {totalPages}
        </PaginationItem>
        {pages.map((page, idx) => (
          <PaginationItem key={`${page}-${idx}`} className="hidden sm:block">
            {page === "..." ? (
              <PaginationEllipsis />
            ) : (
              <Button
                variant={page === currentPage ? "outline" : "ghost"}
                size="icon"
                className="size-11"
                aria-label={`Trang ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <Button
            variant="ghost"
            className="min-h-11 min-w-11"
            aria-label="Trang sau"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight aria-hidden="true" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
