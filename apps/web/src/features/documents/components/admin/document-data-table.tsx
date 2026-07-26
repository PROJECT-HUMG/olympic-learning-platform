import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DocumentResponse } from "@/features/documents/types/documents.types";
import { Button } from "@/components/ui/button";
import { Eye, Download, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";

interface DocumentDataTableProps {
  data: DocumentResponse[];
  onDeleteClick: (document: DocumentResponse) => void;
}

export function DocumentDataTable({ data, onDeleteClick }: DocumentDataTableProps) {
  const columns: ColumnDef<DocumentResponse>[] = [
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => (
        <div className="font-medium max-w-[300px] truncate" title={row.original.title}>
          {row.original.title}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Phân loại",
      cell: ({ row }) => (
        <div className="flex gap-2 flex-wrap max-w-[200px]">
          {row.original.category && (
            <Badge variant="outline" className="font-normal text-xs bg-primary/5 text-primary border-primary/20">
              {row.original.category.name}
            </Badge>
          )}
          {row.original.subject && (
            <Badge variant="secondary" className="font-normal text-xs bg-secondary/30">
              {row.original.subject.name}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "stats",
      header: "Tương tác",
      cell: ({ row }) => (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1" title="Lượt xem">
            <Eye className="size-3" />
            <span>{row.original.viewCount}</span>
          </div>
          <div className="flex items-center gap-1" title="Lượt tải">
            <Download className="size-3" />
            <span>{row.original.downloadCount}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày đăng",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="text-sm text-muted-foreground">
            {format(date, "dd/MM/yyyy", { locale: vi })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild title="Chỉnh sửa">
              <Link to={`/admin/documents/${doc.slug}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Xóa"
              onClick={() => onDeleteClick(doc)}
            >
              <Trash2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild title="Xem chi tiết (Public)">
              <Link to={`${ROUTES.DOCUMENTS}/${doc.slug}`} target="_blank">
                <MoreHorizontal className="size-4" />
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="h-10 text-xs font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="group hover:bg-muted/40 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Không tìm thấy dữ liệu.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
