import { useState } from "react";
import { Link } from "react-router-dom";
import { usePosts } from "@/features/post/hooks/use-posts";
import { useDeletePost } from "@/features/post/hooks/use-delete-post";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppPagination } from "@/components/ui/app-pagination";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PostBadge } from "@/features/post/components/post-badge";
import { PostStatusBadge } from "@/features/post/components/post-status-badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export function PostManagement() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const { data, isLoading } = usePosts({
    page,
    size: 10,
    // Provide a generic search or keyword depending on API.
    // Casting to any to allow search param if not defined in PostSearchRequest.
    ...({ keyword: debouncedSearch, search: debouncedSearch } as any),
  });

  const deleteMutation = useDeletePost();

  const handleDeleteClick = (id: string) => {
    setPostToDelete(id);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      deleteMutation.mutate(postToDelete, {
        onSuccess: () => closeDialog()
      });
    }
  };

  const closeDialog = () => {
    setPostToDelete(null);
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý bài viết</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách bài viết, tin tức và thông báo</p>
        </div>
        <Button asChild>
          <Link to="/admin/posts/create">
            <Plus className="w-4 h-4 mr-2" />
            Tạo bài viết
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm bài viết..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !data || data.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                  Không tìm thấy bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="max-w-[300px]">
                    <div className="font-medium text-foreground truncate">{post.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{post.slug}</div>
                  </TableCell>
                  <TableCell>
                    <PostBadge type={post.type} />
                  </TableCell>
                  <TableCell>
                    <PostStatusBadge status={post.status} />
                  </TableCell>
                  <TableCell>
                    {post.author ? (
                      <div className="flex items-center gap-2">
                        {post.author.avatarUrl && (
                          <img src={post.author.avatarUrl} alt={post.author.fullName} className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <span className="text-sm">{post.author.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Không rõ</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.publishedAt ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi }) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        asChild
                      >
                        <Link to={`/admin/posts/${post.id}/edit`}>
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteClick(post.id)}
                        disabled={deleteMutation.isPending && postToDelete === post.id}
                      >
                        {deleteMutation.isPending && postToDelete === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t mt-auto">
            <AppPagination 
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
