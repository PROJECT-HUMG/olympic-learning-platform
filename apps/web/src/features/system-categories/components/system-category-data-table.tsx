import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
}

interface SystemCategoryDataTableProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  deletePending?: boolean;
}

export function SystemCategoryDataTable<T extends { id: string }>({
  data,
  isLoading,
  columns,
  onEdit,
  onDelete,
  deletePending,
}: SystemCategoryDataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.cell(item)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Sửa</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(item)}
                    disabled={deletePending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Xóa</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
