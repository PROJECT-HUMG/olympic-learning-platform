import { useState, useEffect } from "react";
import { Plus, Search, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/ui/app-pagination";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { usePosts } from "@/features/post/hooks/use-posts";
import { useCreatePost } from "@/features/post/hooks/use-create-post";
import { useUpdatePost } from "@/features/post/hooks/use-update-post";
import { useDeletePost } from "@/features/post/hooks/use-delete-post";
import { usePost } from "@/features/post/hooks/use-post";
import { PostForm } from "@/features/post/components/post-form";
import { PostBadge } from "@/features/post/components/post-badge";
import { PostStatusBadge } from "@/features/post/components/post-status-badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { PostSummaryResponse } from "@/features/post/types/post.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PostManagementFeature() {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: user } = useCurrentUser();

  const apiPageOffset = Math.max(0, currentPage - 1);

  const { data: pageData, isLoading } = usePosts({
    keyword: debouncedKeyword,
    page: apiPageOffset,
    size: 10,
    authorId: user?.role === "LECTURER" ? user.id : undefined,
  });

  useEffect(() => {
    if (pageData && pageData.page.totalPages > 0) {
      if (currentPage > pageData.page.totalPages) {
        setCurrentPage(pageData.page.totalPages);
      }
    }
  }, [pageData?.page.totalPages, currentPage]);

  const deletePost = useDeletePost();
  const [postToDelete, setPostToDelete] = useState<PostSummaryResponse | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<PostSummaryResponse | null>(null);

  const { data: postDetails } = usePost(postToEdit?.id || "", false);
  const isFetchingDetails = !!postToEdit && !postDetails;

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const handleFormSubmit = (data: any) => {
    if (postToEdit) {
      updatePost.mutate(
        { id: postToEdit.id, data },
        {
          onSuccess: () => {
            toast.success("Cập nhật bài viết thành công");
            setPostToEdit(null);
          },
          onError: () => toast.error("Có lỗi xảy ra khi cập nhật bài viết"),
        }
      );
    } else {
      createPost.mutate(data, {
        onSuccess: () => {
          toast.success("Tạo bài viết mới thành công");
          setIsCreateModalOpen(false);
        },
        onError: () => toast.error("Có lỗi xảy ra khi tạo bài viết"),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (postToDelete) {
      deletePost.mutate(postToDelete.id, {
        onSuccess: () => {
          toast.success("Đã xóa bài viết");
          setPostToDelete(null);
        },
        onError: () => toast.error("Không thể xóa bài viết này"),
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý bài viết</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý, thêm mới và cập nhật các bài viết tin tức, thông báo, blog.
          </p>
        </div>
        <Button className="shrink-0 gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="size-4" />
          Tạo bài viết mới
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            className="pl-9 h-10 bg-background"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(1);
            }}
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
              <TableHead>Lượt xem</TableHead>
              <TableHead>Tác giả</TableHead>
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
            ) : !pageData || pageData.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                  Không tìm thấy bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              pageData.content.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium max-w-[200px] truncate" title={post.title}>
                    <div className="flex flex-col">
                      <span>{post.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {post.publishedAt ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi }) : "Chưa xuất bản"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell><PostBadge type={post.type} /></TableCell>
                  <TableCell><PostStatusBadge status={post.status} /></TableCell>
                  <TableCell>{post.viewCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary border shrink-0 overflow-hidden">
                        {post.author?.avatarUrl ? (
                          <img src={post.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (post.author?.fullName || "U")[0].toUpperCase()
                        )}
                      </div>
                      <span className="text-sm truncate max-w-[120px]">{post.author?.fullName || "Quản trị viên"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild title="Xem trên web">
                        <Link to={`${ROUTES.NEWS}/${post.slug}`} target="_blank">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPostToEdit(post)}>
                        Sửa
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setPostToDelete(post)}>
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pageData && pageData.page.totalPages > 1 && (
          <div className="p-4 border-t mt-auto flex items-center justify-center">
            <AppPagination 
              currentPage={currentPage}
              totalPages={pageData.page.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết{" "}
              <span className="font-medium text-foreground">"{postToDelete?.title}"</span> không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deletePost.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? "Đang xóa..." : "Xóa bài viết"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog 
        open={isCreateModalOpen || !!postToEdit} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setPostToEdit(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-5xl sm:max-w-5xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {postToEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
            <DialogDescription>
              {postToEdit 
                ? `Đang chỉnh sửa bài viết: ${postToEdit.title}` 
                : "Điền thông tin bên dưới để tạo bài viết mới."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isFetchingDetails ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải thông tin bài viết...</p>
              </div>
            ) : (
              <PostForm
                key={postToEdit?.id || 'new'}
                initialData={postToEdit ? postDetails : undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsCreateModalOpen(false);
                  setPostToEdit(null);
                }}
                isLoading={createPost.isPending || updatePost.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
