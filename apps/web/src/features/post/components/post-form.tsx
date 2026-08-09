import { useMemo } from "react";
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
import { ListTree, Loader2 } from "lucide-react";
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
  expiredAt: z.string().optional(),
  pinned: z.boolean(),
});

type PostFormValues = z.infer<typeof postSchema>;

function ArticleOutlinePreview({ content }: { content: string }) {
  const headings = useMemo(() => {
    if (!content || typeof DOMParser === "undefined") return [];
    const document = new DOMParser().parseFromString(content, "text/html");
    return Array.from(document.querySelectorAll("h2, h3")).map((heading) => ({
      text: heading.textContent?.trim() || "Tiêu đề chưa đặt",
      level: heading.tagName === "H2" ? 2 : 3,
    }));
  }, [content]);

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ListTree className="size-4 text-primary" />
        Mục lục dự kiến
      </div>
      {headings.length > 0 ? (
        <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {headings.map((heading, index) => (
            <li key={`${heading.text}-${index}`} className={heading.level === 3 ? "pl-5" : "font-medium text-foreground"}>
              {index + 1}. {heading.text}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Dùng “Tiêu đề 2” hoặc “Tiêu đề 3” trong thanh công cụ để tạo mục lục tự động.
        </p>
      )}
    </div>
  );
}

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
      status: (initialData?.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED",
      expiredAt: initialData?.expiredAt ? initialData.expiredAt.slice(0, 16) : "",
      pinned: initialData?.pinned || false,
    },
  });

  const handleSubmit = (values: PostFormValues, forcedStatus?: "DRAFT" | "PUBLISHED") => {
    const status = initialData ? values.status : (forcedStatus || "PUBLISHED");
    onSubmit({
      ...values,
      status,
      thumbnailId: values.thumbnailId || null,
      summary: values.summary || "",
      publishedAt: initialData ? undefined : status === "PUBLISHED" ? new Date().toISOString() : undefined,
      expiredAt: values.expiredAt ? new Date(values.expiredAt).toISOString() : null,
      pinned: status === "PUBLISHED" ? values.pinned : false,
    } as CreatePostRequest);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => handleSubmit(values))} className="space-y-6">
        
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

                {initialData && <FormField
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
                  />}

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
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.35fr)]">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại bài viết</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Chọn loại bài viết" /></SelectTrigger></FormControl>
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
                  <FormField control={form.control} name="expiredAt" render={({ field }) => <FormItem><FormLabel>Thời hạn hiệu lực</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="pinned" render={({ field }) => <FormItem className="flex items-center gap-3 rounded-xl border border-border/60 p-4"><FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} disabled={form.watch("status") !== "PUBLISHED"} className="size-4 accent-primary" /></FormControl><div><FormLabel>Ghim vào thông tin quan trọng</FormLabel><p className="mt-1 text-xs text-muted-foreground">Tối đa 3 bài đang xuất bản.</p></div></FormItem>} />
                </div>
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
                          initialPreviewUrl={initialData?.thumbnailUrl || undefined}
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
            <ArticleOutlinePreview content={form.watch("content")} />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Hủy
          </Button>
          {!initialData && <Button type="button" variant="secondary" disabled={isLoading} onClick={() => {
            void form.handleSubmit((values) => handleSubmit(values, "DRAFT"))();
          }}>
            Lưu bản nháp
          </Button>}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Cập nhật bài viết" : "Xuất bản bài viết"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
