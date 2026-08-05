import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { PostSummaryResponse, CreatePostRequest } from "../types/post.types";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const postSchema = z.object({
  title: z.string().min(2, "Tiêu đề phải có ít nhất 2 ký tự").max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  summary: z.string().max(500, "Tóm tắt không được vượt quá 500 ký tự").optional(),
  content: z.string().min(10, "Nội dung phải có ít nhất 10 ký tự"),
  thumbnailId: z.string().uuid("ID ảnh thu nhỏ không hợp lệ").optional().or(z.literal("")),
  type: z.enum(["NEWS", "BLOG", "ANNOUNCEMENT"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type PostFormValues = z.infer<typeof postSchema>;

interface PostFormProps {
  initialData?: PostSummaryResponse & { content?: string };
  onSubmit: (data: CreatePostRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PostForm({ initialData, onSubmit, onCancel, isLoading }: PostFormProps) {
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      summary: initialData?.summary || "",
      content: initialData?.content || "",
      thumbnailId: "",
      type: (initialData?.type as "NEWS" | "BLOG" | "ANNOUNCEMENT") || "NEWS",
      status: (initialData?.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
    },
  });

  const handleSubmit = (values: PostFormValues) => {
    onSubmit({
      ...values,
      thumbnailId: values.thumbnailId || null,
      summary: values.summary || "",
      publishedAt: initialData ? undefined : new Date().toISOString(), // Assuming we want it or just undefined
    } as CreatePostRequest);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề bài viết</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề bài viết" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Ảnh đại diện</FormLabel>
                  <FormControl>
                    <Input placeholder="UUID của ảnh đại diện (Tùy chọn)" {...field} />
                  </FormControl>
                  <FormDescription>UUID của ảnh thumbnail đã upload</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại bài viết</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại bài viết" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NEWS">Tin tức</SelectItem>
                        <SelectItem value="BLOG">Blog</SelectItem>
                        <SelectItem value="ANNOUNCEMENT">Thông báo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Bản nháp</SelectItem>
                        <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
                        <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tóm tắt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nhập tóm tắt bài viết (hiển thị ở dạng danh sách)" 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6 md:col-span-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung</FormLabel>
                  <FormControl>
                    <RichTextEditor 
                      value={field.value} 
                      onChange={field.onChange} 
                      placeholder="Nhập nội dung bài viết ở đây..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Cập nhật bài viết" : "Tạo bài viết"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
