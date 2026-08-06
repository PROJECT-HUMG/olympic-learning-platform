import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { PostImageUpload } from "./post-image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        
        {/* NỬA TRÊN: THÔNG TIN & ẢNH BÌA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trái (Desktop) / Dưới (Mobile): Thông tin cơ bản */}
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin bài viết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Phải (Desktop) / Trên (Mobile): Ảnh bìa */}
          <div className="order-1 lg:order-2 lg:col-span-1 space-y-6">
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg">Ảnh bìa</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="thumbnailId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PostImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          initialPreviewUrl={initialData?.thumbnailUrl}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* NỬA DƯỚI: NỘI DUNG */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Nội dung</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl className="min-h-[400px]">
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
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
